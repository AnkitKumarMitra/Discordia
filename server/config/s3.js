import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const s3 = new AWS.S3();

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

// S3 upload configuration
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, {
        'uploaded-by': req.user?.id || 'anonymous',
        'upload-date': new Date().toISOString(),
      });
    },
    key: (req, file, cb) => {
      const userId = req.user?.id || 'anonymous';
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const ext = path.extname(file.originalname);
      const fileName = `uploads/${userId}/${timestamp}-${randomString}${ext}`;
      cb(null, fileName);
    },
  }),
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
    files: 5, // Maximum 5 files per request
  },
});

// Helper function to delete file from S3
export const deleteFileFromS3 = async (fileKey) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
    };
    
    await s3.deleteObject(params).promise();
    console.log(`File deleted from S3: ${fileKey}`);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
};

// Helper function to generate signed URL for private files
export const generateSignedUrl = (fileKey, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Expires: expiresIn, // URL expires in 1 hour by default
    };
    
    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

// Helper function to check if S3 is configured
export const isS3Configured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
};

export { s3, upload };
export default s3;