import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getTenantId } from "@/lib/tenant";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// POST /api/community/members/bulk-upload - Bulk import members via CSV/JSON
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { callerMobile, membersData } = body;

    const callerHeaderMobile = request.headers.get("x-caller-mobile") || callerMobile;

    if (!callerHeaderMobile) {
      return Response.json({ error: "Unauthorized: Admin mobile number required" }, { status: 401 });
    }

    const caller = await User.findOne({ mobileNumber: callerHeaderMobile }).lean();
    if (!caller || (caller.role !== "admin" && caller.role !== "super-admin")) {
      return Response.json({ error: "Forbidden: Only community admins can bulk upload members" }, { status: 403 });
    }

    const communityId = caller.communityId || (await getTenantId(request)) || undefined;

    if (!Array.isArray(membersData) || membersData.length === 0) {
      return Response.json({ error: "No member data provided for upload" }, { status: 400 });
    }

    const defaultHashedPassword = hashPassword("Community123");

    let addedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < membersData.length; i++) {
      const row = membersData[i];
      const rawName = row.name || row.Name || row["Full Name"] || row["full_name"];
      const rawMobile = row.mobileNumber || row.Mobile || row.Phone || row["Mobile Number"] || row["mobile_number"];
      const rawCity = row.city || row.City || row["City"];

      if (!rawName || !rawMobile || !rawCity) {
        skippedCount++;
        errors.push(`Row ${i + 1}: Missing Name, Mobile Number, or City`);
        continue;
      }

      const name = String(rawName).trim();
      const mobileNumber = String(rawMobile).trim().replace(/\D/g, "");
      const city = String(rawCity).trim();

      if (mobileNumber.length < 10) {
        skippedCount++;
        errors.push(`Row ${i + 1} (${name}): Invalid mobile number format (${rawMobile})`);
        continue;
      }

      // Check if user already exists
      const existing = await User.findOne({ mobileNumber });
      if (existing) {
        skippedCount++;
        errors.push(`Row ${i + 1} (${name}): Mobile number ${mobileNumber} already registered`);
        continue;
      }

      // Extract optional fields
      const village = row.village || row.Village || undefined;
      const address = row.address || row.Address || undefined;
      const gotra = row.gotra || row.Gotra || undefined;
      const kulDevi = row.kulDevi || row.KulDevi || row["Kul Devi"] || undefined;
      const age = row.age || row.Age ? Number(row.age || row.Age) : undefined;
      const sex = row.sex || row.Sex || row.Gender || "Male";
      const maritalStatus = row.maritalStatus || row.MaritalStatus || row["Marital Status"] || "Single";
      const bloodGroup = row.bloodGroup || row.BloodGroup || row["Blood Group"] || undefined;
      const education = row.education || row.Education || undefined;
      const institution = row.institution || row.Institution || undefined;
      const occupationType = row.occupationType || row.OccupationType || row["Occupation Type"] || undefined;
      const profession = row.profession || row.Profession || undefined;
      const company = row.company || row.Company || undefined;

      await User.create({
        name,
        phone: mobileNumber,
        mobileNumber,
        password: defaultHashedPassword, // Default password "Community123"
        city,
        village: village ? String(village).trim() : undefined,
        address: address ? String(address).trim() : undefined,
        gotra: gotra ? String(gotra).trim() : undefined,
        kulDevi: kulDevi ? String(kulDevi).trim() : undefined,
        age: age && !isNaN(age) ? age : undefined,
        sex: String(sex).trim(),
        maritalStatus: String(maritalStatus).trim(),
        bloodGroup: bloodGroup ? String(bloodGroup).trim() : undefined,
        education: education ? String(education).trim() : undefined,
        institution: institution ? String(institution).trim() : undefined,
        occupationType: occupationType ? String(occupationType).trim() : undefined,
        profession: profession ? String(profession).trim() : undefined,
        company: company ? String(company).trim() : undefined,
        role: "member",
        status: "approved", // Bulk uploaded by admin, automatically approved
        communityId,
      });

      addedCount++;
    }

    return Response.json({
      success: true,
      addedCount,
      skippedCount,
      errors,
      message: `Successfully imported ${addedCount} members (${skippedCount} skipped).`,
    });
  } catch (error: any) {
    return Response.json({ error: error.message || "Bulk upload failed" }, { status: 500 });
  }
}
