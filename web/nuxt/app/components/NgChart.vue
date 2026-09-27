<script setup lang="ts">
/**
 * NgChart — Chart.js host with the Neon Grid lifecycle handled correctly.
 *
 * Three things this does that a naive `new Chart(el, cfg)` does not:
 *
 *  1. `chart.update('none')` immediately after construction. The gradient area
 *     fills are built lazily from `chart.chartArea`, which is undefined on the
 *     first draw — without this one silent update every area chart renders flat
 *     until the first hover.
 *  2. Rebuilds on glow-level change. The bloom is `ctx.shadowBlur`, i.e. canvas
 *     pixels, which CSS cannot reach. A repaint is the only way GLOW=off can
 *     actually turn the chart's glow off.
 *  3. Destroys on unmount and on config replacement. Chart.js keeps a registry
 *     keyed by canvas; leaking instances across route changes is the classic
 *     "canvas is already in use" crash.
 *
 * `config` is treated as a value: replacing it rebuilds. For high-frequency
 * updates (a live calls/minute strip) do NOT replace the config — grab the
 * instance off `chartRef` and use `useNeonChart().makeStripPusher()`.
 */
import { Chart } from 'chart.js'
import type { ChartConfiguration } from 'chart.js'

const props = withDefaults(
  defineProps<{
    config: ChartConfiguration
    /** Accessible summary. A canvas is opaque to assistive tech without one. */
    ariaLabel?: string
    /** Optional data table equivalent, announced instead of the canvas. */
    summary?: string
  }>(),
  { ariaLabel: undefined, summary: undefined },
)

const canvas = ref<HTMLCanvasElement | null>(null)
const chart = shallowRef<Chart | null>(null)
const { glow, contrast } = useGlowLevel()

// Registers controllers/elements/scales + the NeonGlow plugin + global defaults.
useNeonChart()

function build() {
  destroy()
  if (!canvas.value) return
  chart.value = new Chart(canvas.value, props.config as ChartConfiguration)
  // (1) — make the gradients paint on frame one.
  chart.value.update('none')
}

function destroy() {
  chart.value?.destroy()
  chart.value = null
}

onMounted(build)
onBeforeUnmount(destroy)

watch(() => props.config, build, { deep: false })
// (2) — GLOW=full/soft/off and high contrast change the canvas bloom.
//
// `flush: 'post'` is load-bearing, not tidiness. The bloom multiplier is read
// from `--chart-glow-scale`, which only changes once useGlowLevel()'s own
// watcher has written `data-glow` onto <html>. Both are watchers on the same
// refs, so a default pre-flush watcher here would be correct only by virtue of
// registration order — which holds today purely because the layer's client
// plugin runs before any component. Post-flush reads the attribute after the
// DOM is updated, so the ordering cannot matter.
watch([glow, contrast], () => chart.value?.update('none'), { flush: 'post' })

defineExpose({ chart })
</script>

<template>
  <canvas
    ref="canvas"
    role="img"
    :aria-label="ariaLabel"
  >{{ summary }}</canvas>
</template>

<style scoped>
canvas {
  background: transparent; /* the grid substrate shows through */
  width: 100%;
  height: 100%;
}
</style>
