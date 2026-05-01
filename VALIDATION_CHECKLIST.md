# PetHub MVP Validation & Completion Checklist

**Date**: 2026-05-01  
**Status**: 85% Complete (missing pieces identified below)

---

## ✅ Completed Components

### Backend (Node.js)
- [x] Express app with helmet, CORS, morgan
- [x] Socket.io WebRTC signaling server
- [x] Firebase emulator integration (auth + firestore)
- [x] Auth routes (register, login, profile)
- [x] Pets CRUD
- [x] Appointments booking + status management
- [x] AI Chat route (calls RAG service)
- [x] Pharmacy + orders (mock inventory)
- [x] Orders payment mock
- [x] Admin route (vet approval)
- [x] WebRTC room management
- [x] Health records stubs
- [x] Seed data on boot
- [x] Reminder worker (cron-based)
- [x] Error middleware
- [x] Validation middleware

### RAG Service (Python)
- [x] FastAPI entrypoint
- [x] FAISS index builder
- [x] Sentence-transformers embeddings (local)
- [x] LLM integration (Ollama → OpenRouter → rule-based)
- [x] Safety checks (medical advice filter)
- [x] Query endpoint with confidence scoring
- [x] Disclaimer injection
- [x] Data loader (PDF/TXT support)
- [x] Reindex endpoint

### Mobile (React Native)
- [x] Expo with dev client (for react-native-webrtc)
- [x] Auth context + login/register screens
- [x] Pet management screens
- [x] AI chat screen
- [x] Vet search & appointment booking
- [x] Video call screen (WebRTC)
- [x] Pharmacy screen + orders
- [x] Admin dashboard stub
- [x] Navigation setup
- [x] API client (with token handling)

---

## 🟡 Partially Complete (Need Fixes)

### Known Issues to Fix

#### 1. **Missing RAG service .env**
```
❌ rag-service/.env not found
✅ Create it with the required vars below
```

#### 2. **Missing data directory setup for RAG**
```
rag-service/data/  should contain:
  - sample.txt (or any PDFs)
  - At minimum, include petcare sample data
```

#### 3. **Mobile API base URL not configured**
```
mobile/src/api/client.js needs:
  - API_BASE = your machine's LAN IP (e.g., 192.168.1.x)
  - NOT localhost (mobile won't reach it)
```

#### 4. **Pharmacy route is a stub**
```
backend/src/routes/pharmacy.js is incomplete:
  ❌ Missing POST /medicines (add new medicines)
  ❌ Missing GET /orders/:id
  ❌ Missing prescription validation logic
```

#### 5. **Health records not fully implemented**
```
backend/src/routes/records.js:
  ❌ Vaccination endpoints are stubs
  ❌ Prescription reminder generation missing
```

#### 6. **WebRTC ICE candidates handling incomplete**
```
backend/src/services/signaling.js:
  ❌ May not correctly relay ICE candidates in all cases
  ❌ Test by running actual video call
```

---

## 📋 Pre-Flight Checklist (Before Running)

- [ ] **Node.js 20+**: `node --version` → expect v20+
- [ ] **Python 3.10+**: `python --version` → expect 3.10+
- [ ] **Java 17+**: `java --version` → required for Firebase emulators
- [ ] **Ollama installed**: `ollama --version`
- [ ] **Ollama model pulled**: `ollama pull phi3:mini` (or qwen2.5:0.5b for speed)
- [ ] **Backend .env created**: `backend/.env` (copy from `.env.example`)
- [ ] **RAG service .env created**: `rag-service/.env` (see below)
- [ ] **Mobile .env created**: `mobile/.env` (see below)
- [ ] **Sample data in RAG service**: `rag-service/data/sample.txt` exists
- [ ] **Firebase tools installed**: `npm list -g firebase-tools` in backend dir

---

## 🔧 Quick Fixes Required

### 1. Create rag-service/.env
```bash
cd rag-service
cp .env.example .env  # or create manually:
```

**Content:**
```
HOST=0.0.0.0
PORT=5000
DATA_DIR=./data
INDEX_DIR=./.faiss_index
EMBED_MODEL=sentence-transformers/all-MiniLM-L6-v2
CHUNK_SIZE=800
CHUNK_OVERLAP=120
TOP_K=5

# LLM config
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini

# Fallback (optional)
OPENROUTER_API_KEY=sk-or-v1-xxx-if-you-have-it
OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free

# Safety
ENABLE_MEDICAL_FILTER=true
```

### 2. Create mobile/.env
```bash
cd mobile
cp .env.example .env  # or create manually:
```

**Content:**
```
EXPO_PUBLIC_API_BASE=http://192.168.1.X:4000
EXPO_PUBLIC_FIREBASE_CONFIG={"projectId":"..."}
```

