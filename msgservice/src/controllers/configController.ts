import { Request, Response } from 'express';
import { getBotTriggerTag, setBotTriggerTag } from '../config/botConfig';

export const getBotConfig = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    triggerTag: getBotTriggerTag(),
  });
};

export const updateBotConfig = (req: Request, res: Response): void => {
  try {
    const { triggerTag } = req.body;
    if (!triggerTag || typeof triggerTag !== 'string') {
      res.status(400).json({ success: false, error: 'triggerTag string is required (e.g. @jbs)' });
      return;
    }

    const updatedTag = setBotTriggerTag(triggerTag);
    res.status(200).json({
      success: true,
      message: `Bot trigger tag updated to ${updatedTag}`,
      triggerTag: updatedTag,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
