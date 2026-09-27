<script setup lang="ts">
/**
 * NgStatCard — big gradient-clipped numeral, uppercase label, corner icon.
 *
 * The glow on the value uses `filter: drop-shadow()`, NOT `text-shadow`: the
 * glyphs are painted with `-webkit-text-fill-color: transparent` over a
 * background gradient, and `text-shadow` renders *behind* them, so it produces
 * a solid coloured blob instead of a halo. This is one of the three distinct
 * glow mechanisms in the system and they are not interchangeable.
 */
withDefaults(
  defineProps<{
    label: string
    value: string | number
    icon?: string
    /** 'alert' recolours value + hairline + icon to the red/orange ramp. */
    tone?: 'default' | 'alert' | 'positive'
    foot?: string
  }>(),
  { icon: undefined, tone: 'default', foot: undefined },
)
</script>

<template>
  <div class="stat-card" :class="{ alert: tone === 'alert', positive: tone === 'positive' }">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value">{{ value }}</div>
    <div v-if="foot || $slots.foot" class="stat-foot"><slot name="foot">{{ foot }}</slot></div>
    <NgIcon v-if="icon" class="stat-icon" :name="icon" />
  </div>
</template>
