// /records — vaccinations, prescriptions, reminders per pet + health summary.
const express = require('express');
const Joi = require('joi');
const { v4: uuid } = require('uuid');
const { db } = require('../firebase');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { HttpError } = require('../middleware/error');

const router = express.Router();
router.use(authMiddleware);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function assertPetAccess(petId, user) {
  const snap = await db.collection('pets').doc(petId).get();
  if (!snap.exists) throw new HttpError(404, 'Pet not found');
  const owns = snap.data().ownerId === user.uid;
  if (!owns && user.role !== 'Veterinarian' && user.role !== 'Admin') {
    throw new HttpError(403, 'Not your pet');
  }
  return snap; // return for reuse
}

function sortByDate(arr, field) {
  return [...arr].sort((a, b) => new Date(b[field]) - new Date(a[field]));
}

function isPrescriptionActive(rx) {
  if (!rx.durationDays) return false;
  const end = new Date(rx.createdAt);
  end.setDate(end.getDate() + rx.durationDays);
  return end >= new Date();
}

// ── GET /:petId — combined record (vaccinations + prescriptions) ──────────────
router.get('/:petId', async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user);
    const [vac, rx] = await Promise.all([
      db.collection('vaccinations').where('petId', '==', req.params.petId).get(),
      db.collection('prescriptions').where('petId', '==', req.params.petId).get(),
    ]);
    res.json({
      vaccinations: sortByDate(vac.docs.map((d) => ({ id: d.id, ...d.data() })), 'givenAt'),
      prescriptions: sortByDate(rx.docs.map((d) => ({ id: d.id, ...d.data() })), 'createdAt'),
    });
  } catch (err) { next(err); }
});

// ── GET /:petId/vaccinations — list all vaccinations ─────────────────────────
router.get('/:petId/vaccinations', async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user);
    const snap = await db.collection('vaccinations').where('petId', '==', req.params.petId).get();
    const vaccinations = sortByDate(snap.docs.map((d) => ({ id: d.id, ...d.data() })), 'givenAt');
    res.json({ vaccinations, total: vaccinations.length });
  } catch (err) { next(err); }
});

// ── GET /:petId/prescriptions — list all prescriptions ───────────────────────
router.get('/:petId/prescriptions', async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user);
    const snap = await db.collection('prescriptions').where('petId', '==', req.params.petId).get();
    const all = sortByDate(snap.docs.map((d) => ({ id: d.id, ...d.data() })), 'createdAt');
    const active = all.filter(isPrescriptionActive);
    res.json({ prescriptions: all, activePrescriptions: active, total: all.length });
  } catch (err) { next(err); }
});

// ── GET /:petId/reminders — list pending reminders ───────────────────────────
router.get('/:petId/reminders', async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user);
    const snap = await db.collection('reminders').where('petId', '==', req.params.petId).get();
    let reminders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Optionally filter to pending only
    const onlyPending = req.query.pending !== 'false';
    if (onlyPending) reminders = reminders.filter((r) => !r.sent && !r.completed);

    // Sort by dueAt ascending (soonest first)
    reminders.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

    res.json({ reminders, total: reminders.length });
  } catch (err) { next(err); }
});

// ── PUT /:petId/reminders/:reminderId/complete — mark a reminder done ─────────
router.put('/:petId/reminders/:reminderId/complete', async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user);
    const ref = db.collection('reminders').doc(req.params.reminderId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Reminder not found');
    if (snap.data().petId !== req.params.petId) throw new HttpError(403, 'Reminder does not belong to this pet');
    await ref.update({ completed: true, completedAt: new Date().toISOString(), completedBy: req.user.uid });
    res.json({ message: 'Reminder marked as completed' });
  } catch (err) { next(err); }
});

// ── GET /:petId/summary — complete health overview ────────────────────────────
router.get('/:petId/summary', async (req, res, next) => {
  try {
    const petSnap = await assertPetAccess(req.params.petId, req.user);
    const { petId } = req.params;

    const [vacSnap, rxSnap, remSnap] = await Promise.all([
      db.collection('vaccinations').where('petId', '==', petId).get(),
      db.collection('prescriptions').where('petId', '==', petId).get(),
      db.collection('reminders').where('petId', '==', petId).get(),
    ]);

    const vaccinations   = sortByDate(vacSnap.docs.map((d) => ({ id: d.id, ...d.data() })), 'givenAt');
    const prescriptions  = sortByDate(rxSnap.docs.map((d) => ({ id: d.id, ...d.data() })), 'createdAt');
    const reminders      = remSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const now = new Date();

    // Last vaccination
    const lastVaccination = vaccinations[0] || null;

    // Upcoming due vaccinations (nextDueAt in the future)
    const upcomingVaccinations = vaccinations
      .filter((v) => v.nextDueAt && new Date(v.nextDueAt) >= now)
      .sort((a, b) => new Date(a.nextDueAt) - new Date(b.nextDueAt));

    // Overdue vaccinations (nextDueAt in the past)
    const overdueVaccinations = vaccinations
      .filter((v) => v.nextDueAt && new Date(v.nextDueAt) < now)
      .sort((a, b) => new Date(a.nextDueAt) - new Date(b.nextDueAt));

    // Active prescriptions
    const activePrescriptions = prescriptions.filter(isPrescriptionActive);

    // Pending reminders (not sent, not completed), sorted soonest first
    const pendingReminders = reminders
      .filter((r) => !r.sent && !r.completed)
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

    // Overdue reminders
    const overdueReminders = pendingReminders.filter((r) => new Date(r.dueAt) < now);

    res.json({
      pet: { id: petId, ...petSnap.data() },

      // Vaccination summary
      vaccinationCount:     vaccinations.length,
      lastVaccination,
      upcomingVaccinations,
      overdueVaccinations,

      // Prescription summary
      prescriptionCount:    prescriptions.length,
      activePrescriptions,
      recentPrescriptions:  prescriptions.slice(0, 5),

      // Reminders
      pendingRemindersCount: pendingReminders.length,
      overdueRemindersCount: overdueReminders.length,
      nextReminder:          pendingReminders[0] || null,
      overdueReminders,
      pendingReminders,

      // Generated at
      generatedAt: now.toISOString(),
    });
  } catch (err) { next(err); }
});

