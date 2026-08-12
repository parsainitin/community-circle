"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastQueue = exports.BROADCAST_QUEUE_NAME = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
exports.BROADCAST_QUEUE_NAME = 'broadcast-queue';
exports.broadcastQueue = new bullmq_1.Queue(exports.BROADCAST_QUEUE_NAME, {
    connection: (0, redis_1.getRedisConnectionOptions)(),
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
