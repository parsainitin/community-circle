import { Router } from 'express';
import { triggerBroadcast, getBroadcastStatus } from '../controllers/broadcastController';

const router = Router();

// POST /api/broadcast
router.post('/', triggerBroadcast);

// GET /api/broadcast/:broadcastId
router.get('/:broadcastId', getBroadcastStatus);

export default router;
