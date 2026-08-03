import { User } from "../src/models/User";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

function parseEnvUri(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    const match = content.match(/^MONGODB_URI\s*=\s*(.*)$/m);
    return match ? match[1].trim() : null;
  } catch (e) {
    return null;
  }
}

async function run() {
  const projectRoot = ".";
  const prodUri = parseEnvUri(path.join(projectRoot, ".env.production"));

  if (!prodUri) {
    console.error("Production URI not found!");
    process.exit(1);
  }

  try {
    const conn = await mongoose.createConnection(prodUri).asPromise();
    const UserM = conn.model("User", User.schema);
    const users = await UserM.find({ mobileNumber: "9999912345" }).lean();
    console.log("Production users with 9999912345:", users);
    await conn.close();
    process.exit(0);
  } catch (err: any) {
    console.error("Error:", err.message || err);
    process.exit(1);
  }
}

run();
