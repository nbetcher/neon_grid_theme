<script setup lang="ts">
import { computed, useId } from 'vue';
import { signalMarkup } from '@neon-grid/kit-core';
const props = defineProps<{ id?: string }>();
// useId is stable across SSR and hydration. Prefix to satisfy the SVG identifier contract.
const generatedId = `ng-vue-signal-${useId()}`;
const decoration = computed(() => signalMarkup(props.id ?? generatedId));
</script>

<template>
  <span class="mini-timeline" aria-hidden="true"><span class="ng-decoration" v-html="decoration" /></span>
</template>
