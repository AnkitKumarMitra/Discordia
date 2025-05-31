// server/middlewares/inputValidator.js

import sanitizeHtml from 'sanitize-html';

const MAX_TEXT_LENGTH = 2000;
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'video/mp4',
  'audio/mpeg',
  'application/pdf',
  'application/zip',
  'text/plain',
];

const allowedFields = {
  content: { required: false, maxLength: MAX_TEXT_LENGTH },
  username: { required: true, maxLength: 32 },
  roomName: { required: false, maxLength: 64 },
  displayName: { required: false, maxLength: 50 },
};

const sanitizeInput = (input) => {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
};

const inputValidator = (req, res, next) => {
  // 🔹 Validate fields from body
  for (const field in allowedFields) {
    const rules = allowedFields[field];
    if (req.body[field] !== undefined) {
      const value = sanitizeInput(req.body[field]);

      if (rules.required && value.length === 0) {
        return res.status(400).json({ error: `${field} cannot be empty.` });
      }

      if (value.length > rules.maxLength) {
        return res.status(400).json({ error: `${field} cannot exceed ${rules.maxLength} characters.` });
      }

      req.body[field] = value; // overwrite with sanitized version
    } else if (rules.required) {
      return res.status(400).json({ error: `${field} is required.` });
    }
  }

  // 🔹 Validate message content
  if (req.body.content) {
    const containsInvalidChars = /[\u0000-\u001F\u007F]/.test(req.body.content);
    if (containsInvalidChars) {
      return res.status(400).json({ error: 'Message contains invalid characters.' });
    }
  }

  // 🔹 Validate uploaded file
  const file = req.file || req.files?.[0];
  if (file) {
    const { originalname, mimetype, size } = file;

    const extension = originalname.split('.').pop().toLowerCase();
    const filename = originalname.toLowerCase();

    if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
      return res.status(400).json({ error: `Unsupported file type: ${mimetype}` });
    }

    if (size > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({ error: `File size exceeds ${MAX_FILE_SIZE_MB}MB.` });
    }

    if (!filename || filename.length > 100 || !extension) {
      return res.status(400).json({ error: 'Invalid or missing file name/extension.' });
    }
  }

  next();
};

export default inputValidator;
