import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const register = async (req, res) => {
  const { username, password, displayName } = req.body;

  try {
    const user = await User.create({ username, password, displayName });
    const token = generateToken(user._id);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.status(200).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};
