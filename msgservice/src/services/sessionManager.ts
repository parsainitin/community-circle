import axios from 'axios';
import { WhatsAppSession } from '../models/WhatsAppSession';

const EVOLUTION_BASE = () => (process.env.EVOLUTION_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
const EVOLUTION_KEY = () => (process.env.EVOLUTION_API_KEY || 'whastflow_dev_secret_key').trim();
const DEFAULT_INSTANCE = () => (process.env.EVOLUTION_INSTANCE_NAME || 'whastflow_bot').trim();

/**
 * Derive a scoped instance name for a given phone number.
 * Format: cc_{digits}  e.g. cc_919644019992
 * Falls back to the global whastflow_bot if no phone supplied.
 */
export function resolveInstanceName(
  phoneNumber?: string,
  explicitInstanceName?: string,
  platform: string = 'community-circle'
): string {
  if (explicitInstanceName && explicitInstanceName.trim()) {
    return explicitInstanceName.trim();
  }
  if (phoneNumber && phoneNumber.trim()) {
    const digits = phoneNumber.trim().replace(/\D/g, '');
    return `cc_${digits}`;
  }
  return DEFAULT_INSTANCE();
}

/**
 * Touch the session's lastActiveAt timestamp.
 * Called on every message send, status poll, or pairing code request.
 */
export async function touchSession(instanceName: string): Promise<void> {
  try {
    await WhatsAppSession.updateOne(
      { instanceName },
      { $set: { lastActiveAt: new Date(), status: 'open' } },
      { upsert: false }
    );
  } catch (err) {
    // Non-blocking — log only
    console.warn(`[SessionManager] Could not touch session "${instanceName}":`, err);
  }
}

/**
 * Upsert (create or update) a session record when a connection is initiated.
 */
export async function upsertSession(
  instanceName: string,
  phoneNumber: string,
  platform: string = 'community-circle',
  autoDisconnectMinutes: number = 10
): Promise<void> {
  try {
    await WhatsAppSession.updateOne(
      { instanceName },
      {
        $set: {
          phoneNumber,
          platform,
          autoDisconnectMinutes,
          lastActiveAt: new Date(),
          status: 'connecting',
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn(`[SessionManager] Could not upsert session "${instanceName}":`, err);
  }
}

/**
 * Mark a session as open (connected).
 */
export async function markSessionOpen(instanceName: string): Promise<void> {
  try {
    await WhatsAppSession.updateOne(
      { instanceName },
      { $set: { status: 'open', lastActiveAt: new Date() } }
    );
  } catch (err) {
    console.warn(`[SessionManager] Could not mark session open "${instanceName}":`, err);
  }
}

/**
 * Disconnect a specific instance in Evolution API and mark it in DB.
 * Used both by the reaper (idle) and by user logout.
 */
export async function disconnectSession(instanceName: string, reason: string = 'manual'): Promise<void> {
  const baseURL = EVOLUTION_BASE();
  const apiKey = EVOLUTION_KEY();

  console.log(`[SessionManager] Disconnecting instance "${instanceName}" (reason: ${reason})`);

  try {
    // Logout from Evolution API (graceful)
    await axios.delete(`${baseURL}/instance/logout/${instanceName}`, {
      headers: { apikey: apiKey },
      timeout: 8000,
    });
  } catch (err: any) {
    // Not a fatal error — instance may already be logged out
    console.warn(`[SessionManager] Evolution API logout for "${instanceName}":`, err?.response?.data || err.message);
  }

  // Update DB status regardless
  try {
    await WhatsAppSession.updateOne(
      { instanceName },
      { $set: { status: 'disconnected', lastActiveAt: new Date() } }
    );
  } catch (err) {
    console.warn(`[SessionManager] Could not update session status to disconnected for "${instanceName}":`, err);
  }
}

/**
 * List all currently active/open sessions.
 */
export async function listActiveSessions(): Promise<ISessionSummary[]> {
  const sessions = await WhatsAppSession.find({ status: { $in: ['open', 'connecting'] } })
    .select('instanceName phoneNumber platform status lastActiveAt autoDisconnectMinutes')
    .lean();

  return sessions.map((s) => ({
    instanceName: s.instanceName,
    phoneNumber: s.phoneNumber,
    platform: s.platform,
    status: s.status,
    lastActiveAt: s.lastActiveAt,
    idleMinutes: Math.floor((Date.now() - new Date(s.lastActiveAt).getTime()) / 60000),
    autoDisconnectMinutes: s.autoDisconnectMinutes,
  }));
}

export interface ISessionSummary {
  instanceName: string;
  phoneNumber: string;
  platform: string;
  status: string;
  lastActiveAt: Date;
  idleMinutes: number;
  autoDisconnectMinutes: number;
}
