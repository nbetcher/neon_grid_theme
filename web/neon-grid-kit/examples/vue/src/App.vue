<script setup lang="ts">
import { computed, nextTick, ref, shallowRef } from 'vue';
import { Theme as NgTheme, Button as NgButton, NavItem as NgNavItem, Panel as NgPanel, Signal as NgSignal, Identity as NgIdentity } from '@neon-grid/kit-vue';
import type { ThemeController, ThemeOptions } from '@neon-grid/kit-core';

const framework = 'Vue';
const decorationId = 'vue-demo';
const focus = ref(false);
const motion = ref(true);
const glow = ref<NonNullable<ThemeOptions['glow']>>('balanced');
const view = ref<'live' | 'archive'>('live');
const search = ref('');
const controller = shallowRef<ThemeController | null>(null);
const theme = ref<InstanceType<typeof NgTheme> | null>(null);
const announcement = ref('');
let sequence = 0;
type Line = { id: string; time: string; text: string };
type Channel = { id: string; name: string; color: string; frequency: string; window: string; lines: Line[] };
const initialChannels = (): Channel[] => [
  { id: 'dispatch', name: 'Valley dispatch', color: '#00e0ff', frequency: '154.740', window: '5 min', lines: [
    { id: 'v1', time: '14:30:42', text: 'Unit 12, can you check the north entrance? The maintenance crew is waiting by the gate.' },
    { id: 'v2', time: '14:31:08', text: 'Copy. At the north entrance now. We have the crew in sight.' },
    { id: 'v3', time: '14:31:26', text: 'Received. Let us know when the access road is clear.' },
  ] },
  { id: 'operations', name: 'Field operations', color: '#b694ff', frequency: '155.790', window: '8 min', lines: [
    { id: 'f1', time: '14:29:52', text: 'Team two is at the staging area. Equipment check is complete.' },
    { id: 'f2', time: '14:30:15', text: 'Thanks, team two. Stand by there; we will call when the next group is ready.' },
  ] },
  { id: 'service', name: 'Community service', color: '#ff2daa', frequency: '155.580', window: '4 min', lines: [
    { id: 's1', time: '14:28:41', text: 'The east parking area is open again. Signs are back in place.' },
    { id: 's2', time: '14:29:02', text: 'Copy, east parking is open. Thank you.' },
  ] },
];
const channels = ref(initialChannels());
const visibleChannels = computed(() => channels.value.filter((channel) =>
  `${channel.name} ${channel.lines.map((line) => line.text).join(' ')}`.toLowerCase().includes(search.value.toLowerCase()),
));
const sampleLines = [
  'North entrance is clear. The maintenance crew is through the gate.',
  'Received. Unit 12, you can return to the staging area.',
  'Copy that. Returning to staging now.',
];
const shownLines = (channel: Channel) => view.value === 'archive' ? channel.lines : channel.lines.slice(-3);
function onReady(value: ThemeController | null) { controller.value = value; }
async function addLine() {
  sequence += 1;
  const elapsed = 18 * sequence;
  const time = `14:${String(32 + Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  const first = channels.value[0];
  if (!first) return;
  first.lines.push({ id: `demo-${sequence}`, time, text: sampleLines[(sequence - 1) % sampleLines.length]! });
  // Keep the demo bounded. Real source calls belong in the application's own store.
  first.lines = first.lines.slice(-20);
  view.value = 'live';
  search.value = '';
  await nextTick();
  const panel = theme.value?.element?.querySelector<HTMLElement>('[data-ng-panel]');
  if (panel) controller.value?.pulse(panel);
  announcement.value = `Sample transmission ${sequence} added to Valley dispatch.`;
}
function resetDemo() {
  channels.value = initialChannels();
  sequence = 0;
  view.value = 'live';
  search.value = '';
  announcement.value = 'Sample calls reset.';
}
</script>

<template>
  <NgTheme ref="theme" :glow="glow" :motion="motion" :focus="focus" @ready="onReady">
    <aside class="sidebar">
      <a class="brand" href="#main" aria-label="Neon Grid, skip to content">
        <span class="brand-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 9 5v10l-9 5-9-5V7Z" /><path d="m12 7 4 2v6l-4 2-4-2V9Z" /></svg></span>
        <span>NEON<span class="brand-sub">GRID</span></span>
      </a>
      <div class="workspace-label">YOUR WORKSPACE</div>
      <nav aria-label="Workspace views">
        <NgNavItem :selected="view === 'live'" @click="view = 'live'">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16a6 6 0 0 1 0-8m8 8a6 6 0 0 0 0-8M5 19a10 10 0 0 1 0-14m14 14a10 10 0 0 0 0-14" /><circle cx="12" cy="12" r="2" /></svg>
          Live channels<span v-if="view === 'live'" class="nav-dot" />
        </NgNavItem>
        <NgNavItem :selected="view === 'archive'" @click="view = 'archive'">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          Call archive<span v-if="view === 'archive'" class="nav-dot" />
        </NgNavItem>
      </nav>
      <div class="sidebar-note"><div class="small-label">A LITTLE MORE CONTEXT</div><p>Every transmission has a place. Read the exchange without opening every call.</p><NgSignal :id="`${decorationId}-signal`" /></div>
      <div class="sidebar-bottom"><span class="avatar">NG</span><div>Neon Grid<span>Local operator console</span></div></div>
    </aside>
    <div class="workspace">
      <header class="topbar"><div class="breadcrumb">Workspace<span>/</span><strong>{{ view === 'live' ? 'Live channels' : 'Call archive' }}</strong></div><div class="demo-label"><span />{{ framework.toUpperCase() }} TEMPLATE <b>Fictional radio traffic</b></div></header>
      <main id="main" tabindex="-1">
        <section class="preview-controls" aria-label="Theme preferences">
          <div><div class="study-label">NEON GRID // LIGHT &amp; MOTION</div><p>A little atmosphere. Room to read.</p><span class="study-state">{{ focus ? 'Focus mode · quiet surfaces' : 'Motion respects your system preferences' }}</span></div>
          <div class="preview-options">
            <label>Glow <select v-model="glow" data-ng-glow><option value="subtle">Subtle</option><option value="balanced">Balanced</option><option value="off">Off</option></select></label>
            <label><input v-model="motion" type="checkbox" data-ng-motion> Animated accents</label>
            <NgButton data-ng-focus :aria-pressed="focus" @click="focus = !focus">{{ focus ? 'Leave focus mode' : 'Focus mode' }}</NgButton>
          </div>
        </section>
        <div class="page-heading">
          <div><div class="eyebrow">YOUR WORKSPACE // THE CHANNEL, IN CONTEXT</div><h1>{{ view === 'live' ? 'Live' : 'Call' }} <span class="title-outline">{{ view === 'live' ? 'channels' : 'archive' }}</span><span class="title-dot">.</span></h1><p>{{ view === 'live' ? 'What’s being said, channel by channel. The latest words, with the exchange behind them.' : 'The original sample transmissions, including lines outside the current channel readout.' }}</p></div>
          <NgIdentity :id="`${decorationId}-identity`" />
          <div class="heading-actions"><NgButton @click="resetDemo">Reset demo</NgButton><NgButton variant="primary" data-ng-demo-add @click="addLine"><span>+</span> Add demo call</NgButton></div>
        </div>
        <div class="overview-line"><div><span class="status-dot" /><strong>{{ channels.length }} sample channels</strong><span class="overview-separator">/</span><span>Ready to read</span></div><span class="mono">Snapshot · fictional data</span></div>
        <section class="toolbar" aria-label="Find transmissions"><label class="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg><input v-model="search" type="search" placeholder="Find a channel or phrase…" aria-label="Find a channel or phrase"></label><span class="small-label">{{ framework.toUpperCase() }} // COMPONENT TEMPLATE</span></section>
        <div class="list-caption"><span>{{ view === 'live' ? '01 / CHANNEL READOUT' : '02 / CALL ARCHIVE' }}</span><span>{{ view === 'live' ? 'Latest 3 sample transmissions' : 'Up to 20 retained demo transmissions per channel' }}</span></div>
        <section aria-label="Channel transcripts">
          <NgPanel v-for="(channel, index) in visibleChannels" :key="channel.id" :accent="channel.color">
            <header class="channel-header"><div class="channel-identity"><span class="channel-number">{{ String(index + 1).padStart(2, '0') }}</span><h2>{{ channel.name }}</h2><span class="channel-frequency">{{ channel.frequency }} MHz</span></div><div class="channel-actions"><span class="channel-status"><span class="status-dot" />Sample text</span></div></header>
            <div class="transmissions"><div v-for="(line, lineIndex) in shownLines(channel)" :key="line.id" class="transmission" :class="{ latest: lineIndex === shownLines(channel).length - 1 }"><time>{{ line.time }}</time><span class="transmission-text">{{ line.text }}<span v-if="lineIndex === shownLines(channel).length - 1" class="latest-label">LATEST TEXT</span></span></div></div>
            <div class="channel-meta"><div class="meta-left"><span>{{ shownLines(channel).length }} transmissions shown</span><span class="dot-sep">·</span><span>Fictional sample</span></div><span>{{ view === 'archive' ? 'Call history' : 'Channel context' }}</span></div>
          </NgPanel>
          <div v-if="!visibleChannels.length" class="empty-result">No channels or phrases match. Try a different search.</div>
        </section>
        <footer class="page-footer"><span>Original call boundaries preserved</span><span>Native {{ framework }} components <b class="theme-credit">NEON GRID</b></span></footer>
      </main>
    </div>
    <div class="sr-only" role="status" aria-live="polite">{{ announcement }}</div>
  </NgTheme>
</template>
