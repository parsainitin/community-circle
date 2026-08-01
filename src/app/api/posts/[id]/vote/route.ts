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
    const { userId, optionIndex } = await request.json();

    if (!userId || optionIndex === undefined || typeof optionIndex !== "number") {
      return Response.json({ error: "Invalid userId or optionIndex" }, { status: 400 });
    }

    const post = await Post.findById(id);
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.type !== "poll") {
      return Response.json({ error: "Post is not a poll" }, { status: 400 });
    }

    const votes = post.pollVotes || [];
    const existingIndex = votes.findIndex((v) => v.userId.toString() === userId);

    if (existingIndex > -1) {
      if (votes[existingIndex].optionIndex === optionIndex) {
        // Toggle off if clicking the same option
        votes.splice(existingIndex, 1);
      } else {
        // Change vote to a different option
        votes[existingIndex].optionIndex = optionIndex;
      }
    } else {
      // Add new vote
      votes.push({ userId: userId as any, optionIndex });
    }

    post.pollVotes = votes;
    await post.save();

    const updatedPost = await Post.findById(id).populate("author", "name phone");

    return Response.json(updatedPost);
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
