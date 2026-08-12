import mongoose from "mongoose";
import crypto from "crypto";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/comcircle";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

async function seedSuperAdmin() {
  const mobileNumber = process.argv[2] || "9999999999";
  const rawPassword = process.argv[3] || "Admin@123456";
  const name = process.argv[4] || "Super Admin";

  console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);

  const UserSchema = new mongoose.Schema(
    {
      name: String,
      phone: String,
      mobileNumber: String,
      password: String,
      role: String,
      status: String,
      city: String,
    },
    { timestamps: true, collection: "users" }
  );

  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const hashedPassword = hashPassword(rawPassword);

  const filter = { role: "super-admin" };
  const update = {
    $set: {
      name,
      mobileNumber,
      phone: mobileNumber,
      password: hashedPassword,
      role: "super-admin",
      status: "approved",
      city: "Platform",
    },
  };

  const options = { upsert: true, new: true };
  const superAdmin = await User.findOneAndUpdate(filter, update, options);

  console.log("-----------------------------------------");
  console.log("Super Admin user created/updated successfully!");
  console.log(`Name:          ${superAdmin.name}`);
  console.log(`Mobile Number: ${superAdmin.mobileNumber}`);
  console.log(`Password:      ${rawPassword}`);
  console.log(`Role:          ${superAdmin.role}`);
  console.log(`Status:        ${superAdmin.status}`);
  console.log("-----------------------------------------");

  await mongoose.disconnect();
}

seedSuperAdmin().catch((err) => {
  console.error("Error creating super-admin:", err);
  process.exit(1);
});
