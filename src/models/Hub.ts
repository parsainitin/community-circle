import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHub extends Document {
  owner: mongoose.Types.ObjectId;
  hubType:
    | "mahurth_panchang"
    | "bookings"
    | "organization"
    | "shopping"
    | "training"
    | "trade_off"
    | "banking"
    | "car_pooling"
    | "classified"
    | "showcase_business"
    | "tutor_service"
    | "online_sale";
  title: string;
  category?: string;
  description: string;
  price?: number;
  priceUnit?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  location?: string;
  images: string[];
  communityId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HubSchema: Schema<IHub> = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    hubType: {
      type: String,
      enum: [
        "mahurth_panchang",
        "bookings",
        "organization",
        "shopping",
        "training",
        "trade_off",
        "banking",
        "car_pooling",
        "classified",
        "showcase_business",
        "tutor_service",
        "online_sale",
      ],
      required: [true, "Hub type is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    category: { type: String, trim: true },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    price: { type: Number },
    priceUnit: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    whatsappNumber: { type: String, trim: true },
    location: { type: String, trim: true },
    images: [{ type: String, trim: true }],
    communityId: { type: Schema.Types.ObjectId, ref: "Community" },
  },
  { timestamps: true }
);

import { getTenantDb, getSubdomainFromRequest } from "@/lib/mongodb";
import { getTenantUserModel } from "@/models/User";

if (mongoose.models.Hub) {
  delete (mongoose.models as any).Hub;
}

export const Hub: Model<IHub> = mongoose.model<IHub>("Hub", HubSchema);

export async function getTenantHubModel(requestOrSubdomain?: any): Promise<Model<IHub>> {
  const subdomain = typeof requestOrSubdomain === "string"
    ? requestOrSubdomain
    : getSubdomainFromRequest(requestOrSubdomain);

  const tenantDb = await getTenantDb(subdomain);
  if (!tenantDb.models.User) {
    await getTenantUserModel(subdomain);
  }
  return tenantDb.models.Hub || tenantDb.model<IHub>("Hub", HubSchema);
}
