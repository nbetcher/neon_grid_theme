/**
 * useNeonChart() — the Neon Grid Chart.js layer, as a composable.
 *
 * This is a faithful port of `web/petite-vue/charts.js`, with three changes:
 *   1. it is a composable, not a `window.NGCharts` global;
 *   2. registration is tree-shaken and idempotent (no `chart.js/auto`);
 *   3. the bloom radius is multiplied by the live `--chart-glow-scale` token, so
 *      the GLOW=soft/off control reaches the canvas too. Canvas pixels are not
 *      styleable by CSS, so this is the only way a glow control can affect a
 *      chart, and without it the charts would keep glowing in a mode whose whole
 *      point is that nothing glows.
 *
 * Two details from the original are load-bearing and are preserved verbatim:
 *
 *   (a) THE DOUGHNUT BLOOM COLOUR. For doughnut/pie the glow is taken from
 *       `backgroundColor` (the arc fill), NOT `borderColor` — the border on a
 *       doughnut is the dark 3px gap between arcs, and blooming that produces a
 *       muddy black halo. Somebody spent real time getting this right.
 *
 *   (b) `chart.update('none')` ON CONSTRUCTION. Gradient fills are built lazily
 *       from `chart.chartArea`, which is `undefined` on the very first draw. One
 *       silent no-animation update after construction makes the gradients paint
 *       on frame one instead of showing flat fills until the first interaction.
 *       `NgChart.vue` does this; if you construct a Chart by hand, do it too.
 *
 * Reduced motion is honoured by disabling chart animation, not by removing the
 * chart.
 */
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Decimation,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import type { Chart as ChartType, ChartConfiguration, ChartDataset, Plugin, ScriptableContext } from 'chart.js'

import { CHART, NEON, SEVERITY, SPECTRUM, TEXT, hexA } from '#neon-grid/shared/tokens'

/** Per-dataset knobs this layer adds. Set them straight on a dataset object. */
export interface NeonDatasetExtras {
  /** Bloom radius in px. `false` disables. Default 12. */
  neonGlow?: number | false
  /** Force the bloom colour. Otherwise derived — see (a) above. */
  neonGlowColor?: string
}

let registered = false

/**
 * Idempotent tree-shaken registration + global defaults. Safe to call from every
 * component; the work happens once.
 */
function registerNeon() {
  if (registered) return
  registered = true

  Chart.register(
    LineController,
    BarController,
    DoughnutController,
    LineElement,
    PointElement,
    BarElement,
    ArcElement,
    CategoryScale,
    LinearScale,
    Legend,
    Tooltip,
    Filler,
    // LTTB decimation. Chart.js goes from seconds to ~100ms on 5–10k points.
    // Opt-in per chart via `options.plugins.decimation`.
    Decimation,
    NeonGlow,
  )

  const d = Chart.defaults

  // Orbitron for ticks and legend — 11px/600, the size the design uses for
  // every small display-voice label.
  d.font.family = "'Orbitron', sans-serif"
  d.font.size = 11
  d.font.weight = 600
  d.color = TEXT.secondary
  d.borderColor = hexA(NEON.cyan, 0.06)
  d.maintainAspectRatio = false

  d.plugins.legend.labels.color = TEXT.secondary
  d.plugins.legend.labels.usePointStyle = true
  d.plugins.legend.labels.boxWidth = 8
  d.plugins.legend.labels.boxHeight = 8

  // Share Tech Mono for tooltips — numbers line up and it reads as terminal
  // output, which is what a tooltip on this console is.
  Object.assign(d.plugins.tooltip, {
    backgroundColor: CHART.tooltipBg,
    borderColor: hexA(NEON.cyan, 0.5),
    borderWidth: 1,
    titleColor: NEON.cyan,
    bodyColor: TEXT.primary,
    padding: 10,
    cornerRadius: 6,
    titleFont: { family: "'Share Tech Mono', monospace", size: 12 },
    bodyFont: { family: "'Share Tech Mono', monospace", size: 12 },
    displayColors: true,
    boxPadding: 4,
  })

  // Low-alpha cyan gridlines, violet axis border.
  // `d.scale` is typed as the union of every scale variant (radialLinear has no
  // `border`), so the shared-property assignment needs a widening cast. The
  // values themselves are the source's, unchanged.
  const scale = d.scale as unknown as {
    grid: { color: string; tickColor: string }
    border: { color: string }
    ticks: { color: string }
  }
  scale.grid.color = CHART.gridLineChartjs
  scale.grid.tickColor = CHART.gridTick
  scale.border.color = CHART.axisLine
  scale.ticks.color = TEXT.secondary
}

