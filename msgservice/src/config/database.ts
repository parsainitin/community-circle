import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whastflow';
  try {
    await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Connected successfully to ${mongoUri}`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('[MongoDB] Disconnected.');
};
