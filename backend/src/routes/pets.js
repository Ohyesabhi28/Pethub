// /pets — owner-scoped CRUD. Image uploads accept a base64 data URL or remote
// URL; for the MVP we store the string directly (no object storage required).
const express = require('express');
const Joi = require('joi');
const { v4: uuid } = require('uuid');
const { db } = require('../firebase');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { HttpError } = require('../middleware/error');

const router = express.Router();
router.use(authMiddleware);

const petSchema = Joi.object({
  name: Joi.string().min(1).max(60).required(),
  species: Joi.string().valid('dog', 'cat', 'bird', 'rabbit', 'other').default('dog'),
  breed: Joi.string().max(80).allow('', null),
  age: Joi.number().min(0).max(50).required(),
  weightKg: Joi.number().min(0).max(200).allow(null),
  history: Joi.string().max(2000).allow('', null),
  imageUrl: Joi.string().max(500_000).allow('', null), // allow data: URLs
});

router.get('/', async (req, res, next) => {
  try {
    const snap = await db.collection('pets').where('ownerId', '==', req.user.uid).get();
    res.json({ pets: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const ref = db.collection('pets').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Pet not found');
    const data = snap.data();
    if (data.ownerId !== req.user.uid && req.user.role !== 'Veterinarian' && req.user.role !== 'Admin') {
      throw new HttpError(403, 'Not your pet');
    }
    res.json({ pet: { id: snap.id, ...data } });
  } catch (err) { next(err); }
});

router.post('/', validate(petSchema), async (req, res, next) => {
  try {
    const id = uuid();
    const pet = { ...req.body, ownerId: req.user.uid, createdAt: new Date().toISOString() };
    await db.collection('pets').doc(id).set(pet);
    res.status(201).json({ pet: { id, ...pet } });
  } catch (err) { next(err); }
});

router.put('/:id', validate(petSchema), async (req, res, next) => {
  try {
    const ref = db.collection('pets').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Pet not found');
    if (snap.data().ownerId !== req.user.uid) throw new HttpError(403, 'Not your pet');
    await ref.update(req.body);
    res.json({ pet: { id: req.params.id, ...snap.data(), ...req.body } });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const ref = db.collection('pets').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Pet not found');
    if (snap.data().ownerId !== req.user.uid) throw new HttpError(403, 'Not your pet');
    await ref.delete();
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
