<script setup lang="ts">
/**
 * NgToastHost — the toast container, as an ARIA live region.
 *
 * The petite-vue `.toast-container` had no live region at all, so a screen
 * reader never announced anything. In an ALERTING system that is a functional
 * bug, not a polish item.
 *
 * Two regions, not one: errors go through `role="alert"` (assertive, interrupts)
 * and everything else through `role="status"` (polite, waits its turn). Routing
 * a routine "saved" through assertive is how live regions get muted by users.
 *
 * Mounted once by <NgAppShell>. Push from anywhere with `useNgToast()`.
 */
const { toasts, dismiss } = useNgToast()

import type { NgToastType } from '../composables/useNgToast'

const ICON: Record<NgToastType, string> = {
  success: 'ph:check-circle',
  error: 'ph:warning-circle',
  warning: 'ph:warning',
  info: 'ph:info',
}

const alerts = computed(() => toasts.value.filter((t) => t.type === 'error'))
const statuses = computed(() => toasts.value.filter((t) => t.type !== 'error'))
</script>

<template>
  <div class="toast-container">
    <div role="alert" aria-live="assertive" aria-atomic="false" class="toast-stack">
      <div v-for="t in alerts" :key="t.id" class="toast toast-error">
        <NgIcon :name="t.icon ?? ICON.error" />
        <span>{{ t.message }}</span>
        <button class="toast-close" type="button" aria-label="Dismiss" @click="dismiss(t.id)">
          <NgIcon name="ph:x" />
        </button>
      </div>
    </div>

    <div role="status" aria-live="polite" aria-atomic="false" class="toast-stack">
      <div v-for="t in statuses" :key="t.id" class="toast" :class="`toast-${t.type}`">
        <NgIcon :name="t.icon ?? ICON[t.type]" />
        <span>{{ t.message }}</span>
        <button class="toast-close" type="button" aria-label="Dismiss" @click="dismiss(t.id)">
          <NgIcon name="ph:x" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toast-close {
  background: none;
  border: none;
  cursor: pointer;
}
</style>
