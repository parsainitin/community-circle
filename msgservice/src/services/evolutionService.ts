import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class EvolutionService {
  private client: AxiosInstance;
  private defaultInstance: string;

  constructor() {
    const baseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    const apiKey = process.env.EVOLUTION_API_KEY || 'whastflow_dev_secret_key';
    this.defaultInstance = process.env.EVOLUTION_INSTANCE_NAME || 'whastflow_bot';

    this.client = axios.create({
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
  async sendTextMessage(groupJid: string, text: string, instanceName?: string): Promise<any> {
    const instance = instanceName || this.defaultInstance;
    const url = `/message/sendText/${instance}`;
    
    try {
      const response = await this.client.post(url, {
        number: groupJid,
        text,
      });

      return response.data;
    } catch (error: any) {
      console.error(`[Evolution API] Error sending text to ${groupJid}:`, error?.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Simulate human presence (typing / composing indicator)
   */
  async sendPresence(
    groupJid: string,
    presence: 'composing' | 'recording' | 'paused' = 'composing',
    delayMs: number = 1500,
    instanceName?: string
  ): Promise<any> {
    const instance = instanceName || this.defaultInstance;
    const url = `/chat/sendPresence/${instance}`;

    try {
      const response = await this.client.post(url, {
        number: groupJid,
        presence,
        delay: delayMs,
      });
      return response.data;
    } catch (error: any) {
      // Non-blocking fallback log for presence
      console.log(`[Evolution API] Presence notice for ${groupJid}:`, error?.response?.data || error.message);
      return null;
    }
  }

  /**
   * Fetch group metadata (info, participants, subject)
   */
  async fetchGroupMetadata(groupJid: string, instanceName?: string): Promise<any> {
    const instance = instanceName || this.defaultInstance;
    const url = `/group/findGroupInfos/${instance}?groupJid=${groupJid}`;
    
    try {
      const response = await this.client.get(url);
      return response.data;
    } catch (error: any) {
      console.error(`[Evolution API] Error fetching group info for ${groupJid}:`, error?.response?.data || error.message);
      return null;
    }
  }
}

export const evolutionService = new EvolutionService();
