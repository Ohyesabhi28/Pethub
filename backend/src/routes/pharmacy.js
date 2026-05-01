// /pharmacy — medicines catalogue + admin CRUD.
// Public (authenticated): GET /medicines
// Admin only: POST /medicines, PUT /medicines/:id, DELETE /medicines/:id
// Admin only: GET /all-orders, PUT /orders/:orderId/status
const express = require('express');
const Joi = require('joi');
const { v4: uuid } = require('uuid');
const { db } = require('../firebase');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { HttpError } = require('../middleware/error');

const router = express.Router();
router.use(authMiddleware);

// ── Medicine schemas ──────────────────────────────────────────────────────────
const medicineSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(200).required(),
  category:    Joi.string().trim().min(2).max(80).required(),
  price:       Joi.number().positive().required(),
  stock:       Joi.number().integer().min(0).required(),
  requiresRx:  Joi.boolean().default(false),
  description: Joi.string().trim().max(500).allow('', null).default(''),
});

const updateMedicineSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(200),
  category:    Joi.string().trim().min(2).max(80),
  price:       Joi.number().positive(),
  stock:       Joi.number().integer().min(0),
  requiresRx:  Joi.boolean(),
  description: Joi.string().trim().max(500).allow('', null),
}).min(1); // at least one field required

const stockAdjustSchema = Joi.object({
  adjustment: Joi.number().integer().required(), // positive = restock, negative = deduct
  reason:     Joi.string().trim().max(200).allow('', null),
});

// ── GET /medicines — list all medicines (with optional ?category= & ?search=) ─
router.get('/medicines', async (req, res, next) => {
  try {
    const snap = await db.collection('medicines').get();
    let medicines = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Filter by category
    if (req.query.category) {
      medicines = medicines.filter(
        (m) => m.category?.toLowerCase() === req.query.category.toLowerCase()
      );
    }
    // Search by name
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      medicines = medicines.filter((m) => m.name?.toLowerCase().includes(q));
    }

    // Sort by name alphabetically
    medicines.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    res.json({ medicines, total: medicines.length });
  } catch (err) { next(err); }
});

// ── GET /medicines/categories — distinct category list ────────────────────────
router.get('/medicines/categories', async (_req, res, next) => {
  try {
    const snap = await db.collection('medicines').get();
    const cats = [...new Set(snap.docs.map((d) => d.data().category).filter(Boolean))].sort();
    res.json({ categories: cats });
  } catch (err) { next(err); }
});

// ── GET /medicines/:id — single medicine detail ───────────────────────────────
router.get('/medicines/:id', async (req, res, next) => {
  try {
    const snap = await db.collection('medicines').doc(req.params.id).get();
    if (!snap.exists) throw new HttpError(404, 'Medicine not found');
    res.json({ medicine: { id: snap.id, ...snap.data() } });
  } catch (err) { next(err); }
});

// ── POST /medicines — Admin: add new medicine ─────────────────────────────────
router.post('/medicines', requireRole('Admin'), validate(medicineSchema), async (req, res, next) => {
  try {
    const id = uuid();
    const doc = { ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await db.collection('medicines').doc(id).set(doc);
    res.status(201).json({ message: 'Medicine added successfully', medicine: { id, ...doc } });
  } catch (err) { next(err); }
});

// ── PUT /medicines/:id — Admin: update medicine details ───────────────────────
router.put('/medicines/:id', requireRole('Admin'), validate(updateMedicineSchema), async (req, res, next) => {
  try {
    const ref = db.collection('medicines').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Medicine not found');
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    await ref.update(updates);
    res.json({ message: 'Medicine updated', medicine: { id: snap.id, ...snap.data(), ...updates } });
  } catch (err) { next(err); }
});

// ── PUT /medicines/:id/stock — Admin: adjust stock (restock or deduct) ────────
router.put('/medicines/:id/stock', requireRole('Admin'), validate(stockAdjustSchema), async (req, res, next) => {
  try {
    const ref = db.collection('medicines').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Medicine not found');
    const current = snap.data().stock || 0;
    const newStock = current + req.body.adjustment;
    if (newStock < 0) throw new HttpError(422, `Cannot reduce stock below 0 (current: ${current}, adjustment: ${req.body.adjustment})`);
    await ref.update({ stock: newStock, updatedAt: new Date().toISOString() });
    res.json({ message: 'Stock updated', previousStock: current, newStock, adjustment: req.body.adjustment });
  } catch (err) { next(err); }
});

// ── DELETE /medicines/:id — Admin: delete medicine ────────────────────────────
router.delete('/medicines/:id', requireRole('Admin'), async (req, res, next) => {
  try {
    const ref = db.collection('medicines').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Medicine not found');
    await ref.delete();
    res.json({ message: `Medicine "${snap.data().name}" deleted successfully` });
  } catch (err) { next(err); }
});

// ── GET /all-orders — Admin: view all orders with user + item detail ──────────
router.get('/all-orders', requireRole('Admin'), async (req, res, next) => {
  try {
    let query = db.collection('orders');

    // Optional filter by status
    if (req.query.status) {
      query = query.where('status', '==', req.query.status);
    }

    const snap = await query.get();
    let orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Sort by newest first in memory
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const limit  = parseInt(req.query.limit  || '50', 10);
    const offset = parseInt(req.query.offset || '0',  10);
    const total  = orders.length;
    orders = orders.slice(offset, offset + limit);

    res.json({ orders, total, limit, offset });
  } catch (err) { next(err); }
});

// ── GET /all-orders/:orderId — Admin: single order detail ─────────────────────
router.get('/all-orders/:orderId', requireRole('Admin'), async (req, res, next) => {
  try {
    const snap = await db.collection('orders').doc(req.params.orderId).get();
    if (!snap.exists) throw new HttpError(404, 'Order not found');
    res.json({ order: { id: snap.id, ...snap.data() } });
  } catch (err) { next(err); }
});

// ── PUT /all-orders/:orderId/status — Admin: update order status ──────────────
const statusSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').required(),
  note:   Joi.string().trim().max(300).allow('', null),
});

router.put('/all-orders/:orderId/status', requireRole('Admin'), validate(statusSchema), async (req, res, next) => {
  try {
    const ref = db.collection('orders').doc(req.params.orderId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Order not found');

    const previous = snap.data().status;
    await ref.update({
      status: req.body.status,
      statusNote: req.body.note || null,
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: 'Order status updated', orderId: req.params.orderId, previous, status: req.body.status });
  } catch (err) { next(err); }
});

module.exports = router;
