<script setup lang="ts">
/**
 * NgSvgDefs — the shared SVG <defs>, mounted ONCE per document.
 *
 * `filter: url(#tronGlow)` is referenced from CSS by `.cg-arc-fill`, `.ng-conn`,
 * `.ng-trace` and `.ng-glow-svg`. A `url(#id)` filter resolves against the
 * DOCUMENT, not the referencing element's SVG root — so exactly one element with
 * `id="tronGlow"` has to exist somewhere in the page or every one of those
 * strokes silently renders unglowed. Put this in your layout, next to <NgGridBg>.
 *
 * The bloom radii are read from `--svg-glow-outer` / `--svg-glow-inner`, so the
 * GLOW=soft/off control reaches SVG too. (SVG filter primitives cannot read CSS
 * custom properties directly, so the values are pulled once on mount and on
 * every glow change, and written to the attributes.)
 *
 * Structure: wide soft bloom + tight glow + the crisp source graphic on top.
 * Dropping the SourceGraphic merge node is what makes neon look like fog.
 */
const { glow, contrast } = useGlowLevel()

const outer = ref(6.5)
const inner = ref(2.4)

function readRadii() {
  if (!import.meta.client) return
  const cs = getComputedStyle(document.documentElement)
  const o = Number.parseFloat(cs.getPropertyValue('--svg-glow-outer'))
  const i = Number.parseFloat(cs.getPropertyValue('--svg-glow-inner'))
  if (Number.isFinite(o)) outer.value = o
  if (Number.isFinite(i)) inner.value = i
}

onMounted(readRadii)
watch([glow, contrast], () => nextTick(readRadii))
</script>

<template>
  <svg class="ng-svg-defs" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      <!-- Tron halo: wide soft bloom + tight glow + crisp core on top. -->
      <filter id="tronGlow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur :stdDeviation="outer" result="outer" />
        <feGaussianBlur :stdDeviation="inner" result="inner" />
        <feMerge>
          <feMergeNode in="outer" />
          <feMergeNode in="inner" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- Brand gradient, for rings and arcs that want the cyan→violet ramp. -->
      <linearGradient id="ngBrandGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="var(--cyan)" />
        <stop offset="100%" stop-color="var(--violet)" />
      </linearGradient>

      <!-- Positive ramp, for readiness/health rings. -->
      <linearGradient id="ngOkGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="var(--green)" />
        <stop offset="100%" stop-color="var(--cyan)" />
      </linearGradient>

      <!-- Danger ramp. -->
      <linearGradient id="ngDangerGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="var(--red)" />
        <stop offset="100%" stop-color="var(--orange)" />
      </linearGradient>
    </defs>
  </svg>
</template>

<style scoped>
.ng-svg-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}
</style>
