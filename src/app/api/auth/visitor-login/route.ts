import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { getTenantUserModel } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const UserModel = await getTenantUserModel(request);
    const { mobileNumber } = await request.json();

    if (!mobileNumber || !mobileNumber.trim()) {
      return Response.json({ error: "Mobile number is required" }, { status: 400 });
    }

    const digits = mobileNumber.trim().replace(/\D/g, "");
    if (digits.length < 10) {
      return Response.json({ error: "Please enter a valid 10-digit mobile number" }, { status: 400 });
    }

    // Check if user exists in community
    const user = await UserModel.findOne({
      mobileNumber: { $in: [digits, `+91${digits}`, digits.slice(-10)] },
    }).select("name mobileNumber status role communityId");

    // Build a guest session — regardless of membership, allow read-only visit
    const guestSession = {
      _id: `visitor_${digits}`,
      name: user?.name || `Visitor (${digits.slice(-4)})`,
      mobileNumber: digits,
      phone: digits,
      role: "visitor" as const,
      status: "approved" as const,
      isVisitor: true,
      visitorExpiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes from now
    };

    return Response.json(guestSession, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
