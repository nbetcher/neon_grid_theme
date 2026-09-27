<script setup lang="ts">
/**
 * NgNavButton — `.nav-btn`. Renders a <NuxtLink> when `to` is given (so
 * `.router-link-active` supplies the active state for free) and a <button>
 * otherwise, for apps driving pages from local state.
 *
 * The label is wrapped in `.nav-label`, which the 1010px breakpoint hides —
 * that is how the header stays a single 64px row down to a narrow window.
 */
import { NuxtLink } from '#components'

const props = withDefaults(
  defineProps<{
    icon?: string
    label?: string
    to?: string
    active?: boolean
  }>(),
  { icon: undefined, label: undefined, to: undefined, active: undefined },
)

const tag = computed(() => (props.to ? NuxtLink : 'button'))
</script>

<template>
  <component
    :is="tag"
    class="nav-btn"
    :class="{ active }"
    :to="to"
    :type="tag === 'button' ? 'button' : undefined"
    :aria-current="active ? 'page' : undefined"
  >
    <NgIcon v-if="icon" :name="icon" />
    <span class="nav-label"><slot>{{ label }}</slot></span>
  </component>
</template>
