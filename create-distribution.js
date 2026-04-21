const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const EXE_NAME = 'SunarKhata.exe';


// Fresh dist folder each run (no stale files in the ZIP)
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
  console.log('✓ Cleared dist/ (previous package contents)');
}
fs.mkdirSync(distDir, { recursive: true });

// Files and folders to copy
const itemsToCopy = [
  { src: 'build', dest: 'build' },
  { src: 'server/config', dest: 'server/config' },
  { src: 'server/data', dest: 'server/data' },
  { src: EXE_NAME, dest: EXE_NAME }
];

// Copy function
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    if (fs.existsSync(src)) {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(src, dest);
      console.log(`✓ Copied: ${src} -> ${dest}`);
    } else {
      console.log(`⚠ Warning: ${src} not found, skipping...`);
    }
  }
}

// Copy all items
itemsToCopy.forEach(item => {
  const srcPath = path.join(__dirname, item.src);
  const destPath = path.join(distDir, item.dest);
  copyRecursiveSync(srcPath, destPath);
});

// Sidecar native module for argon2 (password hashing). pkg often cannot load .node from the snapshot;
// launcher sets ARGON2_PREBUILD to this folder so Node loads the real file from disk.
(function copyArgon2Native(destRoot) {
  const srcArgon = path.join(__dirname, 'node_modules', 'argon2');
  const destArgon = path.join(destRoot, 'native', 'argon2');
  const srcPre = path.join(srcArgon, 'prebuilds', 'win32-x64');
  if (!fs.existsSync(path.join(srcArgon, 'package.json')) || !fs.existsSync(srcPre)) {
    console.log('⚠ Warning: node_modules/argon2 prebuilds/win32-x64 not found. Run npm install on 64-bit Windows, then rebuild distribution.');
    return;
  }
  fs.mkdirSync(path.join(destArgon, 'prebuilds', 'win32-x64'), { recursive: true });
  fs.copyFileSync(path.join(srcArgon, 'package.json'), path.join(destArgon, 'package.json'));
  fs.readdirSync(srcPre).forEach((name) => {
    if (!name.endsWith('.node')) return;
    fs.copyFileSync(path.join(srcPre, name), path.join(destArgon, 'prebuilds', 'win32-x64', name));
  });
  console.log('✓ Copied native/argon2 (Windows x64) — keep this folder next to SunarKhata.exe');
})(distDir);

// Branding: ship SunarKhata.ico next to the .exe for shortcuts / manual icon changes.
// The .exe icon is embedded after pkg by scripts/applyPkgExeIcon.js (resedit, noGrow).
(function copyShortcutIcon(destRoot) {
  const candidates = [
    path.join(__dirname, 'public', 'assets', 'favicon-16x16.ico'),
    path.join(__dirname, 'public', 'favicon-16x16.ico'),
    path.join(__dirname, 'public', 'icon_sunar_khata.ico'),
  ];
  const src = candidates.find((p) => fs.existsSync(p));
  if (!src) return;
  const dest = path.join(destRoot, 'SunarKhata.ico');
  fs.copyFileSync(src, dest);
  console.log(`✓ Copied ${path.basename(src)} → dist/SunarKhata.ico (optional shortcut / Change Icon)`);
})(distDir);

// Ensure metals config is present in writable data path for .exe mode.
// If missing OR empty there, seed from bundled server/config/metals.json.
const distDataMetals = path.join(distDir, 'server', 'data', 'config', 'metals.json');
const distDefaultMetals = path.join(distDir, 'server', 'config', 'metals.json');
const shouldSeedDataMetals = (() => {
  if (!fs.existsSync(distDataMetals)) return true;
  try {
    const raw = fs.readFileSync(distDataMetals, 'utf8');
    const parsed = raw.trim() ? JSON.parse(raw) : [];
    return !Array.isArray(parsed) || parsed.length === 0;
  } catch (_) {
    return true;
  }
})();
if (shouldSeedDataMetals && fs.existsSync(distDefaultMetals)) {
  fs.mkdirSync(path.dirname(distDataMetals), { recursive: true });
  fs.copyFileSync(distDefaultMetals, distDataMetals);
  console.log('✓ Seeded non-empty dist/server/data/config/metals.json from server/config/metals.json');
}

// Runtime configuration: ship only .env next to the .exe (never create or use .env.example)
const envLocalSrc = path.join(__dirname, '.env');
const distEnv = path.join(distDir, '.env');
const staleEnvExample = path.join(distDir, '.env.example');
if (fs.existsSync(staleEnvExample)) {
  try {
    fs.unlinkSync(staleEnvExample);
  } catch (_) {
    /* ignore */
  }
}

