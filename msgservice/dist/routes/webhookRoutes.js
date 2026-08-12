"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhookController_1 = require("../controllers/webhookController");
const router = (0, express_1.Router)();
// GET /api/webhooks/evolution (Browser status check)
router.get('/evolution', webhookController_1.checkWebhookStatus);
// POST /api/webhooks/evolution (Evolution API event receiver)
router.post('/evolution', webhookController_1.handleEvolutionWebhook);
exports.default = router;
