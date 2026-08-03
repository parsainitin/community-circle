import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mobileNumber = searchParams.get("mobileNumber");
  const email = searchParams.get("email");

  if (!mobileNumber && !email) {
    return Response.json({ error: "Provide mobileNumber or email" }, { status: 400 });
  }

  await dbConnect();

  const result: { mobileExists?: boolean; emailExists?: boolean } = {};

  if (mobileNumber) {
    result.mobileExists = !!(await User.exists({ mobileNumber }));
  }
  if (email) {
    result.emailExists = !!(await User.exists({ email: email.toLowerCase() }));
  }

  return Response.json(result);
}
