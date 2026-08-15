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
      // If instance doesn't exist (404), create it
      if (err.response?.status === 404 || err.response?.data?.error?.includes('not found')) {
        console.log(`[Instance API] Creating new instance "${instanceName}" in Evolution API...`);
        try {
          await axios.post(
            `${baseURL}/instance/create`,
            {
              instanceName,
              qrcode: false,
              integration: 'WHATSAPP-BAILEYS',
            },
            {
              headers: { apikey: apiKey },
              timeout: 10000,
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

    // 2. If connecting/disconnected/close, fetch Pairing Code or QR code
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
        pairingCode =
          connectRes.data?.code ||
          connectRes.data?.pairingCode ||
          connectRes.data?.pairing_code ||
          null;

        console.log(`[Instance API] Connect response received. Pairing Code: ${pairingCode || 'NONE'}`);
      } catch (err: any) {
        connectErrorDetail = err.response?.data?.message || err.response?.data?.error || err.message;
        console.error('[Instance API] Connect error:', connectErrorDetail);
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
