<script setup lang="ts">
/**
 * NgChip — the generic meta chip: `label: value` with an optional icon.
 *
 * Set `selected` for a toggleable chip. Note this needs only `.badge-info`
 * alongside `.chip` — the two-class specificity hack from the petite-vue source
 * is gone, because badges are declared after chips inside `@layer neon.indicators`.
 */
withDefaults(
  defineProps<{
    label?: string
    value?: string | number
    icon?: string
    selected?: boolean
    clickable?: boolean
  }>(),
  { label: undefined, value: undefined, icon: undefined, selected: false, clickable: false },
)
</script>

<template>
  <component
    :is="clickable ? 'button' : 'span'"
    class="chip"
    :class="[selected && 'badge-info', clickable && 'clickable']"
    :type="clickable ? 'button' : undefined"
    :aria-pressed="clickable ? selected : undefined"
  >
    <NgIcon v-if="icon" :name="icon" />
    <span v-if="label" class="chip-label">{{ label }}</span>
    <span v-if="value != null" class="chip-val">{{ value }}</span>
    <slot />
  </component>
</template>
