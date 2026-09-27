<script setup lang="ts">
/**
 * NgCostGauge — spend against a budget ceiling, with a SEPARATE violet
 * cache-hit segment.
 *
 * REQUIRED BY THE AI-USAGE UI. The brief asks for "the estimated cost of each
 * call" plus hard dollar caps; this is the component that answers "how much of
 * the cap is gone, and how much of the traffic was cached" in one glance.
 *
 * GEOMETRY. A 270-degree arc drawn as a single `A` command with
 * `pathLength="100"`, so `stroke-dasharray` is literally "percent, remainder"
 * and no circumference arithmetic exists to get wrong. Three stacked paths,
 * back to front:
 *
 *   .cg-arc-track   the unfilled ring
 *   .cg-arc-cache   VIOLET  — cache_read / (input + output + cache_read),
 *                             scaled to 60% of the ring so a mostly-cached
 *                             session can never visually outrank actual spend
 *   .cg-arc-fill    CYAN    — cost / ceiling, clamped to [0,1]
 *
 * The cache segment matters more than it looks: on a teacher tier with a large
 * cached prefix, cache-read tokens are the difference between an affordable
 * escalation budget and one that blows through its cap in a week. If the violet
 * arc collapses, something upstream stopped hitting the cache and the monthly
 * spend is about to change shape. That is a fault signal, not a statistic.
 *
 * `filter: url(#tronGlow)` on the fill needs <NgSvgDefs> mounted once.
 */
const props = withDefaults(
  defineProps<{
    /** Spend so far, in dollars. */
    costUsd: number
    /** Budget ceiling, in dollars. */
    ceilingUsd?: number
    /** Number of calls/turns in this session. */
    turns?: number
    tokens?: { input?: number; output?: number; cacheRead?: number; cacheWrite?: number }
    /** Free-text "what happens next" line. */
    nextAction?: string
    size?: number
  }>(),
  { ceilingUsd: 60, turns: undefined, tokens: undefined, nextAction: undefined, size: 54 },
)

/** cost / ceiling, clamped. */
const costArc = computed(() => {
  const frac = Math.max(0, Math.min(1, props.costUsd / (props.ceilingUsd || 1)))
  const filled = (frac * 100).toFixed(1)
  return `${filled} ${(100 - Number(filled)).toFixed(1)}`
})

/** cache share of total tokens, scaled to 60% of the ring. */
const cacheArc = computed(() => {
  const t = props.tokens ?? {}
  const tot = (t.input ?? 0) + (t.output ?? 0) + (t.cacheRead ?? 0)
  if (!tot) return '0 100'
  const frac = Math.max(0, Math.min(1, (t.cacheRead ?? 0) / tot)) * 0.6
  const filled = (frac * 100).toFixed(1)
  return `${filled} ${(100 - Number(filled)).toFixed(1)}`
})

const over = computed(() => props.costUsd > props.ceilingUsd)

function tok(n?: number): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

const summary = computed(() => {
  const t = props.tokens ?? {}
  return (
    `$${props.costUsd.toFixed(2)} of $${props.ceilingUsd.toFixed(2)} budget` +
    (props.turns != null ? `, ${props.turns} turns` : '') +
    (t.cacheRead ? `, ${tok(t.cacheRead)} cache-read tokens` : '')
  )
})

// 270-degree arc on a 54x54 box, radius 23 — kept verbatim from the source so
// the gauge is pixel-identical to the shipped widget.
const D = 'M 27 50 A 23 23 0 1 1 27 4'
</script>

<template>
  <div class="cost-gauge" :class="{ over }" role="img" :aria-label="summary">
    <svg :width="size" :height="size" viewBox="0 0 54 54" aria-hidden="true">
      <path class="cg-arc-track" :d="D" />
      <path class="cg-arc-cache" :d="D" pathLength="100" :style="{ strokeDasharray: cacheArc }" />
      <path class="cg-arc-fill" :d="D" pathLength="100" :style="{ strokeDasharray: costArc }" />
    </svg>
    <div class="cg-stats">
      <span class="cg-cost">
        <NgIcon name="ph:coins" />${{ costUsd.toFixed(2) }}
        <span class="cg-sub">/ ${{ ceilingUsd.toFixed(2) }}</span>
      </span>
      <span v-if="turns != null || tokens" class="cg-sub">
        <template v-if="turns != null">{{ turns }} turns · </template>
        {{ tok(tokens?.input) }} in / {{ tok(tokens?.output) }} out
        <template v-if="tokens?.cacheRead">
          · <span class="cg-cache">{{ tok(tokens.cacheRead) }} cache</span>
        </template>
      </span>
      <span v-if="nextAction" class="cg-sub">→ {{ nextAction }}</span>
      <slot />
    </div>
  </div>
</template>
