const voiceSocketHandlers = (socket, io, connectedUsers) => {
  const userId = socket.user.id;

  // Handle joining voice channels
  socket.on('join-voice-channel', (data) => {
    const { channelId, serverId } = data;
    
    if (!channelId) {
      socket.emit('error', { message: 'Channel ID required' });
      return;
    }

    const voiceRoomId = `voice:${channelId}`;
    
    // Join the voice room
    socket.join(voiceRoomId);
    
    // Update user's voice channel info
    const userInfo = connectedUsers.get(userId);
    if (userInfo) {
      userInfo.voiceChannel = channelId;
      userInfo.voiceServer = serverId;
    }

    // Notify others in the voice channel
    socket.to(voiceRoomId).emit('user-joined-voice', {
      userId,
      channelId,
      username: socket.user.username,
    });

    // Send current voice channel members to the new user
    const voiceMembers = [];
    const room = io.sockets.adapter.rooms.get(voiceRoomId);
    
    if (room) {
      room.forEach(socketId => {
        const memberSocket = io.sockets.sockets.get(socketId);
        if (memberSocket && memberSocket.user.id !== userId) {
          voiceMembers.push({
            userId: memberSocket.user.id,
            username: memberSocket.user.username,
          });
        }
      });
    }

    socket.emit('voice-channel-members', {
      channelId,
      members: voiceMembers,
    });

    console.log(`User ${userId} joined voice channel: ${channelId}`);
  });

  // Handle leaving voice channels
  socket.on('leave-voice-channel', (data) => {
    const { channelId } = data;
    
    if (!channelId) {
      socket.emit('error', { message: 'Channel ID required' });
      return;
    }

    const voiceRoomId = `voice:${channelId}`;
    
    // Leave the voice room
    socket.leave(voiceRoomId);
    
    // Update user's voice channel info
    const userInfo = connectedUsers.get(userId);
    if (userInfo) {
      userInfo.voiceChannel = null;
      userInfo.voiceServer = null;
    }

    // Notify others in the voice channel
    socket.to(voiceRoomId).emit('user-left-voice', {
      userId,
      channelId,
      username: socket.user.username,
    });

    console.log(`User ${userId} left voice channel: ${channelId}`);
  });

  // WebRTC Signaling for voice/video calls
  socket.on('webrtc-offer', (data) => {
    const { targetUserId, offer, channelId } = data;
    
    const targetUserInfo = Array.from(connectedUsers.entries())
      .find(([id, info]) => id === targetUserId);
    
    if (targetUserInfo) {
      const [, userInfo] = targetUserInfo;
      io.to(userInfo.socketId).emit('webrtc-offer', {
        fromUserId: userId,
        fromUsername: socket.user.username,
        offer,
        channelId,
      });
    }
  });

  socket.on('webrtc-answer', (data) => {
    const { targetUserId, answer, channelId } = data;
    
    const targetUserInfo = Array.from(connectedUsers.entries())
      .find(([id, info]) => id === targetUserId);
    
    if (targetUserInfo) {
      const [, userInfo] = targetUserInfo;
      io.to(userInfo.socketId).emit('webrtc-answer', {
        fromUserId: userId,
        fromUsername: socket.user.username,
        answer,
        channelId,
      });
    }
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const { targetUserId, candidate, channelId } = data;
    
    const targetUserInfo = Array.from(connectedUsers.entries())
      .find(([id, info]) => id === targetUserId);
    
    if (targetUserInfo) {
      const [, userInfo] = targetUserInfo;
      io.to(userInfo.socketId).emit('webrtc-ice-candidate', {
        fromUserId: userId,
        fromUsername: socket.user.username,
        candidate,
        channelId,
      });
    }
  });

  // Handle voice state changes (mute, deafen, etc.)
  socket.on('voice-state-update', (data) => {
    const { channelId, muted, deafened, speaking } = data;
    
    if (!channelId) return;
    
    const voiceRoomId = `voice:${channelId}`;
    
    // Update user's voice state
    const userInfo = connectedUsers.get(userId);
    if (userInfo) {
      userInfo.voiceState = {
        muted: !!muted,
        deafened: !!deafened,
        speaking: !!speaking,
      };
    }

    // Broadcast voice state to others in the channel
    socket.to(voiceRoomId).emit('user-voice-state-update', {
      userId,
      username: socket.user.username,
      muted: !!muted,
      deafened: !!deafened,
      speaking: !!speaking,
    });
  });

  // Handle screen sharing
  socket.on('start-screen-share', (data) => {
    const { channelId } = data;
    
    if (!channelId) return;
    
    const voiceRoomId = `voice:${channelId}`;
    
    // Update user's screen sharing state
    const userInfo = connectedUsers.get(userId);
    if (userInfo) {
      userInfo.screenSharing = true;
    }

    // Notify others in the voice channel
    socket.to(voiceRoomId).emit('user-started-screen-share', {
      userId,
      username: socket.user.username,
      channelId,
    });
  });

  socket.on('stop-screen-share', (data) => {
    const { channelId } = data;
    
    if (!channelId) return;
    
    const voiceRoomId = `voice:${channelId}`;
    
    // Update user's screen sharing state
    const userInfo = connectedUsers.get(userId);
    if (userInfo) {
      userInfo.screenSharing = false;
    }

    // Notify others in the voice channel
    socket.to(voiceRoomId).emit('user-stopped-screen-share', {
      userId,
      username: socket.user.username,
      channelId,
    });
  });

  // Handle video state changes
  socket.on('video-state-update', (data) => {
    const { channelId, videoEnabled } = data;
    
    if (!channelId) return;
    
    const voiceRoomId = `voice:${channelId}`;
    
    // Update user's video state
    const userInfo = connectedUsers.get(userId);
    if (userInfo) {
      userInfo.videoEnabled = !!videoEnabled;
    }

    // Broadcast video state to others in the channel
    socket.to(voiceRoomId).emit('user-video-state-update', {
      userId,
      username: socket.user.username,
      videoEnabled: !!videoEnabled,
    });
  });

  // Clean up voice state on disconnect
  socket.on('disconnect', () => {
    const userInfo = connectedUsers.get(userId);
    if (userInfo && userInfo.voiceChannel) {
      const voiceRoomId = `voice:${userInfo.voiceChannel}`;
      
      // Notify others that user left voice channel
      socket.to(voiceRoomId).emit('user-left-voice', {
        userId,
        channelId: userInfo.voiceChannel,
        username: socket.user.username,
      });
    }
  });
};

export default voiceSocketHandlers;