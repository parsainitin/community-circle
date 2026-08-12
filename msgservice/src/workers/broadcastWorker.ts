import { Worker, Job } from 'bullmq';
import { BROADCAST_QUEUE_NAME, IBroadcastJobPayload } from '../queues/broadcastQueue';
import { getRedisConnectionOptions } from '../config/redis';
import { groupService } from '../services/groupService';
import { evolutionService } from '../services/evolutionService';
import { BroadcastLog } from '../models/BroadcastLog';
import dotenv from 'dotenv';

dotenv.config();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getRandomDelayMs(): number {
  const min = parseInt(process.env.BROADCAST_MIN_DELAY_MS || '5000', 10);
  const max = parseInt(process.env.BROADCAST_MAX_DELAY_MS || '7000', 10);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const startBroadcastWorker = (): Worker<IBroadcastJobPayload> => {
  const worker = new Worker<IBroadcastJobPayload>(
    BROADCAST_QUEUE_NAME,
    async (job: Job<IBroadcastJobPayload>) => {
      const { broadcastId, title, content, topics } = job.data;
      console.log(`[Broadcast Worker] Processing broadcast: ${broadcastId} (${title})`);

      // Update log to PROCESSING
      const broadcastLog = await BroadcastLog.findOne({ broadcastId });
      if (broadcastLog) {
        broadcastLog.status = 'PROCESSING';
        broadcastLog.startedAt = new Date();
        await broadcastLog.save();
      }

      // Fetch VERIFIED and active groups matching target topics
      const targetGroups = await groupService.getTargetBroadcastGroups(topics);
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
          
          await evolutionService.sendTextMessage(group.groupJid, formattedMessage);
          
          successCount++;
          if (broadcastLog) {
            broadcastLog.deliveryDetails.push({
              groupJid: group.groupJid,
              groupName: group.groupName,
              status: 'SUCCESS',
              deliveredAt: new Date(),
            });
          }
        } catch (error: any) {
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
    },
    {
      connection: getRedisConnectionOptions(),
      concurrency: 1, // Sequential execution to respect rate limiting per worker
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Broadcast Worker] Job ${job?.id} failed with error:`, err);
  });

  return worker;
};
