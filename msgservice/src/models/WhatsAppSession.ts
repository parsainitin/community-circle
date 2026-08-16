import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWhatsAppSession extends Document {
  instanceName: string;         // e.g. "cc_9644019992", "custom_platform_session"
  phoneNumber: string;          // originating phone (digits only, with country code)
  platform: string;             // e.g. "community-circle", "custom-platform"
  status: 'connecting' | 'open' | 'close' | 'disconnected';
  lastActiveAt: Date;
  autoDisconnectMinutes: number; // default 10
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppSessionSchema: Schema<IWhatsAppSession> = new Schema(
  {
    instanceName: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    platform: {
      type: String,
      default: 'community-circle',
      trim: true,
    },
    status: {
      type: String,
      enum: ['connecting', 'open', 'close', 'disconnected'],
      default: 'connecting',
      index: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    autoDisconnectMinutes: {
      type: Number,
      default: 10,
      min: 1,
      max: 1440, // max 24 hours
    },
  },
  { timestamps: true }
);

// Compound index for reaper queries: find open sessions by lastActiveAt
WhatsAppSessionSchema.index({ status: 1, lastActiveAt: 1 });

export const WhatsAppSession: Model<IWhatsAppSession> =
  mongoose.models?.WhatsAppSession ||
  mongoose.model<IWhatsAppSession>('WhatsAppSession', WhatsAppSessionSchema);
