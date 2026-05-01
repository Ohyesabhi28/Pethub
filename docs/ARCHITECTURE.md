# Architecture

## Components
```
┌─────────────────┐    HTTPS/WS     ┌──────────────────┐    HTTP    ┌────────────────┐
│ React Native    │ ──────────────► │ Node.js Backend  │ ─────────► │ Python RAG     │
│ (Expo dev       │                 │ Express          │            │ FastAPI        │
│  client)        │ ◄─── WS ──────► │ Socket.io        │            │ FAISS + ST     │
└────────┬────────┘   (signaling)   └────────┬─────────┘            └────────┬───────┘
         │                                   │                               │
         │  WebRTC P2P (after signaling)     │                               ▼
         └───────────────────────────────────┘                       ┌──────────────┐
                                             │                       │ Ollama (HTTP)│
                                             ▼                       └──────┬───────┘
                                    ┌─────────────────┐                     │ fallback
                                    │ Firebase        │                     ▼
                                    │ Emulator Suite  │              ┌──────────────┐
                                    │ (Auth+Firestore)│              │ OpenRouter   │
                                    └─────────────────┘              └──────┬───────┘
                                                                            │ fallback
                                                                            ▼
                                                                    ┌──────────────┐
                                                                    │ Rule-based   │
                                                                    │ canned reply │
                                                                    └──────────────┘
```

## Data flow

**AI Chat:** Client → POST `/ai/chat` → Backend verifies JWT → forwards to RAG `/query` with `petContext` → RAG retrieves top-K from FAISS → calls LLM with retrieved context → returns `{answer, sources, confidence}` → Backend appends safety disclaimer → returns to client.

**Video call:** Both peers connect to Socket.io room. Caller emits `webrtc:offer`, server relays to room. Callee replies `webrtc:answer`. ICE candidates trickle via `webrtc:ice`. Once connected, media is P2P — server is no longer in the path.

**Auth:** Firebase emulator issues ID tokens. Backend validates with Firebase Admin SDK. Roles stored in Firestore `users/{uid}.role` and copied into custom claims by the Admin role-grant endpoint.

## Why these choices

- **Emulators** — spec says localhost-only. Real Firebase quotas would bite immediately and FCM doesn't work without a real project anyway.
- **Ollama primary, OpenRouter fallback** — Ollama is offline, free, and deterministic latency. OpenRouter is conditional on network + API key. The brief had this inverted; it's fixed here.
- **react-native-webrtc, not simple-peer** — `simple-peer` is a browser library with a `wrtc` shim that doesn't work in RN. `react-native-webrtc` is the standard, but requires `expo prebuild` (no Expo Go).
- **FAISS + sentence-transformers** — fully local, no API. `all-MiniLM-L6-v2` is 80MB and fast on CPU.
- **Stateless backend** — sessions live in Firebase tokens. Socket.io rooms are the only in-memory state, and they're ephemeral (consultations).

## Non-goals
- Production deploy
- HIPAA / regulated medical data handling
- Real payment processing
- Push notifications (needs real FCM)
- Horizontal scaling of WebRTC signaling (single Node process for MVP)
