"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDirectMessage = void 0;
const evolutionService_1 = require("../services/evolutionService");
const BroadcastLog_1 = require("../models/BroadcastLog");
/**
 * Helper to auto-format phone numbers (e.g., auto-prepend country code 91 for 10-digit Indian numbers)
 */
function formatPhoneNumber(rawNum) {
    let cleaned = rawNum.trim().replace(/[^0-9]/g, '');
    // If user entered a 10-digit number without country code (e.g. 7999782728), default to India 91
    if (cleaned.length === 10) {
        cleaned = `91${cleaned}`;
    }
    return cleaned;
}
/**
 * Send direct message to a single or multiple individual phone numbers
 */
const sendDirectMessage = async (req, res) => {
    try {
        const { phoneNumbers, message, title } = req.body;
        if (!phoneNumbers || !message) {
            res.status(400).json({
                success: false,
                error: 'phoneNumbers (string or array) and message are required',
            });
            return;
        }
        // Standardize phone numbers into array
        let rawNumbersList = [];
        if (Array.isArray(phoneNumbers)) {
            rawNumbersList = phoneNumbers.map((n) => n.trim()).filter(Boolean);
        }
        else if (typeof phoneNumbers === 'string') {
            rawNumbersList = phoneNumbers
                .split(/[\n,]+/)
                .map((n) => n.trim())
                .filter(Boolean);
        }
        const numbersList = rawNumbersList.map(formatPhoneNumber).filter((n) => n.length >= 10);
        if (numbersList.length === 0) {
            res.status(400).json({ success: false, error: 'No valid phone numbers provided. Please include country code (e.g. 917999782728).' });
            return;
        }
        const broadcastTitle = title || 'Direct Message';
        const broadcastId = `dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        // Create a BroadcastLog record for tracking direct messages
        const broadcastLog = await BroadcastLog_1.BroadcastLog.create({
            broadcastId,
            title: broadcastTitle,
            content: message,
            topics: ['direct_message'],
            totalTargetGroups: numbersList.length,
            status: 'PROCESSING',
            startedAt: new Date(),
        });
        let successCount = 0;
        let failCount = 0;
        for (const num of numbersList) {
            try {
                console.log(`[DirectMessage Controller] Sending direct message to ${num}...`);
                await evolutionService_1.evolutionService.sendTextMessage(num, message);
                successCount++;
                broadcastLog.deliveryDetails.push({
                    groupJid: num,
                    groupName: `Individual (+${num})`,
                    status: 'SUCCESS',
                    deliveredAt: new Date(),
                });
            }
            catch (err) {
                failCount++;
                console.error(`[DirectMessage Controller] Failed to send to ${num}:`, err.message);
                broadcastLog.deliveryDetails.push({
                    groupJid: num,
                    groupName: `Individual (+${num})`,
                    status: 'FAILED',
                    error: err.message,
                });
            }
        }
        broadcastLog.successfulDeliveries = successCount;
        broadcastLog.failedDeliveries = failCount;
        broadcastLog.status = 'COMPLETED';
        broadcastLog.completedAt = new Date();
        await broadcastLog.save();
        res.status(200).json({
            success: true,
            message: `Direct message process completed: ${successCount} sent successfully, ${failCount} failed.`,
            data: {
                broadcastId,
                totalRecipients: numbersList.length,
                successfulDeliveries: successCount,
                failedDeliveries: failCount,
            },
        });
    }
    catch (error) {
        console.error('[DirectMessage Controller] Error sending direct message:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.sendDirectMessage = sendDirectMessage;
