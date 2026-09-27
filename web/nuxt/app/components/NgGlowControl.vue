<script setup lang="ts">
/**
 * NgGlowControl — the reduced-glow / high-contrast / text-size control.
 *
 * Ship this in the header or a settings pane. It is not a nicety: this console
 * is stared at for hours, the same-hue glyph glow measurably blurs glyph edges,
 * and roughly half the population has some degree of astigmatism that dark-mode
 * pupil dilation amplifies. The default is `soft` precisely so most people never
 * have to find this control.
 *
 * Two forms:
 *   compact  a single cycling icon button, for the header
 *   full     labelled segmented controls + text size, for a settings page
 */
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const { glow, contrast, transcriptSize, levels, transcriptSizes, setGlow, setContrast, setTranscriptSize, cycleGlow } =
  useGlowLevel()

const GLOW_ICON: Record<string, string> = {
  full: 'ph:sun',
  soft: 'ph:sun-dim',
  off: 'ph:moon',
}
const SIZE_LABEL: Record<string, string> = {
  '0.95rem': 'S',
  '1.04rem': 'M',
  '1.2rem': 'L',
}
</script>

<template>
  <NgTooltip v-if="compact" :text="`Glow: ${glow} — click to cycle`">
    <button class="btn btn-ghost btn-icon" type="button" @click="cycleGlow">
      <NgIcon :name="GLOW_ICON[glow] ?? 'ph:sun-dim'" />
      <span class="sr-only">Glow level: {{ glow }}. Click to change.</span>
    </button>
  </NgTooltip>

  <div v-else class="ng-glow-control">
    <div class="form-group">
      <span class="form-label" id="ng-glow-label">Glow</span>
      <div class="ng-seg" role="radiogroup" aria-labelledby="ng-glow-label">
        <button
          v-for="l in levels"
          :key="l"
          class="btn btn-sm"
          :class="glow === l ? 'btn-primary' : 'btn-ghost'"
          type="button"
          role="radio"
          :aria-checked="glow === l"
          @click="setGlow(l)"
        >
          <NgIcon :name="GLOW_ICON[l] ?? 'ph:circle'" />{{ l }}
        </button>
      </div>
      <p class="form-hint">
        <strong>soft</strong> is the default and keeps the panel bloom while halving the glyph halo.
        <strong>off</strong> removes every shadow; colour and borders still carry the design.
      </p>
    </div>

    <div class="form-group">
      <span class="form-label" id="ng-contrast-label">Contrast</span>
      <div class="ng-seg" role="radiogroup" aria-labelledby="ng-contrast-label">
        <button
          v-for="c in (['normal', 'high'] as const)"
          :key="c"
          class="btn btn-sm"
          :class="contrast === c ? 'btn-primary' : 'btn-ghost'"
          type="button"
          role="radio"
          :aria-checked="contrast === c"
          @click="setContrast(c)"
        >
          {{ c }}
        </button>
      </div>
      <p class="form-hint">
        High contrast also forces glow off and thickens container borders. Your OS
        <code>prefers-contrast</code> setting applies automatically unless you pick <strong>normal</strong> here.
      </p>
    </div>

    <div class="form-group">
      <span class="form-label" id="ng-size-label">Transcript text size</span>
      <div class="ng-seg" role="radiogroup" aria-labelledby="ng-size-label">
        <button
          v-for="s in transcriptSizes"
          :key="s"
          class="btn btn-sm"
          :class="transcriptSize === s ? 'btn-primary' : 'btn-ghost'"
          type="button"
          role="radio"
          :aria-checked="transcriptSize === s"
          @click="setTranscriptSize(s)"
        >
          {{ SIZE_LABEL[s] ?? s }}
        </button>
      </div>
      <p class="form-hint">Scales dense mono content only — the chrome stays put, unlike browser zoom.</p>
    </div>
  </div>
</template>

<style scoped>
.ng-seg {
  display: inline-flex;
  gap: 4px;
  flex-wrap: wrap;
}
</style>
