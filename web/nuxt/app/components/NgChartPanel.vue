<script setup lang="ts">
/**
 * NgChartPanel — a `.chart-panel` with a correctly-sized canvas wrapper.
 *
 * The fixed-height wrapper is not cosmetic: Chart.js runs with
 * `maintainAspectRatio: false` (set in the Neon Grid defaults), which means the
 * canvas takes its height from its parent. A parent with `height: auto`
 * collapses the chart to zero and it silently never appears.
 */
import type { ChartConfiguration } from 'chart.js'

withDefaults(
  defineProps<{
    title: string
    config: ChartConfiguration
    height?: 'short' | 'default' | 'tall'
    /** Span all columns of the parent .analytics-grid. */
    span2?: boolean
    ariaLabel?: string
  }>(),
  { height: 'default', span2: false, ariaLabel: undefined },
)
</script>

<template>
  <div class="chart-panel" :class="{ 'chart-span-2': span2 }">
    <h3 class="panel-title">{{ title }}</h3>
    <div class="chart-canvas-wrap" :class="{ tall: height === 'tall', short: height === 'short' }">
      <NgChart :config="config" :aria-label="ariaLabel ?? title" />
    </div>
    <slot />
  </div>
</template>
