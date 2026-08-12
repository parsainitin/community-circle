import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { CommunityRequest } from "@/models/CommunityRequest";

async function assertSuperAdmin(mobile: string | null): Promise<boolean> {
  if (!mobile) return false;
  await dbConnect();
  const u = await User.findOne({ mobileNumber: mobile }).select("role").lean();
  return (u as any)?.role === "super-admin";
}

// GET /api/admin/community-requests — list pending community creation requests
export async function GET(request: NextRequest) {
  const caller = request.headers.get("x-caller-mobile");
  if (!(await assertSuperAdmin(caller))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();
    const requests = await CommunityRequest.find()
      .sort({ createdAt: -1 })
      .lean();
    return Response.json(requests);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
