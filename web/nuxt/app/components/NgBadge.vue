<script setup lang="ts">
/**
 * NgBadge — `.badge` + one tone class. `strong` picks the `-strong` variant,
 * which adds a solid border and the matching glow.
 */
withDefaults(
  defineProps<{
    tone?: 'success' | 'danger' | 'warning' | 'info' | 'violet' | 'magenta' | 'yellow' | 'blue' | 'neutral'
    strong?: boolean
    icon?: string
    /** Small solid dot before the label — for state legends. */
    dotColor?: string
  }>(),
  { tone: 'neutral', strong: false, icon: undefined, dotColor: undefined },
)
</script>

<template>
  <span
    class="badge"
    :class="[
      `badge-${tone}`,
      strong && ['success', 'danger', 'warning', 'info'].includes(tone) ? `badge-${tone}-strong` : null,
    ]"
  >
    <span v-if="dotColor" class="sdot" :style="{ background: dotColor }" />
    <NgIcon v-if="icon" :name="icon" />
    <slot />
  </span>
</template>
