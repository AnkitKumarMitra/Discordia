import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadFile, downloadFile } from '../controllers/fileController.js';
import authMiddleware from '../middlewares/auth.js';
import inputValidator from '../middlewares/validateInput.js';

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'video/mp4',
    'audio/mpeg',
    'application/pdf',
    'application/zip',
    'text/plain',
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
});

// All file routes require authentication
router.use(authMiddleware);

// POST /api/files/upload - Upload a file
router.post('/upload', upload.single('file'), inputValidator, uploadFile);

// GET /api/files/download/:filename - Download a file
router.get('/download/:filename', downloadFile);

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 25MB limit' });
    }
  }
  
  if (error.message.startsWith('Unsupported file type')) {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: 'File upload failed' });
});

export default router;