import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/auth-crypto";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { mobileNumber, password } = body || {};
    const cleanMobile = typeof mobileNumber === "string" ? mobileNumber.trim() : String(mobileNumber || "").trim();
    const cleanPassword = typeof password === "string" ? password : String(password || "");

    if (!cleanMobile || !cleanPassword) {
      return Response.json({ error: "Missing mobileNumber or password" }, { status: 400 });
    }

    const candidates = await User.find({ mobileNumber: cleanMobile });
    const user = candidates.find((u) => verifyPassword(cleanPassword, u.password || ""));
    if (!user) {
      return Response.json({ error: "Invalid mobile number or password" }, { status: 401 });
    }

    if (user.role !== "super-admin" && user.status && user.status !== "approved") {
      if (user.status === "pending") {
        return Response.json(
          { error: "Your account registration is pending approval by your community admin." },
          { status: 403 }
        );
      }
      if (user.status === "rejected") {
        return Response.json(
          { error: "Your registration request was rejected by your community admin." },
          { status: 403 }
        );
      }
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return Response.json(userResponse);
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to sign in" }, { status: 500 });
  }
}
