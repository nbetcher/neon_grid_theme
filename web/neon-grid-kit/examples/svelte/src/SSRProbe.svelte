<script lang="ts">
  import { Theme, Signal, Identity, Panel } from '@neon-grid/kit-svelte';
</script>

<Theme><Signal /><Identity /><Panel><p class="transmission-text">First server-rendered island.</p></Panel></Theme>
<Theme glow="off" focus><Signal /><Identity /><Panel><p class="transmission-text">Second server-rendered island.</p></Panel></Theme>
