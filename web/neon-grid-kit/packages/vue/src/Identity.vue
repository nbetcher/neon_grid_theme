<script setup lang="ts">
import { computed, useId } from 'vue';
import { identityMarkup } from '@neon-grid/kit-core';
const props = defineProps<{ id?: string }>();
const generatedId = `ng-vue-identity-${useId()}`;
const decoration = computed(() => identityMarkup(props.id ?? generatedId));
</script>

<template>
  <span class="ng-decoration" aria-hidden="true" v-html="decoration" />
</template>
