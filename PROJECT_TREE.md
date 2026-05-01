# File map (40 files, ~3,400 lines)

```
pethub/
├── README.md                                  ← start here
├── PROJECT_TREE.md                            ← this file
├── .gitignore
├── docs/
│   ├── ARCHITECTURE.md
│   └── HUMAN_ACTIONS.md                       ← required one-time setup
│
├── backend/                                   Node.js 20 + Express + Socket.io
│   ├── package.json
│   ├── .env.example
│   ├── firebase.json                          ← Firestore + Auth emulator config
│   ├── .firebaserc
│   ├── scripts/
│   │   └── smoke.js                           ← end-to-end smoke test
│   └── src/
│       ├── index.js                           ← entry: Express + Socket.io
│       ├── firebase.js                        ← Admin SDK (emulator/live)
│       ├── middleware/
│       │   ├── auth.js                        ← Firebase JWT verify + RBAC
│       │   ├── error.js                       ← HttpError + central handler
│       │   └── validate.js                    ← Joi wrapper
│       ├── utils/
│       │   ├── logger.js
│       │   └── retry.js                       ← exp backoff
│       ├── routes/
│       │   ├── auth.js                        ← register, /me
│       │   ├── pets.js                        ← CRUD, owner-scoped
│       │   ├── appointments.js                ← vets list, book (txn), update
│       │   ├── ai.js                          ← chat → RAG with fallback
│       │   ├── pharmacy.js                    ← list medicines
│       │   ├── orders.js                      ← create with stock txn + mock pay
│       │   ├── admin.js                       ← approve vets, set role
│       │   ├── webrtc.js                      ← create/join room
│       │   └── records.js                     ← vaccinations, prescriptions
│       ├── services/
│       │   └── signaling.js                   ← Socket.io WebRTC handlers
│       └── seed/
│           └── seed.js                        ← idempotent demo data
│
├── rag-service/                               Python 3.10+ FastAPI
│   ├── requirements.txt
│   ├── .env.example
│   ├── data/
│   │   └── sample_petcare.txt                 ← so RAG works without your PDFs
│   └── app/
│       ├── __init__.py
│       ├── main.py                            ← FastAPI + lifespan
│       ├── schemas.py                         ← Pydantic models
│       ├── loader.py                          ← .pdf/.txt loader + chunker
│       ├── rag.py                             ← FAISS + sentence-transformers
│       ├── llm.py                             ← Ollama → OpenRouter → rules
│       └── safety.py                          ← redaction + disclaimer
│
└── mobile/                                    React Native (Expo dev client)
    ├── package.json
    ├── app.json                               ← incl. WebRTC config plugin
    ├── babel.config.js
    ├── .env.example
    ├── App.js
    └── src/
        ├── api/
        │   └── client.js                      ← axios + token + retry
        ├── services/
        │   └── firebase.js                    ← JS SDK → emulator
        ├── context/
        │   └── AuthContext.js                 ← register/signIn/signOut
        ├── navigation/
        │   └── RootNavigator.js               ← auth stack + tabs
        └── screens/
            ├── LoginScreen.js
            ├── RegisterScreen.js
            ├── HomeScreen.js
            ├── PetListScreen.js
            ├── AddPetScreen.js                ← image picker → base64
            ├── AIChatScreen.js                ← per-pet context selector
            ├── VetSearchScreen.js
            ├── BookingScreen.js               ← 7-day × 4-slot grid
            ├── VideoCallScreen.js             ← WebRTC + signaling + retry
            ├── PharmacyScreen.js              ← cart + checkout
            └── AdminScreen.js                 ← approve vets, view orders
```

## What was deliberately left as stubs / not built

- **FCM push notifications** — needs a real Firebase project + per-device setup. The emulator can't issue push tokens.
- **Reminder cron job** — schema and write paths exist (records.js seeds `reminders` collection on vaccination create), but no scheduler runs them. Add `node-cron` or run a separate worker.
- **Vet rating system** — bonus feature, not built.
- **Emergency mode / smart reminders** — bonus features, not built.
- **Real payment gateway** — orders.js writes to `payments` with `mock_*` IDs.
- **Tests** — `scripts/smoke.js` is the only end-to-end check. No unit tests.
