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
    const { userId, amount, transactionId } = await request.json();

    if (!userId || !amount) {
      return Response.json({ error: "Missing required fields: userId, amount" }, { status: 400 });
    }

    let post = await PostModel.findById(id);
    let ActiveModel = PostModel;
    if (!post) {
      post = await Post.findById(id);
      ActiveModel = Post;
    }

    if (!post) {
      return Response.json({ error: "Event post not found" }, { status: 404 });
    }

    if (post.type !== "event") {
      return Response.json({ error: "Post is not an event" }, { status: 400 });
    }

    if (!post.eventDetails) {
      post.eventDetails = {
        title: "Event",
        date: "",
        location: "",
        contributions: [],
      };
    }

    if (!post.eventDetails.contributions) {
      post.eventDetails.contributions = [];
    }

    // Record the contribution
    post.eventDetails.contributions.push({
      userId: userId as any,
      amount: Number(amount),
      transactionId: transactionId ? String(transactionId).trim() : undefined,
      paidAt: new Date(),
    } as any);

    // Auto mark member as Accepted (Going)
    const rsvps = {
      going: post.rsvps?.going || [],
      maybe: post.rsvps?.maybe || [],
      cant: post.rsvps?.cant || [],
    };

    // Remove user from maybe & cant
    rsvps.maybe = rsvps.maybe.filter((uid) => uid.toString() !== userId);
    rsvps.cant = rsvps.cant.filter((uid) => uid.toString() !== userId);

    // Add user to going if not already in list
    if (!rsvps.going.some((uid) => uid.toString() === userId)) {
      rsvps.going.push(userId as any);
    }

    post.rsvps = rsvps;
    await post.save();

    const updatedPost = await ActiveModel.findById(id)
      .populate("author", "name phone avatar mobileNumber")
      .populate("rsvps.going", "name phone mobileNumber avatar")
      .populate("rsvps.maybe", "name phone mobileNumber avatar")
      .populate("rsvps.cant", "name phone mobileNumber avatar")
      .populate("eventDetails.contributions.userId", "name phone mobileNumber avatar");

    return Response.json(updatedPost);
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to process contribution" }, { status: 500 });
  }
}
