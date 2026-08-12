import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJob extends Document {
  postedBy: mongoose.Types.ObjectId;
  title: string;
  description: string;
  applicants: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema<IJob> = new Schema(
  {
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Posted by user is required"],
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
    },
    applicants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

import { getTenantDb, getSubdomainFromRequest } from "@/lib/mongodb";
import { getTenantUserModel } from "@/models/User";

export const Job: Model<IJob> =
  mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);

export async function getTenantJobModel(requestOrSubdomain?: any): Promise<Model<IJob>> {
  const subdomain = typeof requestOrSubdomain === "string"
    ? requestOrSubdomain
    : getSubdomainFromRequest(requestOrSubdomain);

  const tenantDb = await getTenantDb(subdomain);
  if (!tenantDb.models.User) {
    await getTenantUserModel(subdomain);
  }
  return tenantDb.models.Job || tenantDb.model<IJob>("Job", JobSchema);
}
