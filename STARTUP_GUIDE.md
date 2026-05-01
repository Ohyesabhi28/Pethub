# PetHub MVP - Complete Startup Guide

## 🎯 Overview

This guide walks you through launching the complete PetHub MVP system with 4 parallel services.

**Estimated startup time**: 10 minutes (first run downloads ~80MB for embeddings)

---

## ✅ Pre-Flight Checklist

Run this first to ensure all runtimes are installed:

```bash
# Check Node.js (need 20+)
node --version

# Check Python (need 3.10+)
python --version

# Check Java (need 17+ for Firebase emulators)
java --version

# Check Ollama (for LLM)
ollama --version

# Pull a small Ollama model
ollama pull phi3:mini
# Alternative: ollama pull qwen2.5:0.5b  (if phi3:mini is too slow)
```

If any are missing, install them:
- **Node.js**: https://nodejs.org (v20+)
- **Python**: https://python.org (3.10+)
- **Java**: https://adoptopenjdk.net (17+)
- **Ollama**: https://ollama.com/download

---

## 🚀 Startup (4-5 Terminals)

### Terminal 1: Firebase Emulators
```bash
cd backend
npm install
npx firebase emulators:start --only auth,firestore

# Expected output:
# Auth emulator listening at http://127.0.0.1:9099
# Firestore emulator listening at http://127.0.0.1:8080
```

**Keeps running.** This provides mock Firebase Auth and Firestore.

---

### Terminal 2: Ollama LLM Server
```bash
# Make sure ollama is running in background
ollama serve

# In another shell, verify it's ready:
curl http://localhost:11434/api/tags

# Expected: List of models including "phi3:mini"
```

**Keeps running.** If you want to skip Ollama, the system falls back to OpenRouter (if API key set) or rule-based responses.

---

### Terminal 3: Python RAG Service
```bash
cd rag-service

# Create virtual environment (first time only)
python -m venv .venv

# Activate it
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install dependencies (first time: ~2 min, installs sentence-transformers ~80MB)
pip install -r requirements.txt

# Start the service
python -m app.main

# Expected output:
# [rag-service] loading embedding model + index... (first run downloads ~80MB)
# [rag-service] ready. XXXX chunks indexed.
# Uvicorn running on http://0.0.0.0:5000
```

**Keeps running.** First launch is slow (downloads embeddings model). Subsequent launches are fast.

Test it:
```bash
curl -X POST http://localhost:5000/query \
  -H "Content-Type: application/json" \
  -d '{"question":"How often should I vaccinate my dog?","petContext":null}'

# Expected: JSON with "answer", "sources", "confidence", "llm_used"
```

---

### Terminal 4: Node.js Backend
```bash
cd backend

# Install dependencies (if not done)
npm install

# Start in dev mode
npm run dev

# Expected output:
# PetHub backend listening on http://0.0.0.0:4000
# WebRTC signaling on ws://0.0.0.0:4000
```

**Keeps running.** Automatically seeds default users on first boot.

Test it:
```bash
curl http://localhost:4000/health

# Expected: {"ok":true,"ts":1234567890}
```

---

### Terminal 5 (Optional): Mobile App

When backend is running:

```bash
cd mobile

# Install dependencies (if not done)
npm install

# Build native modules (required for react-native-webrtc)
npx expo prebuild

# Start on Android
npx expo run:android

# Or start on iOS
npx expo run:ios

# First launch builds APK/IPA (~5-10 minutes)
```

**Requirements:**
- **Android**: Android Studio with SDK configured
- **iOS**: Xcode on Mac
- **Emulator or device**: iOS Simulator has no camera (use real device for video calls)

---

## 📱 First-Time Mobile Setup

Edit `mobile/src/api/client.js`:

Find this line (around line 10):
```javascript
const API_BASE = 'http://192.168.0.102:4000';  // CHANGE THIS
```

Replace with **your machine's LAN IP**:

**Find your IP:**
- **Windows**: Run `ipconfig` → look for "IPv4 Address" (e.g., 192.168.1.42)
- **Mac/Linux**: Run `ifconfig` → look for "inet" (e.g., 192.168.1.42)

Set it to:
```javascript
const API_BASE = 'http://192.168.1.42:4000';  // Replace 42 with YOUR IP
```

**Why not localhost?** Mobile devices are separate from your PC. They can't reach `localhost` — they need your machine's LAN IP.

---

## 🔐 Default Test Accounts

After boot, these accounts are pre-seeded:

| Email | Password | Role | Notes |
|---|---|---|---|
| owner@pethub.local | password123 | PetOwner | Can add pets, book appointments, order pharmacy |
| vet1@pethub.local | password123 | Veterinarian | Already approved; can see appointments |
| admin@pethub.local | password123 | Admin | Can approve vets, manage medicines |

**Login flow:**
1. Register (creates new account) or use above email + password
2. Backend returns mock token (dev mode) or real Firebase token
3. Mobile stores token in AsyncStorage
4. Token sent in `Authorization: Bearer <token>` header

---

## 🧪 Quick Feature Tests

### Test 1: AI Chat
```bash
curl -X POST http://localhost:4000/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock_owner@pethub.local_PetOwner" \
  -d '{
    "question": "How often should I vaccinate my dog?",
    "petId": null
  }'

# Expected:
# {
#   "answer": "Dogs should be vaccinated...",
#   "sources": [...],
#   "confidence": 0.85,
#   "disclaimer": "This is not a substitute for..."
# }
```

