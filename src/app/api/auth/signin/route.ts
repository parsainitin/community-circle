import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/auth-crypto";

import { getSubdomainFromRequest, getTenantDb } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { mobileNumber, password, subdomain: bodySubdomain } = body || {};
    const cleanMobile = typeof mobileNumber === "string" ? mobileNumber.trim() : String(mobileNumber || "").trim();
    const cleanPassword = typeof password === "string" ? password : String(password || "");

    if (!cleanMobile || !cleanPassword) {
      return Response.json({ error: "Missing mobileNumber or password" }, { status: 400 });
    }

    const targetSubdomain = bodySubdomain || getSubdomainFromRequest(request);

    const digits = cleanMobile.replace(/\D/g, "");
    const query = {
      $or: [
        { mobileNumber: cleanMobile },
        { mobile: cleanMobile },
        { phone: cleanMobile },
        { email: cleanMobile.toLowerCase() },
        ...(digits.length >= 10 ? [{ mobile: { $regex: digits.slice(-10) + "$" } }] : []),
        ...(digits.length >= 10 ? [{ mobileNumber: { $regex: digits.slice(-10) + "$" } }] : []),
        ...(digits.length >= 10 ? [{ phone: { $regex: digits.slice(-10) + "$" } }] : []),
      ],
    };

    let candidates: any[] = [];

    // Query tenant database comicircle_<subdomain> if available
    if (targetSubdomain) {
      try {
        const tenantDb = await getTenantDb(targetSubdomain);
        const tenantDocs = await tenantDb.collection("users").find(query).toArray();
        candidates.push(...tenantDocs);
      } catch {}
    }

    // Query default database connection as fallback
    const defaultDocs = await User.find(query).lean();
    candidates.push(...defaultDocs);

    const user = candidates.find((u) =>
      verifyPassword(cleanPassword, u.password || u.passwordHash || "")
    );


    if (!user) {
      return Response.json({ error: "Invalid mobile number or password" }, { status: 401 });
    }

    const isApprovedStatus = !user.status || user.status === "approved" || (user.status as string) === "active";
    const isAdminRole =
      user.role === "admin" || user.role === "super-admin" || (user.role as any) === "COMMUNITY_ADMIN";

    if (!isAdminRole && !isApprovedStatus) {
      if (user.status === "pending") {
        return Response.json(
          { error: "Your account registration is pending approval by your community admin." },
          { status: 403 }
        );
      }
      if (user.status === "rejected") {
        return Response.json(
          { error: "Your registration request was rejected by your community admin." },
          { status: 403 }
        );
      }
    }


    // Remove sensitive fields from response
    const userResponse = typeof user.toObject === "function" ? user.toObject() : { ...user };
    delete userResponse.password;
    delete userResponse.passwordHash;

    return Response.json(userResponse);

  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to sign in" }, { status: 500 });
  }
}
