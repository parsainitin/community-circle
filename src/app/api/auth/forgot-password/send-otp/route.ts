import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User, getTenantUserModel } from "@/models/User";
import { PasswordResetOtp } from "@/models/PasswordResetOtp";
import { sendWhatsAppMessage } from "@/lib/msgservice";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { mobileNumber } = body || {};

    const cleanMobile = typeof mobileNumber === "string" ? mobileNumber.trim().replace(/\D/g, "") : "";

    if (!cleanMobile || cleanMobile.length < 10) {
      return NextResponse.json(
        { error: "A valid 10-digit mobile number is required." },
        { status: 400 }
      );
    }

    // Check if user exists in tenant or global DB
    const UserModel = await getTenantUserModel(request);
    let user = await UserModel.findOne({ mobileNumber: cleanMobile });
    if (!user) {
      user = await User.findOne({ mobileNumber: cleanMobile });
    }

    if (!user) {
      return NextResponse.json(
        { error: "No registered account found with this mobile number." },
        { status: 404 }
      );
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Upsert or create OTP record
    await PasswordResetOtp.deleteMany({ mobileNumber: cleanMobile });
    await PasswordResetOtp.create({
      mobileNumber: cleanMobile,
      otp,
      expiresAt,
    });

    // Send OTP via WhatsApp message
    const messageText = `🔐 *Community Circle Password Reset*

Namaste *${user.name || "Member"}*,

Your Password Reset verification code is:
*${otp}*

⏳ Valid for 10 minutes.
⚠️ Do not share this OTP with anyone for account security.`;

    const whatsappRes = await sendWhatsAppMessage({
      phoneNumber: cleanMobile,
      message: messageText,
      title: "Password Reset OTP",
    });

    if (!whatsappRes.success) {
      console.warn("[Send OTP] WhatsApp delivery warning:", whatsappRes.error);
      // Even if WhatsApp fails, we still return success with warning or error detail
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your WhatsApp number.",
      whatsappDelivered: whatsappRes.success,
    });
  } catch (error: any) {
    console.error("[Send OTP] Error sending password reset OTP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate and send OTP" },
      { status: 500 }
    );
  }
}
