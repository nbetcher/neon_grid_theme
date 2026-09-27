<script setup lang="ts">
/**
 * NgGridBg — the animated grid substrate.
 *
 * GRID: yes.  SCANLINES: intentionally omitted, on every platform. There is no
 * scanline overlay in this component, in `30-substrate.css`, or anywhere else in
 * the system, and none is to be added.
 *
 * The one behaviour beyond CSS: the 20-second infinite `gridShift` translate is
 * a permanent compositor wake on an always-on console, so it is paused whenever
 * the document is hidden. `prefers-reduced-motion` kills it outright in CSS.
 */
const props = withDefaults(
  defineProps<{
    /** Grid cell size, e.g. '42px' or '48px'. Overrides --grid-size locally. */
    size?: string
    /** Line alpha 0–1. Overrides --grid-alpha locally — normally leave this to
     *  the glow-level control, which dims the grid at soft/off. */
    alpha?: number
    /** Set false to keep animating in background tabs (you almost never want this). */
    pauseWhenHidden?: boolean
  }>(),
  { size: undefined, alpha: undefined, pauseWhenHidden: true },
)

const paused = ref(false)

function sync() {
  paused.value = props.pauseWhenHidden && document.visibilityState !== 'visible'
}

// Re-armed by a watcher rather than a one-shot onMounted check, because
// `pauseWhenHidden` is a reactive prop. Attaching only at mount meant flipping
// it false -> true never armed the listener (the animation kept waking the
// compositor in hidden tabs — the exact thing this exists to prevent), and
// true -> false left `paused` latched, freezing the grid for a consumer who had
// explicitly opted out.
//
// NOT `immediate: true`: that would run during setup, which on the server has no
// `document`. onMounted does the first arm, the watcher handles every change
// after it.
function arm(on: boolean) {
  document.removeEventListener('visibilitychange', sync)
  if (on) {
    sync()
    document.addEventListener('visibilitychange', sync)
  } else {
    paused.value = false
  }
}

onMounted(() => arm(props.pauseWhenHidden))
watch(() => props.pauseWhenHidden, arm)
onBeforeUnmount(() => document.removeEventListener('visibilitychange', sync))

const style = computed(() => {
  const s: Record<string, string> = {}
  if (props.size) s['--grid-size'] = props.size
  if (props.alpha != null) s['--grid-alpha'] = String(props.alpha)
  return s
})
</script>

<template>
  <div class="grid-bg" :data-paused="String(paused)" :style="style" aria-hidden="true" />
</template>
