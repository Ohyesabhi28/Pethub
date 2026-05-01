# PetHub MVP - Completion Guide (15% Remaining)

This guide provides exact code snippets to complete the remaining 15% of the MVP.

**Estimated time to complete**: 1-2 hours

---

## 1. Complete `pharmacy.js` Routes

**File**: `backend/src/routes/pharmacy.js`

**Current status**: Only `GET /medicines` and `POST /orders` exist.

**Replace ENTIRE file with:**

```javascript
// backend/src/routes/pharmacy.js
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const Joi = require('joi');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { db } = require('../firebase');

router.use(auth);

// GET /medicines — list all medicines with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { category, search, inStock } = req.query;
    
    const snapshot = await db.collection('medicines').get();
    let medicines = [];
    
    snapshot.forEach(doc => {
      const med = { id: doc.id, ...doc.data() };
      
      // Apply filters
      if (category && med.category !== category) return;
      if (search && !med.name.toLowerCase().includes(search.toLowerCase())) return;
      if (inStock === 'true' && med.stock <= 0) return;
      
      medicines.push(med);
    });
    
    res.json({ medicines, count: medicines.length });
  } catch (err) {
    next(err);
  }
});

// GET /medicines/:id
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await db.collection('medicines').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Medicine not found' });
    
    res.json({ medicine: { id: doc.id, ...doc.data() } });
  } catch (err) {
    next(err);
  }
});

// POST /medicines — admin creates new medicine
router.post(
  '/',
  requireRole('Admin'),
  [
    body('name').notEmpty().withMessage('Name required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be >= 0'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be >= 0'),
    body('category').notEmpty().withMessage('Category required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      
      const { name, description, price, stock, category, requiresPrescription, imageUrl } = req.body;
      
      const medicineData = {
        name,
        description: description || '',
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        requiresPrescription: !!requiresPrescription,
        imageUrl: imageUrl || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.user.uid,
      };
      
      const ref = await db.collection('medicines').add(medicineData);
      
      res.status(201).json({
        message: 'Medicine created',
        id: ref.id,
        medicine: { id: ref.id, ...medicineData },
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /medicines/:id — admin updates medicine
router.put(
  '/:id',
  requireRole('Admin'),
  [
    body('name').optional().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('stock').optional().isInt({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      
      const doc = await db.collection('medicines').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Medicine not found' });
      
      const allowed = ['name', 'description', 'price', 'stock', 'category', 'imageUrl', 'requiresPrescription'];
      const updates = {};
      
      allowed.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      
      updates.updatedAt = new Date().toISOString();
      updates.updatedBy = req.user.uid;
      
      await db.collection('medicines').doc(req.params.id).update(updates);
      
      res.json({ message: 'Medicine updated', updates });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /medicines/:id — admin deletes medicine
router.delete('/:id', requireRole('Admin'), async (req, res, next) => {
  try {
    const doc = await db.collection('medicines').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Medicine not found' });
    
    await db.collection('medicines').doc(req.params.id).delete();
    
    res.json({ message: 'Medicine deleted', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

// GET /orders — list user's orders
router.get('/user/orders', async (req, res, next) => {
  try {
    const snapshot = await db.collection('orders')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// GET /orders/:id — get specific order with details
router.get('/user/orders/:id', async (req, res, next) => {
  try {
    const doc = await db.collection('orders').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });
    
    const order = doc.data();
    if (order.userId !== req.user.uid && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ order: { id: doc.id, ...order } });
  } catch (err) {
    next(err);
  }
});

// POST /orders — place new order (existing route, here for completeness)
router.post('/checkout', [
  body('items').isArray({ min: 1 }),
  body('deliveryAddress').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { items, deliveryAddress, prescriptionId } = req.body;
    
    let totalAmount = 0;
    const enrichedItems = [];
    
    for (const item of items) {
      const medDoc = await db.collection('medicines').doc(item.medicineId).get();
      if (!medDoc.exists) {
        return res.status(400).json({ error: `Medicine ${item.medicineId} not found` });
      }
      
      const med = medDoc.data();
      
      // Check stock
      if (med.stock < item.quantity) {
        return res.status(422).json({
          error: `${med.name} out of stock (available: ${med.stock})`,
          itemId: item.medicineId,
          available: med.stock,
          requested: item.quantity,
        });
      }
      
      // Check prescription requirement
      if (med.requiresPrescription && !prescriptionId) {
        return res.status(422).json({
          error: `${med.name} requires a valid prescription`,
          itemId: item.medicineId,
        });
      }
      
      const itemTotal = med.price * item.quantity;
      totalAmount += itemTotal;
      
      enrichedItems.push({
        medicineId: item.medicineId,
        name: med.name,
        quantity: item.quantity,
        price: med.price,
        total: itemTotal,
      });
      
      // Deduct stock (in real app, use transaction)
      await db.collection('medicines').doc(item.medicineId).update({
        stock: med.stock - item.quantity,
      });
    }
    
    const orderData = {
      userId: req.user.uid,
      items: enrichedItems,
      totalAmount,
      deliveryAddress,
      prescriptionId: prescriptionId || null,
      status: 'Pending',
      paymentStatus: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const ref = await db.collection('orders').add(orderData);
    
    // Create payment record
    await db.collection('payments').add({
      orderId: ref.id,
      userId: req.user.uid,
      amount: totalAmount,
      status: 'Pending',
      method: 'MockPayment',
      createdAt: new Date().toISOString(),
    });
    
    res.status(201).json({
      message: 'Order created',
      orderId: ref.id,
      order: { id: ref.id, ...orderData },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /orders/:id/status — update order status (admin/user)
router.put('/:id/status', [
  body('status').isIn(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']),
], async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const doc = await db.collection('orders').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });
    
    const order = doc.data();
    if (order.userId !== req.user.uid && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await db.collection('orders').doc(req.params.id).update({
      status,
      updatedAt: new Date().toISOString(),
    });
    
    res.json({ message: 'Order status updated', status });
  } catch (err) {
    next(err);
  }
});

// PUT /orders/:id/cancel — cancel order (refund stock)
router.put('/:id/cancel', async (req, res, next) => {
  try {
    const doc = await db.collection('orders').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });
    
    const order = doc.data();
    if (order.userId !== req.user.uid && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (order.status === 'Cancelled') {
      return res.status(400).json({ error: 'Order already cancelled' });
    }
    
    // Refund stock
    for (const item of order.items) {
      const medDoc = await db.collection('medicines').doc(item.medicineId).get();
      if (medDoc.exists) {
        const med = medDoc.data();
        await db.collection('medicines').doc(item.medicineId).update({
          stock: med.stock + item.quantity,
        });
      }
    }
    
    await db.collection('orders').doc(req.params.id).update({
      status: 'Cancelled',
      updatedAt: new Date().toISOString(),
    });
    
    res.json({ message: 'Order cancelled, stock refunded' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

---

## 2. Complete `records.js` Health Records

**File**: `backend/src/routes/records.js`

**Add these endpoints:**

```javascript
// backend/src/routes/records.js — Add these methods to existing file

