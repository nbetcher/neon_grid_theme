<script lang="ts">
  import type { ButtonProps } from './types.js';
  let { children, class: className = '', variant = 'secondary', type = 'button', ...attributes }: ButtonProps = $props();
</script>

<button {...attributes} {type} class={`button ${variant} ${className}`.trim()}>
  {@render children?.()}
</button>
