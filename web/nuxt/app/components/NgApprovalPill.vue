<script setup lang="ts">
/**
 * NgApprovalPill — the inline approve/deny gate.
 *
 * REQUIRED BY THE AI-USAGE UI. In this system the thing being approved is
 * usually "this payload is about to leave the machine" — so the component is
 * deliberately loud (orange, glow, slow brightness pulse) and it always shows
 * the exact subject of the approval, never just "approve?".
 *
 * `hard` is the variant for a gate the operator CANNOT approve away — e.g. the
 * escalation router refused a payload on a code-level predicate. It renders red
 * with the approve button suppressed, so a blocked item can never be mistaken
 * for a pending one.
 */
withDefaults(
  defineProps<{
    /** What is being approved, e.g. the tool or route name. */
    subject: string
    /** The concrete thing — a command, a payload summary. Truncated with ellipsis. */
    detail?: string
    icon?: string
    /** Non-approvable: shows the reason, no Approve button. */
    hard?: boolean
    approveLabel?: string
    denyLabel?: string
  }>(),
  { detail: undefined, icon: 'ph:hand-palm', hard: false, approveLabel: 'Approve', denyLabel: 'Deny' },
)

const emit = defineEmits<{ approve: []; deny: [] }>()
</script>

<template>
  <div class="approval-pill" :class="{ hard }" role="group" :aria-label="`Approval required: ${subject}`">
    <NgIcon :name="icon" />
    <span>{{ hard ? 'Blocked' : 'Approval needed' }} · {{ subject }}</span>
    <span v-if="detail" class="ap-cmd" :title="detail">{{ detail }}</span>
    <slot />
    <NgButton v-if="!hard" variant="success" size="sm" icon="ph:check" @click="emit('approve')">
      {{ approveLabel }}
    </NgButton>
    <NgButton variant="danger" size="sm" icon="ph:x" @click="emit('deny')">
      {{ hard ? 'Dismiss' : denyLabel }}
    </NgButton>
  </div>
</template>
