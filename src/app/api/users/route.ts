import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User, getTenantUserModel } from "@/models/User";
import { Community } from "@/models/Community";
import { getTenantId } from "@/lib/tenant";

// GET /api/users - List users scoped to the current community (including community admins)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const UserModel = await getTenantUserModel(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    const communityId = await getTenantId(request);

    let adminUserIds: any[] = [];
    let communityAdminDocs: any[] = [];

    if (communityId) {
      const community = await Community.findById(communityId).populate("admins").lean();
      if (community && community.admins && community.admins.length > 0) {
        adminUserIds = community.admins.map((a: any) => a._id || a);
        communityAdminDocs = (community.admins as any[]).filter((a: any) => typeof a === "object" && a._id);

        // Backfill communityId, role: "admin", and status: "approved" for all assigned community admins in tenant DB
        await UserModel.updateMany(
          { _id: { $in: adminUserIds } },
          { $set: { communityId, role: "admin", status: "approved" } }
        );

        // Also check if any community admins exist in main DB User but not in tenant UserModel, and sync them into tenant DB
        for (const adm of communityAdminDocs) {
          const num = adm.mobileNumber || adm.phone || adm.mobile;
          if (num) {
            const existsInTenant = await UserModel.findOne({
              $or: [{ mobileNumber: num }, { phone: num }, { mobile: num }]
            }).lean();

            if (!existsInTenant) {
              try {
                await UserModel.create({
                  _id: adm._id,
                  name: adm.name,
                  phone: adm.phone || num,
                  mobileNumber: adm.mobileNumber || num,
                  mobile: adm.mobile || num,
                  password: adm.password || "Community123",
                  role: "admin",
                  status: "approved",
                  communityId,
                  city: adm.city || "Headquarters",
                  avatar: adm.avatar || "",
                  gotra: adm.gotra || "",
                  kulDevi: adm.kulDevi || "",
                });
              } catch {}
            }
          }
        }
      }

      // Also check main DB User for any users with role admin and communityId
      const mainAdmins = await User.find({
        communityId,
        role: { $in: ["admin", "COMMUNITY_ADMIN"] as any },
      }).lean();

      for (const adm of mainAdmins) {
        const num = adm.mobileNumber || adm.phone || adm.mobile;
        if (num) {
          const existsInTenant = await UserModel.findOne({
            $or: [{ mobileNumber: num }, { phone: num }, { mobile: num }]
          }).lean();

          if (!existsInTenant) {
            try {
              await UserModel.create({
                _id: adm._id,
                name: adm.name,
                phone: adm.phone || num,
                mobileNumber: adm.mobileNumber || num,
                mobile: adm.mobile || num,
                password: adm.password || "Community123",
                role: "admin",
                status: "approved",
                communityId,
                city: adm.city || "Headquarters",
                avatar: adm.avatar || "",
                gotra: adm.gotra || "",
                kulDevi: adm.kulDevi || "",
              });
            } catch {}
          }
        }
      }
    }

    const filter: Record<string, any> = {
      role: { $ne: "super-admin" },
      status: { $nin: ["pending", "rejected"] },
    };

    if (communityId) {
      filter.$or = [{ communityId }, { role: { $in: ["admin", "COMMUNITY_ADMIN"] } }, { _id: { $in: adminUserIds } }];
    }

    if (query && query.trim()) {
      const qRegex = { $regex: query.trim(), $options: "i" };
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: [{ name: qRegex }, { mobileNumber: qRegex }, { city: qRegex }, { village: qRegex }] },
        ];
        delete filter.$or;
      } else {
        filter.$or = [{ name: qRegex }, { mobileNumber: qRegex }, { city: qRegex }, { village: qRegex }];
      }
    }

    let users = await UserModel.find(filter)
      .select("-password")
      .limit(query ? 50 : 200)
      .lean();

    // Ensure all community admins are in the returned list
    for (const adm of communityAdminDocs) {
      if (adm.role !== "super-admin") {
        const alreadyInList = users.some(
          (u: any) => u.mobileNumber === adm.mobileNumber || String(u._id) === String(adm._id)
        );
        if (!alreadyInList) {
          const admObj = { ...adm };
          delete (admObj as any).password;
          users.unshift(admObj as any);
        }
      }
    }

    return Response.json(users);
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const UserModel = await getTenantUserModel(request);
    const body = await request.json();
    const newUser = await UserModel.create(body);
    return Response.json(newUser, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to create user" }, { status: 400 });
  }
}

