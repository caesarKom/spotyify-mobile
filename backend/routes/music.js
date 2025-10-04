const express = require('express');
const router = express.Router();
const {
  getAllMusic,
  getMusicById,
  uploadMusic,
  uploadCoverImage,
  updateMusic,
  deleteMusic,
  likeMusic,
  unlikeMusic,
  playMusic,
  getMyMusic
} = require('../controllers/musicController');
const { protect } = require('../middleware/auth');
const { uploadMusic: musicUpload, uploadImage: imageUpload } = require('../middleware/upload');

// Public routes
router.get('/', getAllMusic);
router.get('/:id', getMusicById);

// Protected routes
router.post('/upload', protect, musicUpload.single('music'), uploadMusic);
router.post('/:id/cover', protect, imageUpload.single('image'), uploadCoverImage);
router.put('/:id', protect, updateMusic);
router.delete('/:id', protect, deleteMusic);
router.post('/:id/like', protect, likeMusic);
router.delete('/:id/unlike', protect, unlikeMusic);
router.post('/:id/play', protect, playMusic);
router.get('/my/music', protect, getMyMusic);

module.exports = router;