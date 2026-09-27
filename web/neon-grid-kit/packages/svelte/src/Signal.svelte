<script lang="ts">
  import { signalMarkup } from '@neon-grid/kit-core';
  import type { DecorationProps } from './types.js';
  const instanceId = $props.id();
  let { id = `ng-svelte-signal-${instanceId.replace(/[^A-Za-z0-9_-]/g, '_')}` }: DecorationProps = $props();
  const markup = $derived(signalMarkup(id));
</script>

<div class="mini-timeline" aria-hidden="true">
  <span class="ng-decoration">{@html markup}</span>
</div>
