const fetch = global.fetch;

async function main() {
  const email = process.argv[2] || 'owner@stockflow.dev';
  const password = process.argv[3] || '123456';

  const response = await fetch('http://localhost:3333/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const body = await response.text();

  console.log('Status:', response.status);
  console.log('Body:', body);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
