// Load environment variables from .env file at runtime
// This allows configuration updates without rebuilding the .exe
const path = require('path');
const fs = require('fs');

// When packaged, look for .env in the executable directory
const isPackaged = typeof process.pkg !== 'undefined';

if (isPackaged) {
  try {
    const root = path.dirname(process.execPath);
    const logsDir = path.join(root, 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    fs.appendFileSync(
      path.join(logsDir, 'boot.log'),
      `[${new Date().toISOString()}] Launcher process started (pid ${process.pid})\n`,
      'utf8'
    );
  } catch (_) {
    /* if this fails (read-only folder), later errors will surface elsewhere */
  }
}

const envPath = isPackaged 
  ? path.join(path.dirname(process.execPath), '.env')
  : path.join(__dirname, '.env');

// Load .env file if it exists
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('Loaded .env file from:', envPath);
} else {
  // Try default location as fallback
  require('dotenv').config();
  if (isPackaged) {
    console.log('Warning: .env file not found. Using default configuration.');
    console.log('Please create a .env file in the same directory as the executable.');
  }
}

if (isPackaged) {
  process.env.APP_DISTRIBUTION_EXE = '1';
  const st = (process.env.SYNC_TOKEN || '').trim();
  const smtp = (process.env.SMTP_TOKEN || '').trim();
  if (!st && !smtp) {
    process.env.SYNC_TOKEN = 'dummy-sync-token';
  }
}

/** Required for Express JSON parser (registration payloads with base64 images). */
function requireEnvVar(name) {
  const value = (process.env[name] || '').trim();
  if (!value) {
    const hint = isPackaged
      ? `Add ${name} to the .env file next to SunarKhata.exe (e.g. ${name}=50mb).`
      : `Add ${name} to the .env file in the project root (e.g. ${name}=50mb).`;
    console.error(`ERROR: ${name} is not set.\n${hint}`);
    process.exit(1);
  }
  return value;
}

const express = require('express');
const { exec, execSync } = require('child_process');

const webApp = express();

// Read ports from .env file (can be updated at runtime)
const API_PORT = parseInt(process.env.API_PORT, 10) || 3001;
const WEB_PORT = parseInt(process.env.WEB_PORT, 10) || 3000;

// Determine paths - when packaged, __dirname points to the executable location
// (isPackaged already defined above)
const baseDir = isPackaged ? path.dirname(process.execPath) : __dirname;

if (isPackaged) {
  try {
    process.chdir(baseDir);
  } catch (e) {
    console.error('Could not chdir to application folder:', baseDir, e.message);
  }
}

// Read directory paths from .env or use defaults
const BUILD_DIR = process.env.BUILD_DIR || 'build';
const DATA_DIR = process.env.DATA_DIR || 'server/data';

const buildPath = path.join(baseDir, BUILD_DIR);
const dataPath = path.join(baseDir, DATA_DIR);

// Writable data root next to .exe (packaged) or project root (dev). All JSON stores use server/paths.js.
process.env.SUNARKHATA_SERVER_DATA = dataPath;

/** Packaged .exe: avoid instant exit when .env was not extracted; dev still strict. */
function getJsonBodyLimit() {
  const v = (process.env.API_JSON_BODY_LIMIT || '').trim();
  if (v) return v;
  if (isPackaged) {
    const fallback = '50mb';
    console.warn(
      `API_JSON_BODY_LIMIT not set; using default ${fallback}. Add it to .env next to the .exe for explicit control.`
    );
    try {
      const dir = path.join(baseDir, 'logs');
      fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(
        path.join(dir, 'startup-error.log'),
        `[${new Date().toISOString()}] WARN: API_JSON_BODY_LIMIT missing; used ${fallback}\n`,
        'utf8'
      );
    } catch (_) {
      /* ignore */
    }
    return fallback;
  }
  return requireEnvVar('API_JSON_BODY_LIMIT');
}

function showFatalAlert(title, message) {
  if (process.platform !== 'win32' || !isPackaged) return;
  try {
    const { spawnSync } = require('child_process');
    spawnSync(
      'powershell',
      [
        '-NoProfile',
        '-WindowStyle',
        'Hidden',
        '-Command',
        'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show($env:SK_MSGBOX_TEXT, $env:SK_MSGBOX_TITLE)',
      ],
      {
        env: {
          ...process.env,
          SK_MSGBOX_TITLE: String(title || 'SunarKhata').slice(0, 256),
          SK_MSGBOX_TEXT: String(message || '').slice(0, 1024),
        },
        stdio: 'ignore',
      }
    );
  } catch (_) {
    /* ignore */
  }
}

