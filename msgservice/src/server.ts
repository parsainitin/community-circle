import dotenv from 'dotenv';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { startBroadcastWorker } from './workers/broadcastWorker';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDatabase();

    // 2. Start BullMQ Outbound Broadcast Worker (Upstash Redis)
    const worker = startBroadcastWorker();
    console.log('[BullMQ] Outbound Broadcast Worker started with 5-7s rate limiting.');

    // 3. Create Express App & Start Server
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`[WhastFlow] Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[WhastFlow] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
