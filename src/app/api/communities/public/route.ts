import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Community } from "@/models/Community";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const communities = await Community.find({ isActive: true })
      .select("name subdomain description logo cities modules createdAt")
      .sort({ createdAt: -1 })
      .lean();
    return Response.json(communities);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
