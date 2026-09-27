<script setup lang="ts">
/** NgSectionDivider — uppercase display-voice heading with an underline rule. */
withDefaults(defineProps<{ icon?: string; label?: string; as?: string }>(), {
  icon: undefined,
  label: undefined,
  as: 'h3',
})
</script>

<template>
  <component :is="as" class="section-divider">
    <NgIcon v-if="icon" :name="icon" />
    <slot>{{ label }}</slot>
  </component>
</template>
