<script lang="ts">
  import { tick } from 'svelte';
  import { Theme, Button, NavItem, Panel, Signal, Identity, type ThemeController, type ThemeOptions } from '@neon-grid/kit-svelte';

  type View = 'live' | 'archive' | 'guide';
  type Call = { id: string; time: string; text: string };
  type Channel = { id: string; name: string; frequency: string; color: string; window: string; calls: Call[] };

  let view = $state<View>('live');
  let glow = $state<NonNullable<ThemeOptions['glow']>>('balanced');
  let focus = $state(false);
  let motion = $state(true);
  let paused = $state(false);
  let stateReason = $state('Decorative motion starts after mounting');
  let announcement = $state('Fictional radio traffic. No audio is playing.');
  let panelElements = $state<(HTMLElement | null)[]>([null, null, null]);
  let pending = $state<Call[]>([]);
  let controller: ThemeController | null = null;
  let sequence = 0;

  let channels = $state<Channel[]>([
    {
      id: 'mingus', name: 'YCSO · Mingus Mountain', frequency: '154.740', color: '#00e0ff', window: '2m 30s',
      calls: [
        { id: 'svelte-call-1', time: '14:31:22', text: 'Unit 24, check the disabled vehicle near the eastbound shoulder. Caller reports the driver is outside the vehicle.' },
        { id: 'svelte-call-2', time: '14:32:03', text: 'Copy. I have the vehicle in sight. Traffic is moving; I will check with the driver.' }
      ]
    },
    {
      id: 'cottonwood', name: 'Cottonwood Police', frequency: '155.595', color: '#b694ff', window: '3m',
      calls: [
        { id: 'svelte-call-3', time: '14:30:48', text: 'Unit 32, a traffic signal is dark at Main Street. Public works has been notified.' },
        { id: 'svelte-call-4', time: '14:31:36', text: 'On scene. I will remain at the intersection until the crew arrives.' }
      ]
    },
    {
      id: 'fire', name: 'Verde Valley · Fire / EMS', frequency: '155.790', color: '#00ff95', window: '4m',
      calls: [
        { id: 'svelte-call-5', time: '14:30:12', text: 'Medic 12, use the south entrance. A staff member will meet you at the door.' },
        { id: 'svelte-call-6', time: '14:31:54', text: 'Medic 12 copies the south entrance. We are two minutes out.' }
      ]
    }
  ]);

  const samples = [
    'Unit 24, the driver has roadside assistance on the way. The eastbound lane is clear.',
    'Dispatch copies. Remain with the driver until the tow truck arrives.',
    'Tow truck is on scene. We will clear once the vehicle is secure.',
    'Vehicle has been removed. Unit 24 is clear and available.'
  ];

  async function showCalls(calls: Call[]) {
    channels[0].calls = [...channels[0].calls, ...calls];
    await tick();
    // A pulse belongs to this actual update, never to mounting or changing views.
    if (view === 'live' && panelElements[0]) controller?.pulse(panelElements[0]);
  }

  async function addSample() {
    sequence += 1;
    const call = {
      id: `svelte-demo-${sequence}`,
      time: `14:${String(32 + Math.floor(sequence / 3)).padStart(2, '0')}:${String((sequence * 18) % 60).padStart(2, '0')}`,
      text: samples[(sequence - 1) % samples.length]
    };
    if (paused) {
      pending = [...pending, call];
      announcement = `${pending.length} sample ${pending.length === 1 ? 'call is' : 'calls are'} waiting while the view is paused.`;
    } else {
      await showCalls([call]);
      announcement = 'One fictional transmission added to YCSO.';
    }
  }

  async function togglePaused() {
    paused = !paused;
    if (!paused && pending.length) {
      const waiting = pending;
      pending = [];
      await showCalls(waiting);
      announcement = `${waiting.length} waiting sample ${waiting.length === 1 ? 'call added' : 'calls added'}.`;
    }
  }
</script>

