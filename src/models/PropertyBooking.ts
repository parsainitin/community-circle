import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBookedSlot {
  date: string; // YYYY-MM-DD
  bookedBy: string;
  contactPhone?: string;
  notes?: string;
  packageName?: string;
}

export interface IPropertyPackage {
  _id?: string;
  name: string;
  pricePerDay: number;
  description?: string;
}

export interface IPropertyBooking extends Document {
  owner?: mongoose.Types.ObjectId;
  propertyName: string;
  propertyType: string;
  location?: string;
  capacity?: number;
  pricePerDay?: number;
  contactPhone?: string;
  description?: string;
  packages?: IPropertyPackage[];
  bookedDates: IBookedSlot[];
  communityId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PropertyBookingSchema: Schema<IPropertyBooking> = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    propertyName: { type: String, required: true, trim: true },
    propertyType: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    capacity: { type: Number },
    pricePerDay: { type: Number },
    contactPhone: { type: String, trim: true },
    description: { type: String, trim: true },
    packages: [
      {
        name: { type: String, required: true, trim: true },
        pricePerDay: { type: Number, required: true },
        description: { type: String, trim: true },
      },
    ],
    bookedDates: [
      {
        date: { type: String, required: true },
        bookedBy: { type: String, required: true },
        contactPhone: { type: String },
        notes: { type: String },
        packageName: { type: String },
      },
    ],
    communityId: { type: Schema.Types.ObjectId, ref: "Community" },
  },
  { timestamps: true }
);

import { getTenantDb, getSubdomainFromRequest } from "@/lib/mongodb";
import { getTenantUserModel } from "@/models/User";

if (mongoose.models.PropertyBooking) {
  delete (mongoose.models as any).PropertyBooking;
}

export const PropertyBooking: Model<IPropertyBooking> =
  mongoose.model<IPropertyBooking>("PropertyBooking", PropertyBookingSchema);

export async function getTenantPropertyBookingModel(requestOrSubdomain?: any): Promise<Model<IPropertyBooking>> {
  const subdomain = typeof requestOrSubdomain === "string"
    ? requestOrSubdomain
    : getSubdomainFromRequest(requestOrSubdomain);

  const tenantDb = await getTenantDb(subdomain);
  if (!tenantDb.models.User) {
    await getTenantUserModel(subdomain);
  }
  return tenantDb.models.PropertyBooking || tenantDb.model<IPropertyBooking>("PropertyBooking", PropertyBookingSchema);
}
