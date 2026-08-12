"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBotConfig = exports.getBotConfig = void 0;
const botConfig_1 = require("../config/botConfig");
const getBotConfig = (req, res) => {
    res.status(200).json({
        success: true,
        triggerTag: (0, botConfig_1.getBotTriggerTag)(),
    });
};
exports.getBotConfig = getBotConfig;
const updateBotConfig = (req, res) => {
    try {
        const { triggerTag } = req.body;
        if (!triggerTag || typeof triggerTag !== 'string') {
            res.status(400).json({ success: false, error: 'triggerTag string is required (e.g. @jbs)' });
            return;
        }
        const updatedTag = (0, botConfig_1.setBotTriggerTag)(triggerTag);
        res.status(200).json({
            success: true,
            message: `Bot trigger tag updated to ${updatedTag}`,
            triggerTag: updatedTag,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.updateBotConfig = updateBotConfig;
