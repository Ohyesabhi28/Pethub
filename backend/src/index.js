// backend/src/index.js — Express + Socket.io entrypoint.
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server: SocketServer } = require('socket.io');

const log = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/error');
const { attachSignaling } = require('./services/signaling');

// Routes
const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const appointmentRoutes = require('./routes/appointments');
const aiRoutes = require('./routes/ai');
const pharmacyRoutes = require('./routes/pharmacy');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const webrtcRoutes = require('./routes/webrtc');
const recordsRoutes = require('./routes/records');

const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' })); // 2mb to allow base64 pet images
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/auth', authRoutes);
app.use('/pets', petRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/ai', aiRoutes);
app.use('/pharmacy', pharmacyRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/webrtc', webrtcRoutes);
app.use('/records', recordsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '4000', 10);
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] },
});
attachSignaling(io);

const { startReminderWorker } = require('./workers/reminders');

async function start() {
  // Run seed (idempotent) before accepting traffic, if enabled.
  if ((process.env.SEED_ON_BOOT || 'true').toLowerCase() === 'true') {
    try {
      const { seed } = require('./seed/seed');
      await seed();
    } catch (err) {
      log.warn('seed failed (continuing)', { message: err.message });
    }
  }

  // Start background jobs
  startReminderWorker();

  server.listen(PORT, () => {
    log.info(`PetHub backend listening on http://0.0.0.0:${PORT}`);
    log.info(`WebRTC signaling on ws://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  log.error('fatal startup error', { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on('SIGINT', () => { log.info('SIGINT'); server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { log.info('SIGTERM'); server.close(() => process.exit(0)); });
