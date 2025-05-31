import mongoose from 'mongoose';

const serverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 64,
  },
  description: {
    type: String,
    maxlength: 200,
  },
  icon: {
    type: String,
    default: null,
  },
  banner: {
    type: String,
    default: null,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    roles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    }],
    nickname: {
      type: String,
      maxlength: 32,
    },
  }],
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
  }],
  roles: [{
    name: {
      type: String,
      required: true,
      maxlength: 32,
    },
    color: {
      type: String,
      default: '#99AAB5',
    },
    permissions: {
      type: Number,
      default: 0,
    },
    position: {
      type: Number,
      default: 0,
    },
    mentionable: {
      type: Boolean,
      default: false,
    },
  }],
  isPublic: {
    type: Boolean,
    default: false,
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  maxMembers: {
    type: Number,
    default: 500,
  },
  features: [{
    type: String,
    enum: ['VOICE_CHANNELS', 'FILE_SHARING', 'SCREEN_SHARING'],
  }],
  region: {
    type: String,
    default: 'us-east',
  },
  verificationLevel: {
    type: String,
    enum: ['NONE', 'LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Generate unique invite code
serverSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Create default channels when server is created
serverSchema.post('save', async function(doc) {
  if (this.isNew) {
    const Channel = mongoose.model('Channel');
    
    // Create general text channel
    const generalChannel = new Channel({
      name: 'general',
      type: 'text',
      server: doc._id,
      position: 0,
    });
    
    // Create general voice channel
    const voiceChannel = new Channel({
      name: 'General Voice',
      type: 'voice',
      server: doc._id,
      position: 1,
    });
    
    await Promise.all([generalChannel.save(), voiceChannel.save()]);
    
    // Add channels to server
    doc.channels = [generalChannel._id, voiceChannel._id];
    doc.save();
  }
});

// Index for efficient querying
serverSchema.index({ owner: 1 });
serverSchema.index({ 'members.user': 1 });
serverSchema.index({ inviteCode: 1 });

export default mongoose.model('Server', serverSchema);