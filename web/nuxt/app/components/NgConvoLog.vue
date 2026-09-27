<script setup lang="ts">
/**
 * NgConvoLog — the AI conversation viewer.
 *
 * REQUIRED BY THE AI-USAGE UI. The brief asks for "a full viewer for the AI
 * session logs so the user can understand what happened and what was learned".
 * This is that viewer.
 *
 * FIVE ROW TYPES, each visually distinct without reading a word:
 *
 *   user             cyan prose, "U" badge
 *   assistant        secondary prose, orange "A" badge
 *   assistant_thinking  DIM ITALIC, smaller. Distinguishing thinking from output
 *                    is a COST question, not a curiosity: extended thinking bills
 *                    at the output rate, so a session that is 80% thinking has a
 *                    very different price shape from one that is 80% answer.
 *   tool_use         boxed mono row: family glyph + the command, truncated
 *   tool_result      indented dim mono, red when `isError`
 *
 * FOLLOW MODE. Auto-scroll is on by default and turns itself OFF the moment the
 * operator scrolls up, because a log that yanks you back to the bottom while you
 * are reading is worse than no auto-scroll. Scrolling back to the bottom re-arms
 * it.
 */
export type NgConvoRole = 'user' | 'assistant' | 'assistant_thinking' | 'tool_use' | 'tool_result' | string

export interface NgConvoMessage {
  id: string | number
  role: NgConvoRole
  /** Prose, command line, or result text depending on role. */
  body?: string
  /** tool_use: family key for the glyph. */
  family?: string
  /** tool_use: outcome, drives the trailing dot. */
  ok?: boolean
  /** tool_result: render in the error colour. */
  isError?: boolean
  /** Overrides the derived speaker badge. */
  badge?: string
}

const props = withDefaults(
  defineProps<{
    messages: NgConvoMessage[]
    title?: string
    /** Characters before a thinking/result row is truncated. */
    truncateThinking?: number
    truncateResult?: number
    families?: Record<string, string>
    /** Show the steering textarea. */
    input?: boolean
    inputPlaceholder?: string
    emptyMessage?: string
  }>(),
  {
    title: 'Session log',
    truncateThinking: 160,
    truncateResult: 140,
    families: () => ({
      edit: 'ph:pencil-simple',
      bash: 'ph:terminal',
      read: 'ph:book-open',
      search: 'ph:magnifying-glass',
      db: 'ph:database',
      net: 'ph:globe-simple',
      model: 'ph:brain',
    }),
    input: false,
    inputPlaceholder: 'Steer the session… (Enter to send, Shift+Enter newline)',
    emptyMessage: 'No messages yet.',
  },
)

const emit = defineEmits<{ send: [text: string]; copy: [] }>()

const draft = ref('')
const follow = ref(true)
const rowsEl = ref<HTMLElement | null>(null)

function truncate(s: string | undefined, n: number): string {
  if (!s) return ''
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

interface Row {
  key: string | number
  cls: string
  icon?: string
  badge?: string
  badgeCls?: string
  cmd?: string
  body: string
  dotColor?: string
}

const rows = computed<Row[]>(() =>
  props.messages.map((m) => {
    switch (m.role) {
      case 'user':
        return { key: m.id, cls: 'cr-text cr-user', badge: m.badge ?? 'U', badgeCls: 'cr-role-user', body: m.body ?? '' }
      case 'assistant':
        return { key: m.id, cls: 'cr-text', badge: m.badge ?? 'A', badgeCls: 'cr-role-ai', body: m.body ?? '' }
      case 'assistant_thinking':
        return { key: m.id, cls: 'cr-think', icon: 'ph:brain', body: truncate(m.body, props.truncateThinking) }
      case 'tool_use':
        return {
          key: m.id,
          cls: 'cr-tool',
          icon: props.families[m.family ?? ''] ?? 'ph:circle',
          cmd: m.body ?? '',
          body: '',
          dotColor: m.ok === false ? 'var(--red)' : m.ok ? 'var(--green)' : 'var(--text-dim)',
        }
      case 'tool_result':
        return {
          key: m.id,
          cls: `cr-result${m.isError ? ' err' : ''}`,
          icon: 'ph:arrow-elbow-down-right',
          body: truncate(m.body, props.truncateResult),
        }
      default:
        return { key: m.id, cls: 'cr-text', badge: m.badge ?? m.role, body: m.body ?? '' }
    }
  }),
)

/** Re-arm follow only when the operator is genuinely at the bottom. */
function onScroll() {
  const el = rowsEl.value
  if (!el) return
  follow.value = el.scrollHeight - el.scrollTop - el.clientHeight < 24
}

watch(
  () => props.messages.length,
  async () => {
    if (!follow.value) return
    await nextTick()
    const el = rowsEl.value
    if (el) el.scrollTop = el.scrollHeight
  },
)

function send() {
  const t = draft.value.trim()
  if (!t) return
  emit('send', t)
  draft.value = ''
}
</script>

<template>
  <div class="cockpit-convo">
    <div class="cc-head">
      <NgIcon name="ph:chat-teardrop-dots" />
      <span>{{ title }}</span>
      <span class="cc-spacer" />
      <button
        class="convo-toggle-btn"
        type="button"
        :title="follow ? 'auto-scroll on' : 'auto-scroll off'"
        @click="follow = !follow"
      >
        <NgIcon :name="follow ? 'ph:arrow-line-down' : 'ph:pause'" />
        {{ follow ? 'Follow' : 'Paused' }}
      </button>
      <button class="convo-toggle-btn" type="button" title="copy transcript" @click="emit('copy')">
        <NgIcon name="ph:copy" />
        <span class="sr-only">Copy transcript</span>
      </button>
    </div>

    <div ref="rowsEl" class="cc-rows" @scroll.passive="onScroll">
      <div v-if="!rows.length" class="convo-empty">{{ emptyMessage }}</div>
      <div v-for="r in rows" :key="r.key" class="convo-row" :class="r.cls">
        <NgIcon v-if="r.icon" :name="r.icon" :class="r.cls.includes('cr-tool') ? 'crt-glyph' : undefined" />
        <span v-if="r.badge" class="cr-role" :class="r.badgeCls">{{ r.badge }}</span>
        <span v-if="r.cmd" class="crt-cmd">{{ r.cmd }}</span>
        <span v-if="r.dotColor" class="crt-dot" :style="{ background: r.dotColor }" />
        <template v-if="r.body">{{ r.body }}</template>
      </div>
    </div>

    <div v-if="input" class="convo-input">
      <textarea
        v-model="draft"
        :placeholder="inputPlaceholder"
        aria-label="Message"
        @keydown.enter.exact.prevent="send"
      />
      <NgButton variant="primary" size="sm" icon="ph:paper-plane-right" icon-only label="Send" :disabled="!draft.trim()" @click="send" />
    </div>
  </div>
</template>
