import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Post, getTenantPostModel } from "@/models/Post";
import { User, getTenantUserModel } from "@/models/User";

// GET /api/posts - List posts with cursor pagination
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const PostModel = await getTenantPostModel(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    let filter: Record<string, any> = {};
    if (type) filter.type = type;

    // Fire-and-forget bulk cleanup of expired events (only on first page)
    if (page === 1) {
      PostModel.deleteMany({ type: "event", "eventDetails.date": { $lt: new Date().toISOString() } }).catch(() => {});
    }

    const [posts, total] = await Promise.all([
      PostModel.find(filter)
        .populate("author", "name phone avatar mobileNumber")
        .populate({ path: "replies", populate: { path: "author", select: "name phone avatar mobileNumber" } })
        .populate("rsvps.going", "name phone mobileNumber avatar")
        .populate("rsvps.maybe", "name phone mobileNumber avatar")
        .populate("rsvps.cant", "name phone mobileNumber avatar")
        .populate("eventDetails.contributions.userId", "name phone mobileNumber avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PostModel.countDocuments(filter),
    ]);

    return Response.json({ posts, hasMore: skip + posts.length < total, total });
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const PostModel = await getTenantPostModel(request);
    const body = await request.json();
    const { author } = body;

    if (!author) {
      return Response.json({ error: "Author is required" }, { status: 400 });
    }

    // Check author role
    const UserModel = await getTenantUserModel(request);
    let authorUser = await UserModel.findById(author).lean();
    if (!authorUser) {
      authorUser = await User.findById(author).lean();
    }

    const authorRole = authorUser?.role ? String(authorUser.role) : "";
    const isAdmin = authorRole === "admin" || authorRole === "super-admin" || authorRole === "COMMUNITY_ADMIN";

    // Standard members: enforce 1 post per day limit
    if (!isAdmin) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const existingPostToday = await PostModel.findOne({
        author,
        createdAt: { $gte: startOfDay },
      }).lean();

      if (existingPostToday) {
        return Response.json(
          { error: "Daily limit reached: Community members can only create 1 post per day. Please try again tomorrow!" },
          { status: 429 }
        );
      }
    }

    const newPost = await PostModel.create(body);
    const populatedPost = await PostModel.findById(newPost._id)
      .populate("author", "name phone avatar mobileNumber")
      .populate("rsvps.going", "name phone mobileNumber avatar")
      .populate("rsvps.maybe", "name phone mobileNumber avatar")
      .populate("rsvps.cant", "name phone mobileNumber avatar")
      .populate("eventDetails.contributions.userId", "name phone mobileNumber avatar");

    return Response.json(populatedPost, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to create post" }, { status: 400 });
  }
}
