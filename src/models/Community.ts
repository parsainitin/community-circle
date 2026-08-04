import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommunity extends Document {
  name: string;
  subdomain: string;
  description?: string;
  logo?: string;
  cities?: string[];
  gotras?: string[];
  kulDevis?: string[];
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
    cities: [{ type: String, trim: true }],
    gotras: [{ type: String, trim: true }],
    kulDevis: [{ type: String, trim: true }],
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

if (mongoose.models.Community && !mongoose.models.Community.schema.path("cities")) {
  delete (mongoose.models as any).Community;
}

export const Community: Model<ICommunity> =
  mongoose.models.Community || mongoose.model<ICommunity>("Community", CommunitySchema);
