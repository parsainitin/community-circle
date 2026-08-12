import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupDeliveryLog {
  groupJid: string;
  groupName: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  deliveredAt?: Date;
  error?: string;
}

export interface IBroadcastLog extends Document {
  broadcastId: string;
  title: string;
  content: string;
  topics: string[];
  totalTargetGroups: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  deliveryDetails: IGroupDeliveryLog[];
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GroupDeliveryLogSchema: Schema = new Schema(
  {
    groupJid: { type: String, required: true },
    groupName: { type: String, required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'SKIPPED'], required: true },
    deliveredAt: { type: Date },
    error: { type: String },
  },
  { _id: false }
);

const BroadcastLogSchema: Schema = new Schema(
  {
    broadcastId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    topics: { type: [String], default: ['general'] },
    totalTargetGroups: { type: Number, default: 0 },
    successfulDeliveries: { type: Number, default: 0 },
    failedDeliveries: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    deliveryDetails: [GroupDeliveryLogSchema],
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const BroadcastLog = mongoose.model<IBroadcastLog>('BroadcastLog', BroadcastLogSchema);
