"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const instanceController_1 = require("../controllers/instanceController");
const router = (0, express_1.Router)();
// GET /api/instance/status
router.get('/status', instanceController_1.getInstanceStatus);
exports.default = router;
