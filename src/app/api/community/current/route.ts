import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Community } from "@/models/Community";

// GET /api/community/current — public lookup of the community for the current instance (env or default fallback)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const community = await Community.findOne({ isActive: true })
      .sort({ createdAt: 1 })
      .select("name subdomain logo description")
      .lean();

    return Response.json({ community: community || null });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to load community" }, { status: 500 });
  }
}
