import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Community } from "@/models/Community";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function assertSuperAdmin(mobile: string | null): Promise<boolean> {
  if (!mobile) return false;
  await dbConnect();
  const u = await User.findOne({ mobileNumber: mobile }).select("role").lean();
  return (u as any)?.role === "super-admin";
}

// PATCH /api/admin/communities/[id] — update a community's details
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const { callerMobile, name, subdomain, description, logo, cities, gotras, kulDevis, upiId } = await request.json();

    if (!(await assertSuperAdmin(callerMobile))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const community = await Community.findById(id);
    if (!community) {
      return Response.json({ error: "Community not found" }, { status: 404 });
    }

    if (!name?.trim() || !subdomain?.trim()) {
      return Response.json({ error: "name and subdomain are required" }, { status: 400 });
    }

    const slug = subdomain.trim().toLowerCase();
    if (slug !== community.subdomain) {
      const exists = await Community.findOne({ subdomain: slug, _id: { $ne: id } });
      if (exists) {
        return Response.json({ error: "Subdomain already taken" }, { status: 409 });
      }
    }

    community.name = name.trim();
    community.subdomain = slug;
    community.description = description?.trim() || undefined;
    if (logo) community.logo = logo;
    if (Array.isArray(cities)) community.cities = cities.map((c: string) => c.trim()).filter(Boolean);
    if (Array.isArray(gotras)) community.gotras = gotras.map((g: string) => g.trim()).filter(Boolean);
    if (Array.isArray(kulDevis)) community.kulDevis = kulDevis.map((k: string) => k.trim()).filter(Boolean);
    if (typeof upiId === "string") community.upiId = upiId.trim() || undefined;
    await community.save();

    return Response.json(community);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/admin/communities/[id] — delete a community and detach its members
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const { callerMobile } = await request.json();

    if (!(await assertSuperAdmin(callerMobile))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const community = await Community.findById(id);
    if (!community) {
      return Response.json({ error: "Community not found" }, { status: 404 });
    }

    // Detach members so no user is left pointing at a deleted community
    await User.updateMany(
      { communityId: id },
      { $unset: { communityId: "" }, $set: { role: "member" } }
    );
    await Community.findByIdAndDelete(id);

    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
