const axios = require('axios');

async function testDirect() {
  const baseURL = 'http://localhost:8080';
  const apiKey = 'whastflow_dev_secret_key';
  const instance = 'whastflow_bot';

  // 1. Without country code
  try {
    console.log('Testing number WITHOUT country code (7999782728)...');
    await axios.post(
      `${baseURL}/message/sendText/${instance}`,
      { number: '7999782728', text: 'Test message from WhastFlow' },
      { headers: { 'Content-Type': 'application/json', 'apikey': apiKey } }
    );
    console.log('7999782728 SUCCESS!');
  } catch (err) {
    console.log('7999782728 FAILED:', err?.response?.data || err.message);
  }

  // 2. WITH country code 91
  try {
    console.log('Testing number WITH country code 91 (917999782728)...');
    const res2 = await axios.post(
      `${baseURL}/message/sendText/${instance}`,
      { number: '917999782728', text: 'Test message from WhastFlow' },
      { headers: { 'Content-Type': 'application/json', 'apikey': apiKey } }
    );
    console.log('917999782728 SUCCESS:', res2.data);
  } catch (err) {
    console.log('917999782728 FAILED:', err?.response?.data || err.message);
  }
}

testDirect();
