// /admin — admin-only operations. Approve vets, list users, view all orders.
const express = require('express');
const Joi = require('joi');
const { db, auth } = require('../firebase');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { HttpError } = require('../middleware/error');

const router = express.Router();
router.use(authMiddleware, requireRole('Admin'));

router.get('/users', async (_req, res, next) => {
  try {
    const snap = await db.collection('users').get();
    res.json({ users: snap.docs.map((d) => ({ uid: d.id, ...d.data() })) });
  } catch (err) { next(err); }
});

router.get('/pending-vets', async (_req, res, next) => {
  try {
    const snap = await db.collection('users')
      .where('role', '==', 'Veterinarian')
      .where('approved', '==', false)
      .get();
    res.json({ vets: snap.docs.map((d) => ({ uid: d.id, ...d.data() })) });
  } catch (err) { next(err); }
});

router.post('/approve-vet/:uid', async (req, res, next) => {
  try {
    const ref = db.collection('users').doc(req.params.uid);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'User not found');
    if (snap.data().role !== 'Veterinarian') throw new HttpError(400, 'User is not a vet');
    await ref.update({ approved: true });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

const setRoleSchema = Joi.object({
  role: Joi.string().valid('PetOwner', 'Veterinarian', 'Admin').required(),
});

router.post('/set-role/:uid', validate(setRoleSchema), async (req, res, next) => {
  try {
    await db.collection('users').doc(req.params.uid).update({ role: req.body.role });
    await auth.setCustomUserClaims(req.params.uid, { role: req.body.role });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get('/orders', async (_req, res, next) => {
  try {
    const snap = await db.collection('orders').get();
    res.json({ orders: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (err) { next(err); }
});

module.exports = router;
