// server/utils/socketManager.js

import { Server } from 'socket.io';
import { verifySocketToken } from './jwtUtils.js';
import Redis from 'ioredis';

const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();

let io = null;

const connectedUsers = new Map(); // userId => socketId

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.adapter(require('socket.io-redis')({ pubClient, subClient }));

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const user = verifySocketToken(token);
      if (!user) return next(new Error('Authentication error'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    connectedUsers.set(userId, socket.id);

    console.log(`✅ User connected: ${userId}`);

    // Join all room channels
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
    });

    // Message sending
    socket.on('send-message', ({ roomId, message }) => {
      socket.to(roomId).emit('new-message', message);
    });

    // Voice signaling (WebRTC signaling messages)
    socket.on('voice-signal', (payload) => {
      socket.to(payload.roomId).emit('voice-signal', payload);
    });

    // Typing indicators
    socket.on('typing', ({ roomId }) => {
      socket.to(roomId).emit('user-typing', { userId });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      console.log(`❌ User disconnected: ${userId}`);
    });
  });
};

export const sendSocketEvent = (roomId, event, data) => {
  if (io) {
    io.to(roomId).emit(event, data);
  }
};

export const getSocketInstance = () => io;
