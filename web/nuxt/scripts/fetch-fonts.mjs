#!/usr/bin/env node
/**
 * fetch-fonts.mjs — self-host the two Neon Grid faces into `public/fonts/`.
 *
 *   node scripts/fetch-fonts.mjs           # download
 *   node scripts/fetch-fonts.mjs --check   # exit 1 if any face is missing
 *
 * WHY THIS EXISTS
 * ---------------
 * The petite-vue showcase loads Orbitron and Share Tech Mono from the Google
 * Fonts CDN. Verde Watch runs on a LAN-bound bare-metal Windows box that has to
 * keep working when the internet does not (D4/D7). A CDN font link is a silent
 * failure mode: the console falls back to sans-serif/monospace and looks broken
 * at exactly the moment you need to read it. So: self-host.
 *
 * The `.woff2` binaries are NOT committed (see .gitignore). Run this once after
 * `npm install`; the files are ~20 kB total and the layer degrades gracefully to
 * the fallback stacks in `--font-display` / `--font-mono` if they are absent.
 *
 * WHAT IT ACTUALLY FETCHES
 * ------------------------
 * Google serves **Orbitron as a single variable woff2** (wght axis 400–900), not
 * four static weights. Verified 2026-08-17 against the css2 API:
 *   https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900
 *   → font-weight: 400 900;  src: .../orbitron/v35/yMJRMIlzdpvBhQQL_Qq7dy0.woff2
 *
 * The petite-vue `<link>` requested weight **300**, which Orbitron does not have
 * — browsers clamped it to 400, and no rule in styles.css ever asked for 300.
 * The port drops it. Weights genuinely used: 400 (table heads), 600 (titles,
 * pills), 700 (stat values, logo, avatars).
 *
 * Share Tech Mono has a single weight (400) and no axes.
 *
 * The gstatic file hashes rotate when Google reissues a family (v35 → v36…), so
 * this script resolves them at run time from the css2 API rather than hardcoding
 * URLs that will rot.
 *
 * LICENCE: both families are SIL Open Font License 1.1. Self-hosting is
 * explicitly permitted; the OFL text is fetched alongside and written to
 * `public/fonts/LICENSE-*.txt`.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(here, '..', 'public', 'fonts')

// A modern desktop UA is required — the css2 API serves .ttf to unknown agents.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/** family query → output filename → expected @font-face metadata */
const FACES = [
  {
    out: 'orbitron-variable.woff2',
    css: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap',
    family: 'Orbitron',
    weight: '400 900',
    licence: 'https://raw.githubusercontent.com/google/fonts/main/ofl/orbitron/OFL.txt',
    licenceOut: 'LICENSE-Orbitron.txt',
  },
  {
    out: 'share-tech-mono-400.woff2',
    css: 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap',
    family: 'Share Tech Mono',
    weight: '400',
    licence: 'https://raw.githubusercontent.com/google/fonts/main/ofl/sharetechmono/OFL.txt',
    licenceOut: 'LICENSE-ShareTechMono.txt',
  },
]

const missing = FACES.filter((f) => !existsSync(join(OUT_DIR, f.out)))

if (process.argv.includes('--check')) {
  if (missing.length) {
    console.error(
      `[neon-grid] missing self-hosted fonts: ${missing.map((m) => m.out).join(', ')}\n` +
        '            run `npm run fonts` (needs internet, once). The UI still works —\n' +
        '            it falls back to the stacks in --font-display / --font-mono.',
    )
    process.exit(1)
  }
  console.log('[neon-grid] all self-hosted fonts present.')
  process.exit(0)
}

mkdirSync(OUT_DIR, { recursive: true })

const manifest = { fetchedAt: new Date().toISOString(), faces: [] }

for (const face of FACES) {
  process.stdout.write(`[neon-grid] resolving ${face.family}… `)
  const cssRes = await fetch(face.css, { headers: { 'User-Agent': UA } })
  if (!cssRes.ok) throw new Error(`css2 API ${cssRes.status} for ${face.family}`)
  const css = await cssRes.text()

  // Take the FIRST latin woff2 url. The css2 API emits latin last-or-first
  // depending on subset ordering, so filter on the latin unicode-range block.
  const blocks = css.split('@font-face').filter((b) => b.includes('woff2'))
  const latin = blocks.find((b) => b.includes('U+0000-00FF')) ?? blocks[0]
  const m = latin && /url\((https:\/\/[^)]+\.woff2)\)/.exec(latin)
  if (!m) throw new Error(`no woff2 url found for ${face.family}`)
  const url = m[1]

  const binRes = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!binRes.ok) throw new Error(`font download ${binRes.status} for ${url}`)
  const buf = Buffer.from(await binRes.arrayBuffer())
  writeFileSync(join(OUT_DIR, face.out), buf)
  console.log(`${face.out} (${(buf.length / 1024).toFixed(1)} kB) ← ${url}`)

  manifest.faces.push({ family: face.family, weight: face.weight, file: face.out, source: url, bytes: buf.length })

  try {
    const lic = await fetch(face.licence)
    if (lic.ok) writeFileSync(join(OUT_DIR, face.licenceOut), await lic.text(), 'utf8')
  } catch {
    console.warn(`[neon-grid] could not fetch OFL text for ${face.family} — fetch it by hand from ${face.licence}`)
  }
}

writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
console.log('[neon-grid] done. `app/assets/css/05-fonts.css` already points at these filenames.')