### Test 2: Add Pet
```bash
curl -X POST http://localhost:4000/pets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock_USER_ID_PetOwner" \
  -d '{
    "name": "Buddy",
    "species": "Dog",
    "breed": "Golden Retriever",
    "age": 3,
    "weight": 35
  }'

# Expected: {"message": "Pet added", "pet": {...}}
```

### Test 3: Book Appointment
```bash
# First, get a pet ID from /pets
# Then get a vet ID from /appointments/vets
# Then book:

curl -X POST http://localhost:4000/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock_owner_id_PetOwner" \
  -d '{
    "petId": "pet-uuid",
    "vetId": "vet-uuid",
    "dateTime": "2026-05-10T14:00:00Z",
    "type": "Video",
    "notes": "Annual checkup"
  }'

# Expected: {"message": "Appointment booked", "appointment": {...}}
```

### Test 4: WebRTC Signaling (Socket.io)
Open two browser tabs/windows:
```javascript
// In browser console:

// Create Socket.io connection
const socket = io('http://localhost:4000');

// Join a room
socket.emit('webrtc:join-room', { roomId: 'test-room', userId: 'user-1' });

// Send an offer (from peer 1)
socket.emit('webrtc:offer', {
  roomId: 'test-room',
  to: 'user-2',
  offer: { type: 'offer', sdp: '...' }
});

// Listen for answer (from peer 2)
socket.on('webrtc:answer', (data) => console.log('Got answer', data));
```

---

## 📊 System Architecture at Runtime

```
┌──────────────┐
│  React Native│ (Mobile, port 19006)
│  on Device   │
└────────┬─────┘
         │ HTTP/WS (via LAN IP:4000)
         ▼
┌──────────────────┐      HTTP        ┌──────────────┐
│  Node.js Backend │ ─────────────→  │  Python RAG  │ (port 5000)
│  (port 4000)     │ ◄─────────────  │  FastAPI     │
│  Express + Sock.io
└────────┬─────────┘                  └──────┬───────┘
         │ WS signaling                        │
         │                                     │ HTTP
         │                                     ▼
         ▼                              ┌──────────────┐
┌──────────────────┐                   │  Ollama      │ (port 11434)
│ Firebase Emulator│                   │  Local LLM   │
│ (ports 8080, 9099)                   └──────┬───────┘
└──────────────────┘                           │ fallback
                                               ▼
                                        ┌──────────────┐
                                        │  OpenRouter  │ (optional)
                                        │  API         │
                                        └──────────────┘
```

---

## 🛠️ Troubleshooting

### "Port 4000 already in use"
```bash
# Kill the process using port 4000:
# Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :4000
kill -9 <PID>

# Then restart: npm run dev
```

### "Ollama not responding"
```bash
# Make sure ollama server is running:
ollama serve

# In another terminal, verify:
curl http://localhost:11434/api/tags

# If not working, reinstall:
ollama pull phi3:mini
```

### "RAG service returns 503"
```bash
# Check if Ollama is running and has a model:
curl http://localhost:11434/api/tags

# Restart RAG service:
# (kill the python process, then: python -m app.main)
```

### "Mobile can't reach backend"
1. Make sure backend is running (`npm run dev`)
2. Check mobile's `API_BASE` in `src/api/client.js` — should be your LAN IP (not localhost)
3. Ping from mobile to backend:
   ```bash
   curl http://192.168.1.X:4000/health
   ```
   (Replace X with your IP)

### "Firebase emulator won't start"
```bash
# Make sure Java 17+ is installed:
java -version

# If not, install JDK 17+: https://adoptopenjdk.net

# Then in backend dir:
npx firebase emulators:start --only auth,firestore
```

### "react-native-webrtc won't build"
```bash
# This requires native compilation. Must use Expo Dev Client or bare workflow.

# If using Expo Go: Switch to dev client:
npx expo run:android --dev-client
npx expo run:ios --dev-client

# Or prebuild and use native build:
npx expo prebuild
npx expo run:android
```

---

## ✨ What's Working (Full Checklist)

- [x] Auth (register, login, role-based)
- [x] Pet management (add, edit, list)
- [x] AI chat (RAG with fallbacks)
- [x] Appointment booking (with double-booking guard)
- [x] Vet search & approval (admin)
- [x] WebRTC signaling (video call rooms)
- [x] Pharmacy (list, order, mock payment)
- [x] Health records (stub, ready for expansion)
- [x] Admin dashboard (vet approval)
- [x] Seed data (default accounts)
- [x] Offline fallbacks (Ollama → OpenRouter → rule-based)

---

## 🎉 Next Steps

1. ✅ Run all 4 terminals
2. ✅ Login on mobile (use default account)
3. ✅ Add a pet
4. ✅ Test AI chat
5. ✅ Book an appointment
6. ✅ Start a video call
7. ✅ Place a pharmacy order
8. ✅ Admin approves a vet

**Congrats!** You now have a working MVP. 🚀

---

## 📚 Further Reading

- `docs/ARCHITECTURE.md` — System design
- `docs/HUMAN_ACTIONS.md` — Manual setup steps
- `VALIDATION_CHECKLIST.md` — What's complete vs. incomplete
- `backend/package.json` — Dependencies
- `rag-service/requirements.txt` — Python dependencies
- `mobile/package.json` — React Native dependencies
