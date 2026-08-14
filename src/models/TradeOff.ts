import mongoose, { Schema, Document, Model } from "mongoose";
import { getTenantDb, getSubdomainFromRequest } from "@/lib/mongodb";

export interface ITradeOff extends Document {
  owner: mongoose.Types.ObjectId;
  tradeType: "offer" | "request"; // "offer" = Offering to share/lend, "request" = Seeking to borrow/request help
  category: "goods" | "services" | "vehicles" | "crowd_sharing";
  title: string;
  description: string;
  itemCondition?: string; // e.g. "Like New", "Good", "Fair", "N/A"
  pricingModel?: string; // e.g. "Free Borrow", "Security Deposit", "Token Share", "Exchange"
  availableDate?: string; // YYYY-MM-DD
  location?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  status: "active" | "completed" | "cancelled";
  communityId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TradeOffSchema: Schema<ITradeOff> = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    tradeType: {
      type: String,
      enum: ["offer", "request"],
      default: "offer",
      required: [true, "Trade type is required"],
    },
    category: {
      type: String,
      enum: ["goods", "services", "vehicles", "crowd_sharing"],
      default: "goods",
      required: [true, "Category is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    itemCondition: {
      type: String,
      trim: true,
    },
    pricingModel: {
      type: String,
      trim: true,
    },
    availableDate: {
      type: String,
      trim: true,
    },
    location: {
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

export async function getTenantTradeOffModel(
  req?: Request
): Promise<Model<ITradeOff>> {
  const subdomain = getSubdomainFromRequest(req);
  const db = await getTenantDb(subdomain);
  return (
    (db.models.TradeOff as Model<ITradeOff>) ||
    db.model<ITradeOff>("TradeOff", TradeOffSchema)
  );
}

const TradeOffModel: Model<ITradeOff> =
  mongoose.models.TradeOff ||
  mongoose.model<ITradeOff>("TradeOff", TradeOffSchema);

export default TradeOffModel;
