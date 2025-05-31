import Message from '../models/Message.js';
import { sendSocketEvent } from '../utils/socketManager.js';

export const sendMessage = async (req, res) => {
  const { content, roomId } = req.body;

  try {
    const message = await Message.create({
      content,
      sender: req.user.id,
      room: roomId,
    });

    sendSocketEvent(roomId, 'new-message', message);
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  const { roomId } = req.params;

  try {
    const messages = await Message.find({ room: roomId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};
