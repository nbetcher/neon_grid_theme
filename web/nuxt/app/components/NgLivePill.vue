<script setup lang="ts">
/**
 * NgLivePill — the connection indicator. One pill for the whole "is data
 * arriving?" question rather than several competing badges.
 *
 * `flash()` triggers the one-shot burst used when an event lands, so the pill
 * doubles as a heartbeat. Under `prefers-reduced-motion` both the pulse and the
 * flash are replaced with a static ring — the SIGNAL survives, the motion does
 * not.
 */
const props = withDefaults(
  defineProps<{
    /** on = connected, warn = reconnecting, off = down. */
    state?: 'on' | 'warn' | 'off'
    label?: string
    clickable?: boolean
    title?: string
  }>(),
  { state: 'off', label: undefined, clickable: false, title: undefined },
)

const flashing = ref(false)
let t: ReturnType<typeof setTimeout> | undefined

function flash() {
  flashing.value = false
  requestAnimationFrame(() => {
    flashing.value = true
    if (t) clearTimeout(t)
    t = setTimeout(() => (flashing.value = false), 520)
  })
}
onBeforeUnmount(() => t && clearTimeout(t))

const text = computed(
  () => props.label ?? ({ on: 'CONNECTED', warn: 'RECONNECTING', off: 'OFFLINE' } as const)[props.state],
)

defineExpose({ flash })
</script>

<template>
  <component
    :is="clickable ? 'button' : 'span'"
    class="live-pill"
    :class="[state, clickable && 'clickable']"
    :type="clickable ? 'button' : undefined"
    :title="title"
  >
    <span class="live-dot" :class="{ flash: flashing }" />
    <span>{{ text }}</span>
  </component>
</template>
