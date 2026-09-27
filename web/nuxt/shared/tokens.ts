/**
 * Neon Grid — SINGLE SOURCE OF TRUTH for every design token.
 *
 * `app/assets/css/10-tokens.css` is GENERATED from this file by
 * `scripts/gen-tokens-css.mjs`. Never hand-edit that CSS. `npm run tokens:check`
 * fails the build if it is stale.
 *
 * The same object feeds:
 *   - `10-tokens.css`                    (the CSS custom properties)
 *   - `composables/useNeonChart.ts`      (Chart.js palette + NeonGlow plugin)
 *   - `composables/useNeonTokens.ts`     (runtime typed access)
 *   - any future MapLibre / ECharts / LVGL / Android theme emitter
 *
 * CONVENTION (from dossier 11 §9.1): **uppercase hex in TS, lowercase hex in CSS**.
 * The generator lowercases on the way out. Values are byte-identical to
 * `INDEX.md` and `web/petite-vue/styles.css`.
 *
 * This module must stay free of Nuxt/Vue imports: `scripts/*.mjs` imports it
 * directly under Node's native TypeScript type-stripping (Node >= 22.6).
 * Erasable syntax only — no enums, no namespaces, no parameter properties.
 */

/* ------------------------------------------------------------------ */
/* Spectrum — INDEX.md, exact                                          */
/* ------------------------------------------------------------------ */

export const NEON = {
  cyan: '#00E0FF', // brand / primary
  green: '#00FF95', // positive / secondary
  fuchsia: '#FF2DAA', // tertiary  (CSS var is --magenta, see CSS_ALIAS below)
  orange: '#FF9500', // action / accent
  blue: '#1F9BFF', // metric gradients
  violet: '#8A45FF', // brand gradients
  red: '#FF3B5C', // danger / error
  yellow: '#FFE11A', // caution
} as const

/** Ordered categorical palette. Identical to `charts.js`'s SPECTRUM. */
export const SPECTRUM = [
  NEON.cyan,
  NEON.fuchsia,
  NEON.green,
  NEON.orange,
  NEON.violet,
  NEON.blue,
  NEON.yellow,
  NEON.red,
] as const

/* ------------------------------------------------------------------ */
/* Substrate — #0A0A12 → #1C1C44 (void → elevated)                     */
/* ------------------------------------------------------------------ */

export const SUBSTRATE = {
  darkest: '#0A0A12', // void — page ground
  dark: '#0D0D1A', // header / table head
  panel: '#111125', // card ground
  panelHover: '#161638', // row hover
  input: '#0E0E20', // control ground
  elevated: '#1C1C44', // elevated end of the ramp
} as const

export const BORDER = {
  base: '#20204A',
  glow: '#00E0FF', // snapped to brand cyan (was #00D4FF in the pre-reconciliation theme)
  glowDim: 'rgba(0,224,255,0.45)',
  cyanDim: 'rgba(0,224,255,0.58)',
} as const

/* ------------------------------------------------------------------ */
/* Text                                                                */
/* ------------------------------------------------------------------ */

export const TEXT = {
  primary: '#EAF0FB',
  secondary: '#9FB0D6',
  dim: '#62749C',

  /**
   * A11y additions (dossier 11 §10.1). These do not change any spectrum colour.
   * They promote literals that ALREADY existed inline in `styles.css` to tokens,
   * and add one new label colour, so that small text clears WCAG AA (4.5:1).
   *
   *   --text-dim  #62749C = 3.98:1 on --bg-panel  → FAILS AA at label sizes
   *   --text-label #7D8CB5 = 5.56:1 on --bg-panel → passes
   *   --violet    #8A45FF = 3.87:1 on --bg-panel  → FAILS AA as glyph colour
   *                                                 (still clears 3:1 for strokes/borders)
   *   --violet-text #B794FF = 7.69:1               → passes
   */
  label: '#7D8CB5', // every visible label/caption
  violet: '#B794FF', // ANY violet glyph (already used by .btn-violet/.badge-violet)
  red: '#FF6B85', // "lit" red glyph (already used by .badge-danger-strong)
  green: '#A5FFCE', // "lit" green glyph (already used by .resolution-block)
} as const

/**
 * Canonical severity ramp (matches the code-review findings-board vocabulary).
 *
 * Declared AFTER `TEXT` so `cleanup` can reference `TEXT.dim` rather than repeat
 * its literal. This module exists because `#00E0FF` was once hand-written in five
 * places; a hardcoded `'#62749C'` here with a `// --text-dim` comment beside it
 * would have been the sixth.
 */
export const SEVERITY = {
  critical: NEON.red,
  high: NEON.orange,
  medium: NEON.yellow,
  low: NEON.cyan,
  cleanup: TEXT.dim,
} as const

/* ------------------------------------------------------------------ */
/* Geometry / motion                                                   */
/* ------------------------------------------------------------------ */

/** Corners — 6 / 8 / 12 / 20, per INDEX.md. */
export const RADIUS = { xs: 6, sm: 8, md: 12, lg: 20 } as const

export const TRANSITION = '0.25s cubic-bezier(0.4,0,0.2,1)'

