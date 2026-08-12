import { Router } from 'express';
import { getBotConfig, updateBotConfig } from '../controllers/configController';

const router = Router();

// GET /api/config
router.get('/', getBotConfig);

// PUT /api/config
router.put('/', updateBotConfig);

export default router;