// ── POST /:petId/vaccinations — add a vaccination record ─────────────────────
const vacSchema = Joi.object({
  name:      Joi.string().trim().required(),
  givenAt:   Joi.string().isoDate().required(),
  nextDueAt: Joi.string().isoDate().allow(null, ''),
  batchNo:   Joi.string().trim().max(100).allow('', null),
  notes:     Joi.string().trim().max(500).allow('', null),
});

router.post('/:petId/vaccinations', validate(vacSchema), async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user);
    const id  = uuid();
    const doc = {
      ...req.body,
      petId:     req.params.petId,
      addedBy:   req.user.uid,
      createdAt: new Date().toISOString(),
    };
    await db.collection('vaccinations').doc(id).set(doc);

    let reminderId = null;
    if (doc.nextDueAt) {
      reminderId = uuid();
      await db.collection('reminders').doc(reminderId).set({
        petId:     req.params.petId,
        userId:    req.user.uid,
        title:     `${doc.name} due`,
        body:      `Time for ${doc.name} booster vaccination`,
        dueAt:     doc.nextDueAt,
        type:      'vaccination',
        sent:      false,
        completed: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.status(201).json({ message: 'Vaccination recorded', vaccination: { id, ...doc }, reminderId });
  } catch (err) { next(err); }
});

// ── DELETE /:petId/vaccinations/:vacId — remove vaccination record ─────────────
router.delete('/:petId/vaccinations/:vacId', async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user);
    const ref  = db.collection('vaccinations').doc(req.params.vacId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Vaccination not found');
    if (snap.data().petId !== req.params.petId) throw new HttpError(403, 'Record mismatch');
    await ref.delete();
    res.json({ message: 'Vaccination record deleted' });
  } catch (err) { next(err); }
});

// ── POST /:petId/prescriptions — vet creates a prescription ──────────────────
const rxSchema = Joi.object({
  medicineName:  Joi.string().trim().required(),
  dosage:        Joi.string().trim().required(),
  durationDays:  Joi.number().integer().min(1).max(365).required(),
  frequency:     Joi.string().trim().max(100).allow('', null),
  refills:       Joi.number().integer().min(0).max(12).default(0),
  notes:         Joi.string().trim().max(1000).allow('', null),
});

router.post('/:petId/prescriptions', validate(rxSchema), async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user);
    if (req.user.role !== 'Veterinarian' && req.user.role !== 'Admin') {
      throw new HttpError(403, 'Only vets can write prescriptions');
    }
    const id  = uuid();
    const doc = {
      ...req.body,
      petId:     req.params.petId,
      vetId:     req.user.uid,
      vetName:   req.user.name,
      createdAt: new Date().toISOString(),
    };
    await db.collection('prescriptions').doc(id).set(doc);

    // Auto-create a reminder for when the prescription ends
    const expiresAt = new Date(doc.createdAt);
    expiresAt.setDate(expiresAt.getDate() + doc.durationDays);
    const reminderId = uuid();
    await db.collection('reminders').doc(reminderId).set({
      petId:     req.params.petId,
      userId:    req.user.uid,
      title:     `${doc.medicineName} course ending`,
      body:      `The ${doc.medicineName} prescription (${doc.durationDays} days) ends soon. Consult your vet for review.`,
      dueAt:     expiresAt.toISOString(),
      type:      'prescription',
      sent:      false,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Prescription created', prescription: { id, ...doc }, reminderId });
  } catch (err) { next(err); }
});

// ── DELETE /:petId/prescriptions/:rxId — remove prescription ─────────────────
router.delete('/:petId/prescriptions/:rxId', async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user);
    if (req.user.role !== 'Veterinarian' && req.user.role !== 'Admin') {
      throw new HttpError(403, 'Only vets can delete prescriptions');
    }
    const ref  = db.collection('prescriptions').doc(req.params.rxId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Prescription not found');
    if (snap.data().petId !== req.params.petId) throw new HttpError(403, 'Record mismatch');
    await ref.delete();
    res.json({ message: 'Prescription deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
