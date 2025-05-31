import express from 'express';
import { sendMessage, getMessages } from '../controllers/messageController.js';
import authMiddleware from '../middlewares/auth.js';
import inputValidator from '../middlewares/validateInput.js';

const router = express.Router();

// All message routes require authentication
router.use(authMiddleware);

// POST /api/messages - Send a message
router.post('/', inputValidator, sendMessage);

// GET /api/messages/:roomId - Get messages for a room/channel
router.get('/:roomId', getMessages);

export default router;