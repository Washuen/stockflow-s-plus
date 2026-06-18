const required = ['DATABASE_URL', 'JWT_SECRET'];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error('Missing required environment variables:');
  for (const key of missing) console.error(`- ${key}`);
  process.exit(1);
}

console.log('Environment check passed.');
