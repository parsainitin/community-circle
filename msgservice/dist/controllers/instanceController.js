"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstanceStatus = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getInstanceStatus = async (req, res) => {
    const baseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    const apiKey = process.env.EVOLUTION_API_KEY || 'whastflow_dev_secret_key';
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'whastflow_bot';
    const phoneNumber = req.query.phoneNumber;
    try {
        // 1. Fetch connection state
        const stateRes = await axios_1.default.get(`${baseURL}/instance/connectionState/${instanceName}`, {
            headers: { apikey: apiKey },
            timeout: 5000,
        });
        const state = stateRes.data?.instance?.state || stateRes.data?.state || 'UNKNOWN';
        let qrCodeBase64 = null;
        let pairingCode = null;
        // 2. If connecting/disconnected, fetch QR code or Pairing Code
        if (state !== 'open') {
            try {
                const connectUrl = phoneNumber
                    ? `${baseURL}/instance/connect/${instanceName}?number=${phoneNumber.replace(/[^0-9]/g, '')}`
                    : `${baseURL}/instance/connect/${instanceName}`;
                const connectRes = await axios_1.default.get(connectUrl, {
                    headers: { apikey: apiKey },
                    timeout: 8000,
                });
                qrCodeBase64 = connectRes.data?.base64 || connectRes.data?.qrcode?.base64 || null;
                pairingCode = connectRes.data?.code || connectRes.data?.pairingCode || null;
            }
            catch (err) {
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
    }
    catch (error) {
        res.status(200).json({
            success: false,
            instanceName,
            state: 'DISCONNECTED',
            isOnline: false,
            error: 'Evolution API server is offline or instance not created yet.',
        });
    }
};
exports.getInstanceStatus = getInstanceStatus;
