import { Request, Response } from 'express';
import { groupService } from '../services/groupService';

export const listGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const groups = await groupService.listGroups(status);
    res.status(200).json({ success: true, count: groups.length, data: groups });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const syncWhatsAppGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await groupService.syncAllWhatsAppGroupsFromEvolution();
    res.status(200).json({
      success: true,
      message: `Successfully synced ${result.syncedCount} WhatsApp groups into MongoDB Atlas.`,
      syncedCount: result.syncedCount,
      data: result.groups,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const registerGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupJid, groupName } = req.body;
    if (!groupJid) {
      res.status(400).json({ success: false, error: 'groupJid is required' });
      return;
    }

    const group = await groupService.findOrCreateGroup(groupJid, groupName);
    res.status(201).json({ success: true, data: group });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateGroupStatus = async (req: Request, res: Response): Promise<void> => {
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

    const updatedGroup = await groupService.updateStatus(groupJid, status, verifiedByUser);
    if (!updatedGroup) {
      res.status(404).json({ success: false, error: 'Group not found' });
      return;
    }

    res.status(200).json({ success: true, data: updatedGroup });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateGroupTopics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupJid } = req.params;
    const { topics } = req.body;

    if (!Array.isArray(topics)) {
      res.status(400).json({ success: false, error: 'topics must be an array of strings' });
      return;
    }

    const updatedGroup = await groupService.updateSubscribedTopics(groupJid, topics);
    if (!updatedGroup) {
      res.status(404).json({ success: false, error: 'Group not found' });
      return;
    }

    res.status(200).json({ success: true, data: updatedGroup });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
