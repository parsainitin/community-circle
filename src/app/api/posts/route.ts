import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Post, getTenantPostModel } from "@/models/Post";
import { User, getTenantUserModel } from "@/models/User";

const POST_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

/** Returns a Date set to the very end of the day (23:59:59.999) for a given ISO date string. */
function endOfEventDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

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

    const now = new Date();

    // Build filter — exclude any document whose expiresAt has passed
    let filter: Record<string, any> = {
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ],
    };
    if (type) filter.type = type;

    // Fire-and-forget hard delete of fully expired posts (belt-and-suspenders alongside TTL index)
    if (page === 1) {
      PostModel.deleteMany({ expiresAt: { $lte: now } }).catch(() => {});
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

    // === Auto-expiry logic ===
    const postType: string = body.type || "text";
    let expiresAt: Date | undefined;

    if (postType === "event") {
      // Event expires at end of the event day
      const eventDate = body.eventDetails?.date;
      if (eventDate) {
        expiresAt = endOfEventDay(eventDate);
      }
    } else {
      // text, image, poll, announcement — expire after 48 hours
      expiresAt = new Date(Date.now() + POST_TTL_MS);
    }

    const newPost = await PostModel.create({ ...body, expiresAt });
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
