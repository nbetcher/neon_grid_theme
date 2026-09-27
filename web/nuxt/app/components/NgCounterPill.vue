<script setup lang="ts">
/**
 * NgCounterPill — a small count with an icon. Three tones matching the source's
 * `.counter-pill` / `.bugs-pill` / `.blockers-pill`.
 *
 * `blocked` pulses. That is deliberate: a blocker that does not draw the eye is a
 * blocker nobody clears.
 */
withDefaults(
  defineProps<{
    count: number
    icon?: string
    label?: string
    tone?: 'neutral' | 'warn' | 'blocked'
  }>(),
  { icon: undefined, label: undefined, tone: 'neutral' },
)
</script>

<template>
  <span
    :class="[
      tone === 'blocked' ? 'blockers-pill' : tone === 'warn' ? 'bugs-pill' : 'counter-pill',
      count > 0 && (tone === 'blocked' ? 'blocked' : 'has'),
    ]"
  >
    <NgIcon v-if="icon" :name="icon" />
    {{ count }}<template v-if="label">&nbsp;{{ label }}</template>
  </span>
</template>