{#snippet radioIcon()}
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16a6 6 0 0 1 0-8m8 8a6 6 0 0 0 0-8M5 19a10 10 0 0 1 0-14m14 14a10 10 0 0 0 0-14"/><circle cx="12" cy="12" r="2"/><path d="M12 14v7"/></svg>
{/snippet}
{#snippet clockIcon()}
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
{/snippet}
{#snippet gridIcon()}
  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
{/snippet}

<Theme {glow} {motion} {focus} {paused}
  onController={(value) => { controller = value; }}
  onStateChange={(event) => { stateReason = event.detail.reason; }}
>
  <aside class="sidebar">
    <a class="brand" href="./" aria-label="Neon Grid Svelte example home"><span class="brand-icon">{@render radioIcon()}</span><span>VERDE<span class="brand-sub">WATCH</span></span></a>
    <div class="workspace-label">VERDE VALLEY</div>
    <nav aria-label="Example views">
      <NavItem selected={view === 'live'} onclick={() => { view = 'live'; }}>{@render radioIcon()}Live channels<span class="nav-dot"></span></NavItem>
      <NavItem selected={view === 'archive'} onclick={() => { view = 'archive'; }}>{@render clockIcon()}Call archive</NavItem>
      <NavItem selected={view === 'guide'} onclick={() => { view = 'guide'; }}>{@render gridIcon()}Theme notes</NavItem>
    </nav>
    <div class="sidebar-note"><div class="small-label">A LITTLE MORE CONTEXT</div><p>Every transmission has a place. Read the exchange without opening every call.</p><Signal id="svelte-demo-signal" /></div>
    <div class="sidebar-bottom"><span class="avatar">VV</span><div>Verde Valley<span>Local operator console</span></div></div>
  </aside>

  <div class="workspace">
    <header class="topbar"><div class="breadcrumb">Workspace<span>/</span><strong>{view === 'live' ? 'Live channels' : view === 'archive' ? 'Call archive' : 'Theme notes'}</strong></div><div class="demo-label"><span></span>SVELTE 5 <b>Fictional radio traffic</b></div></header>
    <main id="main">
      <section class="preview-controls" aria-label="Theme preferences">
        <div><div class="study-label">NEON GRID // LIGHT &amp; MOTION</div><p>A little atmosphere. Room to read.</p><span class="study-state">{stateReason}</span></div>
        <div class="preview-options">
          <label for="svelte-glow">Glow <select id="svelte-glow" data-ng-glow bind:value={glow}><option value="subtle">Subtle</option><option value="balanced">Balanced</option><option value="off">Off</option></select></label>
          <label><input type="checkbox" data-ng-motion bind:checked={motion} /> Animation</label>
          <Button data-ng-focus aria-pressed={focus} onclick={() => { focus = !focus; }}>{focus ? 'Exit focus mode' : 'Focus mode'}</Button>
        </div>
      </section>

      <div class="page-heading">
        <div><div class="eyebrow">VERDE VALLEY // THE CHANNEL, IN CONTEXT</div><h1>{view === 'live' ? 'Live' : view === 'archive' ? 'Call' : 'Theme'} <span class="title-outline">{view === 'live' ? 'channels' : view === 'archive' ? 'archive' : 'notes'}</span><span class="title-dot">.</span></h1><p>{view === 'live' ? 'What’s being said, channel by channel. The latest words, with the exchange behind them.' : view === 'archive' ? 'Every original sample transmission, including earlier words outside the live view.' : 'Thoughtful motion around a steady space for reading.'}</p></div>
        <Identity id="svelte-demo-identity" />
        <div class="heading-actions"><Button aria-pressed={paused} onclick={togglePaused}>{paused ? 'Resume view' : 'Pause view'}</Button><Button variant="primary" data-ng-demo-add onclick={addSample} disabled={view !== 'live'}><span>+</span> Add demo call</Button></div>
      </div>

      {#if view === 'live'}
        <div class="overview-line"><div><span class="status-dot"></span><strong>3 channels with recent calls</strong><span class="overview-separator">/</span><span>Fictional sample data</span></div><span class="mono">Snapshot · 14:32 MST</span></div>
        {#if paused}<div class="paused-banner"><span>View paused. {pending.length} sample {pending.length === 1 ? 'call' : 'calls'} waiting.</span><button type="button" onclick={togglePaused}>Catch up</button></div>{/if}
        <div class="list-caption"><span>01 / CHANNEL READOUT</span><span>Latest 3 sample transmissions per channel</span></div>
        {#each channels as channel, index (channel.id)}
          <Panel color={channel.color} bind:element={panelElements[index]} aria-labelledby={`svelte-${channel.id}-title`}>
            <header class="channel-header">
              <div class="channel-identity"><span class="channel-number">0{index + 1}</span><h2 id={`svelte-${channel.id}-title`}>{channel.name}</h2><span class="channel-frequency">{channel.frequency} MHz</span></div>
              <div class="channel-actions"><span class="channel-status"><span class="status-dot"></span>Recent traffic</span></div>
            </header>
            <div class="transmissions">
              {#each channel.calls.slice(-3) as call, callIndex (call.id)}
                <div class:latest={callIndex === Math.min(channel.calls.length, 3) - 1} class="transmission"><time>{call.time}</time><span class="transmission-text">{call.text}{#if callIndex === Math.min(channel.calls.length, 3) - 1}<span class="latest-label">LATEST TEXT</span>{/if}</span></div>
              {/each}
            </div>
            <div class="channel-meta"><div class="meta-left"><span>{Math.min(channel.calls.length, 3)} transmissions shown</span><span class="dot-sep">·</span><span>{channel.window} sample look-back</span></div><span>Fictional traffic</span></div>
          </Panel>
        {/each}
      {:else if view === 'archive'}
        <div class="list-caption"><span>02 / CALL ARCHIVE</span><span>Full sample history for this visit</span></div>
        <section aria-label="Original sample calls">
          {#each channels as channel (channel.id)}
            {#each [...channel.calls].reverse() as call (call.id)}
              <article class="archive-row"><time>{call.time}</time><strong>{channel.name}</strong><span class="transmission-text">{call.text}</span></article>
            {/each}
          {/each}
        </section>
      {:else}
        <Panel color="#b694ff" aria-labelledby="svelte-notes-title">
          <header class="channel-header"><div class="channel-identity"><span class="channel-number">01</span><h2 id="svelte-notes-title">Space for the signal</h2></div></header>
          <div class="transmissions"><p class="transmission-text">Light follows the edges. Navigation assembles on hover, the selected item carries a moving perimeter trace, and the three-node signal travels in both directions. Body text stays steady.</p><p class="transmission-text">Focus mode settles decorative motion. Your device’s reduced-motion and high-contrast preferences take priority. New-call pulses happen only when an actual sample is added.</p></div>
        </Panel>
      {/if}

      <footer class="page-footer"><span>NEON GRID / SVELTE 5</span><span>Local sample · No account, network, or audio required</span></footer>
      <p class="demo-announcement" role="status">{announcement}</p>
    </main>
  </div>
</Theme>

<style>
  :global(body) { margin: 0; }
  .demo-announcement { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
</style>
