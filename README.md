# PetHub MVP

Pet care platform: AI chatbot (RAG), teleconsultation (WebRTC), appointments, pet records, pharmacy, admin.

**Stack:** React Native (Expo dev client) · Node.js 20 + Express + Socket.io · Python 3.10+ FastAPI + FAISS + sentence-transformers · Firebase (local emulators) · Ollama (primary LLM) · OpenRouter (fallback) · rule-based (final fallback).

## Repo layout

```
pethub/
  backend/        Node.js API + WebRTC signaling
  rag-service/    Python RAG microservice
  mobile/         React Native (Expo) app
  docs/           ARCHITECTURE.md, HUMAN_ACTIONS.md
```

## Quick start (4 terminals)

> Read `docs/HUMAN_ACTIONS.md` first. There are real one-time setup steps you cannot skip.

**Terminal 1 — Firebase emulators**
```bash
cd backend
npm install
npx firebase emulators:start --only auth,firestore
```

**Terminal 2 — Ollama (LLM)**
```bash
ollama serve                  # if not already running
ollama pull phi3:mini         # ~2GB, fast on CPU
```

**Terminal 3 — RAG service**
```bash
cd rag-service
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.main
```

**Terminal 4 — Backend**
```bash
cd backend
cp .env.example .env          # edit if needed
npm run dev
```

**Terminal 5 — Mobile (when ready)**
```bash
cd mobile
npm install
npx expo prebuild             # generates ios/ + android/ for react-native-webrtc
npx expo run:android          # or run:ios — needs Android Studio / Xcode
```

> **Why not `expo start`?** `react-native-webrtc` needs custom native modules. Expo Go won't load them. You must use a dev client / native build.

## What's actually built (vs. spec)

| Module | Status |
|---|---|
| Auth (Firebase emulator) | ✅ Real |
| Pets CRUD | ✅ Real |
| AI Chat (RAG → Ollama → OpenRouter → rule-based) | ✅ Real |
| WebRTC signaling (Socket.io) | ✅ Real |
| Appointments | ✅ Real (with double-booking guard) |
| Pharmacy + orders | ✅ Real (mock inventory + mock payment) |
| Admin: approve vet | ✅ Real |
| Health records / reminders | 🟡 Stub endpoint, schema in place |
| FCM push notifications | ❌ Skipped (requires real Firebase project, not emulator) |
| Real payment gateway | ❌ Mock only (per spec) |

## Default seeded accounts (after first boot)

| Email | Password | Role |
|---|---|---|
| owner@pethub.local | password123 | PetOwner |
| vet1@pethub.local | password123 | Veterinarian (approved) |
| admin@pethub.local | password123 | Admin |

## Failure modes the code handles

- Ollama not running → OpenRouter fallback → rule-based fallback
- RAG service down → backend returns canned safe answer with disclaimer
- Firestore emulator down → API returns 503
- WebRTC peer disconnects → client auto-retries once, then shows manual retry UI
- Duplicate vet booking → 409 Conflict
- Out-of-stock medicine → 422 with stock info
