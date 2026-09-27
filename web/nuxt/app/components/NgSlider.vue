<script setup lang="ts">
/**
 * NgSlider — Reka Slider with the violet→cyan range fill.
 *
 * Reka gives keyboard control, `aria-valuetext` and RTL handling. The `format`
 * prop feeds `aria-valuetext` so a screen reader hears "0.4 false alerts per
 * day" rather than "37" — for a confidence threshold that is the difference
 * between a usable control and a mystery.
 */
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'

const props = withDefaults(
  defineProps<{
    label?: string
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    /** Turns the raw value into the announced/displayed text. */
    format?: (v: number) => string
  }>(),
  { label: undefined, min: 0, max: 100, step: 1, disabled: false, format: undefined },
)

const model = defineModel<number[]>({ default: () => [50] })
const id = useId()
const display = computed(() => {
  const v = model.value[0] ?? 0
  return props.format ? props.format(v) : String(v)
})
</script>

<template>
  <div class="form-group">
    <div v-if="label" class="ng-slider-head">
      <label class="form-label" :for="id">{{ label }}</label>
      <span class="ng-slider-value">{{ display }}</span>
    </div>
    <SliderRoot
      :id="id"
      v-model="model"
      class="ng-slider"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
    >
      <SliderTrack class="ng-slider-track">
        <SliderRange class="ng-slider-range" />
      </SliderTrack>
      <SliderThumb class="ng-slider-thumb" :aria-label="label" :aria-valuetext="display" />
    </SliderRoot>
  </div>
</template>

<style scoped>
.ng-slider-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.ng-slider-value {
  font-family: var(--font-mono);
  font-size: 0.86rem;
  color: var(--cyan);
  font-variant-numeric: tabular-nums;
}
</style>
