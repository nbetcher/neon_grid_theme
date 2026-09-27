<script setup lang="ts">
/**
 * NgTriad — a row of 3-state pipeline stage chips (idle / running / pass / fail).
 *
 * Generic: in the source it was build/deploy/smoke; here it is whatever three-ish
 * stages a pipeline has (for an ingest chain: demod → transcribe → match).
 * `running` spins its leading icon, `fail` glows red.
 */
export interface NgTriadStage {
  key: string
  label: string
  icon?: string
  state: 'idle' | 'running' | 'pass' | 'fail'
  /** Small dim suffix — a target, a duration, a count. */
  target?: string
}

defineProps<{ stages: NgTriadStage[] }>()

const STATE_ICON: Record<string, string> = {
  running: 'ph:circle-notch',
  pass: 'ph:check-circle',
  fail: 'ph:x-circle',
  idle: 'ph:circle',
}
</script>

<template>
  <div class="triad">
    <span v-for="s in stages" :key="s.key" class="triad-chip" :class="`tc-${s.state}`">
      <NgIcon class="tlead" :name="s.state === 'idle' ? (s.icon ?? STATE_ICON.idle!) : STATE_ICON[s.state]!" />
      {{ s.label }}
      <span class="tc-state">{{ s.state }}</span>
      <span v-if="s.target" class="tc-target">{{ s.target }}</span>
    </span>
  </div>
</template>