export const GRID = {
  /** Grid cell in px. 42 can moiré at 125 %/150 % Windows scaling — see README. */
  size: 42,
  /** Line alpha at GLOW=full. Dimmed at soft/off. */
  alpha: 0.05,
  /** Shift distance of the 20 s `gridShift` translate. */
  drift: 40,
} as const

/* ------------------------------------------------------------------ */
/* Type                                                                */
/* ------------------------------------------------------------------ */

export const FONT = {
  /**
   * Display voice — Orbitron. Variable font, weight axis **400–900**.
   * NOTE: the petite-vue showcase requested weight 300, which Orbitron does not
   * have; browsers clamped it to 400 and no rule in `styles.css` ever used 300.
   * The port drops the phantom 300 request. Weights actually used: 400/600/700.
   */
  display: "'Orbitron', 'Rajdhani', ui-sans-serif, system-ui, sans-serif",
  /** Mono/body voice — Share Tech Mono, single weight 400 (family has no bold). */
  mono: "'Share Tech Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace",
} as const

/* ------------------------------------------------------------------ */
/* Glow                                                                */
/* ------------------------------------------------------------------ */

/**
 * Glow grammar: `0 0 {r}px rgba(R,G,B,{a})` × 3 stops.
 *
 * The petite-vue source is NOT uniform — cyan and green carry slightly hotter
 * alphas and a wider third stop than the rest. Those differences are preserved
 * byte-for-byte here rather than smoothed into one formula, because "hex values
 * preserved EXACTLY" applies to the glow ramp too.
 */
export type GlowSpec = { radii: readonly [number, number, number]; alphas: readonly [number, number, number] }

/** The default spectrum ramp: r 7/18/36, a .55/.28/.12 */
export const GLOW_SPEC_DEFAULT: GlowSpec = { radii: [7, 18, 36], alphas: [0.55, 0.28, 0.12] }
/** Cyan runs hotter and wider: r 7/18/38, a .6/.32/.14 */
export const GLOW_SPEC_CYAN: GlowSpec = { radii: [7, 18, 38], alphas: [0.6, 0.32, 0.14] }
/** Green: r 7/18/38, a .6/.3/.13 */
export const GLOW_SPEC_GREEN: GlowSpec = { radii: [7, 18, 38], alphas: [0.6, 0.3, 0.13] }
/** `--glow-cyan-strong`: r 9/26/52, a .9/.5/.22 */
export const GLOW_SPEC_STRONG: GlowSpec = { radii: [9, 26, 52], alphas: [0.9, 0.5, 0.22] }

/** Which spec each `--glow-*` token uses. Keys are the CSS token suffixes. */
export const GLOW_TOKENS = {
  cyan: { color: NEON.cyan, spec: GLOW_SPEC_CYAN },
  'cyan-strong': { color: NEON.cyan, spec: GLOW_SPEC_STRONG },
  green: { color: NEON.green, spec: GLOW_SPEC_GREEN },
  red: { color: NEON.red, spec: GLOW_SPEC_DEFAULT },
  violet: { color: NEON.violet, spec: GLOW_SPEC_DEFAULT },
  magenta: { color: NEON.fuchsia, spec: GLOW_SPEC_DEFAULT },
  orange: { color: NEON.orange, spec: GLOW_SPEC_DEFAULT },
  blue: { color: NEON.blue, spec: GLOW_SPEC_DEFAULT },
  yellow: { color: NEON.yellow, spec: GLOW_SPEC_DEFAULT },
} as const

/**
 * GLOW LEVELS. CSS cannot multiply a box-shadow list by a scalar, so each level
 * is a full token set swapped by `<html data-glow="...">`.
 *
 *  full — the shipped values. Screenshot / demo / wall-display setting.
 *  soft — DEFAULT. radii ×0.7 (rounded), alphas ×0.55, third stop dropped.
 *         The panel/pill box-shadow bloom is what carries the look; the glyph
 *         text-shadow contributes far less than it costs in legibility.
 *  off  — no box-shadow, no text-shadow. Still fully legible, still Neon Grid
 *         (colour + border + gradient hairlines all survive).
 */
export const GLOW_LEVELS = ['full', 'soft', 'off'] as const
export type GlowLevel = (typeof GLOW_LEVELS)[number]

export const GLOW_SOFT_SCALE = { radius: 0.7, alpha: 0.55, stops: 2 } as const

/** Glyph `text-shadow` per level — the harmful one, gated separately. */
export const GLYPH_GLOW: Record<GlowLevel, string> = {
  full: '0 0 6px currentColor',
  soft: '0 0 3px currentColor',
  off: 'none',
}

/** `.grid-bg` line alpha per level. */
export const GRID_ALPHA: Record<GlowLevel, number> = { full: 0.05, soft: 0.035, off: 0.02 }

/** Multiplier applied to Chart.js `ctx.shadowBlur` — read by `useNeonChart()`. */
export const CHART_GLOW_SCALE: Record<GlowLevel, number> = { full: 1, soft: 0.6, off: 0 }

/* ------------------------------------------------------------------ */
/* Contrast mode                                                       */
/* ------------------------------------------------------------------ */

