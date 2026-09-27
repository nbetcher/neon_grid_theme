<script setup lang="ts">
/**
 * NgSpinner — the ring spinner.
 *
 * Kept animating under `prefers-reduced-motion` (slowed to 2s, not stopped): a
 * frozen spinner reads as "the app has hung", which is worse than motion. That
 * rule lives in 90-motion.css.
 */
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    /** Renders a full-block loader with a caption instead of a bare ring. */
    label?: string
  }>(),
  { size: 'md', label: undefined },
)
</script>

<template>
  <div v-if="label" class="page-loader" role="status">
    <span class="loading-spinner" :class="size === 'md' ? undefined : size" />
    <span>{{ label }}</span>
  </div>
  <span
    v-else
    class="loading-spinner"
    :class="size === 'md' ? undefined : size"
    role="status"
    aria-label="Loading"
  />
</template>
