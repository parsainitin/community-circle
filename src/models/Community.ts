import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommunity extends Document {
  name: string;
  subdomain: string;
  description?: string;
  logo?: string;
  admins: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema: Schema<ICommunity> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    subdomain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "Subdomain may only contain lowercase letters, numbers, and hyphens"],
    },
    description: { type: String, trim: true },
    logo: { type: String, trim: true },
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Community: Model<ICommunity> =
  mongoose.models.Community || mongoose.model<ICommunity>("Community", CommunitySchema);
