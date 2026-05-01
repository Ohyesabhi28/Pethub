// /webrtc — REST helpers for WebRTC rooms. Actual signaling happens over
// Socket.io (see services/signaling.js). REST is used to mint/check rooms.
const express = require('express');
const { v4: uuid } = require('uuid');
const { db } = require('../firebase');
const { authMiddleware } = require('../middleware/auth');
const { HttpError } = require('../middleware/error');

const router = express.Router();
router.use(authMiddleware);

// Create an ad-hoc room (e.g. for an unscheduled call). Booked appointments
// already have roomId === appointment.id.
router.post('/rooms', async (req, res, next) => {
  try {
    const roomId = uuid();
    await db.collection('rooms').doc(roomId).set({
      createdBy: req.user.uid, createdAt: new Date().toISOString(),
    });
    res.json({ roomId });
  } catch (err) { next(err); }
});

// Confirm a user is allowed into a given appointment room.
router.get('/join/:roomId', async (req, res, next) => {
  try {
    const apptSnap = await db.collection('appointments').doc(req.params.roomId).get();
    if (apptSnap.exists) {
      const a = apptSnap.data();
      if (a.ownerId !== req.user.uid && a.vetId !== req.user.uid && req.user.role !== 'Admin') {
        throw new HttpError(403, 'Not a participant in this consultation');
      }
      return res.json({ roomId: req.params.roomId, appointment: a });
    }
    // Ad-hoc room created via /rooms
    const roomSnap = await db.collection('rooms').doc(req.params.roomId).get();
    if (!roomSnap.exists) throw new HttpError(404, 'Room not found');
    res.json({ roomId: req.params.roomId, room: roomSnap.data() });
  } catch (err) { next(err); }
});

const twilio = require('twilio');

// Generate dynamic ICE servers (STUN/TURN) for reliable WebRTC over cellular/restrictive networks.
router.get('/ice', async (req, res, next) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    // Fallback STUN servers if Twilio isn't configured
    const defaultServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ];

    if (!accountSid || !authToken) {
      return res.json({ iceServers: defaultServers });
    }

    const client = twilio(accountSid, authToken);
    const token = await client.tokens.create();
    res.json({ iceServers: token.iceServers });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
