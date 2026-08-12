const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/comcircle";

async function main() {
  console.log("Connecting to MongoDB:", MONGO_URI);
  await mongoose.connect(MONGO_URI);

  const UserSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.model("User", UserSchema, "users");

  const totalUsersBefore = await User.countDocuments({});
  console.log(`Total users in DB before cleanup: ${totalUsersBefore}`);

  const admins = await User.find({ role: { $in: ["admin", "super-admin"] } }).select("name mobileNumber role");
  console.log(`\nFound ${admins.length} admin / super-admin account(s) to KEEP:`);
  admins.forEach((a) => console.log(`  • ${a.get("name")} (${a.get("mobileNumber")}) [${a.get("role")}]`));

  // Delete all users whose role is NOT admin and NOT super-admin (or role is 'member')
  const result = await User.deleteMany({ role: { $nin: ["admin", "super-admin"] } });

  console.log(`\n✅ Successfully deleted ${result.deletedCount} member accounts.`);
  const totalUsersAfter = await User.countDocuments({});
  console.log(`Total remaining users in DB: ${totalUsersAfter}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Error cleaning up members:", err);
  process.exit(1);
});
