<script setup lang="ts">
import { shallowRef } from 'vue';
withDefaults(defineProps<{ accent?: string }>(), { accent: '#00e0ff' });
const element = shallowRef<HTMLElement | null>(null);
defineExpose({ element });
</script>

<template>
  <article ref="element" class="channel-card" :style="{ '--channel-color': accent }" data-ng-panel>
    <slot />
    <span class="arrival-field" data-ng-arrival aria-hidden="true" />
  </article>
</template>
