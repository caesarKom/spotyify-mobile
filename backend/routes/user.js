const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getLikedMusic,
  getRecentlyPlayed,
  changePassword,
  deleteAccount
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

// All routes are protected
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, uploadImage.single('image'), uploadAvatar);
router.delete('/avatar', protect, deleteAvatar);
router.get('/liked-music', protect, getLikedMusic);
router.get('/recently-played', protect, getRecentlyPlayed);
router.put('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

module.exports = router;