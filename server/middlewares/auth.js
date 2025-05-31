// server/middlewares/auth.js

import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check for token in Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request object
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export default authMiddleware;
