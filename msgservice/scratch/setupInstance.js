const axios = require('axios');

const API_URL = 'http://localhost:8080';
const API_KEY = 'whastflow_dev_secret_key';
const INSTANCE_NAME = 'whastflow_bot';
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/evolution';

async function setup() {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
  };

  // Configure Webhook for Evolution API v2
  try {
    console.log(`Setting webhook to '${WEBHOOK_URL}'...`);
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
    console.log('Webhook Set Successfully:', JSON.stringify(webhookRes.data, null, 2));
  } catch (error) {
    if (error.response && error.response.data) {
      console.log('Webhook response/status:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error setting webhook:', error.message);
    }
  }
}

setup();
