// Firebase JS SDK pointed at either the real Firebase project or local Auth emulator.
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoEmulatorKey',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'pethub-local.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'pethub-local',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
};

const app = initializeApp(firebaseConfig);

let _auth;
try {
  _auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (_e) {
  // initializeAuth throws if already initialized (hot reload); fall back.
  _auth = getAuth(app);
}

const useEmulator = (process.env.EXPO_PUBLIC_FIREBASE_USE_EMULATOR || 'true').toLowerCase() === 'true';

if (useEmulator) {
  // HUMAN_ACTION_REQUIRED: change host to your dev machine's LAN IP for real-device testing.
  const EMULATOR_HOST = 'http://192.168.1.42:9099';
  try {
    connectAuthEmulator(_auth, EMULATOR_HOST, { disableWarnings: true });
    console.log('[firebase] connected to auth emulator');
  } catch (_e) {
    // already connected on hot-reload
  }
} else {
  console.log('[firebase] connected to live firebase project');
}

export const auth = _auth;
export default app;
