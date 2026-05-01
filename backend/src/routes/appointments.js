// /appointments — search vets, book a slot, list, status updates.
// Double-booking is prevented by a Firestore transaction that checks for
// any existing appointment for the same vetId+dateTime.
const express = require('express');
const Joi = require('joi');
const { v4: uuid } = require('uuid');
const { db } = require('../firebase');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { HttpError } = require('../middleware/error');

const router = express.Router();
router.use(authMiddleware);

// Public-ish: any logged-in user can list approved vets.
router.get('/vets', async (_req, res, next) => {
  try {
    const snap = await db.collection('users')
      .where('role', '==', 'Veterinarian')
      .where('approved', '==', true)
      .get();
    res.json({ vets: snap.docs.map((d) => ({ uid: d.id, ...d.data(), email: undefined })) });
  } catch (err) { next(err); }
});

const bookSchema = Joi.object({
  petId: Joi.string().required(),
  vetId: Joi.string().required(),
  // ISO timestamp, rounded to a 30-min slot client-side.
  dateTime: Joi.string().isoDate().required(),
  reason: Joi.string().max(500).allow('', null),
});

router.post('/', validate(bookSchema), async (req, res, next) => {
  try {
    const { petId, vetId, dateTime, reason } = req.body;
    // Confirm pet ownership
    const petSnap = await db.collection('pets').doc(petId).get();
    if (!petSnap.exists) throw new HttpError(404, 'Pet not found');
    if (petSnap.data().ownerId !== req.user.uid) throw new HttpError(403, 'Not your pet');
    // Confirm vet exists and is approved
    const vetSnap = await db.collection('users').doc(vetId).get();
    if (!vetSnap.exists || vetSnap.data().role !== 'Veterinarian' || !vetSnap.data().approved) {
      throw new HttpError(404, 'Vet not found or not approved');
    }

    const id = uuid();
    const newAppt = {
      petId,
      vetId,
      ownerId: req.user.uid,
      dateTime,
      reason: reason || '',
      status: 'scheduled',
      roomId: id, // reuse appointment id as WebRTC room id
      createdAt: new Date().toISOString(),
    };

    await db.runTransaction(async (tx) => {
      // Conflict check: same vet at same dateTime
      const conflict = await db.collection('appointments')
        .where('vetId', '==', vetId)
        .where('dateTime', '==', dateTime)
        .where('status', 'in', ['scheduled', 'in_progress'])
        .get();
      if (!conflict.empty) {
        throw new HttpError(409, 'Vet already booked at that time');
      }
      tx.set(db.collection('appointments').doc(id), newAppt);
    });

    res.status(201).json({ appointment: { id, ...newAppt } });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    // Owners see their own; vets see theirs.
    const field = req.user.role === 'Veterinarian' ? 'vetId' : 'ownerId';
    const snap = await db.collection('appointments').where(field, '==', req.user.uid).get();
    res.json({ appointments: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (err) { next(err); }
});

const statusSchema = Joi.object({
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').required(),
  notes: Joi.string().max(2000).allow('', null),
});

router.patch('/:id/status', validate(statusSchema), async (req, res, next) => {
  try {
    const ref = db.collection('appointments').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Appointment not found');
    const data = snap.data();
    const isParticipant = data.ownerId === req.user.uid || data.vetId === req.user.uid;
    if (!isParticipant && req.user.role !== 'Admin') throw new HttpError(403, 'Not your appointment');
    await ref.update({ status: req.body.status, notes: req.body.notes || data.notes || '' });
    if (req.body.status === 'completed') {
      // Persist a consultation summary record.
      await db.collection('consultations').doc(req.params.id).set({
        appointmentId: req.params.id,
        notes: req.body.notes || '',
        completedAt: new Date().toISOString(),
      });
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
