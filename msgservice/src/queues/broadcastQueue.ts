import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from '../config/redis';

export interface IBroadcastJobPayload {
  broadcastId: string;
  title: string;
  content: string;
  topics: string[];
}

export const BROADCAST_QUEUE_NAME = 'broadcast-queue';

export const broadcastQueue = new Queue<IBroadcastJobPayload>(BROADCAST_QUEUE_NAME, {
  connection: getRedisConnectionOptions(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
