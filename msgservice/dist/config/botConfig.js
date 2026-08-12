"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBotTriggerTag = exports.getBotTriggerTag = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let currentTriggerTag = (process.env.BOT_TRIGGER_TAG || '@jbs').trim();
if (!currentTriggerTag.startsWith('@')) {
    currentTriggerTag = `@${currentTriggerTag}`;
}
const getBotTriggerTag = () => currentTriggerTag;
exports.getBotTriggerTag = getBotTriggerTag;
const setBotTriggerTag = (newTag) => {
    let tag = newTag.trim();
    if (!tag)
        return currentTriggerTag;
    if (!tag.startsWith('@')) {
        tag = `@${tag}`;
    }
    currentTriggerTag = tag;
    console.log(`[BotConfig] Updated Bot Trigger Tag to: ${currentTriggerTag}`);
    return currentTriggerTag;
};
exports.setBotTriggerTag = setBotTriggerTag;
