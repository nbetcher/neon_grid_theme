<script setup lang="ts">
/**
 * NgRing — an SVG arc gauge with a centred value.
 *
 * Uses `pathLength="100"` so `stroke-dasharray` is literally "percent filled,
 * percent empty" and no circumference arithmetic is needed — change the radius
 * and nothing else moves.
 *
 * The gradient ids come from <NgSvgDefs>, which must be mounted once in the
 * layout. Without it the stroke falls back to flat cyan rather than breaking.
 */
const props = withDefaults(
  defineProps<{
    /** 0–1. */
    value: number
    label?: string
    /** Text in the middle. Defaults to the rounded percentage. */
    display?: string
    size?: number
    stroke?: number
    /** Which gradient from NgSvgDefs to stroke with. */
    ramp?: 'ok' | 'brand' | 'danger'
  }>(),
  { label: undefined, display: undefined, size: 150, stroke: 12, ramp: 'ok' },
)

const clamped = computed(() => Math.max(0, Math.min(1, props.value)))
const gradId = computed(() => ({ ok: 'ngOkGrad', brand: 'ngBrandGrad', danger: 'ngDangerGrad' })[props.ramp])
const text = computed(() => props.display ?? `${Math.round(clamped.value * 100)}%`)
const dash = computed(() => `${(clamped.value * 100).toFixed(1)} ${(100 - clamped.value * 100).toFixed(1)}`)
const r = computed(() => 50 - props.stroke / 2)
</script>

<template>
  <div
    class="ng-ring"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="meter"
    :aria-valuenow="Math.round(clamped * 100)"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-label="label"
  >
    <svg viewBox="0 0 100 100">
      <circle class="rr-track" cx="50" cy="50" :r="r" :stroke-width="stroke" />
      <circle
        class="rr-fill"
        cx="50"
        cy="50"
        :r="r"
        :stroke-width="stroke"
        :stroke="`url(#${gradId})`"
        pathLength="100"
        :stroke-dasharray="dash"
      />
    </svg>
    <div class="rr-center">
      <div class="rr-pct">{{ text }}</div>
      <div v-if="label" class="rr-label">{{ label }}</div>
    </div>
  </div>
</template>
