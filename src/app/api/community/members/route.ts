import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Community } from "@/models/Community";
import { getTenantId } from "@/lib/tenant";

// GET /api/community/members — list community members for community admin approval view
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const callerMobile = request.headers.get("x-caller-mobile") || searchParams.get("callerMobile");
    const statusParam = searchParams.get("status"); // "pending" | "approved" | "rejected" | "all"

    if (!callerMobile) {
      return Response.json({ error: "Unauthorized: callerMobile header or param required" }, { status: 401 });
    }

    const caller = await User.findOne({ mobileNumber: callerMobile }).lean();
    if (!caller || (caller.role !== "admin" && caller.role !== "super-admin")) {
      return Response.json({ error: "Forbidden: Only community admins can access member approvals" }, { status: 403 });
    }

    const communityId = caller.communityId || (await getTenantId(request)) || undefined;

    let adminUserIds: any[] = [];
    if (communityId) {
      const community = await Community.findById(communityId).select("admins").lean();
      if (community && community.admins && community.admins.length > 0) {
        adminUserIds = community.admins;
        // Automatically backfill communityId, role: "admin", and status: "approved" for all assigned community admins
        await User.updateMany(
          { _id: { $in: adminUserIds } },
          { $set: { communityId, role: "admin", status: "approved" } }
        );
      }
    }

    const filter: Record<string, any> = {};
    if (communityId) {
      filter.$or = [{ communityId }, { _id: { $in: adminUserIds } }];
    }

    // Ensure all member signups lacking a status field are set to pending
    await User.updateMany(
      { role: "member", status: { $exists: false } },
      { $set: { status: "pending" } }
    );

    if (statusParam && statusParam !== "all") {
      if (statusParam === "approved") {
        filter.$or = [{ status: "approved" }, { role: "admin" }, { _id: { $in: adminUserIds } }];
      } else if (statusParam === "pending") {
        filter.role = "member";
        filter.$or = [{ status: "pending" }, { status: { $exists: false } }];
      } else {
        filter.status = statusParam;
      }
    }

    const members = await User.find(filter)
      .select("-password")
      .populate("parent", "name mobileNumber")
      .sort({ createdAt: -1 })
      .lean();

    // Get count of pending members for badge display
    const pendingCount = await User.countDocuments({
      ...(communityId ? { communityId } : {}),
      role: "member",
      $or: [{ status: "pending" }, { status: { $exists: false } }],
    });

    return Response.json({
      members,
      pendingCount,
    });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to fetch members" }, { status: 500 });
  }
}
