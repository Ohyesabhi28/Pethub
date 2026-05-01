# Human actions required

These steps cannot be automated. Do them once before first run.

## 1. Install runtimes
- Node.js 20+ (`node --version`)
- Python 3.10+ (`python --version`)
- Java 17+ (required by Firebase emulators)
- Ollama: https://ollama.com/download
- For mobile: Android Studio (Android) or Xcode (iOS)

## 2. Pull an Ollama model
```bash
ollama pull phi3:mini       # recommended: ~2GB, ~1-3s response on CPU
# alternatives:
# ollama pull qwen2.5:0.5b  # tiny, faster, lower quality
# ollama pull llama3.2:3b   # better quality, ~5-15s on CPU
```
Set `OLLAMA_MODEL` in `rag-service/.env` to match.

## 3. (Optional) OpenRouter fallback key
- Sign up at https://openrouter.ai (free tier available)
- Set `OPENROUTER_API_KEY` in `rag-service/.env`
- Without this, the system still works — it falls back to rule-based responses.

## 4. (Optional) Add real petcare PDFs
Drop any `.pdf` or `.txt` files into `rag-service/data/`. The service reindexes on boot. A sample text file is included so the system works out of the box.

## 5. Firebase: emulator vs real project
This MVP uses **emulators only** (zero external setup). If you ever want real Firebase:
- Create a project at https://console.firebase.google.com
- Generate a service account key
- Set `FIREBASE_USE_EMULATOR=false` and the three credential vars in `backend/.env`
- FCM (push notifications) will then work; it does not work with emulators.

## 6. Mobile: API base URL
Edit `mobile/src/api/client.js` `API_BASE` — must be your machine's LAN IP (not `localhost`) when testing on a real device. E.g. `http://192.168.1.42:4000`.

## 7. WebRTC on iOS Simulator
Camera does not work in iOS Simulator. Test video call on a real device or Android emulator with virtual camera enabled.
