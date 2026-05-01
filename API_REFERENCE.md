# PetHub API Reference Card

**Base URL**: `http://localhost:4000`  
**Auth Header**: `Authorization: Bearer <token>`  
**Content-Type**: `application/json`

---

## 🔐 Authentication

### POST /auth/register
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "password123",
    "name": "John Doe",
    "role": "PetOwner"
  }'

# Response: { message, user: { uid, name, email, role } }
```

### POST /auth/login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "owner@pethub.local", "password": "password123" }'

# Response: { mockToken, user: { uid, name, email, role } }
# Note: In dev mode, returns mockToken. Use real Firebase token in prod.
```

### GET /auth/profile
```bash
curl http://localhost:4000/auth/profile \
  -H "Authorization: Bearer mock_USER_ID_PetOwner"

# Response: { user: { id, name, email, role, phone, address, ... } }
```

### PUT /auth/profile
```bash
curl -X PUT http://localhost:4000/auth/profile \
  -H "Authorization: Bearer mock_USER_ID_PetOwner" \
  -d '{ "phone": "+1234567890", "address": "123 Pet St" }'

# Response: { message, updates: {...} }
```

---

## 🐾 Pets

### POST /pets — Add pet
```bash
curl -X POST http://localhost:4000/pets \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner" \
  -d '{
    "name": "Buddy",
    "species": "Dog",
    "breed": "Golden Retriever",
    "age": 3,
    "weight": 35,
    "gender": "Male",
    "color": "Golden"
  }'

# Response: { message, pet: { id, name, ... } }
```

### GET /pets — List owner's pets
```bash
curl http://localhost:4000/pets \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner"

# Response: { pets: [ { id, name, species, ... }, ... ] }
```

### GET /pets/:id
```bash
curl http://localhost:4000/pets/PET_ID \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner"

# Response: { pet: { id, name, ... } }
```

### PUT /pets/:id — Edit pet
```bash
curl -X PUT http://localhost:4000/pets/PET_ID \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner" \
  -d '{ "weight": 36, "allergies": ["peanuts"] }'

# Response: { message, updates: {...} }
```

### DELETE /pets/:id
```bash
curl -X DELETE http://localhost:4000/pets/PET_ID \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner"

# Response: { message }
```

---

## 🤖 AI Chat

### POST /ai/chat
```bash
curl -X POST http://localhost:4000/ai/chat \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner" \
  -d '{
    "question": "How often should I vaccinate my dog?",
    "petId": null
  }'

# Response: {
#   "answer": "Dogs should...",
#   "sources": [ { document, snippet, score }, ... ],
#   "confidence": 0.85,
#   "disclaimer": "..."
# }
```

### GET /ai/history
```bash
curl http://localhost:4000/ai/history \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner"

# Response: { history: [ { question, answer, timestamp, ... }, ... ] }
```

---

## 📅 Appointments

### GET /appointments/vets — Search vets
```bash
curl "http://localhost:4000/appointments/vets?specialty=Orthopedics&name=Smith" \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner"

# Response: { vets: [ { id, name, specialty, rating, ... }, ... ] }
```

### POST /appointments — Book appointment
```bash
curl -X POST http://localhost:4000/appointments \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner" \
  -d '{
    "vetId": "VET_UUID",
    "petId": "PET_UUID",
    "dateTime": "2026-05-10T14:00:00Z",
    "type": "Video",
    "notes": "Annual checkup"
  }'

# Response: { message, appointment: { id, roomId, ... } }
# Double-booking check: Returns 409 if slot taken
```

### GET /appointments — List appointments
```bash
curl http://localhost:4000/appointments \
  -H "Authorization: Bearer mock_USER_ID_PetOwner"

# Response: { appointments: [ { id, petId, vetId, status, ... }, ... ] }
```

### GET /appointments/:id
```bash
curl http://localhost:4000/appointments/APPT_ID \
  -H "Authorization: Bearer mock_USER_ID_PetOwner"

# Response: { appointment: { id, status, ... } }
```

### PUT /appointments/:id/status — Update status
```bash
curl -X PUT http://localhost:4000/appointments/APPT_ID/status \
  -H "Authorization: Bearer mock_VET_ID_Veterinarian" \
  -d '{ "status": "Confirmed" }'

# Response: { message, status }
# Valid: Pending, Confirmed, Completed, Cancelled
```

