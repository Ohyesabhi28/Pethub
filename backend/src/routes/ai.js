// /ai — proxy to the Python RAG service. Adds:
//   - retry with backoff
//   - graceful fallback (canned safe answer) if RAG is down
//   - mandatory veterinary disclaimer on every response
//   - stores Q/A in Firestore for audit
const express = require('express');
const Joi = require('joi');
const axios = require('axios');
const { v4: uuid } = require('uuid');
const { db } = require('../firebase');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { withRetry } = require('../utils/retry');
const log = require('../utils/logger');

const router = express.Router();
router.use(authMiddleware);

const RAG_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:5000';
const RAG_TIMEOUT = parseInt(process.env.RAG_TIMEOUT_MS || '15000', 10);
const DISCLAIMER = 'This is general information, not a substitute for professional veterinary advice. For urgent symptoms, contact a vet immediately.';

const chatSchema = Joi.object({
  question: Joi.string().min(1).max(2000).required(),
  petId: Joi.string().allow(null, ''),
});

router.post('/chat', validate(chatSchema), async (req, res, next) => {
  try {
    const { question, petId } = req.body;
    let petContext = null;
    if (petId) {
      const snap = await db.collection('pets').doc(petId).get();
      if (snap.exists && snap.data().ownerId === req.user.uid) {
        const p = snap.data();
        petContext = {
          name: p.name, species: p.species, breed: p.breed,
          age: p.age, weightKg: p.weightKg, history: p.history,
        };
      }
    }

    let answer, sources, confidence, fallbackUsed = false;
    try {
      const ragResp = await withRetry(
        () => axios.post(`${RAG_URL}/query`, { question, petContext }, { timeout: RAG_TIMEOUT }),
        { retries: 1, baseMs: 400, retryOn: (e) => !e.response || e.response.status >= 500 }
      );
      answer = ragResp.data.answer;
      sources = ragResp.data.sources || [];
      confidence = typeof ragResp.data.confidence === 'number' ? ragResp.data.confidence : 0.5;
    } catch (err) {
      log.warn('RAG call failed, using fallback', { message: err.message });
      fallbackUsed = true;
      answer = basicFallback(question, petContext);
      sources = [];
      confidence = 0.2;
    }

    // Always append disclaimer.
    const finalAnswer = `${answer}\n\n${DISCLAIMER}`;

    // Audit log (fire-and-forget; do not block response).
    db.collection('chat_logs').doc(uuid()).set({
      userId: req.user.uid,
      petId: petId || null,
      question, answer: finalAnswer, confidence, fallbackUsed,
      createdAt: new Date().toISOString(),
    }).catch((e) => log.warn('chat_logs write failed', { message: e.message }));

    res.json({ answer: finalAnswer, sources, confidence, fallbackUsed, disclaimer: DISCLAIMER });
  } catch (err) { next(err); }
});

function basicFallback(question, petContext) {
  const q = question.toLowerCase();
  const who = petContext?.name ? `For ${petContext.name}: ` : '';
  if (q.includes('vomit') || q.includes('blood') || q.includes('seizure') || q.includes('collaps')) {
    return `${who}These symptoms can be serious. Please contact an emergency veterinary clinic right away.`;
  }
  if (q.includes('food') || q.includes('diet') || q.includes('eat')) {
    return `${who}Diet should match species, age, and weight. Avoid chocolate, grapes, onions, garlic, xylitol, and macadamia nuts for dogs. Cats should never eat lilies, onions, or raw fish in excess. Discuss specifics with your vet.`;
  }
  if (q.includes('vaccin')) {
    return `${who}Core vaccines for dogs: rabies, distemper, parvovirus, adenovirus. For cats: rabies, FVRCP. Schedule depends on age and prior history — your vet can confirm what's due.`;
  }
  return `${who}I'm having trouble reaching the AI service right now. For specific guidance, please consult your veterinarian.`;
}

module.exports = router;
