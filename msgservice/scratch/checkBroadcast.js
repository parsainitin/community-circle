const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const BroadcastLogSchema = new mongoose.Schema({}, { strict: false });
const GroupSchema = new mongoose.Schema({}, { strict: false });

const BroadcastLog = mongoose.model('BroadcastLog', BroadcastLogSchema, 'broadcastlogs');
const Group = mongoose.model('Group', GroupSchema, 'groups');

async function inspect() {
  await mongoose.connect(process.env.MONGO_URI);
  
  console.log('--- ALL GROUPS ---');
  const groups = await Group.find({});
  console.log(JSON.stringify(groups, null, 2));

  console.log('--- LATEST BROADCAST LOGS ---');
  const logs = await BroadcastLog.find({}).sort({ createdAt: -1 }).limit(5);
  console.log(JSON.stringify(logs, null, 2));

  await mongoose.disconnect();
}

inspect();
