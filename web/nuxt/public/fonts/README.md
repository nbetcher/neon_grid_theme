# Self-hosted fonts

This directory is populated by `npm run fonts` (`scripts/fetch-fonts.mjs`) and is
**git-ignored** — binaries are not committed.

| File | Family | Weights | Notes |
|---|---|---|---|
| `orbitron-variable.woff2` | Orbitron | `400 900` (variable `wght` axis) | display voice |
| `share-tech-mono-400.woff2` | Share Tech Mono | `400` | mono / body voice |

Both families are **SIL Open Font License 1.1**; the licence text is fetched
alongside them as `LICENSE-Orbitron.txt` / `LICENSE-ShareTechMono.txt`.

## Why self-hosted

The console runs on a LAN-bound Windows box that must work with the internet
down. A `fonts.googleapis.com` `<link>` is a silent failure mode: the type falls
back to `sans-serif`/`monospace` and the whole design reads as broken at exactly
the moment you need to read it.

## If the files are missing

Nothing breaks. `--font-display` and `--font-mono` carry real fallback stacks
(`Rajdhani → ui-sans-serif → system-ui` and `ui-monospace → Cascadia Mono →
Consolas`). The two `<link rel="preload">` tags in `nuxt.config.ts` will log a
404 in devtools; that is the intended nag. `npm run fonts:check` fails the build
if you want it enforced.

## Orbitron weight 300 does not exist

The petite-vue showcase requested `Orbitron:wght@300;400;600;700`. Orbitron's
variable weight axis is **400–900** — 300 was clamped to 400 by every browser,
and no rule in `styles.css` ever used it. The port drops the phantom request.
