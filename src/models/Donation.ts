import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDonation extends Document {
  donor: mongoose.Types.ObjectId;
  amount: number;
  transactionId: string;
  status: "pending" | "success" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema: Schema<IDonation> = new Schema(
  {
    donor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least 1"],
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

import { getTenantDb, getSubdomainFromRequest } from "@/lib/mongodb";

if (mongoose.models.Donation) {
  delete (mongoose.models as any).Donation;
}

export const Donation: Model<IDonation> =
  mongoose.models.Donation || mongoose.model<IDonation>("Donation", DonationSchema);

export async function getTenantDonationModel(requestOrSubdomain?: any): Promise<Model<IDonation>> {
  const subdomain = typeof requestOrSubdomain === "string"
    ? requestOrSubdomain
    : getSubdomainFromRequest(requestOrSubdomain);

  const tenantDb = await getTenantDb(subdomain);
  return tenantDb.models.Donation || tenantDb.model<IDonation>("Donation", DonationSchema);
}
