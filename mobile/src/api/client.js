// Axios client with token injection + retry on transient failures.
// HUMAN_ACTION_REQUIRED: set API_BASE to your machine's LAN IP when running on a real device.
import axios from 'axios';
import { auth } from '../services/firebase';

// Replace the old local IP/localhost with your Render URL
export const API_BASE = 'https://pethub-backend-kbs8.onrender.com';

const client = axios.create({ baseURL: API_BASE, timeout: 20000 });

client.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } catch (_e) {
      // Token refresh failed (e.g. network offline). Send request without auth;
      // the backend will return 401 with a clear error instead of a network crash.
    }
  }
  return config;
});

// Retry once on network/5xx errors.
client.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const config = error.config || {};
    const isRetriable = !error.response || (error.response.status >= 500 && error.response.status < 600);
    if (isRetriable && !config.__retried) {
      config.__retried = true;
      await new Promise((r) => setTimeout(r, 400));
      return client.request(config);
    }
    return Promise.reject(error);
  },
);

export default client;
