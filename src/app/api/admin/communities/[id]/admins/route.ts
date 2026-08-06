import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Community } from "@/models/Community";
import { hashPassword } from "@/lib/auth-crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/communities/[id]/admins — create or promote a user as admin for this community
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const { callerMobile, name, mobileNumber, password } = await request.json();

    const caller = await User.findOne({ mobileNumber: callerMobile }).select("role").lean();
    if ((caller as any)?.role !== "super-admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const community = await Community.findById(id);
    if (!community) {
      return Response.json({ error: "Community not found" }, { status: 404 });
    }

    if (!name?.trim() || !mobileNumber?.trim() || !password?.trim()) {
      return Response.json({ error: "name, mobileNumber, and password are required" }, { status: 400 });
    }

    // Block duplicate mobile numbers
    const existing = await User.findOne({ mobileNumber: mobileNumber.trim() });
    if (existing) {
      return Response.json(
        { error: `Mobile number ${mobileNumber.trim()} is already registered. Each admin must have a unique mobile number.` },
        { status: 409 }
      );
    }

    const adminUser = await User.create({
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      phone: mobileNumber.trim(),
      password: hashPassword(password),
      city: "—",
      role: "admin",
      status: "approved",
      communityId: community._id,
    });

    await Community.findByIdAndUpdate(id, { $addToSet: { admins: adminUser._id } });

    const response = adminUser.toObject();
    delete (response as any).password;
    return Response.json(response, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/admin/communities/[id]/admins — remove an admin from a community
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const { callerMobile, adminId } = await request.json();

    const caller = await User.findOne({ mobileNumber: callerMobile }).select("role").lean();
    if ((caller as any)?.role !== "super-admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await Community.findByIdAndUpdate(id, { $pull: { admins: adminId } });
    await User.findByIdAndUpdate(adminId, { role: "member" });

    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
