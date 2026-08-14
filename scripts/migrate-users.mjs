import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read production env URI if present
let envUri = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.production'), 'utf-8');
  const match = envContent.match(/^MONGODB_URI=(.*)$/m);
  if (match && match[1]) {
    envUri = match[1].trim();
  }
} catch (e) {
  // Fallback to hardcoded PROD URI
}

const MONGODB_URI = envUri || 'mongodb+srv://parsainitin_db_user:Shri214Ji%5EIndia~@cluster0.ur6sfhr.mongodb.net/comcircle';
const JBS_COMMUNITY_ID = '6a7c2e225b3387af833ec8c8';
const SUPER_ADMIN_ID = '6a702d0aedc038dc110a2c8d';

async function migrateUsers() {
  console.log("Connecting to production MongoDB Atlas...");
  const conn = await mongoose.connect(MONGODB_URI);

  try {
    const comcircleDb = conn.connection.useDb('comcircle');
    const jbsDb = conn.connection.useDb('comicircle_jbs');

    const comcircleUsersColl = comcircleDb.collection('users');
    const jbsUsersColl = jbsDb.collection('users');

    // Query all users from comcircle
    const allUsers = await comcircleUsersColl.find({}).toArray();

    // Filter out super-admin and Twarita / Nitin accounts
    const targetUsers = allUsers.filter(user => {
      if (user._id.toString() === SUPER_ADMIN_ID) {
        return false;
      }
      const nameLower = (user.name || '').toLowerCase();
      if (nameLower.includes('twarita') || nameLower.includes('nitin')) {
        return false;
      }
      return true;
    });

    const excludedUsers = allUsers.filter(user => !targetUsers.includes(user));

    console.log(`\n--- EXCLUSION SUMMARY ---`);
    console.log(`Excluded ${excludedUsers.length} users from migration:`);
    excludedUsers.forEach(u => console.log(` - ID: ${u._id}, Name: ${u.name}, Role: ${u.role}`));

    console.log(`\n--- MIGRATION SUMMARY ---`);
    console.log(`Found ${targetUsers.length} users to migrate into 'comicircle_jbs':`);
    targetUsers.forEach(u => console.log(` - ID: ${u._id}, Name: ${u.name}, Mobile/Phone: ${u.mobileNumber || u.phone}`));

    // Perform upsert into comicircle_jbs
    console.log(`\nLoading users into 'comicircle_jbs.users'...`);
    let migratedCount = 0;

    for (const user of targetUsers) {
      // Set communityId to JBS communityId while keeping _id and all other fields intact
      const updatedUser = {
        ...user,
        communityId: new mongoose.Types.ObjectId(JBS_COMMUNITY_ID),
      };

      const result = await jbsUsersColl.replaceOne(
        { _id: user._id },
        updatedUser,
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        console.log(` [INSERTED] ${user.name} (_id: ${user._id})`);
      } else if (result.modifiedCount > 0) {
        console.log(` [UPDATED]  ${user.name} (_id: ${user._id})`);
      } else {
        console.log(` [NO CHANGE] ${user.name} (_id: ${user._id})`);
      }
      migratedCount++;
    }

    console.log(`\nSuccessfully processed ${migratedCount} user documents into 'comicircle_jbs'.`);

    // Verify final state of comicircle_jbs.users
    const finalJBSUsers = await jbsUsersColl.find({}).toArray();
    console.log(`\n--- FINAL 'comicircle_jbs.users' COLLECTION STATE (${finalJBSUsers.length} Users) ---`);
    finalJBSUsers.forEach((u, idx) => {
      console.log(`${idx + 1}. ID: ${u._id} | Name: ${u.name} | Mobile: ${u.mobileNumber || u.phone} | Role: ${u.role} | Community: ${u.communityId}`);
    });

  } catch (error) {
    console.error("Migration failed with error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("\nMongoDB connection closed.");
  }
}

migrateUsers();
