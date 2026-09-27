<script lang="ts">
  import { navMarkup } from '@neon-grid/kit-core';
  import type { NavItemProps } from './types.js';
  let { children, class: className = '', selected = false, type = 'button', ...attributes }: NavItemProps = $props();
  const decoration = navMarkup();
</script>

<button
  {...attributes} {type}
  class={`nav-item ${selected ? 'selected' : ''} ${className}`.trim()}
  data-ng-nav
  aria-current={selected ? 'page' : undefined}
>
  <span class="nav-content">{@render children?.()}</span>
  <span class="ng-decoration" aria-hidden="true">{@html decoration}</span>
</button>
