<script setup lang="ts">
/**
 * NgEventFeed — the live event stream.
 *
 * `fresh` flashes a row as it arrives; under `prefers-reduced-motion` that flash
 * becomes a static outline instead of nothing, because "this one is new" is
 * INFORMATION, not decoration.
 *
 * The feed is a `role="log"` live region set to POLITE. Deliberately not
 * assertive: a busy fire night can produce a row every few seconds and an
 * assertive log would talk over everything else on the page permanently. Push
 * genuinely urgent items through `useNgToast().error()` instead, which is
 * assertive.
 */
export interface NgEvent {
  key: string | number
  ref?: string
  summary?: string
  time?: string
  icon?: string
  /** Icon tile background + left rule colour. */
  color?: string
  fresh?: boolean
}

withDefaults(
  defineProps<{
    events: NgEvent[]
    clickable?: boolean
    maxHeight?: string
    /** Announce new rows to assistive tech. Off for very high-rate feeds. */
    live?: boolean
  }>(),
  { clickable: false, maxHeight: undefined, live: true },
)

const emit = defineEmits<{ select: [event: NgEvent] }>()
</script>

<template>
  <div
    class="event-feed"
    :style="maxHeight ? { maxHeight } : undefined"
    :role="live ? 'log' : undefined"
    :aria-live="live ? 'polite' : undefined"
    aria-relevant="additions"
  >
    <component
      :is="clickable ? 'button' : 'div'"
      v-for="e in events"
      :key="e.key"
      class="event-row"
      :class="{ fresh: e.fresh, clickable }"
      :type="clickable ? 'button' : undefined"
      :style="e.color ? { borderLeftColor: e.color } : undefined"
      @click="clickable && emit('select', e)"
    >
      <span
        v-if="e.icon"
        class="event-icon"
        :style="e.color ? { background: `${e.color}22`, color: e.color } : undefined"
      >
        <NgIcon :name="e.icon" />
      </span>
      <span class="event-main">
        <span v-if="e.ref" class="event-ref">{{ e.ref }}</span>
        <span v-if="e.summary" class="event-summary">{{ e.summary }}</span>
        <slot :event="e" />
      </span>
      <time v-if="e.time" class="event-time">{{ e.time }}</time>
    </component>

    <NgEmptyState v-if="!events.length" icon="ph:broadcast" message="No events yet." />
  </div>
</template>

<style scoped>
.event-row {
  width: 100%;
  text-align: left;
  background: none;
  border-top: none;
  border-right: none;
  border-bottom: none;
  font: inherit;
  color: inherit;
}
</style>
