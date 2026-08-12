import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { getTenantUserModel } from "@/models/User";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mobileNumber = searchParams.get("mobileNumber");
  const email = searchParams.get("email");

  if (!mobileNumber && !email) {
    return Response.json({ error: "Provide mobileNumber or email" }, { status: 400 });
  }

  await dbConnect();
  const UserModel = await getTenantUserModel(request);

  const result: { mobileExists?: boolean; emailExists?: boolean } = {};

  if (mobileNumber) {
    const cleanMobile = mobileNumber.trim();
    const digits = cleanMobile.replace(/\D/g, "");
    const mobileQuery = {
      $or: [
        { mobileNumber: cleanMobile },
        { mobile: cleanMobile },
        { phone: cleanMobile },
        ...(digits.length >= 10 ? [{ mobile: { $regex: digits.slice(-10) + "$" } }] : []),
        ...(digits.length >= 10 ? [{ mobileNumber: { $regex: digits.slice(-10) + "$" } }] : []),
        ...(digits.length >= 10 ? [{ phone: { $regex: digits.slice(-10) + "$" } }] : []),
      ],
    };
    result.mobileExists = !!(await UserModel.exists(mobileQuery));
  }

  if (email) {
    result.emailExists = !!(await UserModel.exists({ email: email.toLowerCase() }));
  }

  return Response.json(result);
}

