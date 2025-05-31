import User from '../models/User.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ error: 'User not found' });
  }
};

export const searchUsers = async (req, res) => {
  const { query } = req.query;
  try {
    const users = await User.find({
      username: { $regex: query, $options: 'i' },
    }).select('username displayName');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
};
