import File from '../models/File.js';
import path from 'path';
import fs from 'fs';

export const uploadFile = async (req, res) => {
  const file = req.file;

  try {
    const storedFile = await File.create({
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size,
      sender: req.user.id,
    });

    res.status(201).json(storedFile);
  } catch (err) {
    res.status(400).json({ error: 'File upload failed' });
  }
};

export const downloadFile = (req, res) => {
  const filePath = path.resolve(`uploads/${req.params.filename}`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath);
};
