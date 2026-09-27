<script setup lang="ts">
/**
 * NgGlyphTicker — a compact strip of the most recent tool calls, one glyph each.
 *
 * REQUIRED BY THE AI-USAGE UI. In a card list you cannot afford a full
 * transcript per row, but you can afford twelve 22px squares that say "read,
 * read, bash, edit, edit, ERROR" — which is enough to know whether a session is
 * healthy without opening it.
 *
 * Three states: `ok` (cyan), `err` (red + glow), `pending` (pulsing). New glyphs
 * slide in; under reduced motion they just appear.
 *
 * `families` maps a tool name to an icon. Override it for your own tool set.
 */
export interface NgGlyph {
  id: string | number
  /** Tool family key, looked up in `families`. */
  family?: string
  /** Direct icon name, wins over `family`. */
  icon?: string
  /** undefined = still running. */
  ok?: boolean
  /** Tooltip / accessible text. */
  label?: string
  /** Slide-in animation for freshly-arrived glyphs. */
  fresh?: boolean
}

const props = withDefaults(
  defineProps<{
    glyphs: NgGlyph[]
    leadIcon?: string
    families?: Record<string, string>
  }>(),
  {
    leadIcon: 'ph:pulse',
    families: () => ({
      edit: 'ph:pencil-simple',
      bash: 'ph:terminal',
      read: 'ph:book-open',
      search: 'ph:magnifying-glass',
      db: 'ph:database',
      net: 'ph:globe-simple',
      model: 'ph:brain',
    }),
  },
)

function iconFor(g: NgGlyph): string {
  return g.icon ?? props.families[g.family ?? ''] ?? 'ph:circle'
}
function stateClass(g: NgGlyph): string {
  return g.ok === false ? 'gl-err' : g.ok === true ? 'gl-ok' : 'gl-pending'
}
</script>

<template>
  <div v-if="glyphs.length" class="glyph-ticker">
    <NgIcon class="gt-lead" :name="leadIcon" />
    <NgTooltip v-for="g in glyphs" :key="g.id" :text="g.label ?? g.family ?? 'tool call'">
      <span class="glyph" :class="[stateClass(g), g.fresh && 'gl-new']">
        <NgIcon :name="iconFor(g)" />
        <span class="sr-only">{{ g.label ?? g.family }} — {{ g.ok === false ? 'error' : g.ok ? 'ok' : 'running' }}</span>
      </span>
    </NgTooltip>
  </div>
</template>
