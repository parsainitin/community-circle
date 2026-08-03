import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import crypto from "crypto";

function hashPassword(p: string) {
  return crypto.createHash("sha256").update(p).digest("hex");
}

// POST /api/admin/setup — one-time bootstrap to create the platform super-admin.
// Succeeds only if no super-admin exists yet.
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const existing = await User.findOne({ role: "super-admin" });
    if (existing) {
      return Response.json(
        { error: "Super-admin already exists. Setup can only run once." },
        { status: 409 }
      );
    }

    const { name, mobileNumber, password } = await request.json();
    if (!name?.trim() || !mobileNumber?.trim() || !password?.trim()) {
      return Response.json({ error: "name, mobileNumber, and password are required" }, { status: 400 });
    }

    const duplicate = await User.findOne({ mobileNumber: mobileNumber.trim() });
    if (duplicate) {
      return Response.json({ error: "Mobile number already in use by another user" }, { status: 409 });
    }

    const superAdmin = await User.create({
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      phone: mobileNumber.trim(),
      password: hashPassword(password),
      city: "Platform",
      role: "super-admin",
    });

    const response = superAdmin.toObject();
    delete (response as any).password;
    return Response.json(response, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
