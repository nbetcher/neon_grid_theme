<script setup lang="ts">
/**
 * NgKpiTile — headline metric with an inline sparkline in the bottom-right.
 *
 * Pass `spark` and the tile builds its own Chart.js sparkline through
 * `useNeonChart()`. Pass nothing and it is just a metric tile.
 */
import { NEON } from '#neon-grid/shared/tokens'

const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    delta?: string
    /** Arrow/colour hint for the delta line. */
    trend?: 'up' | 'down' | 'flat'
    /** Sparkline series. Omit for no chart. */
    spark?: number[]
    sparkColor?: string
  }>(),
  { delta: undefined, trend: 'flat', spark: undefined, sparkColor: NEON.cyan },
)

const sparkConfig = computed(() =>
  props.spark?.length ? useNeonChart().sparklineConfig(props.spark, props.sparkColor) : null,
)
</script>

<template>
  <div class="kpi-tile">
    <div class="kpi-label">{{ label }}</div>
    <div class="kpi-value">{{ value }}</div>
    <div v-if="delta" class="kpi-delta" :class="trend">{{ delta }}</div>
    <div v-if="sparkConfig" class="kpi-spark">
      <NgChart :config="sparkConfig" :aria-label="`${label} trend`" />
    </div>
  </div>
</template>
