<script setup lang="ts">
/**
 * NgLifecyclePill — one pill, at most two words, soft brightness pulse while the
 * stage is live.
 *
 * REQUIRED BY THE AI-USAGE UI. This is how an escalation's stage is shown in the
 * session viewer. The stage vocabulary below is the theme's generic ladder; an
 * app supplies its own `label`/`icon` when its stages differ (for Verde Watch:
 * queued → pseudonymising → batched → in-flight → returned → absorbed).
 *
 * `strike` is for terminal/cancelled: it kills the glow AND the pulse, so a dead
 * item cannot read as an active one — the single most important state
 * distinction in a list of long-running jobs.
 */
export type NgLifecycleStage =
  | 'queued'
  | 'planning'
  | 'implement'
  | 'build'
  | 'deploy'
  | 'smoke'
  | 'debug'
  | 'resolve'
  | 'blocked'
  | 'aborted'

const props = withDefaults(
  defineProps<{
    stage: NgLifecycleStage
    /** Overrides the default label for the stage. */
    label?: string
    /** Overrides the default icon for the stage. */
    icon?: string
    /** Brightness pulse — set while the stage is actually running. */
    active?: boolean
    /** Terminal/cancelled: strike through, no glow, no pulse. */
    strike?: boolean
  }>(),
  { label: undefined, icon: undefined, active: false, strike: false },
)

const PRESENT: Record<NgLifecycleStage, { label: string; icon: string }> = {
  queued: { label: 'Queued', icon: 'ph:circle' },
  planning: { label: 'Planning', icon: 'ph:list-checks' },
  implement: { label: 'Working', icon: 'ph:code' },
  build: { label: 'Building', icon: 'ph:hammer' },
  deploy: { label: 'Sending', icon: 'ph:upload-simple' },
  smoke: { label: 'Verifying', icon: 'ph:check-square-offset' },
  debug: { label: 'Retrying', icon: 'ph:bug-beetle' },
  resolve: { label: 'Resolved', icon: 'ph:check-circle' },
  blocked: { label: 'Blocked', icon: 'ph:warning-octagon' },
  aborted: { label: 'Aborted', icon: 'ph:prohibit' },
}

const text = computed(() => props.label ?? PRESENT[props.stage].label)
const iconName = computed(() => props.icon ?? PRESENT[props.stage].icon)
</script>

<template>
  <span
    class="lifecycle-pill"
    :class="[`lc-${stage}`, active && !strike && 'active', strike && 'lc-strike']"
  >
    <NgIcon :name="iconName" />
    {{ text }}
  </span>
</template>
