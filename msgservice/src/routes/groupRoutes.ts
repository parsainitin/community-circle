import { Router } from 'express';
import {
  listGroups,
  registerGroup,
  syncWhatsAppGroups,
  updateGroupStatus,
  updateGroupTopics,
} from '../controllers/groupController';

const router = Router();

// GET /api/groups
router.get('/', listGroups);

// POST /api/groups/sync (Automatic bulk sync of existing WhatsApp groups)
router.post('/sync', syncWhatsAppGroups);

// POST /api/groups/register
router.post('/register', registerGroup);

// PATCH /api/groups/:groupJid/status
router.patch('/:groupJid/status', updateGroupStatus);

// PUT /api/groups/:groupJid/topics
router.put('/:groupJid/topics', updateGroupTopics);

export default router;
