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
    const { mobileNumber, password } = body;

    if (!mobileNumber || !password) {
      return Response.json({ error: "Missing mobileNumber or password" }, { status: 400 });
    }

    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return Response.json({ error: "Invalid mobile number or password" }, { status: 401 });
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return Response.json({ error: "Invalid mobile number or password" }, { status: 401 });
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return Response.json(userResponse);
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to sign in" }, { status: 500 });
  }
}
