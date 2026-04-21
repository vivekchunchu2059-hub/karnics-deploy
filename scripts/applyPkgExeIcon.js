/**
 * Embeds the SunarKhata .ico into SunarKhata.exe *after* pkg.
 * Uses resedit with noGrow on the final PE (preserves pkg snapshot tail). See vercel/pkg#1894.
 */
const fs = require('fs');
const path = require('path');
const { applyWinExeIcon } = require('./pkgWinExeIcon');

const EXE_NAME = 'SunarKhata.exe';

function resolveIconIco(rootDir) {
  const candidates = [
    path.join(rootDir, 'public', 'assets', 'favicon-16x16.ico'),
    path.join(rootDir, 'public', 'favicon-16x16.ico'),
    path.join(rootDir, 'public', 'icon_sunar_khata.ico'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  if (process.platform !== 'win32') {
    console.log('applyPkgExeIcon: skipped (not Windows).');
    return;
  }

  const rootDir = path.join(__dirname, '..');
  const exePath = path.join(rootDir, EXE_NAME);
  const icoPath = resolveIconIco(rootDir);

  if (!fs.existsSync(exePath)) {
    console.error(`applyPkgExeIcon: ${EXE_NAME} not found. Run pkg first.`);
    process.exit(1);
  }
  if (!icoPath) {
    console.error(
      'applyPkgExeIcon: no .ico found. Add public/assets/favicon-16x16.ico or run prepareIcons.'
    );
    process.exit(1);
  }

  await applyWinExeIcon(exePath, icoPath);
  console.log(
    `applyPkgExeIcon: embedded icon from ${path.relative(rootDir, icoPath)} into ${EXE_NAME}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
