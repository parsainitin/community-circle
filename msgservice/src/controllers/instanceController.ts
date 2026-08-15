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

export const getInstanceStatus = async (req: Request, res: Response): Promise<void> => {
  const baseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  const apiKey = process.env.EVOLUTION_API_KEY || 'whastflow_dev_secret_key';
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'whastflow_bot';
  const rawPhoneNumber = req.query.phoneNumber as string | undefined;
  const phoneNumber = rawPhoneNumber ? formatPhoneNumber(rawPhoneNumber) : undefined;

  try {
    // 1. Fetch connection state
    let state = 'UNKNOWN';
    try {
      const stateRes = await axios.get(`${baseURL}/instance/connectionState/${instanceName}`, {
        headers: { apikey: apiKey },
        timeout: 5000,
      });
      state = stateRes.data?.instance?.state || stateRes.data?.state || 'UNKNOWN';
    } catch (err: any) {
      // If instance doesn't exist, create it
      if (err.response?.status === 404 || err.response?.data?.error?.includes('not found')) {
        console.log(`[Instance API] Creating new instance "${instanceName}" in Evolution API...`);
        try {
          await axios.post(
            `${baseURL}/instance/create`,
            {
              instanceName,
              qrcode: true,
              integration: 'WHATSAPP-BAILEYS',
            },
            {
              headers: { apikey: apiKey },
              timeout: 10000,
            }
          );
          state = 'connecting';
        } catch (createErr: any) {
          console.error('[Instance API] Error creating instance:', createErr.message);
        }
      }
    }

    let qrCodeBase64: string | null = null;
    let pairingCode: string | null = null;

    // 2. If connecting/disconnected/close, fetch QR code or Pairing Code
    if (state !== 'open') {
      try {
        const connectUrl = phoneNumber
          ? `${baseURL}/instance/connect/${instanceName}?number=${phoneNumber}`
          : `${baseURL}/instance/connect/${instanceName}`;

        const connectRes = await axios.get(connectUrl, {
          headers: { apikey: apiKey },
          timeout: 8000,
        });

        qrCodeBase64 = connectRes.data?.base64 || connectRes.data?.qrcode?.base64 || null;
        pairingCode = connectRes.data?.code || connectRes.data?.pairingCode || null;
      } catch (err: any) {
        console.log('[Instance API] Notice: Connection fetch waiting for instance generation.');
      }
    }

    res.status(200).json({
      success: true,
      instanceName,
      state,
      isOnline: state === 'open',
      qrCodeBase64,
      pairingCode,
    });
  } catch (error: any) {
    res.status(200).json({
      success: false,
      instanceName,
      state: 'DISCONNECTED',
      isOnline: false,
      error: error.message || 'Evolution API server is offline or instance not created yet.',
    });
  }
};

export const logoutInstance = async (req: Request, res: Response): Promise<void> => {
  const baseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  const apiKey = process.env.EVOLUTION_API_KEY || 'whastflow_dev_secret_key';
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'whastflow_bot';

  try {
    await axios.delete(`${baseURL}/instance/logout/${instanceName}`, {
      headers: { apikey: apiKey },
      timeout: 5000,
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
