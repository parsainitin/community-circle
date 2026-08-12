import { Router } from 'express';
import { sendDirectMessage } from '../controllers/directMessageController';

const router = Router();

// POST /api/message/direct
router.post('/direct', sendDirectMessage);

export default router;
