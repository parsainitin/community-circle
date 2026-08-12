"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupService = exports.GroupService = void 0;
const Group_1 = require("../models/Group");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class GroupService {
    /**
     * Register a group or retrieve an existing record
     */
    async findOrCreateGroup(groupJid, groupName) {
        let group = await Group_1.Group.findOne({ groupJid });
        if (!group) {
            group = await Group_1.Group.create({
                groupJid,
                groupName: groupName || 'Unnamed Group',
                status: 'PENDING',
                isActive: true,
                subscribedTopics: ['general'],
            });
            console.log(`[GroupService] Registered new group: ${groupName} (${groupJid}) - Status: PENDING`);
        }
        else if (groupName && group.groupName !== groupName) {
            group.groupName = groupName;
            await group.save();
        }
        return group;
    }
    /**
     * Fetch all existing WhatsApp groups from Evolution API and sync them into MongoDB Atlas
     */
    async syncAllWhatsAppGroupsFromEvolution() {
        const baseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
        const apiKey = process.env.EVOLUTION_API_KEY || 'whastflow_dev_secret_key';
        const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'whastflow_bot';
        try {
            console.log(`[GroupService] Fetching all existing WhatsApp groups from Evolution API instance "${instanceName}"...`);
            const response = await axios_1.default.get(`${baseURL}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
                headers: { apikey: apiKey },
                timeout: 15000,
            });
            const fetchedGroups = response.data || [];
            console.log(`[GroupService] Retrieved ${fetchedGroups.length} groups from WhatsApp account.`);
            const syncedGroups = [];
            for (const item of fetchedGroups) {
                const groupJid = item.id || item.jid || item.groupJid;
                const groupName = item.subject || item.name || item.groupName || 'WhatsApp Group';
                if (groupJid && groupJid.endsWith('@g.us')) {
                    const group = await this.findOrCreateGroup(groupJid, groupName);
                    syncedGroups.push(group);
                }
            }
            return {
                syncedCount: syncedGroups.length,
                groups: syncedGroups,
            };
        }
        catch (error) {
            console.error('[GroupService] Error syncing groups from Evolution API:', error?.response?.data || error.message);
            throw error;
        }
    }
    /**
     * Update group verification status
     */
    async updateStatus(groupJid, status, verifiedByUser) {
        const updateData = {
            status,
            updatedAt: new Date(),
        };
        if (status === 'VERIFIED') {
            updateData.verifiedByUser = verifiedByUser || 'SYSTEM_ADMIN';
            updateData.verifiedAt = new Date();
        }
        const group = await Group_1.Group.findOneAndUpdate({ groupJid }, { $set: updateData }, { new: true });
        if (group) {
            console.log(`[GroupService] Group ${groupJid} status updated to ${status}`);
        }
        return group;
    }
    /**
     * Update group subscribed topics
     */
    async updateSubscribedTopics(groupJid, topics) {
        return Group_1.Group.findOneAndUpdate({ groupJid }, { $set: { subscribedTopics: topics, updatedAt: new Date() } }, { new: true });
    }
    /**
     * Retrieve active verified groups matching specified topics
     */
    async getTargetBroadcastGroups(topics = ['general']) {
        const query = {
            status: 'VERIFIED',
            isActive: true,
        };
        if (topics && topics.length > 0 && !topics.includes('*')) {
            query.subscribedTopics = { $in: topics };
        }
        return Group_1.Group.find(query).exec();
    }
    /**
     * List all groups with optional status filter
     */
    async listGroups(status) {
        const query = status ? { status } : {};
        return Group_1.Group.find(query).sort({ createdAt: -1 }).exec();
    }
}
exports.GroupService = GroupService;
exports.groupService = new GroupService();
