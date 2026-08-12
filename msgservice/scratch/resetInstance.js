const axios = require('axios');

const API_URL = 'http://localhost:8080';
const API_KEY = 'whastflow_dev_secret_key';
const INSTANCE_NAME = 'whastflow_bot';
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/evolution';

async function createFresh() {
  const headers = { 'Content-Type': 'application/json', 'apikey': API_KEY };

  try {
    console.log('Creating fresh instance...');
    const createRes = await axios.post(
      `${API_URL}/instance/create`,
      { instanceName: INSTANCE_NAME, qrcode: true, integration: 'WHATSAPP-BAILEYS' },
      { headers }
    );
    console.log('Created fresh instance:', createRes.data);
  } catch (err) {
    console.log('Create error:', err?.response?.data || err.message);
  }

  try {
    console.log('Setting webhook...');
    const webhookRes = await axios.post(
      `${API_URL}/webhook/set/${INSTANCE_NAME}`,
      {
        webhook: {
          enabled: true,
          url: WEBHOOK_URL,
          byEvents: false,
          base64: false,
          events: ['MESSAGES_UPSERT', 'GROUPS_UPSERT'],
        },
      },
      { headers }
    );
    console.log('Webhook configured:', webhookRes.data);
  } catch (err) {
    console.log('Webhook error:', err?.response?.data || err.message);
  }
}

createFresh();
