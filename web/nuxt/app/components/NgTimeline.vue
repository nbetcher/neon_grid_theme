<script setup lang="ts">
/**
 * NgTimeline — vertical audit trail with glowing nodes.
 *
 * Rendered as an ordered list so assistive tech gets the sequence, which is the
 * whole point of a timeline.
 */
export interface NgTimelineEntry {
  key: string | number
  time?: string
  head?: string
  /** old → new change line. */
  from?: string
  to?: string
  note?: string
  tone?: 'default' | 'created' | 'danger' | 'ok'
}

defineProps<{ entries: NgTimelineEntry[] }>()
</script>

<template>
  <ol class="timeline">
    <li v-for="e in entries" :key="e.key" class="tl-entry" :class="e.tone && e.tone !== 'default' ? e.tone : undefined">
      <div class="tl-head">
        <span v-if="e.head">{{ e.head }}</span>
        <time v-if="e.time" class="tl-time">{{ e.time }}</time>
        <slot name="head" :entry="e" />
      </div>
      <div v-if="e.from || e.to" class="tl-change">
        <span v-if="e.from" class="old">{{ e.from }}</span>
        <span v-if="e.from && e.to" class="arrow">→</span>
        <span v-if="e.to" class="new">{{ e.to }}</span>
      </div>
      <div v-if="e.note" class="tl-note">{{ e.note }}</div>
      <slot :entry="e" />
    </li>
  </ol>
</template>

<style scoped>
.timeline {
  list-style: none;
}
</style>
