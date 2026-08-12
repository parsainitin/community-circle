import { Router } from 'express';
import { handleEvolutionWebhook, checkWebhookStatus } from '../controllers/webhookController';

const router = Router();

// GET /api/webhooks/evolution (Browser status check)
router.get('/evolution', checkWebhookStatus);

// POST /api/webhooks/evolution (Evolution API event receiver)
router.post('/evolution', handleEvolutionWebhook);

export default router;
