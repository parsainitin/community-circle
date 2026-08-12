import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const getInstanceStatus = async (req: Request, res: Response): Promise<void> => {
  const baseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  const apiKey = process.env.EVOLUTION_API_KEY || 'whastflow_dev_secret_key';
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'whastflow_bot';
  const phoneNumber = req.query.phoneNumber as string | undefined;

  try {
    // 1. Fetch connection state
    const stateRes = await axios.get(`${baseURL}/instance/connectionState/${instanceName}`, {
      headers: { apikey: apiKey },
      timeout: 5000,
    });

    const state = stateRes.data?.instance?.state || stateRes.data?.state || 'UNKNOWN';

    let qrCodeBase64: string | null = null;
    let pairingCode: string | null = null;

    // 2. If connecting/disconnected, fetch QR code or Pairing Code
    if (state !== 'open') {
      try {
        const connectUrl = phoneNumber
          ? `${baseURL}/instance/connect/${instanceName}?number=${phoneNumber.replace(/[^0-9]/g, '')}`
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
      error: 'Evolution API server is offline or instance not created yet.',
    });
  }
};
