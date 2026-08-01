import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Post } from "@/models/Post";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/posts/[id]/reply - Add a reply/comment to a post
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const { userId, content } = await request.json();

    if (!userId || !content || !content.trim()) {
      return Response.json({ error: "Missing required fields: userId, content" }, { status: 400 });
    }

    // 1. Create the reply post
    const reply = await Post.create({
      author: userId,
      content: content.trim(),
      type: "text",
    });

    // 2. Add reply to parent post replies array
    const parentPost = await Post.findByIdAndUpdate(
      id,
      { $push: { replies: reply._id } },
      { new: true }
    );

    if (!parentPost) {
      return Response.json({ error: "Parent post not found" }, { status: 404 });
    }

    // 3. Populate author information for response
    const populatedReply = await Post.findById(reply._id).populate("author", "name phone");

    return Response.json(populatedReply, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to create comment" }, { status: 500 });
  }
}
