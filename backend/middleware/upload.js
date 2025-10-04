const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upewnij się, że katalogi istnieją
const uploadDir = path.join(__dirname, '../uploads');
const musicDir = path.join(uploadDir, 'music');
const imagesDir = path.join(uploadDir, 'images');

[musicDir, imagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Konfiguracja storage dla muzyki
const musicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, musicDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Konfiguracja storage dla obrazków
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtr plików muzycznych
const musicFilter = (req, file, cb) => {
  const allowedTypes = /mp3|wav|flac|m4a|aac|ogg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Dozwolone są tylko pliki audio (MP3, WAV, FLAC, M4A, AAC, OGG)'));
  }
};

// Filtr obrazków
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Dozwolone są tylko pliki obrazów (JPEG, JPG, PNG, GIF, WEBP)'));
  }
};

// Middleware do uploadu muzyki
const uploadMusic = multer({
  storage: musicStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50000000 // 50MB domyślnie
  },
  fileFilter: musicFilter
});

// Middleware do uploadu obrazków
const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10000000 // 10MB dla obrazków
  },
  fileFilter: imageFilter
});

// Middleware do uploadu wielu plików
const uploadMultiple = multer({
  storage: musicStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50000000
  }
});

module.exports = {
  uploadMusic,
  uploadImage,
  uploadMultiple
};