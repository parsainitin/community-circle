import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBookedSlot {
  date: string; // YYYY-MM-DD
  bookedBy: string;
  contactPhone?: string;
  notes?: string;
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
    bookedDates: [
      {
        date: { type: String, required: true },
        bookedBy: { type: String, required: true },
        contactPhone: { type: String },
        notes: { type: String },
      },
    ],
    communityId: { type: Schema.Types.ObjectId, ref: "Community" },
  },
  { timestamps: true }
);

if (mongoose.models.PropertyBooking) {
  delete (mongoose.models as any).PropertyBooking;
}

export const PropertyBooking: Model<IPropertyBooking> =
  mongoose.model<IPropertyBooking>("PropertyBooking", PropertyBookingSchema);
