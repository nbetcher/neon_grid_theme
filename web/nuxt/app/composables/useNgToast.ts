/**
 * useNgToast() — module-scoped toast queue for <NgToastHost>.
 *
 * The petite-vue `.toast-container` had no ARIA live region, so a screen reader
 * never announced anything. For an ALERTING system that is a functional bug, not
 * a polish item — so <NgToastHost> renders the container as a live region and
 * routes danger toasts through `role="alert"` (assertive) while everything else
 * is `role="status"` (polite).
 */
import { readonly, ref } from 'vue'

export type NgToastType = 'success' | 'error' | 'warning' | 'info'

export interface NgToast {
  id: number
  type: NgToastType
  message: string
  /** ms; 0 keeps it until dismissed. Errors default to sticky. */
  timeout: number
  /** Optional icon name (`ph:*`); a per-type default is used otherwise. */
  icon?: string
}

const toasts = ref<NgToast[]>([])
let seq = 0

const DEFAULT_TIMEOUT: Record<NgToastType, number> = {
  success: 3500,
  info: 4000,
  warning: 6000,
  error: 0, // sticky — an error you can miss is an error you will miss
}

export function useNgToast() {
  function push(message: string, type: NgToastType = 'info', opts?: { timeout?: number; icon?: string }): number {
    const id = ++seq
    const timeout = opts?.timeout ?? DEFAULT_TIMEOUT[type]
    toasts.value.push({ id, type, message, timeout, icon: opts?.icon })
    if (timeout > 0 && import.meta.client) {
      setTimeout(() => dismiss(id), timeout)
    }
    return id
  }

  function dismiss(id: number) {
    const i = toasts.value.findIndex((t) => t.id === id)
    if (i >= 0) toasts.value.splice(i, 1)
  }

  function clear() {
    toasts.value = []
  }

  return {
    toasts: readonly(toasts),
    push,
    dismiss,
    clear,
    success: (m: string, o?: { timeout?: number }) => push(m, 'success', o),
    error: (m: string, o?: { timeout?: number }) => push(m, 'error', o),
    warning: (m: string, o?: { timeout?: number }) => push(m, 'warning', o),
    info: (m: string, o?: { timeout?: number }) => push(m, 'info', o),
  }
}
