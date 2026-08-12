"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisConnectionOptions = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getRedisConnectionOptions = () => {
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;
    const isUpstash = host.includes('upstash.io') || process.env.REDIS_TLS === 'true';
    return {
        host,
        port,
        password,
        maxRetriesPerRequest: null,
        ...(isUpstash
            ? {
                tls: {
                    servername: host,
                },
            }
            : {}),
    };
};
exports.getRedisConnectionOptions = getRedisConnectionOptions;
