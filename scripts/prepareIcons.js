const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');

const pngToIco =
  typeof pngToIcoModule === 'function' ? pngToIcoModule : pngToIcoModule.default;

async function prepareIcons() {
  const rootDir = path.resolve(__dirname, '..');
  const sourcePng = path.join(rootDir, 'public', 'mainlogo.png');
  const outputFiles = [
    path.join(rootDir, 'public', 'icon_sunar_khata.ico'),
    path.join(rootDir, 'public', 'favicon.ico'),
    path.join(rootDir, 'public', 'icon_sunar_khata.generated.ico')
  ];

  if (!fs.existsSync(sourcePng)) {
    throw new Error(`Source PNG not found: ${sourcePng}`);
  }

  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = await Promise.all(
    icoSizes.map((size) =>
      sharp(sourcePng)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    )
  );

  const icoBuffer = await pngToIco(pngBuffers);
  outputFiles.forEach((filePath) => fs.writeFileSync(filePath, icoBuffer));

  console.log(
    `prepareIcons: generated multi-size ICO (${icoSizes.join(',')}) from public/mainlogo.png`
  );
}

prepareIcons().catch((error) => {
  console.error('prepareIcons: failed.');
  console.error(error.message);
  process.exit(1);
});
