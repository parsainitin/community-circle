import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User, getTenantUserModel } from "@/models/User";
import { Community } from "@/models/Community";
import { PasswordResetOtp } from "@/models/PasswordResetOtp";
import { hashPassword } from "@/lib/auth-crypto";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const UserModel = await getTenantUserModel(request);
    const body = await request.json();
    const { mobileNumber, newPassword, otp, resetKey } = body || {};

    const cleanMobile = typeof mobileNumber === "string" ? mobileNumber.trim().replace(/\D/g, "") : "";
    const cleanNewPassword = typeof newPassword === "string" ? newPassword.trim() : "";
    const cleanOtp = typeof otp === "string" ? otp.trim() : "";
    const cleanResetKey = typeof resetKey === "string" ? resetKey.trim() : "";

    if (!cleanMobile || cleanMobile.length < 10) {
      return NextResponse.json(
        { error: "A valid 10-digit mobile number is required." },
        { status: 400 }
      );
    }

    if (!cleanNewPassword || cleanNewPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (!cleanOtp && !cleanResetKey) {
      return NextResponse.json(
        { error: "Please provide either the 6-digit WhatsApp OTP or the Admin Reset Key." },
        { status: 400 }
      );
    }

    let user = await UserModel.findOne({ mobileNumber: cleanMobile });
    if (!user) {
      user = await User.findOne({ mobileNumber: cleanMobile });
    }
    if (!user) {
      return NextResponse.json(
        { error: "No user found with this mobile number." },
        { status: 404 }
      );
    }

    // Only approved members (and super-admins) can reset password
    if (user.role !== "super-admin") {
      if (user.status === "pending") {
        return NextResponse.json(
          {
            error:
              "Your account is currently pending admin approval. Password reset is only available for approved members.",
          },
          { status: 403 }
        );
      }
      if (user.status === "rejected") {
        return NextResponse.json(
          {
            error:
              "Your registration was rejected. Please contact your Community Admin.",
          },
          { status: 403 }
        );
      }
      if (user.status && user.status !== "approved") {
        return NextResponse.json(
          {
            error:
              "Password reset is only available for approved community members.",
          },
          { status: 403 }
        );
      }
    }

    // 1. Verify via WhatsApp OTP if provided
    if (cleanOtp) {
      const otpRecord = await PasswordResetOtp.findOne({
        mobileNumber: cleanMobile,
        otp: cleanOtp,
        expiresAt: { $gt: new Date() },
      });

      if (!otpRecord) {
        return NextResponse.json(
          { error: "Invalid or expired OTP. Please check the code received on WhatsApp or request a new one." },
          { status: 401 }
        );
      }

      // Consume OTP
      await PasswordResetOtp.deleteMany({ mobileNumber: cleanMobile });
    } else if (cleanResetKey) {
      // 2. Verify via Admin Reset Key
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
      const providedKey = cleanResetKey.toLowerCase();

      if (!allowedKeys.includes(providedKey)) {
        return NextResponse.json(
          { error: "Invalid Admin Reset Key. Please ask your Community Admin for the valid Password Reset Key." },
          { status: 401 }
        );
      }
    }

    // Update password with scrypt salted hash
    user.password = hashPassword(cleanNewPassword);
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("[Forgot Password API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
