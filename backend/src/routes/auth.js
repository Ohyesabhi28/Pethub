// /auth — register + role lookup. Login is handled client-side by the
// Firebase JS SDK against the emulator (no need to proxy passwords through Node).
const express = require('express');
const Joi = require('joi');
const { auth, db } = require('../firebase');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const { HttpError } = require('../middleware/error');

const router = express.Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(1).max(80).required(),
  role: Joi.string().valid('PetOwner', 'Veterinarian', 'Admin').default('PetOwner'),
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    let userRecord;
    try {
      userRecord = await auth.createUser({ email, password, displayName: name });
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        throw new HttpError(409, 'Email already registered');
      }
      throw err;
    }
    // Vets must be approved before they can be booked.
    const approved = role !== 'Veterinarian';
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role,
      approved,
      createdAt: new Date().toISOString(),
    });
    // Mirror role into custom claims so token verification picks it up.
    await auth.setCustomUserClaims(userRecord.uid, { role });
    res.status(201).json({ uid: userRecord.uid, email, name, role, approved });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

const tokenSchema = Joi.object({
  fcmToken: Joi.string().required(),
});

router.post('/token', authMiddleware, validate(tokenSchema), async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    await db.collection('users').doc(req.user.uid).update({ fcmToken });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