export const CONTRAST_MODES = ['normal', 'high'] as const
export type ContrastMode = (typeof CONTRAST_MODES)[number]

/**
 * `[data-contrast="high"]` and `@media (prefers-contrast: more)` apply the same
 * overrides. High contrast also forces GLOW=off and thickens container borders.
 */
export const HIGH_CONTRAST = {
  '--text-dim': '#8fa0c8',
  '--text-label': '#a6b4d6',
  '--text-secondary': '#c3cfe8',
  '--border-base': '#3a3a7a',
  '--border-glow-dim': 'rgba(0,224,255,0.85)',
  '--cyan-dim': 'rgba(0,224,255,0.9)',
} as const

/* ------------------------------------------------------------------ */
/* Chart parity tokens                                                 */
/* ------------------------------------------------------------------ */

export const CHART = {
  fillAlpha: 0.22,
  gridLine: 'rgba(0,224,255,0.10)',
  /** Chart.js default grid colour as used by charts.js (0.06, not 0.10). */
  gridLineChartjs: 'rgba(0,224,255,0.06)',
  gridTick: 'rgba(0,224,255,0.12)',
  axisLine: 'rgba(138,69,255,0.18)',
  tooltipBg: 'rgba(17,17,37,0.95)',
} as const

/* ------------------------------------------------------------------ */
/* CSS variable naming                                                 */
/* ------------------------------------------------------------------ */

/**
 * The CSS custom property for the fuchsia/tertiary hue is historically
 * `--magenta`. INDEX.md calls the colour "Fuchsia". Same value. Keep both names
 * so neither vocabulary breaks: `--magenta` is canonical, `--fuchsia` is an alias.
 */
export const CSS_ALIAS = { fuchsia: 'magenta' } as const

/* ------------------------------------------------------------------ */
/* Helpers (shared by the generator and the runtime)                   */
/* ------------------------------------------------------------------ */

/**
 * '#00E0FF' → [0,224,255]. Accepts 3-, 4-, 6- or 8-digit hex, with or without '#'.
 *
 * VALIDATES rather than degrading. The previous version returned `[0,0,0]` for
 * anything unparseable, because `Number.parseInt('rgba(...)', 16)` is NaN and
 * `(NaN >> 16) & 255` is 0 — so passing an `rgba()` token such as
 * `BORDER.glowDim` produced a BLACK glow with no error anywhere. It also parsed
 * 8-digit `#RRGGBBAA` as one 32-bit integer, shifting every channel by a byte.
 * Both failures produced plausible-looking wrong colours, which is the worst
 * outcome available in a design system whose whole job is exact colour.
 *
 * Any alpha suffix is discarded — this returns RGB. Use `hexA()` to set alpha.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]+$/.test(h) || ![3, 4, 6, 8].includes(h.length)) {
    throw new TypeError(
      `hexToRgb: expected 3-, 4-, 6- or 8-digit hex, got ${JSON.stringify(hex)}. ` +
        'rgba()/hsl()/named colours are not hex — pass the hex token instead.',
    )
  }
  const six =
    h.length <= 4
      ? h.slice(0, 3).split('').map((c) => c + c).join('') // #RGB / #RGBA → RRGGBB
      : h.slice(0, 6) // #RRGGBB / #RRGGBBAA → RRGGBB
  const n = Number.parseInt(six, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** '#00E0FF', 0.45 → 'rgba(0,224,255,0.45)'. Matches charts.js `hexA()`. */
export function hexA(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

/** Build a 3-stop (or `stops`-stop) box-shadow glow string from a spec. */
export function glowString(hex: string, spec: GlowSpec, opts?: { radiusScale?: number; alphaScale?: number; stops?: number }): string {
  const rs = opts?.radiusScale ?? 1
  const as = opts?.alphaScale ?? 1
  // Clamped to the spec's own length. A GlowSpec is a fixed 3-tuple, so a caller
  // asking for 4 stops used to read past the end; the `!` assertions below turned
  // that into `0 0 undefinedpx rgba(0,224,255,NaN)`, which CSS discards as
  // invalid — silently dropping the ENTIRE box-shadow rather than one stop.
  const n = Math.max(0, Math.min(opts?.stops ?? 3, spec.radii.length))
  const parts: string[] = []
  for (let i = 0; i < n; i++) {
    const r = rs === 1 ? spec.radii[i]! : Math.round(spec.radii[i]! * rs)
    const a = as === 1 ? spec.alphas[i]! : round2(spec.alphas[i]! * as)
    parts.push(`0 0 ${r}px ${hexA(hex, a)}`)
  }
  return parts.join(',')
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * WCAG 2.x contrast ratio. Exposed so the showcase page can display live
 * measurements and a CI test can assert the two a11y fixes never regress.
 */
export function contrastRatio(fg: string, bg: string): number {
  const lum = (hex: string) => {
    const [r, g, b] = hexToRgb(hex).map((v) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }) as [number, number, number]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const a = lum(fg)
  const b = lum(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

export type NeonColor = keyof typeof NEON
export type SeverityKey = keyof typeof SEVERITY
export type SubstrateKey = keyof typeof SUBSTRATE
