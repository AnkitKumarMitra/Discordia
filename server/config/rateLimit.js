import rateLimit from 'express-rate-limit';

// Basic in-memory rate limiter (can be replaced with Redis later)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: 429,
    error: 'Too many requests. Please try again later.',
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

export default limiter;