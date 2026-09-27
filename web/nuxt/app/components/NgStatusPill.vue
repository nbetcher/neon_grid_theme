<script setup lang="ts">
/**
 * NgStatusPill — a derived, NON-INTERACTIVE state indicator. If it is clickable
 * it is a button, not a status pill.
 *
 * `sp-live` pulses its icon; `sp-dead` strikes the text through — a terminal
 * state should not look like a state you can still get out of.
 */
withDefaults(
  defineProps<{
    tone?: 'live' | 'ok' | 'warn' | 'err' | 'info' | 'neutral' | 'dead'
    icon?: string
    label?: string
  }>(),
  { tone: 'neutral', icon: undefined, label: undefined },
)
</script>

<template>
  <span class="status-pill" :class="`sp-${tone}`">
    <NgIcon v-if="icon" :name="icon" />
    <slot>{{ label }}</slot>
  </span>
</template>
