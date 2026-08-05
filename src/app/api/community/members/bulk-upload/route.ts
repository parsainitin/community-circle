import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getTenantId } from "@/lib/tenant";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function normalizeSex(val?: any): string {
  if (!val) return "Male";
  const s = String(val).trim().toLowerCase();
  if (s === "female" || s === "f" || s === "woman" || s === "girl") return "Female";
  if (s === "male" || s === "m" || s === "man" || s === "boy") return "Male";
  if (s === "other" || s === "transgender") return "Other";
  if (s.includes("prefer")) return "Prefer not to say";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeMaritalStatus(val?: any): string {
  if (!val) return "Single";
  const m = String(val).trim().toLowerCase();
  if (m === "single" || m === "unmarried") return "Single";
  if (m === "married") return "Married";
  if (m === "divorced") return "Divorced";
  if (m === "widowed" || m === "widow") return "Widowed";
  if (m === "separated") return "Separated";
  return m.charAt(0).toUpperCase() + m.slice(1);
}

function normalizeBloodGroup(val?: any): string | undefined {
  if (!val) return undefined;
  const bg = String(val).trim().toUpperCase();
  const valid = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  if (valid.includes(bg)) return bg;
  return undefined;
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

      // Extract & Normalize optional fields
      const village = row.village || row.Village || undefined;
      const address = row.address || row.Address || undefined;
      const gotra = row.gotra || row.Gotra || undefined;
      const kulDevi = row.kulDevi || row.KulDevi || row["Kul Devi"] || undefined;
      const age = row.age || row.Age ? Number(row.age || row.Age) : undefined;
      const rawSex = row.sex || row.Sex || row.Gender || row.gender;
      const rawMarital = row.maritalStatus || row.MaritalStatus || row["Marital Status"] || row.marital_status;
      const rawBlood = row.bloodGroup || row.BloodGroup || row["Blood Group"] || row.blood_group;
      const education = row.education || row.Education || undefined;
      const institution = row.institution || row.Institution || undefined;
      const occupationType = row.occupationType || row.OccupationType || row["Occupation Type"] || undefined;
      const profession = row.profession || row.Profession || undefined;
      const company = row.company || row.Company || undefined;

      const sex = normalizeSex(rawSex);
      const maritalStatus = normalizeMaritalStatus(rawMarital);
      const bloodGroup = normalizeBloodGroup(rawBlood);

      try {
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
          sex,
          maritalStatus,
          bloodGroup,
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
      } catch (rowErr: any) {
        skippedCount++;
        errors.push(`Row ${i + 1} (${name}): ${rowErr.message || "Failed to create user"}`);
      }
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
