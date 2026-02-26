const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary (will only work if ENV vars are set)
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Check if Cloudinary is configured
const useCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;

let storage;

if (useCloudinary) {
  // Use Cloudinary Cloud Storage
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'aminohouse', // Folder name in Cloudinary
      allowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    }
  });
} else {
  // Fallback to Ephemeral Local Disk Storage (Current buggy behavior on Render)
  storage = multer.diskStorage({
    destination: './Uploads/',
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Note: CloudinaryStorage handles allowedFormats, but we keep this for disk fallback
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb('Error: Images only!');
  },
});

router.post('/', auth, upload.single('image'), (req, res) => {
  try {
    console.log('Uploaded file:', req.file); // Log file details
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let imageUrl;

    if (useCloudinary) {
      // Cloudinary returns the secure URL in req.file.path
      imageUrl = req.file.path;
    } else {
      // Local Disk returns local filename
      const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    res.json({ imageUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;