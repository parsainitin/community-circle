"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBroadcastWorker = void 0;
const bullmq_1 = require("bullmq");
const broadcastQueue_1 = require("../queues/broadcastQueue");
const redis_1 = require("../config/redis");
const groupService_1 = require("../services/groupService");
const evolutionService_1 = require("../services/evolutionService");
const BroadcastLog_1 = require("../models/BroadcastLog");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function getRandomDelayMs() {
    const min = parseInt(process.env.BROADCAST_MIN_DELAY_MS || '5000', 10);
    const max = parseInt(process.env.BROADCAST_MAX_DELAY_MS || '7000', 10);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const startBroadcastWorker = () => {
    const worker = new bullmq_1.Worker(broadcastQueue_1.BROADCAST_QUEUE_NAME, async (job) => {
        const { broadcastId, title, content, topics } = job.data;
        console.log(`[Broadcast Worker] Processing broadcast: ${broadcastId} (${title})`);
        // Update log to PROCESSING
        const broadcastLog = await BroadcastLog_1.BroadcastLog.findOne({ broadcastId });
        if (broadcastLog) {
            broadcastLog.status = 'PROCESSING';
            broadcastLog.startedAt = new Date();
            await broadcastLog.save();
        }
        // Fetch VERIFIED and active groups matching target topics
        const targetGroups = await groupService_1.groupService.getTargetBroadcastGroups(topics);
        console.log(`[Broadcast Worker] Found ${targetGroups.length} target VERIFIED groups for topics: ${topics.join(', ')}`);
        if (broadcastLog) {
            broadcastLog.totalTargetGroups = targetGroups.length;
            await broadcastLog.save();
        }
        let successCount = 0;
        let failCount = 0;
        const formattedMessage = `📢 *${title}*\n\n${content}`;
        for (let i = 0; i < targetGroups.length; i++) {
            const group = targetGroups[i];
            try {
                console.log(`[Broadcast Worker] Delivering message to ${group.groupName} (${group.groupJid}) [${i + 1}/${targetGroups.length}]`);
                await evolutionService_1.evolutionService.sendTextMessage(group.groupJid, formattedMessage);
                successCount++;
                if (broadcastLog) {
                    broadcastLog.deliveryDetails.push({
                        groupJid: group.groupJid,
                        groupName: group.groupName,
                        status: 'SUCCESS',
                        deliveredAt: new Date(),
                    });
                }
            }
            catch (error) {
                failCount++;
                console.error(`[Broadcast Worker] Failed to send to ${group.groupName} (${group.groupJid}):`, error.message);
                if (broadcastLog) {
                    broadcastLog.deliveryDetails.push({
                        groupJid: group.groupJid,
                        groupName: group.groupName,
                        status: 'FAILED',
                        error: error.message,
                    });
                }
            }
            // Apply Rate Limiting delay (5 - 7 seconds) between messages if there are remaining groups
            if (i < targetGroups.length - 1) {
                const delayMs = getRandomDelayMs();
                console.log(`[Broadcast Worker] Rate limiting delay: ${delayMs}ms before next group...`);
                await sleep(delayMs);
            }
        }
        // Finalize BroadcastLog
        if (broadcastLog) {
            broadcastLog.successfulDeliveries = successCount;
            broadcastLog.failedDeliveries = failCount;
            broadcastLog.status = 'COMPLETED';
            broadcastLog.completedAt = new Date();
            await broadcastLog.save();
        }
        console.log(`[Broadcast Worker] Completed broadcast ${broadcastId}: ${successCount} successful, ${failCount} failed.`);
    }, {
        connection: (0, redis_1.getRedisConnectionOptions)(),
        concurrency: 1, // Sequential execution to respect rate limiting per worker
    });
    worker.on('failed', (job, err) => {
        console.error(`[Broadcast Worker] Job ${job?.id} failed with error:`, err);
    });
    return worker;
};
exports.startBroadcastWorker = startBroadcastWorker;
