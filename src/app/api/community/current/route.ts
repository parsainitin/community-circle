import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Community } from "@/models/Community";
import { User } from "@/models/User";

import { getSubdomainFromRequest } from "@/lib/mongodb";

// GET /api/community/current — public lookup of the community for the current instance
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const paramSubdomain = (searchParams.get("subdomain") || "").trim().toLowerCase();
    const reqSubdomain = paramSubdomain || getSubdomainFromRequest(request);

    let community = null;

    if (reqSubdomain) {
      community = await Community.findOne({
        subdomain: reqSubdomain,
        isActive: true,
      })
        .select("name subdomain logo description cities gotras kulDevis upiId")
        .lean();
    }

    if (!community) {
      community = await Community.findOne({ isActive: true })
        .sort({ createdAt: -1 })
        .select("name subdomain logo description cities gotras kulDevis upiId")
        .lean();
    }


    if (community) {
      // Find all distinct Gotras, KulDevis, and Cities added by members of this community
      const members = await User.find({ communityId: community._id })
        .select("gotra kulDevi city")
        .lean();

      const gotrasSet = new Set<string>(community.gotras || []);
      const kulDevisSet = new Set<string>(community.kulDevis || []);
      const citiesSet = new Set<string>(community.cities || []);

      members.forEach((m: any) => {
        if (m.gotra && m.gotra.trim()) gotrasSet.add(m.gotra.trim());
        if (m.kulDevi && m.kulDevi.trim()) kulDevisSet.add(m.kulDevi.trim());
        if (m.city && m.city.trim()) citiesSet.add(m.city.trim());
      });

      community.gotras = Array.from(gotrasSet);
      community.kulDevis = Array.from(kulDevisSet);
      community.cities = Array.from(citiesSet);
    }

    return Response.json({ community: community || null });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to load community" }, { status: 500 });
  }
}
