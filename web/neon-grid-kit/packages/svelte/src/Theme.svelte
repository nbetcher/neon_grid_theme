<script lang="ts">
  import { onMount } from 'svelte';
  import { createThemeController, type ThemeController } from '@neon-grid/kit-core';
  import type { ThemeProps, ThemeStateDetail } from './types.js';

  let {
    children, class: className = '', glow = 'balanced', motion = true,
    focus = false, paused = false, onController, onStateChange, ...attributes
  }: ThemeProps = $props();
  let element: HTMLDivElement;
  let controller: ThemeController | undefined;

  onMount(() => {
    const stateChanged = (event: Event) => onStateChange?.(event as CustomEvent<ThemeStateDetail>);
    const notifyController = onController;
    element.addEventListener('ng:statechange', stateChanged);
    controller = createThemeController(element, { glow, motion, focus, paused });
    notifyController?.(controller);
    return () => {
      element.removeEventListener('ng:statechange', stateChanged);
      controller?.destroy();
      controller = undefined;
      notifyController?.(null);
    };
  });

  $effect(() => {
    // Read every option even before mounting so later prop changes stay reactive.
    const options = { glow, motion, focus, paused };
    controller?.update(options);
  });
</script>

<div
  {...attributes}
  bind:this={element}
  class={`ng-theme ${className}`.trim()}
  data-glow={glow === 'off' ? 'off' : 'soft'}
  data-intensity={glow === 'subtle' ? 'subtle' : 'balanced'}
  data-ambient="stopped"
  data-reading={String(focus)}
>
  {@render children?.()}
</div>
