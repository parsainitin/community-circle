import { WhatsAppSession } from '../models/WhatsAppSession';
import { disconnectSession } from './sessionManager';

const REAPER_INTERVAL_MS = 60 * 1000; // Run every 60 seconds

let reaperTimer: NodeJS.Timeout | null = null;

/**
 * Scans all active WhatsApp sessions and disconnects any that have been idle
 * beyond their configured autoDisconnectMinutes threshold.
 */
async function runReaperCycle(): Promise<void> {
  try {
    const now = new Date();

    // Find all sessions that are 'open' or 'connecting' and have a lastActiveAt set
    const activeSessions = await WhatsAppSession.find({
      status: { $in: ['open', 'connecting'] },
      lastActiveAt: { $exists: true },
    }).lean();

    for (const session of activeSessions) {
      const idleMs = now.getTime() - new Date(session.lastActiveAt).getTime();
      const idleMinutes = idleMs / 60000;
      const threshold = session.autoDisconnectMinutes ?? 10;

      if (idleMinutes >= threshold) {
        console.log(
          `[SessionReaper] Instance "${session.instanceName}" idle for ${idleMinutes.toFixed(1)} min ` +
            `(threshold: ${threshold} min). Disconnecting...`
        );
        await disconnectSession(session.instanceName, 'idle-timeout');
      }
    }
  } catch (err) {
    console.error('[SessionReaper] Cycle error:', err);
  }
}

/**
 * Starts the background session reaper worker.
 * Runs once immediately, then on a 60-second interval.
 */
export function startSessionReaper(): void {
  if (reaperTimer) {
    console.warn('[SessionReaper] Already running — skipping re-init.');
    return;
  }

  console.log('[SessionReaper] Starting idle session cleanup worker (every 60s)...');

  // Run immediately on boot to clean up leftover sessions from previous deploy
  runReaperCycle();

  reaperTimer = setInterval(() => {
    runReaperCycle();
  }, REAPER_INTERVAL_MS);

  // Allow Node.js to exit even if timer is running
  if (reaperTimer.unref) {
    reaperTimer.unref();
  }
}

/**
 * Stops the session reaper (for clean shutdown).
 */
export function stopSessionReaper(): void {
  if (reaperTimer) {
    clearInterval(reaperTimer);
    reaperTimer = null;
    console.log('[SessionReaper] Stopped.');
  }
}
