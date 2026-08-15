import { Router } from 'express';
import { getInstanceStatus, logoutInstance } from '../controllers/instanceController';

const router = Router();

// GET /api/instance/status
router.get('/status', getInstanceStatus);

// POST or DELETE /api/instance/logout
router.post('/logout', logoutInstance);
router.delete('/logout', logoutInstance);

export default router;
