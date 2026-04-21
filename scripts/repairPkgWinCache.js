/**
 * Removes pkg-fetch Windows base binaries from the local cache so the next `pkg` run
 * downloads a pristine `fetched-v*-win-x64` template.
 *
 * Use this if SunarKhata.exe stopped starting after an experimental base-binary patch
 * (only `built-*` left in cache, or a corrupted template).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const pkgFetchPkg = require('pkg-fetch/package.json');
const semver = require('semver');

const tag = `v${semver.major(pkgFetchPkg.version)}.${semver.minor(pkgFetchPkg.version)}`;
const cacheRoot = process.env.PKG_CACHE_PATH || path.join(os.homedir(), '.pkg-cache');
const cacheDir = path.join(cacheRoot, tag);

if (!fs.existsSync(cacheDir)) {
  console.log('repairPkgWinCache: nothing to do (no folder:', cacheDir + ')');
  process.exit(0);
}

let removed = 0;
for (const name of fs.readdirSync(cacheDir)) {
  if (/^(built|fetched)-v[\d.]+-win-x64$/.test(name)) {
    const p = path.join(cacheDir, name);
    try {
      fs.unlinkSync(p);
      console.log('repairPkgWinCache: removed', path.basename(p));
      removed += 1;
    } catch (e) {
      console.warn('repairPkgWinCache: could not remove', p, e.message);
    }
  }
}

if (removed === 0) {
  console.log('repairPkgWinCache: no win-x64 fetched/built bases found in', cacheDir);
} else {
  console.log('repairPkgWinCache: done. Run npm run build:exe to fetch a clean base and rebuild.');
}
