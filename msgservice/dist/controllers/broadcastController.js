"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBroadcastStatus = exports.triggerBroadcast = void 0;
const broadcastQueue_1 = require("../queues/broadcastQueue");
const BroadcastLog_1 = require("../models/BroadcastLog");
const groupService_1 = require("../services/groupService");
const triggerBroadcast = async (req, res) => {
    try {
        const { title, content, topics } = req.body;
        if (!title || !content) {
            res.status(400).json({ success: false, error: 'title and content are required' });
            return;
        }
        const broadcastTopics = Array.isArray(topics) && topics.length > 0 ? topics : ['general'];
        const broadcastId = `bcast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        // Count target groups to store initial metric
        const targetGroups = await groupService_1.groupService.getTargetBroadcastGroups(broadcastTopics);
        // Create BroadcastLog record
        const broadcastLog = await BroadcastLog_1.BroadcastLog.create({
            broadcastId,
            title,
            content,
            topics: broadcastTopics,
            totalTargetGroups: targetGroups.length,
            status: 'PENDING',
        });
        // Enqueue job into BullMQ
        await broadcastQueue_1.broadcastQueue.add('send-broadcast', {
            broadcastId,
            title,
            content,
            topics: broadcastTopics,
        });
        console.log(`[Broadcast API] Triggered broadcast ${broadcastId} for ${targetGroups.length} target groups.`);
        res.status(202).json({
            success: true,
            message: 'Broadcast job queued successfully',
            data: {
                broadcastId,
                targetGroupCount: targetGroups.length,
                status: 'PENDING',
            },
        });
    }
    catch (error) {
        console.error('[Broadcast API] Error triggering broadcast:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.triggerBroadcast = triggerBroadcast;
const getBroadcastStatus = async (req, res) => {
    try {
        const { broadcastId } = req.params;
        const log = await BroadcastLog_1.BroadcastLog.findOne({ broadcastId });
        if (!log) {
            res.status(404).json({ success: false, error: 'Broadcast log not found' });
            return;
        }
        res.status(200).json({ success: true, data: log });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getBroadcastStatus = getBroadcastStatus;
