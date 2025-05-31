import express from 'express';
import { register, login } from '../controllers/authController.js';
import inputValidator from '../middlewares/validateInput.js';
import rateLimit from '../middlewares/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth
  message: {
    status: 429,
    error: 'Too many authentication attempts. Please try again later.',
  },
});

// POST /api/auth/register
router.post('/register', authLimiter, inputValidator, register);

// POST /api/auth/login
router.post('/login', authLimiter, inputValidator, login);

export default router;