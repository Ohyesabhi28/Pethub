// services/signaling.js — Socket.io WebRTC signaling.
// Rooms map to appointment IDs (or ad-hoc room IDs from /webrtc/rooms).
//
// Wire protocol (client ↔ server):
//   client → 'join'         { roomId, name }              → server → 'peers' { peers: [{id, name}] }
//                                                         → broadcasts 'peer-joined' { id, name } to others
//   client → 'webrtc:offer' { to, sdp }                   → relays to peer
//   client → 'webrtc:answer'{ to, sdp }                   → relays to peer
//   client → 'webrtc:ice'   { to, candidate }             → relays to peer
//   client → 'leave'                                       → broadcasts 'peer-left' { id }
//   on disconnect → broadcasts 'peer-left' { id }
//
// Auth: clients pass an idToken in the socket handshake auth payload.
const { auth: fbAuth } = require('../firebase');
const log = require('../utils/logger');

function attachSignaling(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.idToken;
      if (!token) return next(new Error('missing idToken in handshake auth'));
      const decoded = await fbAuth.verifyIdToken(token);
      socket.data.user = { uid: decoded.uid, email: decoded.email };
      next();
    } catch (err) {
      log.warn('socket auth failed', { message: err.message });
      next(new Error('auth failed'));
    }
  });

  io.on('connection', (socket) => {
    log.info('socket connected', { sid: socket.id, uid: socket.data.user.uid });

    socket.on('join', ({ roomId, name }) => {
      if (!roomId) return;
      socket.data.roomId = roomId;
      socket.data.name = name || socket.data.user.email;
      socket.join(roomId);

      // Tell the new peer who is already in the room.
      const sids = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      const peers = sids
        .filter((sid) => sid !== socket.id)
        .map((sid) => {
          const s = io.sockets.sockets.get(sid);
          return { id: sid, name: s?.data?.name || 'peer', uid: s?.data?.user?.uid };
        });
      socket.emit('peers', { peers });

      // Tell existing peers about the newcomer.
      socket.to(roomId).emit('peer-joined', {
        id: socket.id, name: socket.data.name, uid: socket.data.user.uid,
      });
    });

    socket.on('webrtc:offer', ({ to, sdp }) => {
      if (!to || !sdp) return;
      io.to(to).emit('webrtc:offer', { from: socket.id, sdp });
    });

    socket.on('webrtc:answer', ({ to, sdp }) => {
      if (!to || !sdp) return;
      io.to(to).emit('webrtc:answer', { from: socket.id, sdp });
    });

    socket.on('webrtc:ice', ({ to, candidate }) => {
      if (!to || !candidate) return;
      io.to(to).emit('webrtc:ice', { from: socket.id, candidate });
    });

    socket.on('leave', () => {
      const { roomId } = socket.data;
      if (roomId) {
        socket.leave(roomId);
        socket.to(roomId).emit('peer-left', { id: socket.id });
        socket.data.roomId = null;
      }
    });

    socket.on('disconnect', (reason) => {
      const { roomId } = socket.data || {};
      if (roomId) socket.to(roomId).emit('peer-left', { id: socket.id });
      log.info('socket disconnected', { sid: socket.id, reason });
    });
  });
}

module.exports = { attachSignaling };
