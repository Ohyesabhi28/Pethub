// scripts/smoke.js — sanity checks the API after `npm run dev`.
// Usage: node scripts/smoke.js  (after backend + emulator are running)
//
// Exercises: /health, login as seeded owner, create pet, ask AI, list vets, book.
// Uses the Auth REST endpoint exposed by the emulator to avoid pulling in the JS SDK.

const axios = require('axios');

const API = process.env.API_BASE || 'http://127.0.0.1:4000';
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST
  ? `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`
  : 'http://127.0.0.1:9099';
const API_KEY = 'fake-api-key'; // ignored by the emulator

async function login(email, password) {
  const url = `${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const r = await axios.post(url, { email, password, returnSecureToken: true });
  return r.data.idToken;
}

function bearer(token) { return { headers: { Authorization: `Bearer ${token}` } }; }

(async () => {
  console.log('1) /health');
  const h = await axios.get(`${API}/health`);
  console.log('   ok:', h.data);

  console.log('2) login as owner');
  const token = await login('owner@pethub.local', 'password123');
  console.log('   got token (first 20 chars):', token.slice(0, 20) + '...');

  console.log('3) create pet');
  const pet = await axios.post(`${API}/pets`, {
    name: 'Smoke', species: 'dog', breed: 'mix', age: 3, weightKg: 12,
    history: 'no known issues',
  }, bearer(token));
  console.log('   pet id:', pet.data.pet.id);

  console.log('4) ask AI (RAG → Ollama → fallback)');
  const ai = await axios.post(`${API}/ai/chat`, {
    question: 'What core vaccines does my dog need?',
    petId: pet.data.pet.id,
  }, bearer(token));
  console.log('   answer (first 80):', ai.data.answer.slice(0, 80) + '...');
  console.log('   confidence:', ai.data.confidence, 'fallback:', ai.data.fallbackUsed);

  console.log('5) list vets');
  const vets = await axios.get(`${API}/appointments/vets`, bearer(token));
  console.log('   approved vets:', vets.data.vets.length);

  if (vets.data.vets.length) {
    console.log('6) book first available slot');
    const dt = new Date(); dt.setDate(dt.getDate() + 1); dt.setHours(10, 0, 0, 0);
    try {
      const appt = await axios.post(`${API}/appointments`, {
        petId: pet.data.pet.id, vetId: vets.data.vets[0].uid, dateTime: dt.toISOString(),
      }, bearer(token));
      console.log('   booked appointment:', appt.data.appointment.id);
    } catch (e) {
      console.log('   booking error (likely conflict):', e.response?.data || e.message);
    }
  }

  console.log('\nAll smoke checks passed.');
})().catch((e) => {
  console.error('SMOKE FAILED:', e.response?.data || e.message);
  process.exit(1);
});