### GET /appointments/:id/join — Get room info for video call
```bash
curl http://localhost:4000/appointments/APPT_ID/join \
  -H "Authorization: Bearer mock_USER_ID_PetOwner"

# Response: { roomId, appointmentId }
# (Mobile client uses roomId to connect via Socket.io)
```

---

## 💊 Pharmacy

### GET /pharmacy — List medicines
```bash
curl "http://localhost:4000/pharmacy?category=Antibiotics&search=Amoxicillin" \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner"

# Response: { medicines: [ { id, name, price, stock, ... }, ... ] }
```

### POST /pharmacy/checkout — Place order
```bash
curl -X POST http://localhost:4000/pharmacy/checkout \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner" \
  -d '{
    "items": [
      { "medicineId": "MED_ID", "quantity": 2 }
    ],
    "deliveryAddress": "123 Pet St, City",
    "prescriptionId": null
  }'

# Response: { message, orderId, order: {...} }
# Returns 422 if out of stock or requires prescription
```

### GET /pharmacy/user/orders — List orders
```bash
curl http://localhost:4000/pharmacy/user/orders \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner"

# Response: { orders: [ { id, status, items, totalAmount, ... }, ... ] }
```

### PUT /pharmacy/:id/status — Update order status (admin/user)
```bash
curl -X PUT http://localhost:4000/pharmacy/ORDER_ID/status \
  -H "Authorization: Bearer mock_USER_ID_PetOwner" \
  -d '{ "status": "Shipped" }'

# Response: { message, status }
```

### PUT /pharmacy/:id/cancel — Cancel & refund stock
```bash
curl -X PUT http://localhost:4000/pharmacy/ORDER_ID/cancel \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner"

# Response: { message }
# Stock refunded to pharmacy
```

---

## 📋 Health Records

### POST /records/:petId/vaccinations — Add vaccination
```bash
curl -X POST http://localhost:4000/records/PET_ID/vaccinations \
  -H "Authorization: Bearer mock_VET_ID_Veterinarian" \
  -d '{
    "name": "DHPP",
    "date": "2026-05-01T10:00:00Z",
    "nextDueDate": "2027-05-01T00:00:00Z",
    "batchNumber": "BATCH123"
  }'

# Response: { message, vaccinationId, reminderId (if nextDueDate) }
```

### GET /records/:petId/vaccinations
```bash
curl http://localhost:4000/records/PET_ID/vaccinations \
  -H "Authorization: Bearer mock_VET_ID_Veterinarian"

# Response: { vaccinations: [ { id, name, date, ... }, ... ] }
```

### GET /records/health-summary/:petId
```bash
curl http://localhost:4000/records/health-summary/PET_ID \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner"

# Response: {
#   petName, species, allergies, medicalHistory,
#   vaccinations: [...], prescriptions: [...],
#   pendingReminders: [...], lastVaccination, nextReminder
# }
```

### POST /records/:petId/prescriptions
```bash
curl -X POST http://localhost:4000/records/PET_ID/prescriptions \
  -H "Authorization: Bearer mock_VET_ID_Veterinarian" \
  -d '{
    "medicines": [
      { "name": "Amoxicillin", "dosage": "250mg", "frequency": "2x daily" }
    ],
    "diagnosis": "Ear infection",
    "instructions": "Take with food",
    "validUntil": "2026-06-01T00:00:00Z"
  }'

# Response: { message, prescriptionId, reminderId }
```

### GET /records/:petId/reminders
```bash
curl http://localhost:4000/records/PET_ID/reminders \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner"

# Response: { reminders: [ { id, title, dueDate, type, status }, ... ] }
```

### PUT /records/:petId/reminders/:reminderId/complete
```bash
curl -X PUT http://localhost:4000/records/PET_ID/reminders/REMINDER_ID/complete \
  -H "Authorization: Bearer mock_OWNER_ID_PetOwner"

# Response: { message }
```

---

## 👨‍💼 Admin

### PUT /admin/users/:uid/role — Grant/update role
```bash
curl -X PUT http://localhost:4000/admin/users/VET_UID/role \
  -H "Authorization: Bearer mock_ADMIN_ID_Admin" \
  -d '{ "role": "Veterinarian" }'

# Response: { message }
```

