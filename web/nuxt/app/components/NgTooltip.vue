<script setup lang="ts">
/**
 * NgTooltip — Reka Tooltip.
 *
 * Not decoration. This system communicates severity by ICON + COLOUR with no
 * visible text label, so every icon-only control needs BOTH `.sr-only` text (for
 * assistive tech) and a tooltip (for sighted users who do not know the icon
 * vocabulary yet). `.sr-only` alone leaves sighted users guessing.
 *
 * `TooltipProvider` is included per-instance for convenience; hoist one into
 * your layout if you render very many.
 */
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'

withDefaults(
  defineProps<{
    text: string
    side?: 'top' | 'right' | 'bottom' | 'left'
    delay?: number
  }>(),
  { side: 'top', delay: 350 },
)
</script>

<template>
  <TooltipProvider :delay-duration="delay">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent class="ng-tooltip" :side="side" :side-offset="6">
          {{ text }}
          <TooltipArrow class="ng-tooltip-arrow" :width="10" :height="5" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
