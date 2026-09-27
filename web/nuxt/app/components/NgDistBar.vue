<script setup lang="ts">
/**
 * NgDistBar — a stacked proportion bar with an optional legend.
 *
 * The outer bloom lives on the CONTAINER, not the segments: the container is
 * `overflow: hidden` (so the segments clip to the rounded corners), which also
 * clips per-segment box-shadows. Each segment instead carries an inset white
 * sheen so it reads as backlit rather than flat.
 *
 * `forced-color-adjust: none` is applied to the segments in 95-a11y.css — under
 * Windows High Contrast, a proportion bar whose segments all render the same
 * colour is not an accessibility win, it is a broken chart.
 */
export interface NgDistSegment {
  key: string
  label: string
  value: number
  /** Explicit colour; otherwise the `seg-{key}` class supplies it. */
  color?: string
}

const props = withDefaults(
  defineProps<{
    segments: NgDistSegment[]
    legend?: boolean
    height?: string
    /** Accessible summary; auto-generated when omitted. */
    ariaLabel?: string
  }>(),
  { legend: true, height: undefined, ariaLabel: undefined },
)

const total = computed(() => props.segments.reduce((a, s) => a + s.value, 0) || 1)
const pct = (v: number) => (v / total.value) * 100

const summary = computed(
  () =>
    props.ariaLabel ??
    props.segments.map((s) => `${s.label}: ${s.value} (${Math.round(pct(s.value))}%)`).join(', '),
)
</script>

<template>
  <div>
    <div class="dist-bar" :style="height ? { height } : undefined" role="img" :aria-label="summary">
      <div
        v-for="s in segments"
        :key="s.key"
        class="seg"
        :class="`seg-${s.key}`"
        :style="{ width: `${pct(s.value)}%`, ...(s.color ? { background: s.color } : {}) }"
      />
    </div>
    <div v-if="legend" class="dist-legend">
      <span v-for="s in segments" :key="s.key" class="legend-item">
        <span class="legend-dot" :class="`seg-${s.key}`" :style="s.color ? { background: s.color } : undefined" />
        {{ s.label }} <strong>{{ s.value }}</strong>
      </span>
    </div>
  </div>
</template>

<style scoped>
/* The legend dot reuses the segment classes so colours can never diverge. */
.legend-dot.seg-critical {
  background: linear-gradient(90deg, #ff3355, #ff5577);
}
.legend-dot.seg-high {
  background: var(--red);
}
.legend-dot.seg-medium {
  background: var(--orange);
}
.legend-dot.seg-low {
  background: var(--cyan);
}
.legend-dot.seg-cleanup {
  background: var(--text-dim);
}
.legend-dot.seg-resolved {
  background: var(--green);
}
.legend-dot.seg-rest {
  background: var(--border-base);
}
</style>
