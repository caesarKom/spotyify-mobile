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

// Wszystkie routes wymagają autoryzacji
router.use(protect);

router.get('/', getMyMediaToken);
router.post('/', createMediaToken);
router.post('/regenerate', regenerateMediaToken);
router.put('/', updateMediaToken);
router.delete('/', deactivateMediaToken);

export default router;