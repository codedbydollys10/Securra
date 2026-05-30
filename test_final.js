const http = require('http');

const postData = JSON.stringify({
  messages: [
    { role: 'system', content: 'You are a helpful emergency safety assistant for India.' },
    { role: 'user', content: 'What should I do during a fire emergency?' }
  ]
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/ai',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Sending request to http://localhost:3001/api/ai');
console.log('Request body:', postData);
console.log('---');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const response = JSON.parse(data);
      console.log('Response:', JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(postData);
req.end();
