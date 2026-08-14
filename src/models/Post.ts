import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  type: "text" | "image" | "poll" | "event" | "announcement" | "carpool" | "trade_off";
  replies: mongoose.Types.ObjectId[] | IPost[];
  likes: mongoose.Types.ObjectId[];
  expiresAt?: Date;
  tradeOffDetails?: {
    tradeType: "offer" | "request";
    category: "goods" | "services" | "vehicles" | "crowd_sharing";
    title: string;
    itemCondition?: string;
    pricingModel?: string;
    availableDate?: string;
    location?: string;
    contactPhone?: string;
    whatsappNumber?: string;
  };
  carpoolDetails?: {
    tripType: "offer" | "request";
    requestCategory?: "passenger" | "parcel";
    parcelDetails?: string;
    parcelWeight?: string;
    originCity: string;
    destinationCity: string;
    travelDate: string;
    travelTime?: string;
    availableSeats: number;
    pricePerSeat?: number;
    vehicleDetails?: string;
    pickupLocation?: string;
    dropLocation?: string;
    contactPhone?: string;
    whatsappNumber?: string;
    notes?: string;
  };
    eventDetails?: {
      title: string;
      date: string;
      location: string;
      poster?: string;
      contributionFee?: number;
      upiId?: string;
      contributions?: {
        userId: mongoose.Types.ObjectId;
        amount: number;
        transactionId?: string;
        paidAt: Date;
      }[];
    };
  rsvps?: {
    going: mongoose.Types.ObjectId[];
    maybe: mongoose.Types.ObjectId[];
    cant: mongoose.Types.ObjectId[];
  };
  pollDetails?: {
    options: string[];
  };
  pollVotes?: {
    userId: mongoose.Types.ObjectId;
    optionIndex: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema<IPost> = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ["text", "image", "poll", "event", "announcement", "carpool", "trade_off"],
        message: "{VALUE} is not a valid post type",
      },
      default: "text",
    },
    tradeOffDetails: {
      tradeType: { type: String, enum: ["offer", "request"], default: "offer" },
      category: { type: String, enum: ["goods", "services", "vehicles", "crowd_sharing"], default: "goods" },
      title: { type: String, trim: true },
      itemCondition: { type: String, trim: true },
      pricingModel: { type: String, trim: true },
      availableDate: { type: String, trim: true },
      location: { type: String, trim: true },
      contactPhone: { type: String, trim: true },
      whatsappNumber: { type: String, trim: true },
    },
    carpoolDetails: {
      tripType: { type: String, enum: ["offer", "request"], default: "offer" },
      requestCategory: { type: String, enum: ["passenger", "parcel"], default: "passenger" },
      parcelDetails: { type: String, trim: true },
      parcelWeight: { type: String, trim: true },
      originCity: { type: String, trim: true },
      destinationCity: { type: String, trim: true },
      travelDate: { type: String, trim: true },
      travelTime: { type: String, trim: true },
      availableSeats: { type: Number },
      pricePerSeat: { type: Number },
      vehicleDetails: { type: String, trim: true },
      pickupLocation: { type: String, trim: true },
      dropLocation: { type: String, trim: true },
      contactPhone: { type: String, trim: true },
      whatsappNumber: { type: String, trim: true },
      notes: { type: String, trim: true },
    },
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    eventDetails: {
      title: { type: String, trim: true },
      date: { type: String, trim: true },
      location: { type: String, trim: true },
      poster: { type: String, default: "" },
      contributionFee: { type: Number, default: 0 },
      upiId: { type: String, trim: true, default: "" },
      contributions: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
          amount: { type: Number, required: true },
          transactionId: { type: String, trim: true, default: "" },
          paidAt: { type: Date, default: Date.now },
        },
      ],
    },
    rsvps: {
      going: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
      maybe: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
      cant: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    },
    pollDetails: {
      options: [{ type: String, trim: true }],
    },
    pollVotes: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        optionIndex: { type: Number },
      },
    ],
    // Auto-expiry timestamp — MongoDB TTL index will delete doc when this date is reached.
    // • text / image / poll posts  → createdAt + 48 hours
    // • announcement               → createdAt + 48 hours
    // • event                      → set to eventDetails.date (end-of-day) at creation
    // If null / undefined, the document never auto-expires.
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL — deletes when Date <= now
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

import { getTenantDb, getSubdomainFromRequest } from "@/lib/mongodb";
import { getTenantUserModel } from "@/models/User";

if (mongoose.models.Post) {
  delete (mongoose.models as any).Post;
}

export const Post: Model<IPost> =
  mongoose.model<IPost>("Post", PostSchema);

export async function getTenantPostModel(requestOrSubdomain?: any): Promise<Model<IPost>> {
  const subdomain = typeof requestOrSubdomain === "string"
    ? requestOrSubdomain
    : getSubdomainFromRequest(requestOrSubdomain);

  const tenantDb = await getTenantDb(subdomain);
  if (!tenantDb.models.User) {
    await getTenantUserModel(subdomain);
  }
  return tenantDb.models.Post || tenantDb.model<IPost>("Post", PostSchema);
}
