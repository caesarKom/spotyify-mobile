import express from "express";

import {
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
} from '../controllers/musicController.js'
import {protect} from '../middleware/auth.js'
import { uploadMusic as musicUpload, uploadImage as imageUpload } from '../middleware/upload.js';

const router = express.Router();

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

export default router;