<script setup lang="ts">
/**
 * NgSevChips — the severity filter row.
 *
 * Severity is communicated by ICON + COLOUR with no visible text label, which is
 * a deliberate density decision — so every chip carries `.sr-only` text AND a
 * tooltip. Without both, the row is unreadable to a screen reader and a guessing
 * game for anyone who has not memorised the icons.
 *
 * `v-model` is the selected key, or `'all'`.
 */
export interface NgSevCount {
  key: string
  label: string
  count: number
}

const props = withDefaults(
  defineProps<{
    counts: NgSevCount[]
    /** Show the leading "All" chip with the total. */
    showAll?: boolean
    allLabel?: string
  }>(),
  { showAll: true, allLabel: 'All' },
)

const model = defineModel<string>({ default: 'all' })

const ICONS: Record<string, string> = {
  all: 'ph:list-bullets',
  critical: 'ph:warning-octagon',
  high: 'ph:warning',
  medium: 'ph:warning-circle',
  low: 'ph:info',
  cleanup: 'ph:broom',
}

const total = computed(() => props.counts.reduce((a, c) => a + c.count, 0))
</script>

<template>
  <div class="sev-chips" role="group" aria-label="Filter by severity">
    <NgTooltip v-if="showAll" :text="`${allLabel} — show everything`">
      <button
        class="sev-chip sev-all"
        :class="{ active: model === 'all' }"
        type="button"
        :aria-pressed="model === 'all'"
        @click="model = 'all'"
      >
        <NgIcon :name="ICONS.all!" />
        <span class="sr-only">{{ allLabel }}</span>
        <span class="cnt">{{ total }}</span>
      </button>
    </NgTooltip>

    <NgTooltip v-for="c in counts" :key="c.key" :text="`${c.label} — ${c.count}`">
      <button
        class="sev-chip"
        :class="[`sev-${c.key}`, { active: model === c.key }]"
        type="button"
        :aria-pressed="model === c.key"
        @click="model = model === c.key ? 'all' : c.key"
      >
        <NgIcon :name="ICONS[c.key] ?? 'ph:circle'" />
        <span class="sr-only">{{ c.label }}</span>
        <span class="cnt">{{ c.count }}</span>
      </button>
    </NgTooltip>
  </div>
</template>
