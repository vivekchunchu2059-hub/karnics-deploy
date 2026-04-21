// Load environment variables from .env file in project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const log = require('loglevel');

function requireEnvVar(name) {
  const value = (process.env[name] || '').trim();
  if (!value) {
    log.error(
      `ERROR: ${name} is not set in .env (project root). Example: ${name}=50mb`
    );
    process.exit(1);
  }
  return value;
}

const { createApiApp } = require('./apiApp');

// Dev: persist under server/data (SUNARKHATA_SERVER_DATA unset)
const app = createApiApp({
  jsonBodyLimit: requireEnvVar('API_JSON_BODY_LIMIT'),
});

const PORT = process.env.API_PORT;

app.listen(PORT, () => {
  log.info(`Server running on http://localhost:${PORT}`);
});
