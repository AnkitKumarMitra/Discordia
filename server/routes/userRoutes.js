import express from 'express';
import { getUserProfile, searchUsers } from '../controllers/userController.js';
import authMiddleware from '../middlewares/auth.js';
import inputValidator from '../middlewares/validateInput.js';

const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

// GET /api/users/profile - Get current user profile
router.get('/profile', getUserProfile);

// GET /api/users/search?query=username - Search users
router.get('/search', inputValidator, searchUsers);

export default router;