/** Full default when project .env is missing (same keys as a typical app .env). */
const defaultEnvTemplate = `# Server Configuration
# These values can be updated at runtime after creating the .exe file
# Restart the application for changes to take effect

# API Server Port
API_PORT=3001

# REQUIRED — max JSON body for API (registration base64 images, etc.)
API_JSON_BODY_LIMIT=50mb

# API HTTP/error logs when using ${EXE_NAME} (default: logs/api.log next to .exe)
# API_LOG_ENABLED=true
# API_LOG_DIR=logs
# API_LOG_FILE=logs/api.log

# Web Server Port (for serving React app)
WEB_PORT=3000

# API Base URL (used by frontend)
REACT_APP_API_BASE_URL=http://localhost:3001
REACT_APP_API_CUSTOMER_SERVICE_URL=http://localhost:3004/customer-id
REACT_APP_API_SYNC_UPLOAD_URL=http://127.0.0.1:3001/sync/upload/folder
REACT_APP_API_SYNC_LOGS_URL=http://127.0.0.1:3001/sync/logs

# Application Settings
APP_NAME=Jewellery Management System
APP_VERSION=0.1.0

# Data Directory (relative to executable location)
DATA_DIR=server/data

# Build Directory (relative to executable location)
BUILD_DIR=build

# Company URL for frontend (e.g. logo link in Navbar)
COMPANY_URL=https://example.com/contact
REACT_APP_COMPANY_URL=https://example.com/contact

# GoldAPI.io — get token from https://www.goldapi.io/
REACT_APP_GOLD_API_BASE_URL=https://www.goldapi.io/api
REACT_APP_GOLD_API_ACCESS_TOKEN=your-goldapi-token-here

# Optional: sync upload auth (if used)
# REACT_APP_SYNC_TOKEN=
`;

if (fs.existsSync(envLocalSrc)) {
  fs.copyFileSync(envLocalSrc, distEnv);
  console.log(`✓ Wrote .env from project .env (all fields) — configurable at runtime next to ${EXE_NAME}`);
} else {
  fs.writeFileSync(distEnv, defaultEnvTemplate, 'utf8');
  console.log('⚠ Project .env not found; wrote full default .env into dist');
}

// Create README for distribution
const readmeContent = `# Jewellery Management System - Distribution Package

## Quick Start

1. Extract this zip file to any location on your computer
2. (Optional) Edit **.env** in the same folder as **${EXE_NAME}** to change ports, API URLs, or keys — then save
3. Double-click **${EXE_NAME}** to launch the application (or use **Start SunarKhata (console).bat** if nothing happens — you will see errors in the window)
4. The application will automatically open in your default web browser (default: http://localhost:3000)

## Configuration (.env) at runtime

- **.env** lives next to **${EXE_NAME}** (not inside the .exe). You can change settings anytime; **restart the app** for changes to apply.
- **\`API_JSON_BODY_LIMIT\`** (e.g. \`50mb\`) — set in **.env** for clarity; if missing next to the .exe, the packaged app defaults to \`50mb\`.
- Other common edits: \`API_PORT\`, \`WEB_PORT\`, \`REACT_APP_API_BASE_URL\` (must match your API port), \`REACT_APP_API_CUSTOMER_SERVICE_URL\`, metal API token, etc.

### API logs (port 3001 / \`API_PORT\`)

- When running **${EXE_NAME}**, the API console may be hidden. All API requests and errors are appended to **\`logs/api.log\`** in the same folder as the .exe (create automatically).
- Open that file in Notepad, or from Command Prompt: \`type logs\\api.log\` / \`powershell Get-Content logs\\api.log -Wait\` (live tail).
- To turn off file logging: set \`API_LOG_ENABLED=false\` in **.env** and restart.
- Optional: \`API_LOG_DIR\`, \`API_LOG_FILE\` in **.env** to change location.

## Default Login Credentials

**Username:** admin123  
**Password:** admin123

## Important Notes

- Each new **${EXE_NAME}** / ZIP build uses a fresh **build stamp**: the first time you open the app after upgrading, **browser storage for this site (localhost) is cleared** so old logins and cached UI data are not reused.
- Keep the **${EXE_NAME}** file in the same folder as **build**, **server**, **native** (contains **native/argon2** for login passwords), and **.env**
- **${EXE_NAME}** should already show the SunarKhata icon from the build. **SunarKhata.ico** in this folder is included for shortcuts or if you need to reassign an icon manually. Do **not** use Resource Hacker or editors that **resize** the resource section on **${EXE_NAME}** — that can break the packaged app.
- Do not delete or move the **server/data** folder - this contains your application data
- The web UI uses the port in **WEB_PORT** (default 3000). Ensure that port is free, or change it in **.env**
- To stop the application, close the console window that appears when you run the .exe file

## Data Sync tab

- When you run **${EXE_NAME}**, sync uses the **same API** as the app (port **API_PORT**, usually 3001). You do not need a separate service on port 3005.
- If \`SYNC_TOKEN\` is not set in **.env**, the launcher sets a default so local upload/auth works. For production you may set **\`SYNC_TOKEN\`** explicitly in **.env**.

## Troubleshooting

### Icon in File Explorer still looks like the old green Node logo
- Windows caches program icons. After a new build, try **renaming** **${EXE_NAME}** once, or sign out/in, or run **\`ie4uinit.exe -show\`** from Win+R to refresh the icon cache.

### Application won't start (double-click does nothing or closes immediately)
- If the app worked before a rebuild: run **\`npm run repair:pkg-cache\`** once, then **\`npm run build:exe\`** again. That clears a bad pkg Windows base template in **\`%USERPROFILE%\\.pkg-cache\`** (can happen after failed experiments).
- Extract the **entire** ZIP (folders **build**, **server**, **native**, **.env**, and **${EXE_NAME}** must stay together). Do not run only the .exe from inside the zip without extracting.
- Use **Start SunarKhata (console).bat** or **cmd.exe** to run **${EXE_NAME}** so errors stay visible.
- If **logs\\boot.log** never appears after double-clicking the .exe, Windows may be blocking the program (SmartScreen), antivirus, or the file is corrupted.
- Open **logs\\boot.log**, **logs\\startup-error.log**, and **logs\\api.log** (HTTP once the API is up).
- Ensure **.env** exists beside the .exe and includes **API_JSON_BODY_LIMIT** (e.g. \`50mb\`). The distribution build copies a full **.env** from this project or creates a default one.
- Make sure port 3000 (WEB_PORT) and 3001 (API_PORT) are not in use, or change them in **.env**
- Check Windows Firewall settings - it may be blocking the application
- Try running as Administrator if you encounter permission issues
- If the app was downloaded from the internet, right-click the extracted folder → **Properties** → check **Unblock** if present, then apply

### Browser doesn't open automatically
- Manually open your browser and navigate to: http://localhost:3000

### Data not saving
- Ensure the **server/data** folder exists and has write permissions
- Check that the application is not running in a read-only location

## System Requirements

- Windows 10 or later
- No additional software installation required
- The application includes everything needed to run

## Support

For issues or questions, please contact the development team.
`;