// GET /records/health-summary/:petId — Aggregated health overview
router.get('/health-summary/:petId', async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user, db);
    
    const petDoc = await db.collection('pets').doc(req.params.petId).get();
    if (!petDoc.exists) return res.status(404).json({ error: 'Pet not found' });
    
    const pet = petDoc.data();
    
    // Fetch all health data in parallel
    const [vaccSnapshot, prescSnapshot, remindSnapshot] = await Promise.all([
      db.collection('vaccinations').where('petId', '==', req.params.petId).get(),
      db.collection('prescriptions').where('petId', '==', req.params.petId).get(),
      db.collection('reminders').where('petId', '==', req.params.petId).get(),
    ]);
    
    const vaccinations = [];
    const prescriptions = [];
    const reminders = [];
    
    vaccSnapshot.forEach(doc => vaccinations.push({ id: doc.id, ...doc.data() }));
    prescSnapshot.forEach(doc => prescriptions.push({ id: doc.id, ...doc.data() }));
    remindSnapshot.forEach(doc => {
      if (doc.data().status === 'Pending') {
        reminders.push({ id: doc.id, ...doc.data() });
      }
    });
    
    // Sort by date
    vaccinations.sort((a, b) => new Date(b.date) - new Date(a.date));
    prescriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    reminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    res.json({
      petId: req.params.petId,
      petName: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      allergies: pet.allergies || [],
      medicalHistory: pet.medicalHistory || [],
      vaccinations: vaccinations.slice(0, 10), // Last 10
      prescriptions: prescriptions.slice(0, 10), // Last 10
      pendingReminders: reminders.slice(0, 5), // Next 5
      lastVaccination: vaccinations.length > 0 ? vaccinations[0].date : null,
      nextReminder: reminders.length > 0 ? reminders[0].dueDate : null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /records/vaccinations/:petId — Create vaccination (improved)
router.post('/:petId/vaccinations', requireRole('Veterinarian', 'Admin'), [
  body('name').notEmpty(),
  body('date').isISO8601(),
  body('nextDueDate').optional().isISO8601(),
], async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user, db);
    
    const { name, date, nextDueDate, batchNumber, administeredBy, notes } = req.body;
    
    const vaccData = {
      petId: req.params.petId,
      name,
      date,
      nextDueDate: nextDueDate || null,
      batchNumber: batchNumber || '',
      administeredBy: administeredBy || req.user.uid,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };
    
    const ref = await db.collection('vaccinations').add(vaccData);
    
    // Auto-create reminder if nextDueDate provided
    if (nextDueDate) {
      const reminderRef = await db.collection('reminders').add({
        petId: req.params.petId,
        type: 'Vaccination',
        title: `${name} booster due`,
        dueDate: nextDueDate,
        status: 'Pending',
        linkedVaccinationId: ref.id,
        createdAt: new Date().toISOString(),
      });
      
      res.status(201).json({
        message: 'Vaccination recorded with reminder',
        vaccinationId: ref.id,
        reminderId: reminderRef.id,
        vaccination: { id: ref.id, ...vaccData },
      });
    } else {
      res.status(201).json({
        message: 'Vaccination recorded',
        id: ref.id,
        vaccination: { id: ref.id, ...vaccData },
      });
    }
  } catch (err) {
    next(err);
  }
});