### PUT /admin/vets/:uid/approve — Approve vet
```bash
curl -X PUT http://localhost:4000/admin/vets/VET_UID/approve \
  -H "Authorization: Bearer mock_ADMIN_ID_Admin"

# Response: { message, isApproved: true }
```

### GET /admin/stats — Admin dashboard
```bash
curl http://localhost:4000/admin/stats \
  -H "Authorization: Bearer mock_ADMIN_ID_Admin"

# Response: {
#   totalUsers, totalVets, approvedVets,
#   totalAppointments, completedAppointments,
#   totalOrders, totalRevenue, recentUsers, ...
# }
```

---

## 🔌 WebRTC Signaling (Socket.io)

Base: `http://localhost:4000` (Socket.io WS upgrade)

```javascript
const socket = io('http://localhost:4000');

// Join room
socket.emit('webrtc:join-room', { roomId: 'ROOM_ID', userId: 'USER_ID' });

// Send offer
socket.emit('webrtc:offer', {
  roomId: 'ROOM_ID',
  to: 'PEER_ID',
  offer: { type: 'offer', sdp: '...' }
});

// Listen for offer
socket.on('webrtc:offer', ({ offer, from, iceServers }) => {
  // Create answer...
});

// Send answer
socket.emit('webrtc:answer', {
  roomId: 'ROOM_ID',
  to: 'PEER_ID',
  answer: { type: 'answer', sdp: '...' }
});

// Send ICE candidate
socket.emit('webrtc:ice-candidate', {
  roomId: 'ROOM_ID',
  to: 'PEER_ID',
  candidate: { ... }
});

// Leave room
socket.emit('webrtc:leave-room', { roomId: 'ROOM_ID' });
```

---

## 🧪 Test Tokens (Dev Mode)

In development/mock mode, use these tokens:

```
Owner: mock_OWNER_ID_PetOwner
Vet: mock_VET_ID_Veterinarian
Admin: mock_ADMIN_ID_Admin
```

Replace with real Firebase tokens in production.

---

## 📊 Common Response Codes

| Code | Meaning | Example |
|---|---|---|
| 200 | OK | GET /pets |
| 201 | Created | POST /pets |
| 400 | Bad request | Missing required field |
| 401 | Unauthorized | No/invalid token |
| 403 | Forbidden | Insufficient role |
| 404 | Not found | Pet doesn't exist |
| 409 | Conflict | Double-booked appointment |
| 422 | Unprocessable | Out of stock medicine |
| 500 | Server error | Unhandled exception |
| 503 | Unavailable | Firebase/RAG down |

---

## 🚀 Quick Test Suite

```bash
# 1. Health check
curl http://localhost:4000/health

# 2. Register
TOKEN=$(curl -s -X POST http://localhost:4000/auth/register \
  -d '{"email":"test@x.com","password":"pass","name":"Test","role":"PetOwner"}' \
  | jq -r '.user.uid')

# 3. Add pet
PET=$(curl -s -X POST http://localhost:4000/pets \
  -H "Authorization: Bearer mock_${TOKEN}_PetOwner" \
  -d '{"name":"Rex","species":"Dog","breed":"Lab","age":2,"weight":30}' \
  | jq -r '.pet.id')

# 4. Ask AI
curl -s -X POST http://localhost:4000/ai/chat \
  -H "Authorization: Bearer mock_${TOKEN}_PetOwner" \
  -d "{\"question\":\"How to care for a dog?\",\"petId\":\"$PET\"}" \
  | jq '.answer'

# 5. Search vets
curl -s http://localhost:4000/appointments/vets \
  -H "Authorization: Bearer mock_${TOKEN}_PetOwner" \
  | jq '.vets[0]'

echo "✅ All tests passed!"
```

---

## 📞 Debug Tips

### Check token validity
```bash
curl http://localhost:4000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
# Returns 401 if invalid
```

### Check service health
```bash
curl http://localhost:4000/health
curl http://localhost:5000/health  # RAG service
```

### List all database
```bash
# Terminal with Firebase emulator running:
curl http://localhost:8080/firestore/debug/entities
```

### Enable verbose logging
```bash
# In backend .env:
LOG_LEVEL=debug
```

---

## ✨ Response Format

All successful responses:
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

All error responses:
```json
{
  "error": "Description of error",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

---

**Ready to test? Start with the Quick Test Suite above!** 🚀