function logFatalStartup(message, err) {
  const dir = path.join(baseDir, 'logs');
  const line = `[${new Date().toISOString()}] ${message}\n${err && err.stack ? err.stack : String(err)}\n`;
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'startup-error.log'), line, 'utf8');
  } catch (_) {
    /* ignore */
  }
  console.error(message);
  if (err) console.error(err);
}

// Argon2 uses a native .node file; pkg's virtual snapshot often fails to load it. Prefer
// real files shipped in native/argon2 next to the .exe (see create-distribution.js).
if (isPackaged && process.platform === 'win32') {
  const argon2Root = path.join(baseDir, 'native', 'argon2');
  const preDir = path.join(argon2Root, 'prebuilds', 'win32-x64');
  const warnNative = (msg) => {
    try {
      const logsDir = path.join(baseDir, 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      fs.appendFileSync(
        path.join(logsDir, 'boot.log'),
        `[${new Date().toISOString()}] ${msg}\n`,
        'utf8'
      );
    } catch (_) {
      /* ignore */
    }
  };
  if (
    fs.existsSync(path.join(argon2Root, 'package.json')) &&
    fs.existsSync(preDir)
  ) {
    const hasNode = fs.readdirSync(preDir).some((f) => f.endsWith('.node'));
    if (hasNode) {
      process.env.ARGON2_PREBUILD = path.resolve(argon2Root);
      warnNative(`Using ARGON2_PREBUILD=${process.env.ARGON2_PREBUILD}`);
    } else {
      warnNative(
        'WARN: native/argon2/prebuilds/win32-x64 has no .node file — extract the full ZIP (native folder). Login will likely fail.'
      );
    }
  } else {
    warnNative(
      'WARN: native/argon2 folder missing next to .exe — extract the full ZIP. Login may fail without argon2 prebuild.'
    );
  }
}

let createApiApp;
try {
  ({ createApiApp } = require('./server/apiApp'));
} catch (err) {
  const detail = err && err.message ? String(err.message) : String(err);
  logFatalStartup(
    `Failed to start SunarKhata (could not load server): ${detail}. Rebuild the .exe after npm install. See logs/startup-error.log`,
    err
  );
  showFatalAlert(
    'SunarKhata',
    `Could not load the server:\n\n${detail.slice(0, 900)}\n\nSee logs\\startup-error.log next to the .exe. Run npm install, then rebuild the .exe.`
  );
  process.exit(1);
}

// API file logs (port 3001) — .exe often has no visible console; tail logs/api.log to debug
const API_LOG_ENABLED =
  String(process.env.API_LOG_ENABLED ?? 'true').toLowerCase() !== 'false';
const API_LOG_DIR =
  (process.env.API_LOG_DIR && process.env.API_LOG_DIR.trim()) ||
  path.join(baseDir, 'logs');
const API_LOG_FILE =
  (process.env.API_LOG_FILE && process.env.API_LOG_FILE.trim()) ||
  path.join(API_LOG_DIR, 'api.log');

function ensureApiLogDir() {
  if (!API_LOG_ENABLED) return;
  try {
    if (!fs.existsSync(API_LOG_DIR)) {
      fs.mkdirSync(API_LOG_DIR, { recursive: true });
    }
  } catch (e) {
    console.error('Could not create API log directory:', e.message);
  }
}

/**
 * Log API messages to console and append to logs/api.log (next to .exe when packaged).
 */
function apiLog(level, message) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level}] ${message}`;
  console.log(line);
  if (!API_LOG_ENABLED) return;
  try {
    ensureApiLogDir();
    fs.appendFileSync(API_LOG_FILE, `${line}\n`, 'utf8');
  } catch (e) {
    console.error('API log file write failed:', e.message);
  }
}

// Full API stack (login, inventory routes, dashboard, invoices, sync, /customer-id, etc.)
const jsonBodyLimit = getJsonBodyLimit();
const apiApp = createApiApp({
  jsonBodyLimit,
  requestLogger: (req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - started;
      const len = req.headers['content-length'];
      const sizeHint = len ? ` ${len}b` : '';
      apiLog(
        'HTTP',
        `${req.method} ${req.originalUrl || req.url} → ${res.statusCode} ${ms}ms${sizeHint}`
      );
    });
    next();
  },
});

webApp.use(express.static(buildPath));

// Web App Routes (serve React build)
if (fs.existsSync(buildPath)) {
  // Handle React Router - serve index.html for all routes
  webApp.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  // If build folder doesn't exist, show error page
  webApp.get('*', (req, res) => {
    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Build folder not found</h1>
          <p>The application build folder is missing. Please ensure the 'build' folder exists in the same directory as this executable.</p>
        </body>
      </html>
    `);
  });
}

