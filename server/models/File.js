import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 255,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
    max: 26214400, // 25MB in bytes
  },
  url: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
  },
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'audio', 'document', 'archive', 'other'],
    required: true,
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number, // for audio/video files
    pages: Number, // for documents
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  downloads: {
    type: Number,
    default: 0,
  },
  virusScanResult: {
    status: {
      type: String,
      enum: ['pending', 'clean', 'infected', 'error'],
      default: 'pending',
    },
    scannedAt: Date,
    details: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Determine file type from mimetype
fileSchema.pre('save', function(next) {
  const mimetype = this.mimetype.toLowerCase();
  
  if (mimetype.startsWith('image/')) {
    this.fileType = 'image';
  } else if (mimetype.startsWith('video/')) {
    this.fileType = 'video';
  } else if (mimetype.startsWith('audio/')) {
    this.fileType = 'audio';
  } else if (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('text')) {
    this.fileType = 'document';
  } else if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('archive')) {
    this.fileType = 'archive';
  } else {
    this.fileType = 'other';
  }
  
  next();
});

// Format file size for display
fileSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Check if file is an image
fileSchema.virtual('isImage').get(function() {
  return this.fileType === 'image';
});

// Check if file is a video
fileSchema.virtual('isVideo').get(function() {
  return this.fileType === 'video';
});

// Indexes for efficient querying
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ server: 1, createdAt: -1 });
fileSchema.index({ channel: 1, createdAt: -1 });
fileSchema.index({ message: 1 });

export default mongoose.model('File', fileSchema);