import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  phone: string;
  gotra?: string;
  kulDevi?: string;
  address?: string;
  city: string;
  village?: string;
  mobileNumber?: string;
  age?: number;
  sex?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  password?: string;
  parent?: mongoose.Types.ObjectId | IUser;
  parentRelationship?: string;
  familyMembers: mongoose.Types.ObjectId[] | IUser[];
  avatar?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  education?: string;
  institution?: string;
  occupationType?: string;
  profession?: string;
  company?: string;
  role?: "super-admin" | "admin" | "member";
  status?: "pending" | "approved" | "rejected";
  communityId?: mongoose.Types.ObjectId;
  isPropertyManager?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    gotra: {
      type: String,
      trim: true,
    },
    kulDevi: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    village: {
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    age: {
      type: Number,
      min: [0, "Age cannot be negative"],
    },
    sex: {
      type: String,
      enum: {
        values: ["Male", "Female", "Other", "Prefer not to say"],
        message: "{VALUE} is not a valid sex option",
      },
    },
    maritalStatus: {
      type: String,
      enum: {
        values: ["Single", "Married", "Divorced", "Widowed", "Separated"],
        message: "{VALUE} is not a valid marital status",
      },
    },
    bloodGroup: {
      type: String,
      enum: {
        values: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        message: "{VALUE} is not a valid blood group",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    familyMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    parentRelationship: {
      type: String,
      enum: {
        values: ["Son", "Daughter", "Wife", "Husband", "Father", "Mother"],
        message: "{VALUE} is not a valid parent relationship option",
      },
    },
    avatar: {
      type: String,
      default: "",
    },
    education: {
      type: String,
      trim: true,
    },
    institution: {
      type: String,
      trim: true,
    },
    occupationType: {
      type: String,
      trim: true,
    },
    profession: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    googleMapsUrl: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["super-admin", "admin", "member"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
    },
    isPropertyManager: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

if (
  mongoose.models.User &&
  (!mongoose.models.User.schema.path("status") ||
   !mongoose.models.User.schema.path("latitude") ||
   !mongoose.models.User.schema.path("googleMapsUrl") ||
   !mongoose.models.User.schema.path("isPropertyManager"))
) {
  delete (mongoose.models as any).User;
}

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
