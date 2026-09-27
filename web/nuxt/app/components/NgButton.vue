<script setup lang="ts">
/**
 * NgButton — `.btn` + one variant class. No headless primitive: a <button> has
 * no behaviour worth abstracting, and wrapping one in a library component is
 * pure cost.
 *
 * Renders <button>, <a> or <NuxtLink> depending on `to`/`href`, so a nav action
 * and a form action look identical without faking one as the other.
 *
 * `iconOnly` REQUIRES a `label` — icon-only controls in this system carry
 * `.sr-only` text and a tooltip, never nothing.
 */
import { NuxtLink } from '#components'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'success' | 'violet' | 'warning' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    icon?: string
    /** Icon after the label instead of before. */
    trailingIcon?: string
    /** Hide the visible label; `label` becomes .sr-only text. */
    iconOnly?: boolean
    /** Accessible name. Required when iconOnly. */
    label?: string
    disabled?: boolean
    /** Swaps the icon for a spinner and blocks interaction. */
    loading?: boolean
    /** Sticky "on" state for filter/sort toggles. */
    toggled?: boolean
    block?: boolean
    type?: 'button' | 'submit' | 'reset'
    to?: string
    href?: string
  }>(),
  {
    variant: 'ghost',
    size: 'md',
    icon: undefined,
    trailingIcon: undefined,
    iconOnly: false,
    label: undefined,
    disabled: false,
    loading: false,
    toggled: false,
    block: false,
    type: 'button',
    to: undefined,
    href: undefined,
  },
)

const tag = computed(() => (props.to ? NuxtLink : props.href ? 'a' : 'button'))

const classes = computed(() => [
  'btn',
  `btn-${props.variant}`,
  props.size === 'sm' && 'btn-sm',
  props.size === 'lg' && 'btn-lg',
  props.iconOnly && 'btn-icon',
  props.block && 'btn-block',
  props.toggled && 'btn-toggle-on',
])

const isDisabled = computed(() => props.disabled || props.loading)

if (import.meta.dev && props.iconOnly && !props.label) {
  console.warn('[NgButton] iconOnly requires `label` — an icon-only control with no accessible name is unusable.')
}
</script>

<template>
  <component
    :is="tag"
    :class="classes"
    :to="to"
    :href="href"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? isDisabled : undefined"
    :aria-disabled="tag !== 'button' && isDisabled ? 'true' : undefined"
    :aria-pressed="toggled ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :title="iconOnly ? label : undefined"
  >
    <span v-if="loading" class="loading-spinner sm" aria-hidden="true" />
    <NgIcon v-else-if="icon" :name="icon" />
    <span v-if="iconOnly" class="sr-only">{{ label }}</span>
    <slot v-else>{{ label }}</slot>
    <NgIcon v-if="trailingIcon && !iconOnly" :name="trailingIcon" />
  </component>
</template>
