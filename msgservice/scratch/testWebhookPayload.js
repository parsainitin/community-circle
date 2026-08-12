const axios = require('axios');

async function testWebhook() {
  const webhookUrl = 'http://localhost:3000/api/webhooks/evolution';

  console.log('Sending test @jbs group message webhook payload...');

  const payload = {
    event: 'messages.upsert',
    instance: 'whastflow_bot',
    data: {
      key: {
        remoteJid: '120363378862036592@g.us',
        fromMe: false,
        participant: '917999782728@s.whatsapp.net',
      },
      pushName: 'Nitin',
      message: {
        conversation: 'Hello @jbs status check',
      },
    },
  };

  try {
    const res = await axios.post(webhookUrl, payload);
    console.log('Webhook Response:', res.data);
  } catch (err) {
    console.error('Webhook Error:', err?.response?.data || err.message);
  }
}

testWebhook();
