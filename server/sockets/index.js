import { Server } from 'socket.io';
import { verifySocketToken } from '../utils/jwtUtils.js';
import chatSocketHandlers from './chatSocket.js';
import voiceSocketHandlers from './voiceSocket.js';

let io = null;
const connectedUsers = new Map(); // userId => { socketId, status, rooms }

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const user = verifySocketToken(token);
      
      if (!user) {
        return next(new Error('Authentication error'));
      }
      
      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket auth error:', err);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    
    // Store user connection info
    connectedUsers.set(userId, {
      socketId: socket.id,
      status: 'online',
      rooms: new Set(),
    });

    console.log(`✅ User connected: ${userId} (${socket.id})`);

    // Emit user online status to their servers
    socket.broadcast.emit('user-status-change', {
      userId,
      status: 'online',
    });

    // Register chat event handlers
    chatSocketHandlers(socket, io, connectedUsers);
    
    // Register voice event handlers
    voiceSocketHandlers(socket, io, connectedUsers);

    // Handle room joining
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      connectedUsers.get(userId)?.rooms.add(roomId);
      console.log(`User ${userId} joined room: ${roomId}`);
    });

    // Handle room leaving
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      connectedUsers.get(userId)?.rooms.delete(roomId);
      console.log(`User ${userId} left room: ${roomId}`);
    });

    // Handle status updates
    socket.on('status-change', (status) => {
      const userInfo = connectedUsers.get(userId);
      if (userInfo) {
        userInfo.status = status;
        // Broadcast status change to all connected users
        socket.broadcast.emit('user-status-change', {
          userId,
          status,
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${userId} (${reason})`);
      
      // Remove from connected users
      connectedUsers.delete(userId);
      
      // Notify others of offline status
      socket.broadcast.emit('user-status-change', {
        userId,
        status: 'offline',
      });
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  });

  return io;
};

export const getSocketInstance = () => io;

export const sendToRoom = (roomId, event, data) => {
  if (io) {
    io.to(roomId).emit(event, data);
  }
};

export const sendToUser = (userId, event, data) => {
  const userInfo = connectedUsers.get(userId);
  if (userInfo && io) {
    io.to(userInfo.socketId).emit(event, data);
  }
};

export const getConnectedUsers = () => connectedUsers;

export const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};