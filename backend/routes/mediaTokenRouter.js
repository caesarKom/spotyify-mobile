// routes/mediaTokenRouter.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMyMediaToken,
  createMediaToken,
  regenerateMediaToken,
  updateMediaToken,
  deactivateMediaToken
} from '../controllers/mediaTokenController.js';

const router = express.Router();

// all routes need autorization
router.use(protect);

router.get('/:id', getMyMediaToken);
router.post('/:id', createMediaToken);
router.post('/regenerate/:id', regenerateMediaToken);
router.put('/:id', updateMediaToken);
router.delete('/:id', deactivateMediaToken);

export default router;