/**
 * Live bloom multiplier from `--chart-glow-scale` (full 1 / soft .6 / off 0).
 *
 * CACHED PER `data-glow`/`data-contrast` PAIR. `getComputedStyle` forces a
 * synchronous style resolution, and this is called from BOTH dataset draw hooks —
 * so an uncached read cost two full style recalcs per dataset per frame, i.e. 8
 * per frame on a 4-series chart during a pointer-move redraw. The value only
 * changes when the user toggles the glow control, which is exactly what the two
 * attributes encode, so keying the cache on them is both cheap and exact.
 */
let glowScaleCache: { key: string; value: number } | null = null

function glowScale(): number {
  if (!import.meta.client) return 1
  const el = document.documentElement
  const key = `${el.getAttribute('data-glow') ?? ''}|${el.getAttribute('data-contrast') ?? ''}`
  if (glowScaleCache?.key === key) return glowScaleCache.value
  const raw = getComputedStyle(el).getPropertyValue('--chart-glow-scale')
  const n = Number.parseFloat(raw)
  const value = Number.isFinite(n) ? n : 1
  glowScaleCache = { key, value }
  return value
}

/**
 * NeonGlow — wraps each dataset's draw in a canvas shadow. This is the whole
 * bloom mechanism; there is no CSS involved.
 */
export const NeonGlow: Plugin = {
  id: 'neonGlow',
  beforeDatasetDraw(chart, args) {
    const ds = (chart.data.datasets[args.index] ?? {}) as ChartDataset & NeonDatasetExtras
    if (ds.neonGlow === false) return
    const scale = glowScale()
    if (scale <= 0) return

    const type = (ds as { type?: string }).type ?? (chart.config as { type?: string }).type
    let col: unknown = ds.neonGlowColor
    if (!col) {
      // (a) doughnut/pie glow the FILL, everything else glows the stroke.
      col = type === 'doughnut' || type === 'pie' ? ds.backgroundColor : (ds.borderColor ?? ds.backgroundColor)
    }
    if (Array.isArray(col)) col = col[0]
    if (typeof col !== 'string') col = NEON.cyan

    const ctx = chart.ctx
    ctx.save()
    ctx.shadowColor = col as string
    ctx.shadowBlur = (ds.neonGlow == null ? 12 : ds.neonGlow) * scale
  },
  afterDatasetDraw(chart, args) {
    const ds = (chart.data.datasets[args.index] ?? {}) as ChartDataset & NeonDatasetExtras
    if (ds.neonGlow === false) return
    if (glowScale() <= 0) return
    chart.ctx.restore()
  },
}

