import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import inputValidator from '../middlewares/validateInput.js';
import Server from '../models/Server.js';
import Channel from '../models/Channel.js';

const router = express.Router();

// All server routes require authentication
router.use(authMiddleware);

// GET /api/servers - Get user's servers
router.get('/', async (req, res) => {
  try {
    const servers = await Server.find({
      'members.user': req.user.id,
    }).populate('channels').populate('owner', 'username displayName avatar');
    
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// POST /api/servers - Create a new server
router.post('/', inputValidator, async (req, res) => {
  const { name, description } = req.body;
  
  try {
    const server = await Server.create({
      name,
      description,
      owner: req.user.id,
      members: [{
        user: req.user.id,
        joinedAt: new Date(),
      }],
    });
    
    res.status(201).json(server);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/servers/:serverId - Get server details
router.get('/:serverId', async (req, res) => {
  try {
    const server = await Server.findById(req.params.serverId)
      .populate('channels')
      .populate('members.user', 'username displayName avatar status')
      .populate('owner', 'username displayName avatar');
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if user is a member
    const isMember = server.members.some(member => 
      member.user._id.toString() === req.user.id
    );
    
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(server);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch server' });
  }
});

// POST /api/servers/:serverId/join - Join server by invite
router.post('/:serverId/join', async (req, res) => {
  try {
    const server = await Server.findById(req.params.serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if already a member
    const isMember = server.members.some(member => 
      member.user.toString() === req.user.id
    );
    
    if (isMember) {
      return res.status(400).json({ error: 'Already a member' });
    }
    
    // Add user to server
    server.members.push({
      user: req.user.id,
      joinedAt: new Date(),
    });
    
    await server.save();
    res.json({ message: 'Successfully joined server' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join server' });
  }
});

// POST /api/servers/:serverId/channels - Create a new channel
router.post('/:serverId/channels', inputValidator, async (req, res) => {
  const { name, type = 'text', topic } = req.body;
  
  try {
    const server = await Server.findById(req.params.serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if user is server owner (for simplicity)
    if (server.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can create channels' });
    }
    
    const channel = await Channel.create({
      name,
      type,
      topic,
      server: server._id,
      position: server.channels.length,
    });
    
    // Add channel to server
    server.channels.push(channel._id);
    await server.save();
    
    res.status(201).json(channel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;