import { sendSocketEvent } from '../utils/socketManager.js';

export const joinVoiceChannel = (req, res) => {
  const { roomId } = req.body;
  sendSocketEvent(roomId, 'user-joined-voice', { userId: req.user.id });
  res.status(200).json({ message: 'Joined voice channel' });
};

export const leaveVoiceChannel = (req, res) => {
  const { roomId } = req.body;
  sendSocketEvent(roomId, 'user-left-voice', { userId: req.user.id });
  res.status(200).json({ message: 'Left voice channel' });
};
