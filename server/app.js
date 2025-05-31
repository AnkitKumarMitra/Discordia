import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import rateLimit from './middlewares/rateLimiter.js'

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(rateLimit);

// Routes
// app.use('/api/auth', authRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('API is running...');
});

export default app