// Log body-parser and other errors on the API app
apiApp.use((err, req, res, next) => {
  apiLog(
    'ERROR',
    `${err.name || 'Error'}: ${err.message} — ${req.method} ${req.originalUrl || req.url}`
  );
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Server error' });
});

// Start API server
const apiServer = apiApp.listen(API_PORT, () => {
  const url = `http://localhost:${API_PORT}`;
  console.log(`API server running on ${url}`);
  if (API_LOG_ENABLED) {
    ensureApiLogDir();
    console.log(`API logs (HTTP + errors): ${API_LOG_FILE}`);
  } else {
    console.log('API file logging disabled (API_LOG_ENABLED=false in .env)');
  }
  apiLog('START', `API server listening on ${url}`);
});
apiServer.on('error', (err) => {
  logFatalStartup(`Cannot listen on API port ${API_PORT}`, err);
  showFatalAlert(
    'SunarKhata',
    `Port ${API_PORT} is already in use. Stop the other SunarKhata (or change API_PORT in .env). Details: logs/startup-error.log`
  );
  process.exit(1);
});

// Get primary screen working area (width, height) on Windows for opening app to fit screen
function getWindowsScreenSize() {
  if (process.platform !== 'win32') return null;
  try {
    const ps = `Add-Type -AssemblyName System.Windows.Forms; $s = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea; "$($s.Width),$($s.Height)"`;
    const out = execSync(`powershell -NoProfile -Command "${ps}"`, { encoding: 'utf8', timeout: 5000 });
    const trimmed = (out && out.trim()) || '';
    const match = /^(\d+),(\d+)$/.exec(trimmed);
    if (match) return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
  } catch (_) { /* ignore */ }
  return null;
}

// Open browser; on Windows try to open at screen size to avoid unnecessary scrollbars
function openBrowser(url) {
  const fullUrl = url.startsWith('http') ? url : `http://localhost:${WEB_PORT}`;
  if (process.platform === 'win32') {
    const size = getWindowsScreenSize();
    const w = size ? size.width : 1280;
    const h = size ? size.height : 800;
    // Try Chrome then Edge with --app and --window-size for a desktop-style window
    const chromeCmd = `"${process.env.LOCALAPPDATA || ''}\\Google\\Chrome\\Application\\chrome.exe" --window-size=${w},${h} --app=${fullUrl}`;
    const edgeCmd = `"${process.env.ProgramFiles || 'C:\\\\Program Files'}\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe" --window-size=${w},${h} --app=${fullUrl}`;
    exec(chromeCmd, (errChrome) => {
      if (errChrome) exec(edgeCmd, (errEdge) => {
        if (errEdge) exec(`start ${fullUrl}`);
      });
    });
  } else if (process.platform === 'darwin') {
    exec(`open ${fullUrl}`);
  } else {
    exec(`xdg-open ${fullUrl}`);
  }
}

// Start Web server
const webServer = webApp.listen(WEB_PORT, () => {
  console.log(`Web server running on http://localhost:${WEB_PORT}`);
  console.log(`\nJewellery Management System is ready!`);
  console.log(`Access the application at: http://localhost:${WEB_PORT}`);
  console.log('Press Ctrl+C to stop the server\n');
  openBrowser(`http://localhost:${WEB_PORT}`);
});
webServer.on('error', (err) => {
  logFatalStartup(`Cannot listen on web port ${WEB_PORT}`, err);
  showFatalAlert(
    'SunarKhata',
    `Port ${WEB_PORT} is already in use. Stop the other program or change WEB_PORT in .env. Details: logs/startup-error.log`
  );
  try {
    apiServer.close();
  } catch (_) {
    /* ignore */
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logFatalStartup('Uncaught exception', err);
  if (isPackaged) {
    showFatalAlert('SunarKhata', 'Unexpected error — see logs/startup-error.log');
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logFatalStartup('Unhandled promise rejection (non-fatal — app may keep running)', err);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});

