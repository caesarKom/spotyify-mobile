import express from "express";

import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getLikedMusic,
  getRecentlyPlayed,
  changePassword,
  deleteAccount
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = express.Router();

// All routes are protected
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, uploadImage.single('image'), uploadAvatar);
router.delete('/avatar', protect, deleteAvatar);
router.get('/liked-music', protect, getLikedMusic);
router.get('/recently-played', protect, getRecentlyPlayed);
router.put('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

export default router;