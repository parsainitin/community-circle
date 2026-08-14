import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICarPool extends Document {
  owner: mongoose.Types.ObjectId;
  tripType: "offer" | "request"; // "offer" = Driver offering seats, "request" = Passenger seeking ride
  requestCategory?: "passenger" | "parcel"; // "passenger" = Passenger traveling, "parcel" = Send parcel/courier
  parcelDetails?: string; // e.g. "Small box / 5kg documents"
  parcelWeight?: string; // e.g. "500 gm", "1 KG", "3 KG", etc.
  originCity: string;
  destinationCity: string;
  travelDate: string; // YYYY-MM-DD
  travelTime?: string; // HH:MM AM/PM
  availableSeats: number;
  pricePerSeat?: number;
  vehicleDetails?: string; // e.g. "White Maruti Ertiga (RJ14 CB 1234)"
  pickupLocation?: string;
  dropLocation?: string;
  notes?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  status: "active" | "completed" | "cancelled";
  communityId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CarPoolSchema: Schema<ICarPool> = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    tripType: {
      type: String,
      enum: ["offer", "request"],
      default: "offer",
      required: [true, "Trip type is required"],
    },
    requestCategory: {
      type: String,
      enum: ["passenger", "parcel"],
      default: "passenger",
    },
    parcelDetails: {
      type: String,
      trim: true,
    },
    parcelWeight: {
      type: String,
      trim: true,
    },
    originCity: {
      type: String,
      required: [true, "Origin city is required"],
      trim: true,
    },
    destinationCity: {
      type: String,
      required: [true, "Destination city is required"],
      trim: true,
    },
    travelDate: {
      type: String,
      required: [true, "Travel date is required"],
      trim: true,
    },
    travelTime: {
      type: String,
      trim: true,
    },
    availableSeats: {
      type: Number,
      required: [true, "Number of seats is required"],
      min: [1, "At least 1 seat is required"],
      default: 1,
    },
    pricePerSeat: {
      type: Number,
      min: [0, "Price per seat cannot be negative"],
      default: 0,
    },
    vehicleDetails: {
      type: String,
      trim: true,
    },
    pickupLocation: {
      type: String,
      trim: true,
    },
    dropLocation: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
    },
  },
  { timestamps: true }
);

import { getTenantDb, getSubdomainFromRequest } from "@/lib/mongodb";
import { getTenantUserModel } from "@/models/User";

if (mongoose.models.CarPool) {
  delete (mongoose.models as any).CarPool;
}

export const CarPool: Model<ICarPool> =
  mongoose.models.CarPool || mongoose.model<ICarPool>("CarPool", CarPoolSchema);

export async function getTenantCarPoolModel(requestOrSubdomain?: any): Promise<Model<ICarPool>> {
  const subdomain =
    typeof requestOrSubdomain === "string"
      ? requestOrSubdomain
      : getSubdomainFromRequest(requestOrSubdomain);

  const tenantDb = await getTenantDb(subdomain);
  if (!tenantDb.models.User) {
    await getTenantUserModel(subdomain);
  }
  return tenantDb.models.CarPool || tenantDb.model<ICarPool>("CarPool", CarPoolSchema);
}
