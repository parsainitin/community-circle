import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

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
  // Valid WhatsApp Pairing Code is 6 to 15 alphanumeric characters and never starts with 2@ (QR code)
  return clean.length >= 6 && clean.length <= 15 && !clean.startsWith('2@') && !clean.includes(',');
}

export const getInstanceStatus = async (req: Request, res: Response): Promise<void> => {
  const rawBaseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  const baseURL = rawBaseURL.replace(/\/+$/, '');
  const apiKey = (process.env.EVOLUTION_API_KEY || 'whastflow_dev_secret_key').trim();
  const instanceName = (process.env.EVOLUTION_INSTANCE_NAME || 'whastflow_bot').trim();
  const rawPhoneNumber = req.query.phoneNumber as string | undefined;
  const phoneNumber = rawPhoneNumber ? formatPhoneNumber(rawPhoneNumber) : undefined;

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

    let qrCodeBase64: string | null = null;
    let pairingCode: string | null = null;
    let connectErrorDetail: string | null = null;

    // 2. If connecting/disconnected/close, fetch Pairing Code
    if (state !== 'open') {
      try {
        const connectUrl = phoneNumber
          ? `${baseURL}/instance/connect/${instanceName}?number=${phoneNumber}`
          : `${baseURL}/instance/connect/${instanceName}`;

        console.log(`[Instance API] Requesting connection from: ${connectUrl}`);
        const connectRes = await axios.get(connectUrl, {
          headers: { apikey: apiKey },
          timeout: 10000,
        });

        qrCodeBase64 = connectRes.data?.base64 || connectRes.data?.qrcode?.base64 || null;

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

      // 3. If phoneNumber was provided but instance is stuck in QR mode (state == 'connecting' without pairingCode), reset instance with qrcode: true & number to trigger pairing code
      if (!pairingCode && phoneNumber) {
        try {
          console.log(`[Instance API] Resetting instance "${instanceName}" to force phone pairing for ${phoneNumber}...`);
          
          // Delete old QR instance
          await axios.delete(`${baseURL}/instance/delete/${instanceName}`, {
            headers: { apikey: apiKey },
            timeout: 6000,
          }).catch(() => {});

          // Recreate with number and qrcode: true (triggers Baileys connectToWhatsapp with number in Evolution API)
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

          // Polling loop: Wait for Baileys to request pairing code from WhatsApp servers
          let attempts = 0;
          while (!pairingCode && attempts < 4) {
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 2000));
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

    res.status(200).json({
      success: true,
      instanceName,
      state,
      isOnline: state === 'open',
      qrCodeBase64,
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

export const logoutInstance = async (req: Request, res: Response): Promise<void> => {
  const rawBaseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  const baseURL = rawBaseURL.replace(/\/+$/, '');
  const apiKey = (process.env.EVOLUTION_API_KEY || 'whastflow_dev_secret_key').trim();
  const instanceName = (process.env.EVOLUTION_INSTANCE_NAME || 'whastflow_bot').trim();

  try {
    await axios.delete(`${baseURL}/instance/logout/${instanceName}`, {
      headers: { apikey: apiKey },
      timeout: 6000,
    });
    res.status(200).json({
      success: true,
      message: 'WhatsApp instance logged out successfully.',
    });
  } catch (err: any) {
    console.error('[Instance API] Logout error:', err.message);
    res.status(200).json({
      success: true,
      message: 'Instance disconnected or already logged out.',
    });
  }
};
