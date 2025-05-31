import mongoose from 'mongoose';
import dotenv from 'dotenv';

import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// MongoDB connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
