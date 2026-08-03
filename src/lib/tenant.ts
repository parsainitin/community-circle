import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Community } from "@/models/Community";
import mongoose from "mongoose";

// Returns the communityId for this database instance.
export async function getTenantId(
  request?: NextRequest
): Promise<mongoose.Types.ObjectId | null> {
  await dbConnect();

  const community = await Community.findOne({ isActive: true })
    .sort({ createdAt: 1 })
    .select("_id")
    .lean();

  return (community as any)?._id ?? null;
}