function prefersReducedMotion(): boolean {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useNeonChart() {
  registerNeon()

  /**
   * Vertical gradient fill from `hex` at the top to transparent at the bottom.
   * Returns a flat rgba if `chartArea` is not ready — see (b).
   */
  function gradientFill(
    ctx: CanvasRenderingContext2D,
    area: { top: number; bottom: number } | null | undefined,
    hex: string,
    topA = 0.45,
  ): CanvasGradient | string {
    if (!area) return hexA(hex, 0.25)
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom)
    g.addColorStop(0, hexA(hex, topA))
    g.addColorStop(1, hexA(hex, 0))
    return g
  }

  /** Scriptable `backgroundColor` producing the vertical gradient above. */
  function areaFill(hex: string, topA = 0.4) {
    return (c: ScriptableContext<'line' | 'bar'>) => gradientFill(c.chart.ctx, c.chart.chartArea, hex, topA)
  }

  /**
   * Horizontal gradient, dim → bright. Used by horizontal bars.
   *
   * MEMOISED on (colour, left, right). Chart.js evaluates scriptable options once
   * per data point per render, so `barConfig` was allocating one closure AND one
   * CanvasGradient per bar per frame — thousands of short-lived canvas objects a
   * second on a 40-row chart during a hover redraw. The gradient depends only on
   * the colour and the chart's horizontal extent, so the cache is exact and
   * invalidates itself on resize.
   */
  const gradCache = new Map<string, CanvasGradient>()

  function barFillH(hex: string) {
    return (c: ScriptableContext<'bar'>) => {
      const a = c.chart.chartArea
      if (!a) return hexA(hex, 0.4)
      const key = `${hex}|${a.left}|${a.right}`
      const hit = gradCache.get(key)
      if (hit) return hit
      const g = c.chart.ctx.createLinearGradient(a.left, 0, a.right, 0)
      g.addColorStop(0, hexA(hex, 0.15))
      g.addColorStop(1, hexA(hex, 0.85))
      // Bounded: one entry per (colour, width) pair actually drawn. A resize
      // sweep can add a few dozen; this keeps it from growing across a long
      // session on a console that is never reloaded.
      if (gradCache.size > 256) gradCache.clear()
      gradCache.set(key, g)
      return g
    }
  }

  /* ------------------------------------------------------------------ */
  /* The five builders, ported 1:1                                       */
  /* ------------------------------------------------------------------ */

  /** KPI sparkline tile — no axes, no legend, no tooltip, gradient to origin. */
  function sparklineConfig(series: number[], hex: string = NEON.cyan): ChartConfiguration<'line'> {
    return {
      type: 'line',
      data: {
        labels: series.map((_, i) => i),
        datasets: [
          {
            data: series,
            borderColor: hex,
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            fill: 'origin',
            backgroundColor: areaFill(hex, 0.35),
            neonGlow: 8,
          } as ChartDataset<'line'> & NeonDatasetExtras,
        ],
      },
      options: {
        responsive: true,
        animation: prefersReducedMotion() ? false : undefined,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false, beginAtZero: true } },
        layout: { padding: 2 },
      },
    }
  }

  /**
   * Multi-series line/area. The Verde Watch instance of this is
   * matches-vs-false-positives over time; the source's was opened-vs-resolved.
   * Same chart.
   */
  function lineAreaConfig(
    labels: (string | number)[],
    series: { label: string; data: number[]; color?: string }[],
    opts?: { decimate?: boolean },
  ): ChartConfiguration<'line'> {
    return {
      type: 'line',
      data: {
        labels,
        datasets: series.map((s, i) => {
          const hex = s.color ?? SPECTRUM[i % SPECTRUM.length]!
          return {
            label: s.label,
            data: s.data,
            borderColor: hex,
            borderWidth: 2.5,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            fill: 'origin',
            backgroundColor: areaFill(hex, 0.4),
            neonGlow: 14,
          } as ChartDataset<'line'> & NeonDatasetExtras
        }),
      },
      options: {
        responsive: true,
        animation: prefersReducedMotion() ? false : undefined,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'end' },
          // Anything over ~2000 points wants LTTB or the canvas stalls.
          decimation: opts?.decimate ? { enabled: true, algorithm: 'lttb', samples: 500 } : { enabled: false },
        },
        scales: {
          x: { grid: { color: hexA(NEON.cyan, 0.05) }, ticks: { maxRotation: 0, autoSkipPadding: 16 } },
          y: { beginAtZero: true, grid: { color: hexA(NEON.cyan, 0.06) }, ticks: { precision: 0 } },
        },
      },
    }
  }

  /**
   * Severity doughnut. `hoverOffset` + a dark gap border, with an EXPLICIT cyan
   * bloom halo (`neonGlowColor`) so the halo reads as one ring rather than eight
   * competing coloured smears.
   */
  function doughnutConfig(
    arr: { label: string; value: number; color: string }[],
    opts?: { cutout?: string },
  ): ChartConfiguration<'doughnut'> {
    return {
      type: 'doughnut',
      data: {
        labels: arr.map((d) => d.label),
        datasets: [
          {
            data: arr.map((d) => d.value),
            backgroundColor: arr.map((d) => hexA(d.color, 0.85)),
            borderColor: '#0a0a12',
            borderWidth: 3,
            hoverBorderColor: '#0a0a12',
            hoverOffset: 8,
            neonGlow: 16,
            neonGlowColor: NEON.cyan,
          } as ChartDataset<'doughnut'> & NeonDatasetExtras,
        ],
      },
      options: {
        responsive: true,
        animation: prefersReducedMotion() ? false : undefined,
        cutout: opts?.cutout ?? '62%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              // Reads colour from the LIVE dataset, not from the `arr` captured
              // when this config was built. Mutating `chart.data` in place and
              // calling update() is the normal Chart.js pattern; against the
              // captured array that produced new counts beside stale swatches,
              // and cyan for any category added past `arr.length`.
              generateLabels: (chart: ChartType) => {
                const d = chart.data
                const bg = d.datasets[0]?.backgroundColor
                const colourAt = (i: number) =>
                  (Array.isArray(bg) ? (bg[i] as string | undefined) : undefined) ?? arr[i]?.color ?? NEON.cyan
                return (d.labels ?? []).map((lab, i) => ({
                  text: `${String(lab)}  ${d.datasets[0]?.data[i] ?? 0}`,
                  fillStyle: colourAt(i),
                  strokeStyle: colourAt(i),
                  pointStyle: 'rectRounded' as const,
                  index: i,
                }))
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (c) => {
                const tot = (c.dataset.data as number[]).reduce((a, b) => a + b, 0) || 1
                return ` ${c.label}: ${c.parsed} (${Math.round((c.parsed / tot) * 100)}%)`
              },
            },
          },
        },
      },
    }
  }

  /** Histogram — zero-gap bars (`barPercentage`/`categoryPercentage` both 1). */
  function histogramConfig(
    arr: { label: string; value: number }[],
    hex: string = NEON.cyan,
    label = 'Count',
  ): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: {
        labels: arr.map((d) => d.label),
        datasets: [
          {
            label,
            data: arr.map((d) => d.value),
            backgroundColor: areaFill(hex, 0.75),
            borderColor: hex,
            borderWidth: 1.5,
            borderRadius: 3,
            barPercentage: 1,
            categoryPercentage: 1,
            neonGlow: 12,
          } as ChartDataset<'bar'> & NeonDatasetExtras,
        ],
      },
      options: {
        responsive: true,
        animation: prefersReducedMotion() ? false : undefined,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { autoSkip: false } },
          y: { beginAtZero: true, grid: { color: hexA(NEON.cyan, 0.06) }, ticks: { precision: 0 } },
        },
      },
    }
  }

  /** Horizontal category bar, per-row colour, Share Tech Mono category ticks. */
  function barConfig(
    rows: { label: string; value: number; color?: string }[],
    opts?: { horizontal?: boolean; top?: number; label?: string },
  ): ChartConfiguration<'bar'> {
    const sorted = [...rows].sort((a, b) => b.value - a.value).slice(0, opts?.top ?? rows.length)
    const colourAt = (i: number) => sorted[i]?.color ?? SPECTRUM[i % SPECTRUM.length]!
    const horizontal = opts?.horizontal ?? true
    return {
      type: 'bar',
      data: {
        labels: sorted.map((r) => r.label),
        datasets: [
          {
            label: opts?.label ?? 'Count',
            data: sorted.map((r) => r.value),
            backgroundColor: (c: ScriptableContext<'bar'>) => barFillH(colourAt(c.dataIndex))(c),
            borderColor: (c: ScriptableContext<'bar'>) => colourAt(c.dataIndex),
            borderWidth: 1.5,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.8,
            neonGlow: 12,
          } as ChartDataset<'bar'> & NeonDatasetExtras,
        ],
      },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        animation: prefersReducedMotion() ? false : undefined,
        plugins: { legend: { display: false } },
        scales: {
          x: horizontal
            ? { beginAtZero: true, grid: { color: hexA(NEON.cyan, 0.06) }, ticks: { precision: 0 } }
            : { grid: { display: false }, ticks: { font: { family: "'Share Tech Mono', monospace", size: 11 } } },
          y: horizontal
            ? { grid: { display: false }, ticks: { font: { family: "'Share Tech Mono', monospace", size: 11 } } }
            : { beginAtZero: true, grid: { color: hexA(NEON.cyan, 0.06) }, ticks: { precision: 0 } },
        },
      },
    }
  }

  /**
   * Live strip driver. Chart.js has no maintained streaming plugin
   * (`chartjs-plugin-streaming` was last published 2021), so drive it by hand:
   * push a point, drop the head, `update('none')` at <= 2 Hz. Returns a throttled
   * push function.
   */
  function makeStripPusher(chart: ChartType, maxPoints = 120, hz = 2) {
    const minGap = 1000 / hz
    let last = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    /**
     * Call this in `onBeforeUnmount`, BEFORE the chart is destroyed.
     *
     * The trailing timeout used to be uncancellable: if a push landed inside the
     * throttle window and the component unmounted before it fired, the callback
     * ran `chart.update()` against a destroyed instance and threw an uncatchable
     * TypeError from a timer. Route changes and panel collapses make that window
     * routine on a live console.
     */
    const stop = () => {
      stopped = true
      if (timer) clearTimeout(timer)
      timer = undefined
    }

    const push = (label: string | number, values: number[]) => {
      if (stopped) return
      chart.data.labels ??= []
      chart.data.labels.push(label)
      // Push a point to EVERY dataset, not just those covered by `values`, so a
      // caller passing fewer values than there are datasets (a dropped sensor, a
      // static threshold series) cannot desync. The trim below shifts all of
      // them unconditionally, so a dataset that is shifted but never pushed
      // drains to empty and silently disappears from the chart.
      chart.data.datasets.forEach((ds, i) => ds.data.push(values[i] ?? null))
      // Bounded on the labels array, which is now guaranteed to exist — the old
      // `(labels?.length ?? 0) > maxPoints` read 0 when labels was undefined, so
      // the loop never ran and every dataset grew without bound.
      while (chart.data.labels.length > maxPoints) {
        chart.data.labels.shift()
        chart.data.datasets.forEach((ds) => ds.data.shift())
      }

      const now = performance.now()
      if (now - last >= minGap) {
        last = now
        chart.update('none')
      } else if (!timer) {
        timer = setTimeout(
          () => {
            timer = undefined
            if (stopped) return
            last = performance.now()
            chart.update('none')
          },
          minGap - (now - last),
        )
      }
    }

    return Object.assign(push, { stop })
  }

  return {
    Chart,
    NEON,
    SPECTRUM,
    SEVERITY,
    hexA,
    gradientFill,
    areaFill,
    barFillH,
    glowScale,
    sparklineConfig,
    lineAreaConfig,
    doughnutConfig,
    histogramConfig,
    barConfig,
    makeStripPusher,
    registerNeon,
  }
}
