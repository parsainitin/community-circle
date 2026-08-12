import { NextRequest } from "next/server";
import { dbConnect, getSubdomainFromRequest } from "@/lib/mongodb";
import { Community } from "@/models/Community";
import mongoose from "mongoose";

// Returns the communityId for this database instance.
export async function getTenantId(
  request?: NextRequest
): Promise<mongoose.Types.ObjectId | null> {
  await dbConnect();

  const subdomain = getSubdomainFromRequest(request);
  if (subdomain) {
    const commBySub = await Community.findOne({ subdomain, isActive: true })
      .select("_id")
      .lean();
    if (commBySub) {
      return (commBySub as any)._id ?? null;
    }
  }

  const community = await Community.findOne({ isActive: true })
    .sort({ createdAt: 1 })
    .select("_id")
    .lean();

  return (community as any)?._id ?? null;
}
