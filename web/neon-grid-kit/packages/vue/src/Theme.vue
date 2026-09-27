<script setup lang="ts">
import { onMounted, onBeforeUnmount, provide, shallowRef, watch } from 'vue';
import { createThemeController, type ThemeController, type ThemeOptions } from '@neon-grid/kit-core';
import { neonThemeKey } from './context';

const props = withDefaults(defineProps<ThemeOptions>(), {
  glow: 'balanced', motion: true, focus: false, paused: false,
});
const emit = defineEmits<{ ready: [controller: ThemeController | null] }>();
const element = shallowRef<HTMLElement | null>(null);
const controller = shallowRef<ThemeController | null>(null);
provide(neonThemeKey, controller);
const options = (): ThemeOptions => ({ glow: props.glow, motion: props.motion, focus: props.focus, paused: props.paused });
onMounted(() => {
  if (!element.value) return;
  controller.value = createThemeController(element.value, options());
  emit('ready', controller.value);
});
watch(options, (value) => controller.value?.update(value));
onBeforeUnmount(() => {
  controller.value?.destroy();
  controller.value = null;
  emit('ready', null);
});
defineExpose({ element, controller });
</script>

<template>
  <div ref="element" class="ng-theme" :data-glow="glow === 'off' ? 'off' : 'soft'"
    :data-intensity="glow === 'subtle' ? 'subtle' : 'balanced'" data-ambient="stopped" :data-reading="String(focus)">
    <slot />
  </div>
</template>
