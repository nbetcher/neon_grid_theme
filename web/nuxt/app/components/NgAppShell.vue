<script lang="ts">
export default { inheritAttrs: false }
</script>

<script setup lang="ts">
/**
 * NgAppShell — grid substrate + shared SVG defs + sticky header + main + toasts.
 *
 * One component so an app never forgets <NgSvgDefs> (without it every SVG glow
 * silently disappears — `url(#tronGlow)` resolves against the document) or the
 * skip link.
 *
 * Slots:
 *   #logo          brand block (defaults to icon + title)
 *   #nav           the <nav> contents; use <NgNavButton>
 *   #header-right  status pills, tools
 *   #banner        full-width strip UNDER the header — this is where "which
 *                  sources are dark" belongs, never squeezed into the header row
 *   default        page content
 *   #footer        anything below main
 */
const props = withDefaults(
  defineProps<{
    title?: string
    logoIcon?: string
    /** Extra chip next to the logo (hidden below 1180px). */
    chip?: string
    chipIcon?: string
    /** Remove the 1400px content cap. */
    wide?: boolean
    /** Minutes of no input before the idle dim engages. 0 disables. */
    idleDimMinutes?: number
  }>(),
  {
    title: 'Neon Grid',
    logoIcon: 'ph:cpu',
    chip: undefined,
    chipIcon: 'ph:device-tablet',
    wide: false,
    idleDimMinutes: 0,
  },
)

// Installs the glow attributes and, if asked, the idle-dim watcher.
useGlowLevel({ idleDimMinutes: props.idleDimMinutes })
</script>

<template>
  <div>
    <NgGridBg />
    <NgSvgDefs />

    <a class="ng-skip" href="#ng-main">Skip to content</a>

    <div class="app-wrapper" v-bind="$attrs">
      <header class="app-header">
        <div class="header-left">
          <slot name="logo">
            <div class="header-logo">
              <div class="logo-icon"><NgIcon :name="logoIcon" /></div>
              <div class="logo-text">{{ title }}</div>
            </div>
          </slot>
          <span v-if="chip" class="header-chip"><NgIcon :name="chipIcon" /> {{ chip }}</span>
          <nav v-if="$slots.nav" class="app-nav" aria-label="Primary">
            <slot name="nav" />
          </nav>
        </div>
        <div class="header-right">
          <slot name="header-right" />
        </div>
      </header>

      <slot name="banner" />

      <main id="ng-main" class="app-main" :class="{ wide }">
        <slot />
      </main>

      <slot name="footer" />
    </div>

    <NgToastHost />
  </div>
</template>

<style scoped>
/* Visible only on keyboard focus. A console with a sticky header and a long
   transcript table needs this more than a marketing page does. */
.ng-skip {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 1000;
  padding: 10px 16px;
  background: var(--bg-panel);
  border: 1px solid var(--cyan);
  border-radius: var(--radius-xs);
  color: var(--cyan);
  box-shadow: var(--glow-cyan);
}
.ng-skip:focus-visible {
  left: 12px;
  top: 12px;
}
</style>
