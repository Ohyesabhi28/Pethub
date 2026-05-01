import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import client from '../api/client';
import { registerForPushNotificationsAsync } from '../services/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const r = await client.get('/auth/me');
          setProfile(r.data.user);
          
          // Register for push notifications
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await client.post('/auth/token', { fcmToken: token });
          }
        } catch (_e) {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = {
    user,
    profile,
    loading,
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    register: async ({ email, password, name, role }) => {
      // Backend creates the auth user + the profile in one call so role is set atomically.
      await client.post('/auth/register', { email, password, name, role });
      return signInWithEmailAndPassword(auth, email, password);
    },
    signOut: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
