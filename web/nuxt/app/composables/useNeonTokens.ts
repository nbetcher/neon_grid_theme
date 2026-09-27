/**
 * useNeonTokens() — typed, auto-imported access to the Neon Grid tokens.
 *
 * Everything returned here is re-exported from `shared/tokens.ts`, which is the
 * single source of truth that also generates `10-tokens.css`. If you need the
 * tokens in a Nitro handler or a build script instead, import the module
 * directly: `import { NEON } from '#neon-grid/shared/tokens'`.
 *
 * `cssVar()` reads a live custom property off <html>, which is how you get the
 * CURRENT value under a given glow level or contrast mode — the static token
 * object always describes GLOW=full.
 */
import {
  BORDER,
  CHART,
  GLOW_LEVELS,
  GRID,
  NEON,
  RADIUS,
  SEVERITY,
  SPECTRUM,
  SUBSTRATE,
  TEXT,
  TRANSITION,
  contrastRatio,
  hexA,
  hexToRgb,
} from '#neon-grid/shared/tokens'
import type { GlowLevel, NeonColor, SeverityKey } from '#neon-grid/shared/tokens'

export function useNeonTokens() {
  /** Read a live CSS custom property from <html>. Client-only; '' on the server. */
  function cssVar(name: string): string {
    if (!import.meta.client) return ''
    const n = name.startsWith('--') ? name : `--${name}`
    return getComputedStyle(document.documentElement).getPropertyValue(n).trim()
  }

  /** Read a live numeric custom property (e.g. --chart-glow-scale). */
  function cssVarNumber(name: string, fallback = 0): number {
    const raw = cssVar(name)
    const n = Number.parseFloat(raw)
    return Number.isFinite(n) ? n : fallback
  }

  /** Colour for a severity key, with a safe fallback. */
  function severityColor(key: string | null | undefined): string {
    return SEVERITY[(key ?? '') as SeverityKey] ?? TEXT.dim
  }

  /** Deterministic spectrum colour for an arbitrary index (charts, legends). */
  function spectrumAt(i: number): string {
    return SPECTRUM[((i % SPECTRUM.length) + SPECTRUM.length) % SPECTRUM.length]!
  }

  return {
    NEON,
    SPECTRUM,
    SEVERITY,
    SUBSTRATE,
    BORDER,
    TEXT,
    RADIUS,
    GRID,
    CHART,
    TRANSITION,
    GLOW_LEVELS,
    hexA,
    hexToRgb,
    contrastRatio,
    cssVar,
    cssVarNumber,
    severityColor,
    spectrumAt,
  }
}

export type { GlowLevel, NeonColor, SeverityKey }
