import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 64,
  },
  type: {
    type: String,
    enum: ['text', 'voice', 'category'],
    required: true,
    default: 'text',
  },
  topic: {
    type: String,
    maxlength: 200,
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
  },
  position: {
    type: Number,
    default: 0,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  permissions: [{
    target: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'permissions.targetType',
    },
    targetType: {
      type: String,
      enum: ['User', 'Role'],
    },
    allow: {
      type: Number,
      default: 0,
    },
    deny: {
      type: Number,
      default: 0,
    },
  }],
  // Voice channel specific settings
  userLimit: {
    type: Number,
    default: 0, // 0 = unlimited
  },
  bitrate: {
    type: Number,
    default: 64000, // 64kbps
    min: 8000,
    max: 128000,
  },
  // Text channel specific settings
  slowMode: {
    type: Number,
    default: 0, // seconds between messages
    min: 0,
    max: 21600, // 6 hours
  },
  nsfw: {
    type: Boolean,
    default: false,
  },
  lastMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
channelSchema.index({ server: 1, position: 1 });
channelSchema.index({ server: 1, type: 1 });

// Generate room ID for socket connections
channelSchema.virtual('roomId').get(function() {
  return `channel:${this._id}`;
});

// Update last activity when messages are sent
channelSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

export default mongoose.model('Channel', channelSchema);