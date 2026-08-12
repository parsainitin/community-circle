import { Router } from 'express';
import { getInstanceStatus } from '../controllers/instanceController';

const router = Router();

// GET /api/instance/status
router.get('/status', getInstanceStatus);

export default router;
