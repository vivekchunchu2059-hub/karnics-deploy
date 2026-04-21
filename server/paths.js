/**
 * Central data directory for JSON stores and uploads.
 * Launcher (.exe) sets SUNARKHATA_SERVER_DATA to a writable folder next to the executable.
 * `npm run server` leaves it unset → defaults to server/data (this repo layout).
 */
const path = require('path');

const SERVER_DIR = __dirname;

function getDataRoot() {
  const override = process.env.SUNARKHATA_SERVER_DATA;
  if (override && String(override).trim()) {
    return path.resolve(String(override).trim());
  }
  return path.join(SERVER_DIR, 'data');
}

/** Join path segments under the active data root. */
function dataPath(...parts) {
  return path.join(getDataRoot(), ...parts);
}

/**
 * metals.json: bundled under server/config when developing; under data/config when
 * SUNARKHATA_SERVER_DATA is set (writable next to .exe).
 */
function getMetalsConfigPath() {
  if (process.env.SUNARKHATA_SERVER_DATA && String(process.env.SUNARKHATA_SERVER_DATA).trim()) {
    return dataPath('config', 'metals.json');
  }
  return path.join(SERVER_DIR, 'config', 'metals.json');
}

module.exports = {
  SERVER_DIR,
  getDataRoot,
  dataPath,
  getMetalsConfigPath,
};
