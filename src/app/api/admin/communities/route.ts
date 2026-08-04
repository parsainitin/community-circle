import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Community } from "@/models/Community";

async function assertSuperAdmin(mobile: string | null): Promise<boolean> {
  if (!mobile) return false;
  await dbConnect();
  const u = await User.findOne({ mobileNumber: mobile }).select("role").lean();
  return (u as any)?.role === "super-admin";
}

// GET /api/admin/communities — list all communities with populated admins
export async function GET(request: NextRequest) {
  const caller = request.headers.get("x-caller-mobile");
  if (!(await assertSuperAdmin(caller))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();
    const communities = await Community.find()
      .populate("admins", "name mobileNumber")
      .sort({ createdAt: -1 })
      .lean();
    return Response.json(communities);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/admin/communities — create a new community
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { callerMobile, name, subdomain, description, logo, cities, gotras, kulDevis } = body;

    if (!(await assertSuperAdmin(callerMobile))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!name?.trim() || !subdomain?.trim()) {
      return Response.json({ error: "name and subdomain are required" }, { status: 400 });
    }

    const slug = subdomain.trim().toLowerCase();
    const exists = await Community.findOne({ subdomain: slug });
    if (exists) {
      return Response.json({ error: "Subdomain already taken" }, { status: 409 });
    }

    const community = await Community.create({
      name: name.trim(),
      subdomain: slug,
      description: description?.trim() || undefined,
      logo: logo?.trim() || undefined,
      cities: Array.isArray(cities) ? cities.map((c: string) => c.trim()).filter(Boolean) : [],
      gotras: Array.isArray(gotras) ? gotras.map((g: string) => g.trim()).filter(Boolean) : [],
      kulDevis: Array.isArray(kulDevis) ? kulDevis.map((k: string) => k.trim()).filter(Boolean) : [],
    });
    return Response.json(community, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
