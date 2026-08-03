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

    const hashedPassword = hashPassword(password);
    const candidates = await User.find({ mobileNumber });
    const user = candidates.find((u) => u.password === hashedPassword);
    if (!user) {
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
