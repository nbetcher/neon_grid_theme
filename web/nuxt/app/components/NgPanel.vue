<script setup lang="ts">
/**
 * NgPanel — the primary surface. Card ground, glow-dim border, and the inset
 * gradient hairline across the top that is the system's most recognisable
 * detail.
 *
 * Slots: #title (overrides `title`), #sub, #actions (right side of the header),
 * default (body), #footer.
 */
withDefaults(
  defineProps<{
    title?: string
    sub?: string
    icon?: string
    /** Recolours the border and the top hairline together. */
    accent?: 'cyan' | 'red' | 'green' | 'orange' | 'violet'
    /** Decorative corner arcs. */
    arcs?: boolean
    /** Remove the bottom margin (use inside <NgPanelGrid>). */
    flush?: boolean
    /** Remove padding — for tables and media that bleed to the edge. */
    padNone?: boolean
    /** Span all columns of a parent grid. */
    span2?: boolean
    /**
     * Opt into `content-visibility: auto`. Skips layout/paint while off-screen,
     * which is a real win on a page of many static panels — but it BREAKS
     * position:sticky table headers inside the panel and can cause scroll-anchor
     * jumps. Never set this on a panel containing <NgTable>.
     */
    defer?: boolean
    /** Element tag. Use 'section' when the panel is a landmark. */
    as?: string
  }>(),
  {
    title: undefined,
    sub: undefined,
    icon: undefined,
    accent: 'cyan',
    arcs: false,
    flush: false,
    padNone: false,
    span2: false,
    defer: false,
    as: 'section',
  },
)
</script>

<template>
  <component
    :is="as"
    class="panel"
    :class="[
      accent !== 'cyan' && `accent-${accent}`,
      flush && 'flush',
      padNone && 'pad-none',
      span2 && 'panel-span-2',
      defer && 'defer',
    ]"
  >
    <template v-if="arcs">
      <span class="panel-arc panel-arc-tl" aria-hidden="true" />
      <span class="panel-arc panel-arc-br" aria-hidden="true" />
    </template>

    <div v-if="title || $slots.title || $slots.actions || sub || $slots.sub" class="panel-header">
      <div>
        <h2 class="panel-title">
          <NgIcon v-if="icon" :name="icon" />
          <slot name="title">{{ title }}</slot>
        </h2>
        <p v-if="sub || $slots.sub" class="panel-sub"><slot name="sub">{{ sub }}</slot></p>
      </div>
      <div v-if="$slots.actions" class="panel-actions"><slot name="actions" /></div>
    </div>

    <slot />

    <slot name="footer" />
  </component>
</template>
