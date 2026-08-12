"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const configController_1 = require("../controllers/configController");
const router = (0, express_1.Router)();
// GET /api/config
router.get('/', configController_1.getBotConfig);
// PUT /api/config
router.put('/', configController_1.updateBotConfig);
exports.default = router;
