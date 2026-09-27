<script setup lang="ts">
/**
 * NgHBar — labelled horizontal bars with the violet→cyan fill.
 *
 * The track is `overflow: visible` on purpose so the fill's bloom spills past
 * the track edge; that spill is what makes the bar look lit rather than painted.
 */
export interface NgHBarRow {
  label: string
  value: number
  /** Overrides the gradient fill for this row. */
  color?: string
}

const props = withDefaults(
  defineProps<{
    rows: NgHBarRow[]
    /** Denominator. Defaults to the largest value. */
    max?: number
    labelWidth?: string
  }>(),
  { max: undefined, labelWidth: undefined },
)

const denom = computed(() => props.max ?? Math.max(1, ...props.rows.map((r) => r.value)))
</script>

<template>
  <div>
    <div v-for="r in rows" :key="r.label" class="hbar-row">
      <span class="hbar-label" :style="labelWidth ? { width: labelWidth } : undefined" :title="r.label">
        {{ r.label }}
      </span>
      <div
        class="hbar-track"
        role="meter"
        :aria-valuenow="r.value"
        :aria-valuemin="0"
        :aria-valuemax="denom"
        :aria-label="r.label"
      >
        <div
          class="hbar-fill"
          :style="{ width: `${(r.value / denom) * 100}%`, ...(r.color ? { background: r.color } : {}) }"
        />
      </div>
      <span class="hbar-cnt">{{ r.value }}</span>
    </div>
  </div>
</template>
