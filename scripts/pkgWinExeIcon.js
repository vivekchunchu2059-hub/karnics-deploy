/**
 * Replace Windows icon group 1 in a PE using resedit, without growing the .rsrc section
 * (required for pkg / Node base binaries). See vercel/pkg#1894.
 */
async function applyWinExeIcon(exePath, icoPath) {
  const fs = require('fs');
  const [{ NtExecutable, NtExecutableResource }, ResEdit] = await Promise.all([
    import('pe-library'),
    import('resedit'),
  ]);

  const buf = fs.readFileSync(exePath);
  const exe = NtExecutable.from(buf);
  const res = NtExecutableResource.from(exe);

  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const target = groups.find((g) => g.id === 1) || groups[0];
  if (!target) {
    throw new Error('pkgWinExeIcon: no icon group in executable');
  }
  if (target.id !== 1) {
    console.warn(`pkgWinExeIcon: no icon group id 1; using id ${target.id} (lang ${target.lang}).`);
  }

  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));
  const icons = iconFile.icons.map((item) => item.data);

  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries,
    target.id,
    target.lang,
    icons
  );

  try {
    res.outputResource(exe, true, false);
  } catch (e) {
    throw new Error(
      `pkgWinExeIcon: .ico is too large for this PE's resource section (${e.message || e}). Use public/assets/favicon-16x16.ico or a smaller multi-size .ico.`
    );
  }

  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
}

module.exports = { applyWinExeIcon };
