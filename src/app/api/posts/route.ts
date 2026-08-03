import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Post } from "@/models/Post";

// GET /api/posts - List posts with cursor pagination
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    let filter: Record<string, any> = {};
    if (type) filter.type = type;

    // Fire-and-forget bulk cleanup of expired events (only on first page)
    if (page === 1) {
      Post.deleteMany({ type: "event", "eventDetails.date": { $lt: new Date().toISOString() } }).catch(() => {});
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "name phone")
        .populate({ path: "replies", populate: { path: "author", select: "name phone" } })
        .populate("rsvps.going", "name")
        .populate("rsvps.maybe", "name")
        .populate("rsvps.cant", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter),
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
    const body = await request.json();
    const newPost = await Post.create(body);
    return Response.json(newPost, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to create post" }, { status: 400 });
  }
}
