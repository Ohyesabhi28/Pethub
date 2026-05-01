// VideoCallScreen.js
//
// One-to-one WebRTC call using react-native-webrtc + Socket.io signaling.
// Designed for the simplest two-peer case (caller + callee).
//
// Flow:
//   1. Client opens local media (camera + mic).
//   2. Connects to Socket.io with the user's Firebase ID token.
//   3. Emits 'join' { roomId } — server replies with current peers list.
//   4. If there are existing peers → THIS client is the caller. Create offer, send to peer.
//   5. Otherwise wait for 'peer-joined'; another client will offer to us.
//   6. ICE candidates trickle both ways via 'webrtc:ice'.
//   7. On disconnect, attempt one auto-reconnect, then surface manual retry UI.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from 'react-native-webrtc';
import { io as ioClient } from 'socket.io-client';
import { auth } from '../services/firebase';
import client, { API_BASE } from '../api/client';

export default function VideoCallScreen({ route, navigation }) {
  const { roomId } = route.params;
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState('initializing');
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const peerSidRef = useRef(null);
  const iceQueueRef = useRef([]);

  const cleanup = useCallback(() => {
    try { pcRef.current?.close(); } catch (_e) {}
    try { socketRef.current?.disconnect(); } catch (_e) {}
    try { localStream?.getTracks().forEach((t) => t.stop()); } catch (_e) {}
    pcRef.current = null;
    socketRef.current = null;
    peerSidRef.current = null;
    iceQueueRef.current = [];
  }, [localStream]);

  useEffect(() => () => cleanup(), [cleanup]);

  const connect = useCallback(async () => {
    setStatus('initializing');
    setRemoteStream(null);

    // 0. Fetch dynamic ICE Servers (STUN/TURN)
    let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
    try {
      const { data } = await client.get('/webrtc/ice');
      if (data.iceServers) iceServers = data.iceServers;
    } catch (e) {
      console.warn('Failed to fetch ICE servers, using default STUN', e);
    }

    // 1. Local media
    let stream;
    try {
      stream = await mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'user' },
      });
      setLocalStream(stream);
    } catch (err) {
      setStatus(`media-error:${err.message}`);
      return;
    }

    // 2. Peer connection
    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) setRemoteStream(e.streams[0]);
    };
    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      setStatus(s);
      if (s === 'failed' || s === 'disconnected') {
        if (retryCount === 0) {
          setRetryCount(1);
          setTimeout(() => { cleanup(); connect(); }, 1000);
        }
      }
    };
    pc.onicecandidate = (e) => {
      if (e.candidate && peerSidRef.current && socketRef.current) {
        socketRef.current.emit('webrtc:ice', { to: peerSidRef.current, candidate: e.candidate });
      }
    };

    // 3. Socket signaling
    const token = await auth.currentUser?.getIdToken();
    if (!token) { setStatus('auth-error'); return; }
    const socket = ioClient(API_BASE, { auth: { idToken: token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect_error', (err) => setStatus(`signaling-error:${err.message}`));

    socket.on('peers', async ({ peers }) => {
      // If there's already someone in the room, we initiate (caller).
      if (peers.length > 0) {
        peerSidRef.current = peers[0].id;
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:offer', { to: peerSidRef.current, sdp: pc.localDescription });
          setStatus('offering');
        } catch (e) {
          setStatus(`offer-error:${e.message}`);
        }
      } else {
        setStatus('waiting');
      }
    });

    socket.on('peer-joined', ({ id }) => {
      // We're the existing peer; the newcomer will send us an offer.
      peerSidRef.current = id;
    });

    socket.on('webrtc:offer', async ({ from, sdp }) => {
      peerSidRef.current = from;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        // Drain any ICE that arrived before the remote description.
        for (const c of iceQueueRef.current) await pc.addIceCandidate(new RTCIceCandidate(c));
        iceQueueRef.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', { to: from, sdp: pc.localDescription });
        setStatus('answering');
      } catch (e) { setStatus(`answer-error:${e.message}`); }
    });

    socket.on('webrtc:answer', async ({ sdp }) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        for (const c of iceQueueRef.current) await pc.addIceCandidate(new RTCIceCandidate(c));
        iceQueueRef.current = [];
        setStatus('connected');
      } catch (e) { setStatus(`answer-apply-error:${e.message}`); }
    });

    socket.on('webrtc:ice', async ({ candidate }) => {
      try {
        if (!pc.remoteDescription) {
          iceQueueRef.current.push(candidate);
        } else {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        // ignore — late ICE is benign
      }
    });

    socket.on('peer-left', () => {
      setStatus('peer-left');
      setRemoteStream(null);
    });

    socket.emit('join', { roomId });
  }, [roomId, cleanup, retryCount]);

  useEffect(() => { connect(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMute = () => {
    const audio = localStream?.getAudioTracks?.()[0];
    if (audio) { audio.enabled = !audio.enabled; setMuted(!audio.enabled); }
  };
  const toggleCam = () => {
    const video = localStream?.getVideoTracks?.()[0];
    if (video) { video.enabled = !video.enabled; setCamOff(!video.enabled); }
  };
  const hangUp = () => { cleanup(); navigation.goBack(); };
  const retry = () => { setRetryCount((c) => c + 1); cleanup(); connect(); };

  const showRetry = status.startsWith('media-error') || status.startsWith('signaling-error') || status === 'failed';

  return (
    <View style={s.root}>
      <View style={s.remoteWrap}>
        {remoteStream ? (
          <RTCView style={s.remote} streamURL={remoteStream.toURL()} objectFit="cover" />
        ) : (
          <View style={s.placeholder}>
            <ActivityIndicator color="#fff" />
            <Text style={s.placeholderText}>{status}</Text>
            {showRetry && (
              <TouchableOpacity style={s.retryBtn} onPress={retry}>
                <Text style={s.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      {localStream && (
        <RTCView style={s.local} streamURL={localStream.toURL()} objectFit="cover" mirror />
      )}
      <View style={s.controls}>
        <TouchableOpacity style={[s.ctrl, muted && s.ctrlActive]} onPress={toggleMute}>
          <Text style={s.ctrlText}>{muted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.ctrl, camOff && s.ctrlActive]} onPress={toggleCam}>
          <Text style={s.ctrlText}>{camOff ? 'Cam on' : 'Cam off'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.ctrl, s.ctrlEnd]} onPress={hangUp}>
          <Text style={s.ctrlText}>End</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.statusBar}>Room: {roomId.slice(0, 8)} · {status}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  remoteWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  remote: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', gap: 12 },
  placeholderText: { color: '#fff', marginTop: 12 },
  retryBtn: { padding: 10, backgroundColor: '#0a84ff', borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: '600' },
  local: { position: 'absolute', top: 40, right: 16, width: 100, height: 140, borderRadius: 8, borderWidth: 1, borderColor: '#fff' },
  controls: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  ctrl: { paddingVertical: 12, paddingHorizontal: 18, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 24 },
  ctrlActive: { backgroundColor: 'rgba(255,255,255,0.35)' },
  ctrlEnd: { backgroundColor: '#ef4444' },
  ctrlText: { color: '#fff', fontWeight: '600' },
  statusBar: { position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', color: '#aaa', fontSize: 11 },
});