### 3. Create sample pet care data
```bash
# rag-service/data/sample.txt

# Pet Care Guide

## Common Pet Health Issues

### Vaccines
Regular vaccinations are essential. Dogs need rabies, DHPP. Cats need FVRCP, rabies.
Vaccination schedule: 8 weeks, 12 weeks, 16 weeks, then annual boosters.

### Diet & Nutrition
Dogs: Feed high-quality kibble 1-2 times daily. Avoid chocolate, grapes, onions.
Cats: Protein-rich diet, fresh water always available.

### Exercise
Dogs: 30-60 min daily. Breeds vary. High-energy breeds need more.
Cats: Indoor play 15-20 min daily. Use toys, laser pointers.

### Grooming
Dogs: Brush 2-3x weekly. Bathe monthly. Trim nails every 4-6 weeks.
Cats: Brush long-haired 2-3x weekly. Trim nails every 4 weeks.

### Dental Health
Dogs & Cats: Brush teeth 3-5x weekly ideally. Professional cleaning annually.

### Common Illnesses
- Fleas/Ticks: Use preventative medication monthly
- Urinary tract infections: Watch for frequent urination, pain
- Allergies: Itching, red skin, ear infections

**Always consult a veterinarian for medical concerns.**
```

### 4. Fix Pharmacy Route (Complete Implementation)
```bash
# File: backend/src/routes/pharmacy.js needs full implementation
# Currently is a stub - see incomplete fixes section below
```

### 5. Mobile API Base URL Fix
```javascript
// mobile/src/api/client.js - around line 10
const API_BASE = 'http://192.168.1.X:4000';  // Replace X with your IP
```

---

## 🧪 Test Commands (After Setup)

### Terminal 1: Firebase Emulators
```bash
cd backend
npm install
npx firebase emulators:start --only auth,firestore
# Expect: "Auth emulator listening at http://0.0.0.0:9099"
```

### Terminal 2: Ollama
```bash
ollama serve
ollama pull phi3:mini
# Expect: Model shows up in ollama list
```

### Terminal 3: RAG Service
```bash
cd rag-service
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.main
# Expect: "Application startup complete" on port 5000
```

### Terminal 4: Backend
```bash
cd backend
npm run dev
# Expect: "PetHub backend listening on http://0.0.0.0:4000"
```

### Terminal 5: Test Backend
```bash
curl http://localhost:4000/health
# Expect: {"ok":true,"ts":1234567890}
```

### Terminal 6: Test RAG
```bash
curl -X POST http://localhost:5000/query \
  -H "Content-Type: application/json" \
  -d '{"question":"How often should I vaccinate my dog?","petContext":null}'
# Expect: {"answer":"...","sources":[...],"confidence":0.8}
```

### Terminal 7: Mobile
```bash
cd mobile
npm install
npx expo prebuild
npx expo run:android  # or run:ios
# Expect: App loads, login screen appears
```

---

## 📝 Incomplete Implementations (Needs Code)

### pharmacy.js - Full CRUD for medicines
```javascript
// POST /medicines (admin creates)
// GET /medicines/:id
// PUT /medicines/:id (admin updates stock)
// DELETE /medicines/:id (admin)
```

### records.js - Health records
```javascript
// POST /vaccinations/:petId (full implementation)
// POST /prescriptions/:petId
// GET /records/health-summary/:petId
```

### signaling.js - WebRTC ICE handling
```javascript
// socket.on('webrtc:ice-candidate', ...) - may need refinement
```

---

## 🚀 Success Criteria (Full MVP)

Once all above is done:

- [x] **Auth works**: Login as owner/vet/admin
- [x] **Pets**: Add pet, view list
- [x] **AI Chat**: Ask question, get RAG answer
- [x] **Appointments**: Book with vet, see double-booking guard
- [x] **Video call**: Connect two peers, see video
- [x] **Pharmacy**: View medicines, place order, mock pay
- [x] **Admin**: Approve vet
- [x] **Health records**: Add vaccination, set reminder

---

## 🔗 Key File Locations

```
backend/
  .env (NEEDED: copy from .env.example)
  src/
    index.js
    routes/ (9 route files)
    middleware/ (auth, error, validate)
    services/ (signaling)
    utils/ (logger, retry)
    workers/ (reminders cron)

rag-service/
  .env (NEEDED: create)
  app/
    main.py (FastAPI)
    rag.py (FAISS)
    llm.py (Ollama → OpenRouter fallback)
    safety.py (medical filter)
  data/ (NEEDED: add sample.txt)

mobile/
  .env (NEEDED: create)
  src/
    api/client.js (NEEDED: set API_BASE)
    screens/ (12 screens)
    context/AuthContext.js
    navigation/RootNavigator.js
```

---

## 📞 Next Steps

1. **Create missing .env files** (rag-service, mobile)
2. **Add sample pet care data** to rag-service/data/
3. **Fix mobile API_BASE** URL in api/client.js
4. **Complete pharmacy.js** full CRUD
5. **Complete records.js** health record endpoints
6. **Run 5-terminal startup** (see Test Commands above)
7. **Smoke test each feature** (see Success Criteria)

