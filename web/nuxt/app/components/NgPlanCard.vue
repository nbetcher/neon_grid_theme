<script setup lang="ts">
/**
 * NgPlanCard — numbered step pills joined by glowing connectors, plus an
 * optional risk line and file chips.
 *
 * Used in the AI-usage UI to show a proposed sequence BEFORE it runs, which is
 * what makes an approval gate meaningful — approving a plan you cannot see is
 * not approval.
 */
export interface NgPlanStep {
  label: string
  icon?: string
}

withDefaults(
  defineProps<{
    steps: NgPlanStep[]
    heading?: string
    headingIcon?: string
    /** Rendered in orange under the steps. */
    risk?: string
    /** Chips under the risk line — file paths, table names, endpoints. */
    files?: string[]
  }>(),
  { heading: 'Proposed plan', headingIcon: 'ph:list-checks', risk: undefined, files: () => [] },
)
</script>

<template>
  <div class="plan-card">
    <div class="hud-sec-label"><NgIcon :name="headingIcon" /> {{ heading }}</div>
    <ol class="plan-steps">
      <template v-for="(s, i) in steps" :key="i">
        <span v-if="i > 0" class="plan-conn" aria-hidden="true" />
        <li class="plan-step">
          <span class="ps-n">{{ i + 1 }}</span>
          <NgIcon v-if="s.icon" :name="s.icon" />
          {{ s.label }}
        </li>
      </template>
    </ol>
    <p v-if="risk" class="pc-risk"><NgIcon name="ph:warning" /> {{ risk }}</p>
    <div v-if="files.length" class="plan-files">
      <span v-for="f in files" :key="f" class="fc-chip"><NgIcon name="ph:file" /> {{ f }}</span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.plan-steps {
  list-style: none;
}
</style>
