import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/community/members/[id]/approval — approve or reject a pending member
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { callerMobile, action, password } = body; // action: "approve" | "reject"

    if (!callerMobile || !action) {
      return Response.json({ error: "Missing required fields: callerMobile, action" }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return Response.json({ error: "Action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const caller = await User.findOne({ mobileNumber: callerMobile }).lean();
    if (!caller || (caller.role !== "admin" && caller.role !== "super-admin")) {
      return Response.json({ error: "Forbidden: Only community admins can approve or reject members" }, { status: 403 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    // Verify admin is in the same community (super-admin bypasses)
    if (caller.role === "admin" && String(caller.communityId) !== String(targetUser.communityId)) {
      return Response.json({ error: "Forbidden: Cannot manage members outside your community" }, { status: 403 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    targetUser.status = newStatus;
    if (action === "approve" && password && String(password).trim() !== "") {
      targetUser.password = hashPassword(String(password).trim());
    }
    await targetUser.save();

    const userObj = targetUser.toObject();
    delete (userObj as any).password;

    return Response.json({
      message: `Member ${action === "approve" ? "approved" : "rejected"} successfully`,
      user: userObj,
    });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to update member approval status" }, { status: 500 });
  }
}
