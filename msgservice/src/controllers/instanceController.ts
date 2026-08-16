import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import {
  resolveInstanceName,
  upsertSession,
  markSessionOpen,
  touchSession,
  disconnectSession,
  listActiveSessions,
} from '../services/sessionManager';

dotenv.config();

function formatPhoneNumber(rawNum: string): string {
  let cleaned = rawNum.trim().replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

function isValidPairingCode(code: any): boolean {
  if (!code || typeof code !== 'string') return false;
  const clean = code.trim();
  return clean.length >= 6 && clean.length <= 15 && !clean.startsWith('2@') && !clean.includes(',');
}

function getEvolutionConfig() {
  const rawBaseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  const baseURL = rawBaseURL.replace(/\/+$/, '');
  const apiKey = (process.env.EVOLUTION_API_KEY || 'whastflow_dev_secret_key').trim();
  return { baseURL, apiKey };
}

/**
 * Resolve instanceName from multiple sources (priority order):
 * 1. req.body.instanceName
 * 2. req.query.instanceName
 * 3. req.headers['x-instance-name']
 * 4. Derived from phoneNumber: cc_{digits}
 * 5. Default whastflow_bot
 */
function resolveInstanceFromRequest(req: Request, phoneNumber?: string): string {
  const explicit =
    (req.body?.instanceName as string) ||
    (req.query?.instanceName as string) ||
    (req.headers['x-instance-name'] as string) ||
    undefined;
  const platform = (req.body?.platform || req.query?.platform || req.headers['x-platform'] || 'community-circle') as string;
  return resolveInstanceName(phoneNumber, explicit, platform);
}

// ─── GET /api/instance/status ────────────────────────────────────────────────

export const getInstanceStatus = async (req: Request, res: Response): Promise<void> => {
  const { baseURL, apiKey } = getEvolutionConfig();
  const rawPhoneNumber = req.query.phoneNumber as string | undefined;
  const phoneNumber = rawPhoneNumber ? formatPhoneNumber(rawPhoneNumber) : undefined;
  const checkOnly = req.query.checkOnly === 'true';
  const platform = (req.query.platform || req.headers['x-platform'] || 'community-circle') as string;
  const instanceName = resolveInstanceFromRequest(req, phoneNumber);

  // Upsert session record so we track this instance
  if (phoneNumber) {
    await upsertSession(instanceName, phoneNumber, platform);
  }

  try {
    // 1. Fetch connection state
    let state = 'UNKNOWN';
    try {
      const stateRes = await axios.get(`${baseURL}/instance/connectionState/${instanceName}`, {
        headers: { apikey: apiKey },
        timeout: 6000,
      });
      state = stateRes.data?.instance?.state || stateRes.data?.state || 'UNKNOWN';
    } catch (err: any) {
      console.warn(`[Instance API] connectionState status ${err.response?.status || err.message}`);
      if (err.response?.status === 404 || err.response?.data?.error?.includes('not found')) {
        console.log(`[Instance API] Creating new instance "${instanceName}" in Evolution API...`);
        try {
          await axios.post(
            `${baseURL}/instance/create`,
            {
              instanceName,
              qrcode: true,
              number: phoneNumber,
              integration: 'WHATSAPP-BAILEYS',
            },
            {
              headers: { apikey: apiKey },
              timeout: 12000,
            }
          );
          state = 'connecting';
        } catch (createErr: any) {
          console.error('[Instance API] Error creating instance:', createErr.response?.data || createErr.message);
        }
      }
    }

    // If online, touch session and return immediately
    if (state === 'open') {
      await markSessionOpen(instanceName);
      res.status(200).json({
        success: true,
        instanceName,
        state: 'open',
        isOnline: true,
        qrCodeBase64: null,
        code: null,
        pairingCode: null,
        error: null,
      });
      return;
    }

    // If checkOnly, do NOT trigger connect
    if (checkOnly) {
      res.status(200).json({
        success: true,
        instanceName,
        state,
        isOnline: false,
        qrCodeBase64: null,
        code: null,
        pairingCode: null,
        error: null,
      });
      return;
    }

    let qrCodeBase64: string | null = null;
    let rawCode: string | null = null;
    let pairingCode: string | null = null;
    let connectErrorDetail: string | null = null;

    // 2. Fetch QR Code (if no phone number)
    if (!phoneNumber) {
      try {
        const connectUrl = `${baseURL}/instance/connect/${instanceName}`;
        console.log(`[Instance API] Requesting QR code from: ${connectUrl}`);
        const connectRes = await axios.get(connectUrl, {
          headers: { apikey: apiKey },
          timeout: 10000,
        });

        qrCodeBase64 = connectRes.data?.base64 || connectRes.data?.qrcode?.base64 || null;
        rawCode = connectRes.data?.code || connectRes.data?.qrcode?.code || null;
      } catch (err: any) {
        connectErrorDetail = err.response?.data?.message || err.response?.data?.error || err.message;
        console.error('[Instance API] QR Connect error:', connectErrorDetail);
      }
    } else {
      // 3. Fetch Pairing Code (if phone number provided)
      try {
        const connectUrl = `${baseURL}/instance/connect/${instanceName}?number=${phoneNumber}`;
        console.log(`[Instance API] Requesting connection from: ${connectUrl}`);
        const connectRes = await axios.get(connectUrl, {
          headers: { apikey: apiKey },
          timeout: 10000,
        });

        qrCodeBase64 = connectRes.data?.base64 || connectRes.data?.qrcode?.base64 || null;
        rawCode = connectRes.data?.code || connectRes.data?.qrcode?.code || null;

        const candidates = [
          connectRes.data?.pairingCode,
          connectRes.data?.pairing_code,
          connectRes.data?.codePairing,
          connectRes.data?.qrcode?.pairingCode,
          connectRes.data?.code,
        ];

        for (const candidate of candidates) {
          if (isValidPairingCode(candidate)) {
            pairingCode = candidate.trim();
            break;
          }
        }

        console.log(`[Instance API] Connect response received. Pairing Code: ${pairingCode || 'NONE'}`);
      } catch (err: any) {
        connectErrorDetail = err.response?.data?.message || err.response?.data?.error || err.message;
        console.error('[Instance API] Connect error:', connectErrorDetail);
      }

      // Reset instance if no pairing code obtained
      if (!pairingCode) {
        try {
          console.log(`[Instance API] Resetting instance "${instanceName}" to force phone pairing for ${phoneNumber}...`);

          await axios.delete(`${baseURL}/instance/delete/${instanceName}`, {
            headers: { apikey: apiKey },
            timeout: 6000,
          }).catch(() => {});
          await new Promise((resolve) => setTimeout(resolve, 1000));

          try {
            const createRes = await axios.post(
              `${baseURL}/instance/create`,
              {
                instanceName,
                qrcode: true,
                number: phoneNumber,
                integration: 'WHATSAPP-BAILEYS',
              },
              {
                headers: { apikey: apiKey },
                timeout: 15000,
              }
            );

            const createCandidates = [
              createRes.data?.pairingCode,
              createRes.data?.pairing_code,
              createRes.data?.codePairing,
              createRes.data?.qrcode?.pairingCode,
              createRes.data?.instance?.pairingCode,
              createRes.data?.code,
            ];

            for (const candidate of createCandidates) {
              if (isValidPairingCode(candidate)) {
                pairingCode = candidate.trim();
                break;
              }
            }
          } catch (createErr: any) {
            console.warn('[Instance API] Create fallback warning:', createErr.response?.data || createErr.message);
          }

          let attempts = 0;
          while (!pairingCode && attempts < 5) {
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 1500));
            try {
              const pollRes = await axios.get(`${baseURL}/instance/connect/${instanceName}?number=${phoneNumber}`, {
                headers: { apikey: apiKey },
                timeout: 10000,
              });
              const pollCandidates = [
                pollRes.data?.pairingCode,
                pollRes.data?.pairing_code,
                pollRes.data?.codePairing,
                pollRes.data?.qrcode?.pairingCode,
                pollRes.data?.code,
              ];
              for (const candidate of pollCandidates) {
                if (isValidPairingCode(candidate)) {
                  pairingCode = candidate.trim();
                  break;
                }
              }
              if (pollRes.data?.base64 || pollRes.data?.qrcode?.base64) {
                qrCodeBase64 = pollRes.data?.base64 || pollRes.data?.qrcode?.base64;
              }
              if (pollRes.data?.code || pollRes.data?.qrcode?.code) {
                rawCode = pollRes.data?.code || pollRes.data?.qrcode?.code;
              }
            } catch (err: any) {
              console.warn(`[Instance API] Attempt ${attempts} waiting for pairing code...`);
            }
          }

          console.log(`[Instance API] Reset completed. Pairing Code: ${pairingCode || 'NONE'}`);
        } catch (recreateErr: any) {
          console.error('[Instance API] Reset error:', recreateErr.response?.data || recreateErr.message);
        }
      }
    }

    // Touch session activity
    await touchSession(instanceName);

    res.status(200).json({
      success: true,
      instanceName,
      state,
      isOnline: state === 'open',
      qrCodeBase64,
      code: rawCode,
      pairingCode,
      error: connectErrorDetail,
    });
  } catch (error: any) {
    console.error('[Instance API] Fatal status check error:', error.message);
    res.status(200).json({
      success: false,
      instanceName,
      state: 'DISCONNECTED',
      isOnline: false,
      error: error.message || 'Evolution API server is offline or unreachable.',
    });
  }
};

// ─── POST/DELETE /api/instance/logout ────────────────────────────────────────

export const logoutInstance = async (req: Request, res: Response): Promise<void> => {
  const rawPhoneNumber = (req.body?.phoneNumber || req.query.phoneNumber) as string | undefined;
  const phoneNumber = rawPhoneNumber ? formatPhoneNumber(rawPhoneNumber) : undefined;
  const instanceName = resolveInstanceFromRequest(req, phoneNumber);

  try {
    await disconnectSession(instanceName, 'user-logout');
    res.status(200).json({
      success: true,
      instanceName,
      message: 'WhatsApp session logged out and disconnected successfully.',
    });
  } catch (err: any) {
    console.error('[Instance API] Logout error:', err.message);
    res.status(200).json({
      success: true,
      instanceName,
      message: 'Instance disconnected or already logged out.',
    });
  }
};

// ─── GET /api/instance/sessions ──────────────────────────────────────────────

export const getActiveSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await listActiveSessions();
    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
