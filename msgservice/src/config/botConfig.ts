import dotenv from 'dotenv';

dotenv.config();

let currentTriggerTag = (process.env.BOT_TRIGGER_TAG || '@jbs').trim();
if (!currentTriggerTag.startsWith('@')) {
  currentTriggerTag = `@${currentTriggerTag}`;
}

export const getBotTriggerTag = (): string => currentTriggerTag;

export const setBotTriggerTag = (newTag: string): string => {
  let tag = newTag.trim();
  if (!tag) return currentTriggerTag;
  
  if (!tag.startsWith('@')) {
    tag = `@${tag}`;
  }
  
  currentTriggerTag = tag;
  console.log(`[BotConfig] Updated Bot Trigger Tag to: ${currentTriggerTag}`);
  return currentTriggerTag;
};
