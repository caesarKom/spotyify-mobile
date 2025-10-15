import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');
const musicDir = path.join(uploadDir, 'music');
const imagesDir = path.join(uploadDir, 'images');

[musicDir, imagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const musicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, musicDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const musicFilter = (req, file, cb) => {
  const allowedTypes = /mp3|wav|mpeg|flac|m4a|aac|ogg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed (MP3, MPEG, WAV, FLAC, M4A, AAC, OGG)'));
  }
};

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, JPG, PNG, GIF, WEBP)'));
  }
};


const uploadMusic = multer({
  storage: musicStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50000000 // 50MB by default
  },
  fileFilter: musicFilter
});

const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10000000 // 10MB by default
  },
  fileFilter: imageFilter
});

const uploadMultiple = multer({
  storage: musicStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50000000
  }
});

export {
  uploadMusic,
  uploadImage,
  uploadMultiple
};