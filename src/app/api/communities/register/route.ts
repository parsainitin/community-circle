import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Community } from "@/models/Community";
import { CommunityRequest } from "@/models/CommunityRequest";
import { hashPassword } from "@/lib/auth-crypto";

const RESERVED_SUBDOMAINS = ["www", "admin", "app", "api", "superadmin", "mail", "localhost", "mysocialclan"];

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const {
      name,
      subdomain,
      description,
      logo,
      cities,
      gotras,
      kulDevis,
      upiId,
      modules,
      adminName,
      adminMobile,
      adminPassword,
    } = body;

    // Validate Community details
    if (!name?.trim() || !subdomain?.trim()) {
      return Response.json({ error: "Community Name and Subdomain are required" }, { status: 400 });
    }

    const slug = subdomain.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return Response.json(
        { error: "Subdomain can only contain lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    if (RESERVED_SUBDOMAINS.includes(slug)) {
      return Response.json({ error: `Subdomain '${slug}' is reserved` }, { status: 400 });
    }

    // Check if subdomain exists in live communities or pending requests
    const existingCommunity = await Community.findOne({ subdomain: slug });
    if (existingCommunity) {
      return Response.json({ error: `Subdomain '${slug}' is already taken` }, { status: 409 });
    }

    const existingPending = await CommunityRequest.findOne({ subdomain: slug, status: "pending" });
    if (existingPending) {
      return Response.json(
        { error: `A creation request for subdomain '${slug}' is already pending review` },
        { status: 409 }
      );
    }

    // Validate Admin details
    if (!adminName?.trim() || !adminMobile?.trim() || !adminPassword?.trim()) {
      return Response.json({ error: "Admin Name, Mobile Number, and Password are required" }, { status: 400 });
    }

    const cleanMobile = adminMobile.trim();

    // Create Community Request for offline provisioning
    const creationRequest = await CommunityRequest.create({
      name: name.trim(),
      subdomain: slug,
      description: description?.trim() || undefined,
      logo: logo?.trim() || undefined,
      cities: Array.isArray(cities) ? cities.map((c: string) => c.trim()).filter(Boolean) : [],
      gotras: Array.isArray(gotras) ? gotras.map((g: string) => g.trim()).filter(Boolean) : [],
      kulDevis: Array.isArray(kulDevis) ? kulDevis.map((k: string) => k.trim()).filter(Boolean) : [],
      upiId: upiId?.trim() || undefined,
      modules: {
        directory: modules?.directory ?? true,
        marketplace: modules?.marketplace ?? true,
        panchang: modules?.panchang ?? true,
        booking: modules?.booking ?? true,
        events: modules?.events ?? true,
        donations: modules?.donations ?? true,
      },
      adminName: adminName.trim(),
      adminMobile: cleanMobile,
      adminPassword: hashPassword(adminPassword.trim()),
      status: "pending",
    });

    return Response.json(
      {
        success: true,
        pendingApproval: true,
        message: "Community setup request submitted for offline provisioning",
        request: {
          id: creationRequest._id,
          name: creationRequest.name,
          subdomain: creationRequest.subdomain,
          adminName: creationRequest.adminName,
          adminMobile: creationRequest.adminMobile,
        },
      },
      { status: 202 }
    );
  } catch (e: any) {
    return Response.json({ error: e.message || "Failed to submit community request" }, { status: 500 });
  }
}
