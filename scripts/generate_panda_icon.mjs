import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Warm sunrise gradient (amber -> orange -> rose) as in landing page -->
    <linearGradient id="warmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>

    <!-- Subtle inner white gradient -->
    <linearGradient id="innerWhite" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#fff8f2" />
    </linearGradient>

    <!-- Soft drop shadow -->
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#ea580c" flood-opacity="0.25" />
    </filter>

    <filter id="pandaHeadShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#7c2d12" flood-opacity="0.1" />
    </filter>
  </defs>

  <!-- Outer squircle with warm gradient -->
  <rect width="512" height="512" rx="128" fill="url(#warmGrad)" />

  <!-- Inner white container matching the landing logo (p-0.5 rounded-[14px]) -->
  <rect x="22" y="22" width="468" height="468" rx="112" fill="url(#innerWhite)" filter="url(#pandaHeadShadow)" />

  <!-- PANDA FACE -->
  <!-- Left Ear -->
  <circle cx="164" cy="148" r="54" fill="#2d1b13" />
  <circle cx="164" cy="148" r="34" fill="#4a3024" />

  <!-- Right Ear -->
  <circle cx="348" cy="148" r="54" fill="#2d1b13" />
  <circle cx="348" cy="148" r="34" fill="#4a3024" />

  <!-- Head Base -->
  <circle cx="256" cy="276" r="146" fill="#ffffff" stroke="#f6ede5" stroke-width="6" />

  <!-- Left Eye Patch (rotated oval) -->
  <g transform="translate(196, 262) rotate(-16) translate(-196, -262)">
    <ellipse cx="196" cy="262" rx="42" ry="50" fill="#2d1b13" />
  </g>

  <!-- Right Eye Patch (rotated oval) -->
  <g transform="translate(316, 262) rotate(16) translate(-316, -262)">
    <ellipse cx="316" cy="262" rx="42" ry="50" fill="#2d1b13" />
  </g>

  <!-- Left Eye Sparkles -->
  <circle cx="204" cy="254" r="13" fill="#ffffff" />
  <circle cx="211" cy="248" r="4.5" fill="#ffffff" />

  <!-- Right Eye Sparkles -->
  <circle cx="308" cy="254" r="13" fill="#ffffff" />
  <circle cx="315" cy="248" r="4.5" fill="#ffffff" />

  <!-- Blushing Cheeks -->
  <ellipse cx="152" cy="316" rx="24" ry="15" fill="#fda4af" opacity="0.85" />
  <ellipse cx="360" cy="316" rx="24" ry="15" fill="#fda4af" opacity="0.85" />

  <!-- Cute Triangular Nose -->
  <path d="M 242 292 C 242 284, 270 284, 270 292 C 270 300, 256 310, 256 310 C 256 310, 242 300, 242 292 Z" fill="#2d1b13" />

  <!-- Smiling Mouth -->
  <path d="M 240 318 Q 256 332 256 312 Q 256 332 272 318" fill="none" stroke="#2d1b13" stroke-width="6" stroke-linecap="round" />
</svg>`;

async function main() {
  const root = process.cwd();
  const svgBuffer = Buffer.from(svgContent);

  // 1. Save public/icons/icon.svg
  fs.writeFileSync(path.join(root, 'public/icons/icon.svg'), svgContent);
  // Also save src/app/icon.svg (Next.js App router automatically serves this)
  fs.writeFileSync(path.join(root, 'src/app/icon.svg'), svgContent);
  // Also save public/favicon.svg
  fs.writeFileSync(path.join(root, 'public/favicon.svg'), svgContent);

  console.log('✓ Wrote icon.svg files');

  // 2. Generate PNGs:
  // - 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(root, 'public/icons/icon-192x192.png'));
  console.log('✓ Generated icon-192x192.png');

  // - 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(root, 'public/icons/icon-512x512.png'));
  console.log('✓ Generated icon-512x512.png');

  // - 512x512 maskable (with slight padding for safe zone)
  const maskableSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#f97316" />
    <g transform="translate(51, 51) scale(0.8)">
      ${svgContent.replace(/^<svg[^>]*>|<\/svg>$/g, '')}
    </g>
  </svg>`;
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(root, 'public/icons/icon-maskable-512x512.png'));
  console.log('✓ Generated icon-maskable-512x512.png');

  // - apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(root, 'public/apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png');

  // - favicon.ico (32x32 PNG inside ico or direct 32x32 ico)
  // sharp can generate png, and ico can be saved or converted
  const ico32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(root, 'public/favicon.ico'), ico32);
  fs.writeFileSync(path.join(root, 'src/app/favicon.ico'), ico32);
  console.log('✓ Generated favicon.ico');

  // - src/app/icon.png (32x32 and 192x192)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(root, 'src/app/icon.png'));
  console.log('✓ Generated src/app/icon.png');
}

main().catch(console.error);

