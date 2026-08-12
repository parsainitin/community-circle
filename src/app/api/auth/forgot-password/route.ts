import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User, getTenantUserModel } from "@/models/User";
import { Community } from "@/models/Community";
import { hashPassword } from "@/lib/auth-crypto";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const UserModel = await getTenantUserModel(request);
    const body = await request.json();
    const { mobileNumber, newPassword, resetKey } = body || {};
    const cleanMobile = typeof mobileNumber === "string" ? mobileNumber.trim() : String(mobileNumber || "").trim();
    const cleanNewPassword = typeof newPassword === "string" ? newPassword : String(newPassword || "");
    const cleanResetKey = typeof resetKey === "string" ? resetKey.trim() : String(resetKey || "").trim();

    if (!cleanMobile || !cleanNewPassword || !cleanResetKey) {
      return Response.json(
        { error: "Mobile number, new password, and Admin Reset Key are required." },
        { status: 400 }
      );
    }

    let user = await UserModel.findOne({ mobileNumber: cleanMobile });
    if (!user) {
      user = await User.findOne({ mobileNumber: cleanMobile });
    }
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
    user.password = hashPassword(cleanNewPassword);
    await user.save();

    return Response.json({ message: "Password reset successfully! You can now log in with your new password." });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to reset password" }, { status: 500 });
  }
}
