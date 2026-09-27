<script setup lang="ts">
/**
 * NgWorkerChip — a background worker's state at a glance.
 *
 * States and what they mean here:
 *   online     the worker is up and heartbeating (pulsing icon)
 *   retrying   transient failure, backing off (spinning icon)
 *   waiting    blocked on something external — a batch job, a rate limit
 *   needs-attn requires a human; clickable
 *   offline    down. Loud on purpose: a monitoring system that silently stops
 *              monitoring is worse than no system, because you trust its silence.
 */
const props = withDefaults(
  defineProps<{
    state: 'online' | 'retrying' | 'waiting' | 'needs-attn' | 'offline' | 'idle'
    label?: string
    icon?: string
  }>(),
  { label: undefined, icon: undefined },
)

const DEFAULT_ICON: Record<string, string> = {
  online: 'ph:pulse',
  retrying: 'ph:arrow-clockwise',
  waiting: 'ph:hourglass',
  'needs-attn': 'ph:hand-palm',
  offline: 'ph:plugs',
  idle: 'ph:moon',
}

const iconName = computed(() => props.icon ?? DEFAULT_ICON[props.state] ?? 'ph:circle')
const clickable = computed(() => props.state === 'needs-attn')
</script>

<template>
  <component
    :is="clickable ? 'button' : 'span'"
    class="worker-chip"
    :class="state"
    :type="clickable ? 'button' : undefined"
  >
    <NgIcon :name="iconName" />
    <slot>{{ label ?? state }}</slot>
  </component>
</template>
