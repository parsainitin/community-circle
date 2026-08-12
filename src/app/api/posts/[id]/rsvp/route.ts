import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Post, getTenantPostModel } from "@/models/Post";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const PostModel = await getTenantPostModel(request);
    const { id } = await params;
    const { userId, status } = await request.json();

    if (!userId || !status || !["going", "maybe", "cant"].includes(status)) {
      return Response.json({ error: "Invalid userId or status" }, { status: 400 });
    }

    let post = await PostModel.findById(id);
    let ActiveModel = PostModel;
    if (!post) {
      post = await Post.findById(id);
      ActiveModel = Post;
    }
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.type !== "event") {
      return Response.json({ error: "Post is not an event" }, { status: 400 });
    }

    // Initialize RSVP lists if undefined
    const rsvps = {
      going: post.rsvps?.going || [],
      maybe: post.rsvps?.maybe || [],
      cant: post.rsvps?.cant || [],
    };

    const isGoing = rsvps.going.some((uid) => uid.toString() === userId);
    const isMaybe = rsvps.maybe.some((uid) => uid.toString() === userId);
    const isCant = rsvps.cant.some((uid) => uid.toString() === userId);

    // Remove user from all lists
    rsvps.going = rsvps.going.filter((uid) => uid.toString() !== userId);
    rsvps.maybe = rsvps.maybe.filter((uid) => uid.toString() !== userId);
    rsvps.cant = rsvps.cant.filter((uid) => uid.toString() !== userId);

    // If new status clicked, add it. (If they clicked the same active status, they are now un-RSVP'd)
    const currentStatus = isGoing ? "going" : isMaybe ? "maybe" : isCant ? "cant" : null;
    if (currentStatus !== status) {
      if (status === "going") rsvps.going.push(userId as any);
      if (status === "maybe") rsvps.maybe.push(userId as any);
      if (status === "cant") rsvps.cant.push(userId as any);
    }

    post.rsvps = rsvps;
    await post.save();

    const updatedPost = await ActiveModel.findById(id).populate("author", "name phone");

    return Response.json(updatedPost);
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
