import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Post } from "@/models/Post";

// GET /api/posts - List all posts
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Automatically clean up expired events
    try {
      const now = new Date();
      const eventPosts = await Post.find({ type: "event" });
      for (const event of eventPosts) {
        if (event.eventDetails && event.eventDetails.date) {
          const eventDate = new Date(event.eventDetails.date);
          if (!isNaN(eventDate.getTime()) && eventDate < now) {
            await Post.findByIdAndDelete(event._id);
          }
        }
      }
    } catch (cleanupErr) {
      console.error("Failed to cleanup expired events:", cleanupErr);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let filter = {};
    if (type) {
      filter = { type };
    }

    const posts = await Post.find(filter)
      .populate("author", "name phone")
      .populate({
        path: "replies",
        populate: { path: "author", select: "name phone" }
      })
      .sort({ createdAt: -1 });

    return Response.json(posts);
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