fs.writeFileSync(path.join(distDir, 'README.txt'), readmeContent);
console.log('\n✓ Created README.txt');

// Optional launcher: keeps a console open if the .exe exits immediately (easier debugging than double-click).
const startConsoleBat = [
  '@echo off',
  'title SunarKhata',
  'cd /d "%~dp0"',
  'if not exist "SunarKhata.exe" (',
  '  echo SunarKhata.exe not found in this folder.',
  '  pause',
  '  exit /b 1',
  ')',
  'echo Starting SunarKhata...',
  'echo Keep this window open while the app runs. Close it to stop the servers.',
  'echo.',
  `"SunarKhata.exe"`,
  'echo.',
  'echo App exited with code %ERRORLEVEL%. If it failed right away, open logs\\startup-error.log',
  'pause',
  '',
].join('\r\n');
fs.writeFileSync(path.join(distDir, 'Start SunarKhata (console).bat'), startConsoleBat);
console.log('✓ Created Start SunarKhata (console).bat');

// Create zip file (if 7zip or PowerShell is available)
console.log('\nCreating ZIP file...');
try {
  const zipPath = path.join(__dirname, 'dist', 'SunarKhata-Distribution.zip');
  
  // Try using PowerShell Compress-Archive (Windows)
  if (process.platform === 'win32') {
    const distPath = distDir.replace(/\\/g, '/');
    const zipPathEscaped = zipPath.replace(/\\/g, '/');
    
    try {
      execSync(`powershell -Command "Compress-Archive -Path '${distPath}\\*' -DestinationPath '${zipPathEscaped}' -Force"`, { stdio: 'inherit' });
      console.log(`\n✓ Successfully created: ${zipPath}`);
      console.log('\nDistribution package is ready!');
      console.log(`\nLocation: ${zipPath}`);
    } catch (error) {
      console.log('\n⚠ Could not create ZIP automatically. Please manually zip the contents of the "dist" folder.');
      console.log(`\nDistribution files are ready in: ${distDir}`);
      console.log('Please zip the contents manually and name it: JewelleryApp-Distribution.zip');
    }
  } else {
    console.log('\n⚠ ZIP creation is only automated on Windows.');
    console.log(`\nDistribution files are ready in: ${distDir}`);
    console.log('Please zip the contents manually.');
  }
} catch (error) {
  console.log('\n⚠ Error creating ZIP file:', error.message);
  console.log(`\nDistribution files are ready in: ${distDir}`);
  console.log('Please zip the contents manually.');
}

console.log('\n✓ Distribution package creation complete!');

