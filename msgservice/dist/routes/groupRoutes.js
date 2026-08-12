"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const groupController_1 = require("../controllers/groupController");
const router = (0, express_1.Router)();
// GET /api/groups
router.get('/', groupController_1.listGroups);
// POST /api/groups/sync (Automatic bulk sync of existing WhatsApp groups)
router.post('/sync', groupController_1.syncWhatsAppGroups);
// POST /api/groups/register
router.post('/register', groupController_1.registerGroup);
// PATCH /api/groups/:groupJid/status
router.patch('/:groupJid/status', groupController_1.updateGroupStatus);
// PUT /api/groups/:groupJid/topics
router.put('/:groupJid/topics', groupController_1.updateGroupTopics);
exports.default = router;
