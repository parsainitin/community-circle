import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  groupJid: string;            // e.g., "1203630XXXXX@g.us"
  groupName: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'DISABLED';
  verifiedByUser?: string;     // Phone number of verifying admin
  verifiedAt?: Date;
  isActive: boolean;
  subscribedTopics: string[];  // e.g., ["announcements", "engineering_updates"]
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema: Schema = new Schema(
  {
    groupJid: { type: String, required: true, unique: true, index: true },
    groupName: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'DISABLED'],
      default: 'PENDING',
      index: true,
    },
    verifiedByUser: { type: String },
    verifiedAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    subscribedTopics: { type: [String], default: ['general'], index: true },
  },
  { timestamps: true }
);

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
