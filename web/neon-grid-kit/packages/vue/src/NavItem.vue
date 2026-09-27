<script setup lang="ts">
import { navMarkup } from '@neon-grid/kit-core';
defineProps<{ selected?: boolean; href?: string }>();
const decoration = navMarkup();
</script>

<template>
  <component :is="href ? 'a' : 'button'" :href="href" :type="href ? undefined : 'button'"
    class="nav-item" :class="{ selected }" data-ng-nav :aria-current="selected ? 'page' : undefined">
    <span class="nav-content"><slot /></span>
    <span class="ng-decoration" aria-hidden="true" v-html="decoration" />
  </component>
</template>
