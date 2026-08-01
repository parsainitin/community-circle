import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    
    let filter = {};
    if (query) {
      filter = { name: { $regex: query, $options: "i" } };
    }

    const users = await User.find(filter).populate("familyMembers", "name phone");
    return Response.json(users);
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const newUser = await User.create(body);
    return Response.json(newUser, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to create user" }, { status: 400 });
  }
}
