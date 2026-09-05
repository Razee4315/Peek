// Renders the supplied SVG brand mark into PWA/Apple touch icons with sharp.
import { mkdir, copyFile } from 'node:fs/promises'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const brand = path.join(root, 'assets')
const out = path.join(root, 'public', 'brand', 'icons')

const paper = { r: 247, g: 246, b: 242, alpha: 1 }

async function render(size, logoScale, file) {
  const logoPx = Math.round(size * logoScale)
  const logoBuf = await sharp(path.join(brand, 'logo.svg'))
    .resize(logoPx, Math.round((logoPx * 160) / 192))
    .png()
    .toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: paper },
  })
    .composite([{ input: logoBuf, gravity: 'centre' }])
    .png()
    .toFile(path.join(out, file))
  console.log('wrote', file)
}

await mkdir(out, { recursive: true })
await render(192, 0.62, 'pwa-192.png')
await render(512, 0.62, 'pwa-512.png')
// Maskable needs a larger safe zone: keep the mark inside the inner 66%.
await render(512, 0.5, 'maskable-512.png')
await copyFile(path.join(brand, 'logo-mono.svg'), path.join(root, 'public', 'favicon.svg'))
console.log('icons done')
