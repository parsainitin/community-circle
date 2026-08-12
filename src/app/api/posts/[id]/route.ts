import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Post, getTenantPostModel } from "@/models/Post";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/posts/[id] - Get a single post by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const PostModel = await getTenantPostModel(request);
    const { id } = await params;
    
    let post = await PostModel.findById(id)
      .populate("author", "name phone")
      .populate({
        path: "replies",
        populate: { path: "author", select: "name phone" }
      });

    if (!post) {
      post = await Post.findById(id)
        .populate("author", "name phone")
        .populate({
          path: "replies",
          populate: { path: "author", select: "name phone" }
        });
    }

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }
    return Response.json(post);
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/posts/[id] - Update a post by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const PostModel = await getTenantPostModel(request);
    const { id } = await params;
    const body = await request.json();
    
    let updatedPost = await PostModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("author", "name phone");

    if (!updatedPost) {
      updatedPost = await Post.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true,
      }).populate("author", "name phone");
    }

    if (!updatedPost) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }
    return Response.json(updatedPost);
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to update post" }, { status: 400 });
  }
}

// DELETE /api/posts/[id] - Delete a post by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const PostModel = await getTenantPostModel(request);
    const { id } = await params;
    
    let deletedPost = await PostModel.findByIdAndDelete(id);
    if (!deletedPost) {
      deletedPost = await Post.findByIdAndDelete(id);
    }
    if (!deletedPost) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }
    return Response.json({ message: "Post deleted successfully" });
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
