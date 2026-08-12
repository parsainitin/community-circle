"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEvolutionWebhook = exports.checkWebhookStatus = void 0;
const groupService_1 = require("../services/groupService");
const evolutionService_1 = require("../services/evolutionService");
const botConfig_1 = require("../config/botConfig");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// In-memory rate limiting cooldown map for group auto-replies (10 seconds per group)
const groupReplyCooldowns = new Map();
const INBOUND_REPLY_COOLDOWN_MS = 10000;
function isGroupRateLimited(groupJid) {
    const lastReplyTimestamp = groupReplyCooldowns.get(groupJid);
    if (!lastReplyTimestamp)
        return false;
    return Date.now() - lastReplyTimestamp < INBOUND_REPLY_COOLDOWN_MS;
}
function updateGroupReplyTimestamp(groupJid) {
    groupReplyCooldowns.set(groupJid, Date.now());
}
/**
 * GET Webhook status check (for browser testing)
 */
const checkWebhookStatus = (req, res) => {
    const currentTag = (0, botConfig_1.getBotTriggerTag)();
    res.status(200).json({
        status: 'OK',
        message: `Evolution API webhook endpoint is active. Required group trigger tag: "${currentTag}"`,
        endpoint: '/api/webhooks/evolution',
        currentTriggerTag: currentTag,
        rateLimitCooldownMs: INBOUND_REPLY_COOLDOWN_MS,
        supportedEvents: ['messages.upsert', 'groups.upsert', 'MESSAGES_UPSERT', 'GROUPS_UPSERT'],
    });
};
exports.checkWebhookStatus = checkWebhookStatus;
/**
 * Handle Webhooks from Evolution API (Strict Anti-Spam Hardening Enabled)
 */
const handleEvolutionWebhook = async (req, res) => {
    try {
        const { event, data } = req.body;
        console.log(`[Webhook] Received Evolution API event: ${event || 'UNKNOWN'}`);
        if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
            const message = data?.message || data;
            const key = message?.key || data?.key;
            const remoteJid = key?.remoteJid || data?.remoteJid;
            const fromMe = key?.fromMe;
            const pushName = message?.pushName || data?.pushName || 'User';
            // 1. HARDENING RULE: Strict fromMe Guard (Never reply to messages sent by the bot itself)
            if (fromMe) {
                console.log(`[Webhook Guard] Ignored message sent by bot itself (fromMe = true)`);
                res.status(200).json({ status: 'IGNORED', message: 'Message sent by bot itself' });
                return;
            }
            // Comprehensive text extraction from all possible WhatsApp message payload types
            const text = (message?.conversation ||
                message?.extendedTextMessage?.text ||
                data?.message?.conversation ||
                data?.message?.extendedTextMessage?.text ||
                message?.imageMessage?.caption ||
                message?.videoMessage?.caption ||
                '').trim();
            // Check if message comes from a WhatsApp Group (@g.us)
            if (remoteJid && remoteJid.endsWith('@g.us')) {
                const groupJid = remoteJid;
                const groupName = data?.groupMetadata?.subject || pushName || 'WhatsApp Group';
                // Fetch user-configured bot trigger tag (e.g. "@jbs")
                const botTriggerTag = (0, botConfig_1.getBotTriggerTag)().toLowerCase();
                const lowerText = text.toLowerCase();
                const isTagged = lowerText.includes(botTriggerTag);
                if (!isTagged) {
                    console.log(`[Webhook] Ignored group message in ${groupJid} (Missing required trigger tag "${botTriggerTag}"): "${text}"`);
                    res.status(200).json({
                        status: 'IGNORED',
                        message: `Group message not tagged with required bot tag "${botTriggerTag}"`,
                    });
                    return;
                }
                // 2. HARDENING RULE: Rate Limiting to prevent continuous auto-reply spamming (1 reply per 10s per group)
                if (isGroupRateLimited(groupJid)) {
                    console.warn(`[Webhook Anti-Spam] Rate limit active for ${groupJid}. Skipping auto-reply to prevent spam detection.`);
                    res.status(200).json({
                        status: 'RATE_LIMITED',
                        message: 'Auto-reply rate limit active for this group (max 1 reply per 10 seconds).',
                    });
                    return;
                }
                console.log(`[Webhook] ✅ Bot Tagged ("${botTriggerTag}") in group ${groupJid} by ${pushName}: "${text}"`);
                // Update cooldown timestamp
                updateGroupReplyTimestamp(groupJid);
                // Auto-register group in PENDING status if not existing
                const group = await groupService_1.groupService.findOrCreateGroup(groupJid, groupName);
                let ackMessage = '';
                // Check for specific commands
                if (text.includes('!verify')) {
                    const senderPhone = key?.participant || data?.key?.participant || pushName;
                    await groupService_1.groupService.updateStatus(groupJid, 'VERIFIED', senderPhone);
                    ackMessage = `✅ *${(0, botConfig_1.getBotTriggerTag)()} Acknowledgement*\n\nGroup *${groupName}* has been successfully *VERIFIED* for broadcasts!`;
                }
                else if (text.includes('!reject')) {
                    const senderPhone = key?.participant || data?.key?.participant || pushName;
                    await groupService_1.groupService.updateStatus(groupJid, 'REJECTED', senderPhone);
                    ackMessage = `❌ *${(0, botConfig_1.getBotTriggerTag)()} Acknowledgement*\n\nGroup *${groupName}* status set to *REJECTED*.`;
                }
                else {
                    // Standard Tag Acknowledgement Reply
                    const cleanUserQuery = text.replace(new RegExp(botTriggerTag, 'gi'), '').trim() || 'hello';
                    ackMessage = `👋 *Hello ${pushName}!*\n\nI am *${(0, botConfig_1.getBotTriggerTag)()}*, your WhastFlow Bot.\n\n📌 *Received Query*: "${cleanUserQuery}"\n📋 *Group Status*: *${group.status}*\n\n_Your message has been acknowledged and registered._`;
                }
                // 3. HARDENING RULE: Simulate Realistic Human Typing ("composing" indicator for 1.5 seconds)
                try {
                    console.log(`[Webhook Anti-Spam] Simulating human typing indicator ("composing") for 1.5s in ${groupJid}...`);
                    await evolutionService_1.evolutionService.sendPresence(groupJid, 'composing', 1500);
                    await sleep(1500); // 1.5-second realistic human delay before dispatch
                    console.log(`[Webhook] Dispatching automated acknowledgement reply to ${groupJid}...`);
                    await evolutionService_1.evolutionService.sendTextMessage(groupJid, ackMessage);
                    console.log(`[Webhook] ✅ Acknowledgement reply sent successfully to ${groupJid}`);
                }
                catch (sendErr) {
                    console.error(`[Webhook] Failed to send group acknowledgement reply:`, sendErr.message);
                }
            }
        }
        else if (event === 'groups.upsert' || event === 'GROUPS_UPSERT') {
            const groupJid = data?.id;
            const groupSubject = data?.subject;
            if (groupJid) {
                await groupService_1.groupService.findOrCreateGroup(groupJid, groupSubject || 'WhatsApp Group');
            }
        }
        res.status(200).json({ status: 'SUCCESS', message: 'Webhook processed' });
    }
    catch (error) {
        console.error('[Webhook] Error processing webhook:', error.message);
        res.status(500).json({ status: 'ERROR', error: error.message });
    }
};
exports.handleEvolutionWebhook = handleEvolutionWebhook;
