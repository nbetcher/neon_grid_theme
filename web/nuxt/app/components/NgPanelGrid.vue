<script setup lang="ts">
/** NgPanelGrid — `repeat(auto-fit, minmax(min, 1fr))`, collapsing to one column at 760px. */
withDefaults(defineProps<{ min?: string; gap?: string }>(), { min: '320px', gap: '20px' })
</script>

<template>
  <div
    class="panel-grid"
    :style="{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}, 1fr))`, gap }"
  >
    <slot />
  </div>
</template>
