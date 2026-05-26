/**
 * Generate OG images, social cards, and favicon pack from public/logo.png
 * Run: npm run generate:seo
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const logoPath = path.join(root, 'public', 'logo.png');
const faviconDir = path.join(root, 'public', 'favicon');
const appDir = path.join(root, 'app');

const BRAND = {
  name: 'Vee Care',
  tagline: 'Feminine Care and Wellness for Every Woman',
  sub: 'Accra, Ghana - Shop Online',
  cream: '#FFF9F7',
  blush: '#F6E6E8',
  berry: '#C95D7B',
  rose: '#E88BA8',
  cocoa: '#5B4B4B',
  lavender: '#DCC9D6',
};

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function ogSvg(width, height, variant = 'landscape') {
  const isSquare = variant === 'square';
  const titleSize = isSquare ? 56 : 64;
  const tagSize = isSquare ? 26 : 30;
  const subSize = isSquare ? 20 : 22;
  const textX = isSquare ? 80 : 480;
  const titleY = isSquare ? height - 200 : 300;
  const tagY = titleY + 56;
  const subY = tagY + 44;

  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${BRAND.cream}"/>
      <stop offset="40%" style="stop-color:${BRAND.blush}"/>
      <stop offset="100%" style="stop-color:${BRAND.lavender};stop-opacity:0.5"/>
    </linearGradient>
    <linearGradient id="bar" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${BRAND.rose}"/>
      <stop offset="100%" style="stop-color:${BRAND.berry}"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="${width * 0.88}" cy="${height * 0.12}" r="${Math.min(width, height) * 0.14}" fill="${BRAND.rose}" opacity="0.18"/>
  <circle cx="${width * 0.08}" cy="${height * 0.75}" r="${Math.min(width, height) * 0.2}" fill="${BRAND.lavender}" opacity="0.2"/>
  <rect x="0" y="0" width="10" height="100%" fill="url(#bar)"/>
  <text x="${textX}" y="${titleY}" font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" font-weight="600" fill="${BRAND.berry}" filter="url(#soft)">${BRAND.name}</text>
  <text x="${textX}" y="${tagY}" font-family="Arial, Helvetica, sans-serif" font-size="${tagSize}" fill="${BRAND.cocoa}" opacity="0.9">${BRAND.tagline}</text>
  <text x="${textX}" y="${subY}" font-family="Arial, Helvetica, sans-serif" font-size="${subSize}" fill="${BRAND.cocoa}" opacity="0.65">${BRAND.sub}</text>
</svg>`);
}

async function buildOgImage(width, height, outFile, variant = 'landscape') {
  const bg = await sharp(ogSvg(width, height, variant)).png().toBuffer();
  const logoMaxH = Math.round(height * (variant === 'square' ? 0.35 : 0.55));
  const logo = await sharp(logoPath).resize({ height: logoMaxH, fit: 'inside' }).png().toBuffer();
  const meta = await sharp(logo).metadata();
  const left =
    variant === 'square'
      ? Math.round((width - (meta.width || logoMaxH)) / 2)
      : Math.round(width * 0.055);
  const top = Math.round((height - (meta.height || logoMaxH)) / 2);

  await sharp(bg)
    .composite([{ input: logo, left, top }])
    .png({ quality: 92, compressionLevel: 6 })
    .toFile(outFile);
  console.log('  ✓', path.relative(root, outFile));
}

async function buildFavicon(size, outFile, withBg = false) {
  const pad = withBg ? Math.round(size * 0.12) : 0;
  const inner = size - pad * 2;

  if (withBg) {
    const bg = { r: 255, g: 249, b: 247, alpha: 1 };
    const logoBuf = await sharp(logoPath)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background: bg },
    })
      .composite([{ input: logoBuf, gravity: 'centre' }])
      .png()
      .toFile(outFile);
  } else {
    await sharp(logoPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(outFile);
  }
  console.log('  ✓', path.relative(root, outFile));
}

async function buildIco() {
  const fav32 = path.join(faviconDir, 'favicon-32x32.png');
  await sharp(fav32).toFile(path.join(faviconDir, 'favicon.ico'));
  console.log('  ✓', path.relative(root, path.join(faviconDir, 'favicon.ico')));
}

async function main() {
  if (!fs.existsSync(logoPath)) {
    console.error('Missing public/logo.png — add your logo first.');
    process.exit(1);
  }

  await ensureDir(faviconDir);

  console.log('\nGenerating social share images…');
  await buildOgImage(1200, 630, path.join(root, 'public', 'og-image.png'), 'landscape');
  await buildOgImage(1200, 630, path.join(root, 'public', 'twitter-card.png'), 'landscape');
  await buildOgImage(1200, 1200, path.join(root, 'public', 'og-image-square.png'), 'square');

  console.log('\nGenerating favicon pack in public/favicon/…');
  await buildFavicon(16, path.join(faviconDir, 'favicon-16x16.png'), false);
  await buildFavicon(32, path.join(faviconDir, 'favicon-32x32.png'), false);
  await buildFavicon(48, path.join(faviconDir, 'favicon-48x48.png'), false);
  await buildFavicon(180, path.join(faviconDir, 'apple-touch-icon.png'), true);
  await buildFavicon(192, path.join(faviconDir, 'android-chrome-192x192.png'), true);
  await buildFavicon(512, path.join(faviconDir, 'android-chrome-512x512.png'), true);
  await buildIco();

  await fs.promises.copyFile(
    path.join(faviconDir, 'favicon-32x32.png'),
    path.join(appDir, 'icon.png')
  );
  await fs.promises.copyFile(
    path.join(faviconDir, 'apple-touch-icon.png'),
    path.join(appDir, 'apple-icon.png')
  );
  await fs.promises.copyFile(path.join(faviconDir, 'favicon.ico'), path.join(appDir, 'favicon.ico'));
  console.log('  ✓ app/icon.png, app/apple-icon.png, app/favicon.ico');

  const webmanifest = {
    name: BRAND.name,
    short_name: 'Vee Care',
    description: 'Feminine care and wellness - Accra, Ghana',
    start_url: '/',
    display: 'standalone',
    background_color: BRAND.cream,
    theme_color: BRAND.rose,
    icons: [
      {
        src: '/favicon/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/favicon/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
  await fs.promises.writeFile(
    path.join(faviconDir, 'site.webmanifest'),
    JSON.stringify(webmanifest, null, 2)
  );
  await fs.promises.writeFile(
    path.join(root, 'public', 'manifest.json'),
    JSON.stringify(
      {
        ...webmanifest,
        icons: webmanifest.icons.map((i) => ({ ...i, purpose: undefined })),
      },
      null,
      2
    )
  );

  const browserconfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/favicon/android-chrome-192x192.png"/>
      <TileColor>${BRAND.rose}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
  await fs.promises.writeFile(path.join(faviconDir, 'browserconfig.xml'), browserconfig);
  console.log('  ✓ public/favicon/site.webmanifest, public/manifest.json, browserconfig.xml');

  const robotsTxt = `# ${BRAND.name} — ${BRAND.sub}
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout
Disallow: /cart
Disallow: /account/
Disallow: /auth/

Sitemap: https://veecarehera.com/sitemap.xml
`;
  await fs.promises.writeFile(path.join(root, 'public', 'robots.txt'), robotsTxt);
  console.log('  ✓ public/robots.txt');

  console.log('\nDone. Set NEXT_PUBLIC_APP_URL=https://veecarehera.com in .env.local\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
