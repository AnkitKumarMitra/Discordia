import Message from '../models/Message.js';
import Channel from '../models/Channel.js';

const chatSocketHandlers = (socket, io, connectedUsers) => {
  const userId = socket.user.id;

  // Handle sending messages via socket
  socket.on('send-message', async (data) => {
    try {
      const { content, roomId, channelId, replyTo } = data;

      // Validate input
      if (!content || !roomId || !channelId) {
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      if (content.length > 2000) {
        socket.emit('error', { message: 'Message too long' });
        return;
      }

      // Verify channel exists and user has access
      const channel = await Channel.findById(channelId).populate('server');
      if (!channel) {
        socket.emit('error', { message: 'Channel not found' });
        return;
      }

      // Create message
      const message = await Message.create({
        content: content.trim(),
        sender: userId,
        channel: channelId,
        server: channel.server?._id,
        room: roomId,
        replyTo: replyTo || null,
      });

      // Populate sender info
      await message.populate('sender', 'username displayName avatar status');

      // Update channel last activity
      await channel.updateActivity();

      // Emit to all users in the room
      io.to(roomId).emit('new-message', message);

      console.log(`Message sent in ${roomId} by ${userId}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle message editing
  socket.on('edit-message', async (data) => {
    try {
      const { messageId, content } = data;

      if (!content || content.length > 2000) {
        socket.emit('error', { message: 'Invalid message content' });
        return;
      }

      const message = await Message.findById(messageId).populate('sender');
      
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check if user owns the message
      if (message.sender._id.toString() !== userId) {
        socket.emit('error', { message: 'Not authorized to edit this message' });
        return;
      }

      // Update message
      message.content = content.trim();
      message.edited = true;
      message.editedAt = new Date();
      await message.save();

      // Emit to all users in the room
      io.to(message.room).emit('message-edited', {
        messageId: message._id,
        content: message.content,
        edited: true,
        editedAt: message.editedAt,
      });

    } catch (error) {
      console.error('Edit message error:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // Handle message deletion
  socket.on('delete-message', async (data) => {
    try {
      const { messageId } = data;

      const message = await Message.findById(messageId).populate('sender');
      
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check if user owns the message
      if (message.sender._id.toString() !== userId) {
        socket.emit('error', { message: 'Not authorized to delete this message' });
        return;
      }

      // Soft delete
      message.deleted = true;
      message.deletedAt = new Date();
      message.content = '[Message deleted]';
      await message.save();

      // Emit to all users in the room
      io.to(message.room).emit('message-deleted', {
        messageId: message._id,
      });

    } catch (error) {
      console.error('Delete message error:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { roomId } = data;
    if (roomId) {
      socket.to(roomId).emit('user-typing', {
        userId,
        username: socket.user.username,
      });
    }
  });

  socket.on('typing-stop', (data) => {
    const { roomId } = data;
    if (roomId) {
      socket.to(roomId).emit('user-stopped-typing', {
        userId,
      });
    }
  });

  // Handle message reactions
  socket.on('add-reaction', async (data) => {
    try {
      const { messageId, emoji } = data;

      if (!emoji || !messageId) {
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Find existing reaction or create new one
      let reaction = message.reactions.find(r => r.emoji === emoji);
      
      if (reaction) {
        // Toggle reaction
        const userIndex = reaction.users.indexOf(userId);
        if (userIndex > -1) {
          reaction.users.splice(userIndex, 1);
          if (reaction.users.length === 0) {
            message.reactions = message.reactions.filter(r => r.emoji !== emoji);
          }
        } else {
          reaction.users.push(userId);
        }
      } else {
        // Add new reaction
        message.reactions.push({
          emoji,
          users: [userId],
        });
      }

      await message.save();

      // Emit to all users in the room
      io.to(message.room).emit('reaction-updated', {
        messageId: message._id,
        reactions: message.reactions,
      });

    } catch (error) {
      console.error('Add reaction error:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  // Handle user presence in channels
  socket.on('join-channel', (data) => {
    const { channelId } = data;
    if (channelId) {
      const roomId = `channel:${channelId}`;
      socket.join(roomId);
      
      // Notify others that user joined channel
      socket.to(roomId).emit('user-joined-channel', {
        userId,
        channelId,
      });
    }
  });

  socket.on('leave-channel', (data) => {
    const { channelId } = data;
    if (channelId) {
      const roomId = `channel:${channelId}`;
      socket.leave(roomId);
      
      // Notify others that user left channel
      socket.to(roomId).emit('user-left-channel', {
        userId,
        channelId,
      });
    }
  });
};

export default chatSocketHandlers;