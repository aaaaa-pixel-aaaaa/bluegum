// One-off generator for the app icon — see BRIEF.md §6 "App icon".
// A single sickle eucalypt leaf silhouette, paper leaf on sickle background.
// Re-run with `node scripts/generate-icons.mjs` after editing the path below.
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const PAPER = '#EEF2EC'
const SICKLE = '#3A5140'

// Falcate (curved, pointed-both-ends) leaf silhouette, drawn in a 100x100
// local space and centered into the canvas via the nested <svg> below.
const LEAF_PATH =
  'M50,8 C82,30 82,74 50,92 C40,74 40,26 50,8 Z'

const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${SICKLE}" />
  <svg x="106" y="66" width="300" height="380" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
    <path d="${LEAF_PATH}" fill="${PAPER}" />
  </svg>
</svg>
`

const outDir = new URL('../public/icons/', import.meta.url)
await mkdir(outDir, { recursive: true })

const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]

for (const [name, size] of targets) {
  const png = await sharp(Buffer.from(svg(size))).resize(size, size).png().toBuffer()
  await writeFile(new URL(name, outDir), png)
  console.log(`wrote ${name}`)
}
