import mongoose from 'mongoose';
import { groupService } from '../src/services/groupService';
import { Group } from '../src/models/Group';

describe('GroupService & Model Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whastflow_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await Group.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Group.deleteMany({});
  });

  it('should register a new group in PENDING status', async () => {
    const groupJid = '1203630123456789@g.us';
    const groupName = 'Tech Announcement Group';

    const group = await groupService.findOrCreateGroup(groupJid, groupName);

    expect(group).toBeDefined();
    expect(group.groupJid).toBe(groupJid);
    expect(group.groupName).toBe(groupName);
    expect(group.status).toBe('PENDING');
    expect(group.isActive).toBe(true);
    expect(group.subscribedTopics).toContain('general');
  });

  it('should update group status to VERIFIED', async () => {
    const groupJid = '1203630987654321@g.us';
    await groupService.findOrCreateGroup(groupJid, 'Dev Updates');

    const updated = await groupService.updateStatus(groupJid, 'VERIFIED', '+1234567890');

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('VERIFIED');
    expect(updated?.verifiedByUser).toBe('+1234567890');
    expect(updated?.verifiedAt).toBeDefined();
  });

  it('should retrieve target broadcast groups correctly', async () => {
    // 1. Pending group (should be excluded)
    await groupService.findOrCreateGroup('g1@g.us', 'Group 1');

    // 2. Verified group with general topic (should be included)
    const g2 = await groupService.findOrCreateGroup('g2@g.us', 'Group 2');
    await groupService.updateStatus('g2@g.us', 'VERIFIED');
    await groupService.updateSubscribedTopics('g2@g.us', ['announcements']);

    // 3. Verified group with engineering topic (should be included when requested)
    const g3 = await groupService.findOrCreateGroup('g3@g.us', 'Group 3');
    await groupService.updateStatus('g3@g.us', 'VERIFIED');
    await groupService.updateSubscribedTopics('g3@g.us', ['engineering_updates']);

    const targetGroups = await groupService.getTargetBroadcastGroups(['announcements']);

    expect(targetGroups.length).toBe(1);
    expect(targetGroups[0].groupJid).toBe('g2@g.us');
  });
});
