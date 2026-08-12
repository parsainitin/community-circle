"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const broadcastController_1 = require("../controllers/broadcastController");
const router = (0, express_1.Router)();
// POST /api/broadcast
router.post('/', broadcastController_1.triggerBroadcast);
// GET /api/broadcast/:broadcastId
router.get('/:broadcastId', broadcastController_1.getBroadcastStatus);
exports.default = router;
