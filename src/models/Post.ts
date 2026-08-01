import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  type: "text" | "image" | "poll" | "event" | "announcement";
  replies: mongoose.Types.ObjectId[] | IPost[];
  likes: mongoose.Types.ObjectId[];
    eventDetails?: {
      title: string;
      date: string;
      location: string;
      poster?: string;
      contributionFee?: number;
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
        values: ["text", "image", "poll", "event", "announcement"],
        message: "{VALUE} is not a valid post type",
      },
      default: "text",
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
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Post) {
  delete (mongoose.models as any).Post;
}

export const Post: Model<IPost> =
  mongoose.model<IPost>("Post", PostSchema);
