import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Post } from "@/models/Post";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    const post = await Post.findById(id);
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Toggle logic
    const likesList = post.likes.map((l) => l.toString());
    const hasLiked = likesList.includes(userId);

    let updatedPost;
    if (hasLiked) {
      updatedPost = await Post.findByIdAndUpdate(
        id,
        { $pull: { likes: userId } },
        { new: true }
      ).populate("author", "name phone");
    } else {
      updatedPost = await Post.findByIdAndUpdate(
        id,
        { $addToSet: { likes: userId } },
        { new: true }
      ).populate("author", "name phone");
    }

    return Response.json(updatedPost);
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
