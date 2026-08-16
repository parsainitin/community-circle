import { Router } from 'express';
import { getInstanceStatus, logoutInstance, getActiveSessions } from '../controllers/instanceController';

const router = Router();

// GET /api/instance/status?phoneNumber=9644019992
// Also accepts: ?instanceName=custom_name, header x-instance-name
router.get('/status', getInstanceStatus);

// GET /api/instance/sessions — list all active multi-user sessions
router.get('/sessions', getActiveSessions);

// POST or DELETE /api/instance/logout
// Body: { phoneNumber?, instanceName?, platform? }
router.post('/logout', logoutInstance);
router.delete('/logout', logoutInstance);

export default router;
