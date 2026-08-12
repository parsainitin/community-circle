"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = require("./app");
const database_1 = require("./config/database");
const broadcastWorker_1 = require("./workers/broadcastWorker");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const startServer = async () => {
    try {
        // 1. Connect to MongoDB Atlas
        await (0, database_1.connectDatabase)();
        // 2. Start BullMQ Outbound Broadcast Worker (Upstash Redis)
        const worker = (0, broadcastWorker_1.startBroadcastWorker)();
        console.log('[BullMQ] Outbound Broadcast Worker started with 5-7s rate limiting.');
        // 3. Create Express App & Start Server
        const app = (0, app_1.createApp)();
        app.listen(PORT, () => {
            console.log(`[WhastFlow] Server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('[WhastFlow] Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
