/**
 * useGlowLevel() — the reduced-glow / high-contrast control.
 *
 * Drives three attributes on <html>:
 *   data-glow      full | soft | off      (default: soft)
 *   data-contrast  normal | high          (default: normal; OS preference also applies)
 *   data-idle      true | absent          (idle dim, burn-in mitigation)
 *
 * plus the `--transcript-size` inline custom property.
 *
 * All four are persisted to localStorage and re-applied pre-paint by the inline
 * head script declared in the layer's nuxt.config, so the page never renders one
 * frame at the wrong glow level and then snaps. This composable is the reactive
 * mirror of that: it reads the attribute the script already set, so there is no
 * flash and no second source of truth.
 *
 * The state is module-scoped, not per-caller — every component that asks gets
 * the same refs, and toggling from a settings page updates a header pill for
 * free.
 *
 * DELIBERATELY NOT reactive to `prefers-contrast` in JS: that preference is
 * handled entirely in CSS (`@media (prefers-contrast: more)` in 10-tokens.css),
 * so the OS setting works even with JS disabled. `data-contrast="high"` is the
 * explicit user override on top; `"normal"` explicitly opts OUT of the OS
 * preference, which is why the media query is written
 * `:root:not([data-contrast="normal"])`.
 */
import { computed, ref, watch } from 'vue'
import { GLOW_LEVELS } from '#neon-grid/shared/tokens'
import type { ContrastMode, GlowLevel } from '#neon-grid/shared/tokens'

const KEY_GLOW = 'ng-glow'
const KEY_CONTRAST = 'ng-contrast'
const KEY_TRANSCRIPT = 'ng-transcript-size'

const DEFAULT_GLOW: GlowLevel = 'soft'
const DEFAULT_CONTRAST: ContrastMode = 'normal'

/** Offered by the "text size" control. Not browser zoom — the chrome stays put. */
export const TRANSCRIPT_SIZES = ['0.95rem', '1.04rem', '1.2rem'] as const
export type TranscriptSize = (typeof TRANSCRIPT_SIZES)[number]

const glow = ref<GlowLevel>(DEFAULT_GLOW)
const contrast = ref<ContrastMode>(DEFAULT_CONTRAST)
const transcriptSize = ref<TranscriptSize>('1.04rem')
const idle = ref(false)
let initialised = false
/** Separate from `initialised`: see the note in useGlowLevel(). */
let idleWatchInstalled = false

function isGlow(v: unknown): v is GlowLevel {
  return typeof v === 'string' && (GLOW_LEVELS as readonly string[]).includes(v)
}

function apply() {
  if (!import.meta.client) return
  const el = document.documentElement
  el.setAttribute('data-glow', glow.value)
  el.setAttribute('data-contrast', contrast.value)
  el.style.setProperty('--transcript-size', transcriptSize.value)
  if (idle.value) el.setAttribute('data-idle', 'true')
  else el.removeAttribute('data-idle')
}

function persist() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(KEY_GLOW, glow.value)
    localStorage.setItem(KEY_CONTRAST, contrast.value)
    localStorage.setItem(KEY_TRANSCRIPT, transcriptSize.value)
  } catch {
    /* private mode / storage disabled — the attribute still works this session */
  }
}

/**
 * Idle-dim timer. Static neon panels on an always-on OLED/mini-LED display are
 * a burn-in risk, and a console nobody is looking at has no reason to be at full
 * brightness. Any pointer/key/scroll clears it instantly.
 */
function installIdleWatch(minutes: number) {
  if (!import.meta.client || minutes <= 0) return () => {}
  let timer: ReturnType<typeof setTimeout> | undefined
  const wake = () => {
    if (idle.value) {
      idle.value = false
      apply()
    }
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      idle.value = true
      apply()
    }, minutes * 60_000)
  }
  const events = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const
  for (const e of events) window.addEventListener(e, wake, { passive: true })
  wake()
  return () => {
    if (timer) clearTimeout(timer)
    for (const e of events) window.removeEventListener(e, wake)
  }
}

export function useGlowLevel(options?: { idleDimMinutes?: number }) {
  if (import.meta.client && !initialised) {
    initialised = true
    const el = document.documentElement
    // The pre-paint script has already read localStorage and stamped the
    // attributes. Read them back rather than re-reading storage, so there is
    // exactly one place that decides the initial value.
    const g = el.getAttribute('data-glow')
    if (isGlow(g)) glow.value = g
    const c = el.getAttribute('data-contrast')
    if (c === 'high' || c === 'normal') contrast.value = c
    const t = el.style.getPropertyValue('--transcript-size').trim()
    if (t) transcriptSize.value = t as TranscriptSize

    watch([glow, contrast, transcriptSize], () => {
      apply()
      persist()
    })
  }

  /**
   * Installed OUTSIDE the `!initialised` block, and guarded by its own flag.
   *
   * `plugins/ng-glow.client.ts` calls `useGlowLevel()` with NO options before any
   * component mounts, which sets `initialised = true`. While this lived inside
   * that block, every later `useGlowLevel({ idleDimMinutes })` — the only way the
   * option is ever actually passed — silently did nothing, and the burn-in
   * mitigation this composable documents never ran once.
   *
   * First caller to pass a value wins; the state is module-scoped, so a second
   * timer would just fight the first. The teardown is intentionally not returned:
   * the watch belongs to the singleton, not to whichever component happened to
   * ask first, and unmounting that component must not disarm it.
   */
  if (import.meta.client && !idleWatchInstalled && options?.idleDimMinutes) {
    idleWatchInstalled = true
    installIdleWatch(options.idleDimMinutes)
  }

  function cycleGlow() {
    const i = GLOW_LEVELS.indexOf(glow.value)
    glow.value = GLOW_LEVELS[(i + 1) % GLOW_LEVELS.length]!
  }

  return {
    glow,
    contrast,
    transcriptSize,
    idle,
    levels: GLOW_LEVELS,
    transcriptSizes: TRANSCRIPT_SIZES,
    /** True when NO bloom should be drawn — including on canvas. */
    glowOff: computed(() => glow.value === 'off' || contrast.value === 'high'),
    setGlow: (v: GlowLevel) => {
      glow.value = v
    },
    setContrast: (v: ContrastMode) => {
      contrast.value = v
    },
    setTranscriptSize: (v: TranscriptSize) => {
      transcriptSize.value = v
    },
    cycleGlow,
  }
}
