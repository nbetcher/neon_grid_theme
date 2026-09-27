<script lang="ts">
  import type { PanelProps } from './types.js';
  let {
    children, class: className = '', color = '#00e0ff', style = '',
    element = $bindable<HTMLElement | null>(), ...attributes
  }: PanelProps = $props();
</script>

<article
  {...attributes} bind:this={element}
  class={`channel-card ${className}`.trim()}
  style={`--channel-color:${color};${style ?? ''}`}
  data-ng-panel
>
  {@render children?.()}
  <span class="arrival-field" data-ng-arrival aria-hidden="true"></span>
</article>
