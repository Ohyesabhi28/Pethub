// backend/src/firebase.js
// Firebase Admin SDK initialization. Defaults to Firebase Emulator Suite (no
// real project required). Set FIREBASE_USE_EMULATOR=false in .env and supply
// service account credentials to talk to a real Firebase project.

require('dotenv').config();
const admin = require('firebase-admin');

const useEmulator = (process.env.FIREBASE_USE_EMULATOR || 'true').toLowerCase() === 'true';
const projectId = process.env.FIREBASE_PROJECT_ID || 'pethub-local';

if (useEmulator) {
  // Required envs read by the Admin SDK to route to local emulators.
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
  // GOOGLE_APPLICATION_CREDENTIALS is intentionally unset in emulator mode.
  admin.initializeApp({ projectId });
  // eslint-disable-next-line no-console
  console.log(`[firebase] emulator mode (project=${projectId}, firestore=${process.env.FIRESTORE_EMULATOR_HOST}, auth=${process.env.FIREBASE_AUTH_EMULATOR_HOST})`);
} else {
  // HUMAN_ACTION_REQUIRED: paste service-account credentials into .env
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL are required when FIREBASE_USE_EMULATOR=false');
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
  // eslint-disable-next-line no-console
  console.log(`[firebase] live mode (project=${projectId})`);
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth, useEmulator };