// PUT /records/vaccinations/:vaccinationId — Edit vaccination
router.put('/vaccinations/:vaccinationId', requireRole('Veterinarian', 'Admin'), async (req, res, next) => {
  try {
    const doc = await db.collection('vaccinations').doc(req.params.vaccinationId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Vaccination not found' });
    
    const vacc = doc.data();
    await assertPetAccess(vacc.petId, req.user, db);
    
    const allowed = ['name', 'date', 'nextDueDate', 'batchNumber', 'notes'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    
    await db.collection('vaccinations').doc(req.params.vaccinationId).update(updates);
    
    res.json({ message: 'Vaccination updated', updates });
  } catch (err) {
    next(err);
  }
});

// DELETE /records/vaccinations/:vaccinationId
router.delete('/vaccinations/:vaccinationId', requireRole('Veterinarian', 'Admin'), async (req, res, next) => {
  try {
    const doc = await db.collection('vaccinations').doc(req.params.vaccinationId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Vaccination not found' });
    
    const vacc = doc.data();
    await assertPetAccess(vacc.petId, req.user, db);
    
    await db.collection('vaccinations').doc(req.params.vaccinationId).delete();
    
    res.json({ message: 'Vaccination deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /records/:petId/prescriptions — Create prescription (improved)
router.post('/:petId/prescriptions', requireRole('Veterinarian', 'Admin'), [
  body('medicines').isArray({ min: 1 }),
  body('diagnosis').notEmpty(),
  body('instructions').optional().notEmpty(),
], async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user, db);
    
    const { medicines, diagnosis, instructions, validUntil, appointmentId } = req.body;
    
    // Validate medicines array
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ error: 'At least one medicine required' });
    }
    
    for (const med of medicines) {
      if (!med.name || !med.dosage) {
        return res.status(400).json({ error: 'Each medicine needs name and dosage' });
      }
    }
    
    const prescData = {
      petId: req.params.petId,
      vetId: req.user.uid,
      medicines,
      diagnosis,
      instructions: instructions || '',
      validUntil: validUntil || null,
      appointmentId: appointmentId || null,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    
    const ref = await db.collection('prescriptions').add(prescData);
    
    // Create medication reminder
    const reminderRef = await db.collection('reminders').add({
      petId: req.params.petId,
      type: 'Medication',
      title: `Follow prescription: ${medicines.map(m => m.name).join(', ')}`,
      dueDate: new Date().toISOString(), // Immediate
      status: 'Pending',
      linkedPrescriptionId: ref.id,
      createdAt: new Date().toISOString(),
    });
    
    res.status(201).json({
      message: 'Prescription created with reminder',
      prescriptionId: ref.id,
      reminderId: reminderRef.id,
      prescription: { id: ref.id, ...prescData },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /records/prescriptions/:prescriptionId/revoke — Deactivate prescription
router.put('/prescriptions/:prescriptionId/revoke', requireRole('Veterinarian', 'Admin'), async (req, res, next) => {
  try {
    const doc = await db.collection('prescriptions').doc(req.params.prescriptionId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Prescription not found' });
    
    const presc = doc.data();
    await assertPetAccess(presc.petId, req.user, db);
    
    await db.collection('prescriptions').doc(req.params.prescriptionId).update({
      status: 'Revoked',
      revokedAt: new Date().toISOString(),
    });
    
    res.json({ message: 'Prescription revoked' });
  } catch (err) {
    next(err);
  }
});

// GET /records/:petId/medications-due — Active medications for pet
router.get('/:petId/medications-due', async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user, db);
    
    const snapshot = await db.collection('prescriptions')
      .where('petId', '==', req.params.petId)
      .where('status', '==', 'Active')
      .get();
    
    const prescriptions = [];
    snapshot.forEach(doc => {
      const presc = doc.data();
      // Only include if not expired
      if (!presc.validUntil || new Date(presc.validUntil) > new Date()) {
        prescriptions.push({ id: doc.id, ...presc });
      }
    });
    
    res.json({ activeMedications: prescriptions });
  } catch (err) {
    next(err);
  }
});

// PUT /records/:petId/reminders/:reminderId/complete — Mark reminder as done
router.put('/:petId/reminders/:reminderId/complete', async (req, res, next) => {
  try {
    await assertPetAccess(req.params.petId, req.user, db);
    
    const doc = await db.collection('reminders').doc(req.params.reminderId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reminder not found' });
    
    const reminder = doc.data();
    if (reminder.petId !== req.params.petId) {
      return res.status(400).json({ error: 'Reminder does not belong to this pet' });
    }
    
    await db.collection('reminders').doc(req.params.reminderId).update({
      status: 'Completed',
      completedAt: new Date().toISOString(),
    });
    
    res.json({ message: 'Reminder marked as complete' });
  } catch (err) {
    next(err);
  }
});
```

---

## 3. Test the Complete Routes

### Test Pharmacy CRUD
```bash
# Create medicine (admin)
curl -X POST http://localhost:4000/pharmacy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock_ADMIN_ID_Admin" \
  -d '{
    "name": "Amoxicillin",
    "price": 45.99,
    "stock": 100,
    "category": "Antibiotics",
    "description": "Broad-spectrum antibiotic"
  }'

# Update medicine
curl -X PUT http://localhost:4000/pharmacy/MED_ID \
  -H "Authorization: Bearer mock_ADMIN_ID_Admin" \
  -d '{"stock": 80}'

# List medicines
curl http://localhost:4000/pharmacy

# Get order
curl http://localhost:4000/pharmacy/user/orders/ORDER_ID \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner"
```

### Test Health Records
```bash
# Get health summary
curl http://localhost:4000/records/health-summary/PET_ID \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner"

# Add vaccination with reminder
curl -X POST http://localhost:4000/records/PET_ID/vaccinations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock_VET_ID_Veterinarian" \
  -d '{
    "name": "DHPP",
    "date": "2026-05-01T10:00:00Z",
    "nextDueDate": "2027-05-01T00:00:00Z"
  }'

# Get active medications
curl http://localhost:4000/records/PET_ID/medications-due \
  -H "Authorization: Bearer mock_VET_ID_Veterinarian"
```

---

## 4. Optional: Add TURN Server for Better WebRTC

If video calls fail on some networks, add TURN server to `backend/src/services/signaling.js`:

```javascript
// In the webrtc:offer handler, add TURN servers:

socket.on('webrtc:offer', ({ offer, to, from, roomId }) => {
  // Broadcast offer with TURN config
  io.to(roomId).emit('webrtc:offer', {
    offer,
    from,
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: 'turn:turnserver.example.com:3478',
        username: 'user',
        credential: 'pass'
      }
    ]
  });
});
```

Free TURN servers:
- `stun.l.google.com:19302`
- `stun1.l.google.com:19302`
- `openrelay.metered.ca` (free tier available)

---

## Summary

| Feature | File | Time | Code Lines |
|---|---|---|---|
| Pharmacy CRUD | `pharmacy.js` | 30 min | 200 lines |
| Health records | `records.js` | 45 min | 150 lines |
| WebRTC TURN | `signaling.js` | 15 min | 20 lines |
| **Total** | | **90 minutes** | **~370 lines** |

**After completing these, PetHub MVP will be 100% feature-complete!**
