const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const BroadcastLogSchema = new mongoose.Schema({}, { strict: false });
const BroadcastLog = mongoose.model('BroadcastLog', BroadcastLogSchema, 'broadcastlogs');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  
  console.log('--- RECENT DIRECT MESSAGE LOGS ---');
  const logs = await BroadcastLog.find({ topics: 'direct_message' }).sort({ createdAt: -1 }).limit(5);
  console.log(JSON.stringify(logs, null, 2));

  await mongoose.disconnect();
}

check();
