"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGroupTopics = exports.updateGroupStatus = exports.registerGroup = exports.syncWhatsAppGroups = exports.listGroups = void 0;
const groupService_1 = require("../services/groupService");
const listGroups = async (req, res) => {
    try {
        const status = req.query.status;
        const groups = await groupService_1.groupService.listGroups(status);
        res.status(200).json({ success: true, count: groups.length, data: groups });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.listGroups = listGroups;
const syncWhatsAppGroups = async (req, res) => {
    try {
        const result = await groupService_1.groupService.syncAllWhatsAppGroupsFromEvolution();
        res.status(200).json({
            success: true,
            message: `Successfully synced ${result.syncedCount} WhatsApp groups into MongoDB Atlas.`,
            syncedCount: result.syncedCount,
            data: result.groups,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.syncWhatsAppGroups = syncWhatsAppGroups;
const registerGroup = async (req, res) => {
    try {
        const { groupJid, groupName } = req.body;
        if (!groupJid) {
            res.status(400).json({ success: false, error: 'groupJid is required' });
            return;
        }
        const group = await groupService_1.groupService.findOrCreateGroup(groupJid, groupName);
        res.status(201).json({ success: true, data: group });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.registerGroup = registerGroup;
const updateGroupStatus = async (req, res) => {
    try {
        const { groupJid } = req.params;
        const { status, verifiedByUser } = req.body;
        const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED', 'DISABLED'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
            return;
        }
        const updatedGroup = await groupService_1.groupService.updateStatus(groupJid, status, verifiedByUser);
        if (!updatedGroup) {
            res.status(404).json({ success: false, error: 'Group not found' });
            return;
        }
        res.status(200).json({ success: true, data: updatedGroup });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.updateGroupStatus = updateGroupStatus;
const updateGroupTopics = async (req, res) => {
    try {
        const { groupJid } = req.params;
        const { topics } = req.body;
        if (!Array.isArray(topics)) {
            res.status(400).json({ success: false, error: 'topics must be an array of strings' });
            return;
        }
        const updatedGroup = await groupService_1.groupService.updateSubscribedTopics(groupJid, topics);
        if (!updatedGroup) {
            res.status(404).json({ success: false, error: 'Group not found' });
            return;
        }
        res.status(200).json({ success: true, data: updatedGroup });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.updateGroupTopics = updateGroupTopics;
