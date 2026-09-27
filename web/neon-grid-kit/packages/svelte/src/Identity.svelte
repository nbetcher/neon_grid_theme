<script lang="ts">
  import { identityMarkup } from '@neon-grid/kit-core';
  import type { DecorationProps } from './types.js';
  const instanceId = $props.id();
  let { id = `ng-svelte-identity-${instanceId.replace(/[^A-Za-z0-9_-]/g, '_')}` }: DecorationProps = $props();
  const markup = $derived(identityMarkup(id));
</script>

<span class="ng-decoration" aria-hidden="true">{@html markup}</span>
