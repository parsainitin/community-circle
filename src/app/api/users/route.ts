import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Community } from "@/models/Community";
import { getTenantId } from "@/lib/tenant";

// GET /api/users - List users scoped to the current community (including community admins)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    const communityId = await getTenantId(request);

    let adminUserIds: any[] = [];
    if (communityId) {
      const community = await Community.findById(communityId).select("admins").lean();
      if (community && community.admins && community.admins.length > 0) {
        adminUserIds = community.admins;
        // Backfill communityId, role: "admin", and status: "approved" for all assigned community admins
        await User.updateMany(
          { _id: { $in: adminUserIds } },
          { $set: { communityId, role: "admin", status: "approved" } }
        );
      }
    }

    const filter: Record<string, any> = {
      role: { $ne: "super-admin" },
      status: { $nin: ["pending", "rejected"] },
    };

    if (communityId) {
      filter.$or = [{ communityId }, { _id: { $in: adminUserIds } }];
    }

    if (query && query.trim()) {
      const qRegex = { $regex: query.trim(), $options: "i" };
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: [{ name: qRegex }, { mobileNumber: qRegex }, { city: qRegex }, { village: qRegex }] },
        ];
        delete filter.$or;
      } else {
        filter.$or = [{ name: qRegex }, { mobileNumber: qRegex }, { city: qRegex }, { village: qRegex }];
      }
    }

    const users = await User.find(filter)
      .select("name mobileNumber phone city address village gotra kulDevi avatar role status")
      .limit(query ? 20 : 100)
      .lean();
    return Response.json(users);
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const newUser = await User.create(body);
    return Response.json(newUser, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to create user" }, { status: 400 });
  }
}
