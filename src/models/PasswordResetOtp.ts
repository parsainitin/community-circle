import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPasswordResetOtp extends Document {
  mobileNumber: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
}

const PasswordResetOtpSchema: Schema<IPasswordResetOtp> = new Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB automatically deletes documents when expiresAt is reached
    },
  },
  {
    timestamps: true,
  }
);

export const PasswordResetOtp: Model<IPasswordResetOtp> =
  mongoose.models.PasswordResetOtp ||
  mongoose.model<IPasswordResetOtp>("PasswordResetOtp", PasswordResetOtpSchema);
