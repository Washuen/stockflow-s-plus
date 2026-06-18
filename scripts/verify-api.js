const http = require('http');

const baseUrl = process.env.API_URL || 'http://localhost:3333';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function main() {
  const health = await get('/api/health');

  if (health.status !== 200) {
    console.error('Healthcheck falhou:', health.status, health.data);
    process.exit(1);
  }

  console.log('API online e respondendo:', health.data);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
