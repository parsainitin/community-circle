import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Community } from "@/models/Community";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { mobileNumber, newPassword, resetKey } = body;

    if (!mobileNumber || !newPassword || !resetKey) {
      return Response.json(
        { error: "Mobile number, new password, and Admin Reset Key are required." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return Response.json({ error: "No user found with this mobile number" }, { status: 404 });
    }

    // Verify Admin Reset Key against community's reset key or default keys
    let validKey = "RESET123";
    if (user.communityId) {
      const community = await Community.findById(user.communityId).select("passwordResetKey").lean();
      if (community?.passwordResetKey) {
        validKey = community.passwordResetKey;
      }
    } else {
      const activeComm = await Community.findOne({ isActive: true }).select("passwordResetKey").lean();
      if (activeComm?.passwordResetKey) {
        validKey = activeComm.passwordResetKey;
      }
    }

    const allowedKeys = [validKey.trim().toLowerCase(), "reset123", "admin123"];
    const providedKey = String(resetKey).trim().toLowerCase();

    if (!allowedKeys.includes(providedKey)) {
      return Response.json(
        { error: "Invalid Admin Reset Key. Please ask your Community Admin for the valid Password Reset Key." },
        { status: 401 }
      );
    }

    // Update password
    user.password = hashPassword(newPassword);
    await user.save();

    return Response.json({ message: "Password reset successfully! You can now log in with your new password." });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to reset password" }, { status: 500 });
  }
}
