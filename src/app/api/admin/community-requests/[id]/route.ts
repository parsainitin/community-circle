import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Community } from "@/models/Community";
import { CommunityRequest } from "@/models/CommunityRequest";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function assertSuperAdmin(mobile: string | null): Promise<boolean> {
  if (!mobile) return false;
  await dbConnect();
  const u = await User.findOne({ mobileNumber: mobile }).select("role").lean();
  return (u as any)?.role === "super-admin";
}

// PATCH /api/admin/community-requests/[id] — update status or provision community
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const { callerMobile, status, notes, provisionNow } = await request.json();

    if (!(await assertSuperAdmin(callerMobile))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const reqDoc = await CommunityRequest.findById(id);
    if (!reqDoc) {
      return Response.json({ error: "Creation request not found" }, { status: 404 });
    }

    if (status) reqDoc.status = status;
    if (notes) reqDoc.notes = notes;
    await reqDoc.save();

    // If provisionNow flag is true, also create live Community and Admin user
    if (provisionNow && status === "approved") {
      const existingCommunity = await Community.findOne({ subdomain: reqDoc.subdomain });
      if (!existingCommunity) {
        const community = await Community.create({
          name: reqDoc.name,
          subdomain: reqDoc.subdomain,
          description: reqDoc.description,
          logo: reqDoc.logo,
          cities: reqDoc.cities,
          gotras: reqDoc.gotras,
          kulDevis: reqDoc.kulDevis,
          upiId: reqDoc.upiId,
          modules: reqDoc.modules,
          isActive: true,
          admins: [],
        });

        // Create Admin user if not exists
        let adminUser = await User.findOne({ mobileNumber: reqDoc.adminMobile });
        if (!adminUser) {
          adminUser = await User.create({
            name: reqDoc.adminName,
            mobileNumber: reqDoc.adminMobile,
            phone: reqDoc.adminMobile,
            password: reqDoc.adminPassword,
            role: "admin",
            status: "approved",
            communityId: community._id,
            city: reqDoc.cities?.[0] || "Headquarters",
          });
        }

        community.admins = [adminUser._id];
        await community.save();
      }
    }

    return Response.json(reqDoc);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/admin/community-requests/[id] — delete a request
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const { callerMobile } = await request.json();

    if (!(await assertSuperAdmin(callerMobile))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await CommunityRequest.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
