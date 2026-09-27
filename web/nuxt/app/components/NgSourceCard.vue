<script setup lang="ts">
/**
 * NgSourceCard — a monitored source's health at a glance.
 *
 * The petite-vue `.agent-card`, renamed to what it is actually for here: an
 * ingest source (an SDR channel, a talkgroup, a polled feed). "Which sources are
 * dark" has to be as prominent as the matches themselves, because a monitoring
 * system that silently stops monitoring is worse than no system — you will trust
 * its silence.
 *
 * `state: 'blocked'` recolours the top rule to red, so a wall of these reads at
 * a glance from across the room.
 */
const props = withDefaults(
  defineProps<{
    name: string
    /** Two- or three-character badge, e.g. a talkgroup id. */
    initials?: string
    /** Colour of the top rule and the avatar. */
    color?: string
    state?: 'working' | 'idle' | 'blocked'
    stateLabel?: string
    /** One-line "what is it doing right now". */
    activity?: string
    /** 0–1; omit for no bar. */
    progress?: number
    /** e.g. "last call 4m ago" */
    heartbeat?: string
  }>(),
  {
    initials: undefined,
    color: undefined,
    state: 'idle',
    stateLabel: undefined,
    activity: undefined,
    progress: undefined,
    heartbeat: undefined,
  },
)

const badge = computed(() => props.initials ?? props.name.slice(0, 2).toUpperCase())
const stateText = computed(
  () => props.stateLabel ?? ({ working: 'Live', idle: 'Quiet', blocked: 'Dark' } as const)[props.state],
)
</script>

<template>
  <div
    class="ng-source-card"
    :class="[state, state === 'blocked' && 'dark']"
    :style="color ? { borderTopColor: color } : undefined"
  >
    <div class="ng-source-head">
      <div class="ng-source-avatar" :style="{ background: color ?? 'var(--cyan)' }">{{ badge }}</div>
      <div class="ng-source-id">
        <div class="ng-source-name">{{ name }}</div>
        <div class="ng-source-state" :class="state">
          <span class="st-dot" />
          {{ stateText }}
        </div>
      </div>
      <slot name="actions" />
    </div>

    <div v-if="activity" class="ng-source-activity">{{ activity }}</div>
    <slot />

    <div v-if="progress != null" class="ng-source-prog">
      <div class="ng-prog-track" role="meter" :aria-valuenow="Math.round(progress * 100)" :aria-valuemin="0" :aria-valuemax="100" :aria-label="`${name} progress`">
        <div
          class="ng-prog-fill"
          :style="{ width: `${Math.max(0, Math.min(1, progress)) * 100}%`, background: color ?? 'var(--cyan)' }"
        />
      </div>
      <span class="ng-prog-pct">{{ Math.round(progress * 100) }}%</span>
    </div>

    <div class="ng-source-foot">
      <slot name="foot" />
      <span v-if="heartbeat">{{ heartbeat }}</span>
    </div>
  </div>
</template>

<style scoped>
.ng-source-prog {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
</style>
