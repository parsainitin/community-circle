"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evolutionService = exports.EvolutionService = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class EvolutionService {
    client;
    defaultInstance;
    constructor() {
        const baseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
        const apiKey = process.env.EVOLUTION_API_KEY || 'whastflow_dev_secret_key';
        this.defaultInstance = process.env.EVOLUTION_INSTANCE_NAME || 'whastflow_bot';
        this.client = axios_1.default.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey, // Strict requirement: custom apikey header
            },
            timeout: 15000,
        });
    }
    /**
     * Send text message to WhatsApp Group or User
     */
    async sendTextMessage(groupJid, text, instanceName) {
        const instance = instanceName || this.defaultInstance;
        const url = `/message/sendText/${instance}`;
        try {
            const response = await this.client.post(url, {
                number: groupJid,
                text,
            });
            return response.data;
        }
        catch (error) {
            console.error(`[Evolution API] Error sending text to ${groupJid}:`, error?.response?.data || error.message);
            throw error;
        }
    }
    /**
     * Simulate human presence (typing / composing indicator)
     */
    async sendPresence(groupJid, presence = 'composing', delayMs = 1500, instanceName) {
        const instance = instanceName || this.defaultInstance;
        const url = `/chat/sendPresence/${instance}`;
        try {
            const response = await this.client.post(url, {
                number: groupJid,
                presence,
                delay: delayMs,
            });
            return response.data;
        }
        catch (error) {
            // Non-blocking fallback log for presence
            console.log(`[Evolution API] Presence notice for ${groupJid}:`, error?.response?.data || error.message);
            return null;
        }
    }
    /**
     * Fetch group metadata (info, participants, subject)
     */
    async fetchGroupMetadata(groupJid, instanceName) {
        const instance = instanceName || this.defaultInstance;
        const url = `/group/findGroupInfos/${instance}?groupJid=${groupJid}`;
        try {
            const response = await this.client.get(url);
            return response.data;
        }
        catch (error) {
            console.error(`[Evolution API] Error fetching group info for ${groupJid}:`, error?.response?.data || error.message);
            return null;
        }
    }
}
exports.EvolutionService = EvolutionService;
exports.evolutionService = new EvolutionService();
