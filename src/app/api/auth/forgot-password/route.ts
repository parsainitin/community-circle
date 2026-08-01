import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { mobileNumber, newPassword } = body;

    if (!mobileNumber || !newPassword) {
      return Response.json({ error: "Missing mobileNumber or newPassword" }, { status: 400 });
    }

    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return Response.json({ error: "No user found with this mobile number" }, { status: 404 });
    }

    // Update password
    user.password = hashPassword(newPassword);
    await user.save();

    return Response.json({ message: "Password reset successfully" });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to reset password" }, { status: 500 });
  }
}
