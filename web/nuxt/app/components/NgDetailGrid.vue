<script setup lang="ts">
/**
 * NgDetailGrid — auto-fitting label/value grid for record detail panes.
 * Rendered as a <dl> so the label→value relationship survives to assistive tech.
 */
export interface NgDetailField {
  label: string
  value?: string | number | null
  /** Span the whole grid width. */
  full?: boolean
  mono?: boolean
}

withDefaults(defineProps<{ fields: NgDetailField[]; min?: string }>(), { min: '200px' })
</script>

<template>
  <dl class="detail-grid" :style="{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}, 1fr))` }">
    <div v-for="f in fields" :key="f.label" class="detail-field" :class="{ full: f.full }">
      <dt class="df-label">{{ f.label }}</dt>
      <dd class="df-value" :class="{ mono: f.mono }">
        <slot :name="f.label" :field="f">{{ f.value ?? '—' }}</slot>
      </dd>
    </div>
  </dl>
</template>

<style scoped>
dd {
  margin: 0;
}
</style>
