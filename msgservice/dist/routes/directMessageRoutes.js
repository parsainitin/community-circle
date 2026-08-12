"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const directMessageController_1 = require("../controllers/directMessageController");
const router = (0, express_1.Router)();
// POST /api/message/direct
router.post('/direct', directMessageController_1.sendDirectMessage);
exports.default = router;
