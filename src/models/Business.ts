import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBusiness extends Document {
  owner: mongoose.Types.ObjectId;
  title: string;
  description: string;
  catalogImages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema: Schema<IBusiness> = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    title: {
      type: String,
      required: [true, "Business title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Business description is required"],
      trim: true,
    },
    catalogImages: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Business: Model<IBusiness> =
  mongoose.models.Business ||
  mongoose.model<IBusiness>("Business", BusinessSchema);
