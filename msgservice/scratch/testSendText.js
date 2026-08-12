const axios = require('axios');

async function testState() {
  const baseURL = 'http://localhost:8080';
  const apiKey = 'whastflow_dev_secret_key';
  const instance = 'whastflow_bot';

  try {
    const res = await axios.get(`${baseURL}/instance/connectionState/${instance}`, {
      headers: { apikey: apiKey },
    });
    console.log('Connection State:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('State Fetch Error:', err?.response?.data || err.message);
  }
}

testState();
