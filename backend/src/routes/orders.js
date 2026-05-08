// /orders — create an order from cart items, decrement stock, mock payment.
const express = require('express');
const Joi = require('joi');
const { v4: uuid } = require('uuid');
const { db, admin } = require('../firebase');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { HttpError } = require('../middleware/error');

const router = express.Router();
router.use(authMiddleware);

const orderSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    medicineId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).max(100).required(),
  })).min(1).required(),
  // Mock payment field — accepts any string. Real integration would tokenize.
  paymentMethod: Joi.string().valid('mock_card', 'mock_upi', 'cash_on_delivery', 'razorpay').default('mock_card'),
});

const Razorpay = require('razorpay');
const log = require('../utils/logger'); // Make sure log is imported

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
});

router.post('/', validate(orderSchema), async (req, res, next) => {
  try {
    const { items, paymentMethod } = req.body;
    const internalOrderId = uuid();
    let total = 0;
    const lineItems = [];

    await db.runTransaction(async (tx) => {
      // 1. Validate stock + price for every item INSIDE the transaction.
      const refs = items.map((i) => db.collection('medicines').doc(i.medicineId));
      const snaps = await Promise.all(refs.map((r) => tx.get(r)));
      snaps.forEach((s, idx) => {
        if (!s.exists) throw new HttpError(404, `Medicine not found: ${items[idx].medicineId}`);
        const med = s.data();
        const wanted = items[idx].quantity;
        if ((med.stock || 0) < wanted) {
          throw new HttpError(422, `Out of stock: ${med.name} (have ${med.stock}, need ${wanted})`);
        }
        const subtotal = med.price * wanted;
        total += subtotal;
        lineItems.push({ medicineId: items[idx].medicineId, name: med.name, price: med.price, quantity: wanted, subtotal });
      });
      // 2. Decrement stock + create order
      snaps.forEach((s, idx) => {
        tx.update(refs[idx], { stock: admin.firestore.FieldValue.increment(-items[idx].quantity) });
      });
      tx.set(db.collection('orders').doc(internalOrderId), {
        userId: req.user.uid, items: lineItems, total, status: 'pending',
        createdAt: new Date().toISOString(),
      });
    });

    let razorpayOrderId = null;
    if (paymentMethod === 'razorpay') {
      try {
        const options = {
          amount: Math.round(total * 100), // Razorpay expects paise
          currency: 'INR',
          receipt: internalOrderId,
        };
        const order = await razorpay.orders.create(options);
        razorpayOrderId = order.id;
      } catch (err) {
        log.error('Razorpay order creation failed', { error: err.message });
        throw new HttpError(503, `Razorpay Service Unavailable: ${err.message}`);
      }
    } else if (paymentMethod === 'mock_card') {
      razorpayOrderId = 'mock_rzp_order_id';
    }

    res.status(201).json({ orderId: internalOrderId, total, items: lineItems, status: 'pending', razorpayOrderId });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const snap = await db.collection('orders').where('userId', '==', req.user.uid).get();
    res.json({ orders: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (err) { next(err); }
});

module.exports = router;
