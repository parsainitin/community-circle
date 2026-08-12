import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommunityRequest extends Document {
  name: string;
  subdomain: string;
  description?: string;
  logo?: string;
  cities?: string[];
  gotras?: string[];
  kulDevis?: string[];
  upiId?: string;
  modules?: {
    directory?: boolean;
    marketplace?: boolean;
    panchang?: boolean;
    booking?: boolean;
    events?: boolean;
    donations?: boolean;
  };
  adminName: string;
  adminMobile: string;
  adminPassword?: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityRequestSchema: Schema<ICommunityRequest> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    subdomain: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true },
    logo: { type: String, trim: true },
    cities: [{ type: String, trim: true }],
    gotras: [{ type: String, trim: true }],
    kulDevis: [{ type: String, trim: true }],
    upiId: { type: String, trim: true },
    modules: {
      directory: { type: Boolean, default: true },
      marketplace: { type: Boolean, default: true },
      panchang: { type: Boolean, default: true },
      booking: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      donations: { type: Boolean, default: true },
    },
    adminName: { type: String, required: true, trim: true },
    adminMobile: { type: String, required: true, trim: true },
    adminPassword: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const CommunityRequest: Model<ICommunityRequest> =
  mongoose.models.CommunityRequest ||
  mongoose.model<ICommunityRequest>("CommunityRequest", CommunityRequestSchema);
