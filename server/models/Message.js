import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
  },
  room: {
    type: String,
    required: true, // For socket room identification
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'voice', 'system'],
    default: 'text',
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  reactions: [{
    emoji: String,
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  }],
  edited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

// Populate sender info by default
messageSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'sender',
    select: 'username displayName avatar status',
  }).populate({
    path: 'attachments',
    select: 'name url size mimetype',
  });
  next();
});

export default mongoose.model('Message', messageSchema);