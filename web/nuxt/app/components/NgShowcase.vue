<script setup lang="ts">
/**
 * NgShowcase — renders EVERY component in the layer, so the port can be visually
 * verified against `web/petite-vue/index.html` side by side.
 *
 * Drop it on a page:  <template><NgShowcase /></template>
 * Or run the layer's own playground:  npm run dev
 *
 * It also renders the live WCAG contrast table for every foreground/background
 * token pair, which is how the two a11y fixes stay honest: if somebody edits a
 * token and drops a pair below 4.5:1, this page shows it in red immediately.
 */
import { NEON, SEVERITY, SPECTRUM, SUBSTRATE, TEXT, contrastRatio } from '#neon-grid/shared/tokens'

const { push } = useNgToast()
const { lineAreaConfig, doughnutConfig, histogramConfig, barConfig } = useNeonChart()

/* ---------------------------------------------------------------- demo data */
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
const rand = (seed: number) => {
  // deterministic — the showcase must render identically every time so visual
  // diffs against the petite-vue original mean something
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}
const r = rand(20260817)
const seriesA = HOURS.map(() => Math.round(4 + r() * 26))
const seriesB = HOURS.map(() => Math.round(1 + r() * 9))

const trendConfig = computed(() =>
  lineAreaConfig(HOURS, [
    { label: 'Calls', data: seriesA, color: NEON.fuchsia },
    { label: 'Matches', data: seriesB, color: NEON.green },
  ]),
)
const sevConfig = computed(() =>
  doughnutConfig([
    { label: 'Critical', value: 3, color: SEVERITY.critical },
    { label: 'High', value: 11, color: SEVERITY.high },
    { label: 'Medium', value: 24, color: SEVERITY.medium },
    { label: 'Low', value: 42, color: SEVERITY.low },
    { label: 'Cleanup', value: 9, color: SEVERITY.cleanup },
  ]),
)
const histConfig = computed(() =>
  histogramConfig(
    ['0–2s', '2–4s', '4–6s', '6–8s', '8–12s', '12–20s', '20s+'].map((label, i) => ({
      label,
      value: [12, 58, 91, 66, 34, 15, 4][i]!,
    })),
  ),
)
const barCfg = computed(() =>
  barConfig(
    [
      { label: 'CPSCC FIRE', value: 412 },
      { label: 'YCSO DISP', value: 388 },
      { label: 'COTTONWD PD', value: 201 },
      { label: 'CAMP VERDE', value: 147 },
      { label: 'DPS D12', value: 96 },
      { label: 'SEDONA PD', value: 74 },
    ],
    { horizontal: true },
  ),
)

/* ------------------------------------------------------------------- tables */
interface CallRow extends Record<string, unknown> {
  id: string
  tg: string
  unit: string
  dur: number
  err: number
  text: string
}
const callRows: CallRow[] = [
  { id: 'C-88213', tg: '154.010', unit: 'E411', dur: 6.2, err: 0, text: 'Engine four eleven responding, 1010 South Main' },
  { id: 'C-88214', tg: '155.740', unit: '3A12', dur: 4.8, err: 3, text: 'Copy, show me out at milepost 384' },
  { id: 'C-88215', tg: '154.875', unit: '—', dur: 11.4, err: 17, text: '(garbled) …units respond code three…' },
  { id: 'C-88216', tg: '155.5125', unit: 'CV21', dur: 3.1, err: 0, text: 'Camp Verde 21, traffic stop, Finnie Flat' },
]
const callCols = [
  { key: 'id', label: 'Call', sortable: true, width: '110px' },
  { key: 'tg', label: 'Freq / TG', sortable: true },
  { key: 'unit', label: 'Unit' },
  { key: 'dur', label: 'Dur', numeric: true, sortable: true },
  { key: 'err', label: 'Err', numeric: true, sortable: true },
  { key: 'text', label: 'Transcript' },
]
const sortKey = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')

/* ------------------------------------------------------------------ signals */
const sevFilter = ref('all')
const sevCounts = [
  { key: 'critical', label: 'Critical', count: 3 },
  { key: 'high', label: 'High', count: 11 },
  { key: 'medium', label: 'Medium', count: 24 },
  { key: 'low', label: 'Low', count: 42 },
  { key: 'cleanup', label: 'Cleanup', count: 9 },
]

const modalMd = ref(false)
const modalSm = ref(false)
const modalXl = ref(false)
const modalCockpit = ref(false)

const tab = ref('transcript')
const switchOn = ref(true)
const slider = ref([62])
const inputVal = ref('1010 S Main St')
const selectVal = ref('cyan')
const textVal = ref('')
const rowOpen = ref(false)

/* ----------------------------------------------------------------- cockpit */
const convo = [
  { id: 1, role: 'user', body: 'Why was call C-88215 escalated?' },
  { id: 2, role: 'assistant_thinking', body: 'The transcript has a 17-error frame count and the matcher scored 0.61 on GEOFENCE_UNCERTAIN, which is inside the escalation band but below the auto-alert threshold, so it went to the teacher tier rather than the notifier…' },
  { id: 3, role: 'tool_use', family: 'db', body: "select * from call where id='C-88215'", ok: true },
  { id: 4, role: 'tool_result', body: '1 row · errorCount=17 · dbm=-104.2 · talkgroup=154.875' },
  { id: 5, role: 'tool_use', family: 'search', body: 'gazetteer lookup "milepost 384 89A"', ok: false },
  { id: 6, role: 'tool_result', body: 'ERROR: locator timeout after 2000ms', isError: true },
  { id: 7, role: 'assistant', body: 'Escalated under GEOFENCE_UNCERTAIN: RF quality was poor (17 frame errors, -104 dBm) and the address token did not resolve locally.' },
]
const glyphs = [
  { id: 'g1', family: 'read', ok: true, label: 'read transcript' },
  { id: 'g2', family: 'db', ok: true, label: 'query call' },
  { id: 'g3', family: 'search', ok: false, label: 'gazetteer lookup' },
  { id: 'g4', family: 'model', ok: undefined, label: 'teacher call in flight', fresh: true },
]

const events = [
  { key: 1, ref: 'ALERT-4471', summary: 'Structure fire — 1010 S Main St, Cottonwood', time: '02:14:07', icon: 'ph:fire', color: NEON.red, fresh: true },
  { key: 2, ref: 'ALERT-4470', summary: 'Traffic stop — Finnie Flat Rd', time: '02:09:51', icon: 'ph:police-car', color: NEON.cyan },
  { key: 3, ref: 'SRC-YCSO', summary: 'YCSO 155.740 silent 41 min — below 1st percentile', time: '01:58:20', icon: 'ph:warning', color: NEON.orange },
  { key: 4, ref: 'ALERT-4469', summary: 'Medical — address truncated (PHI policy)', time: '01:44:02', icon: 'ph:first-aid', color: NEON.green },
]

const timeline = [
  { key: 1, time: '02:14:07', head: 'Call received', tone: 'created' as const },
  { key: 2, time: '02:14:09', head: 'Transcribed', note: 'Parakeet TDT · RTFx 11.4 · NPU' },
  { key: 3, time: '02:14:09', head: 'Matched', from: 'no match', to: 'watch term: 1010 S Main' },
  { key: 4, time: '02:14:10', head: 'Notified', tone: 'ok' as const, note: 'critical tier · TTS + transcript card' },
]

/* ------------------------------------------------------ live contrast audit */
const FOREGROUNDS: [string, string][] = [
  ['--text-primary', TEXT.primary],
  ['--text-secondary', TEXT.secondary],
  ['--text-label', TEXT.label],
  ['--text-dim', TEXT.dim],
  ['--cyan', NEON.cyan],
  ['--green', NEON.green],
  ['--yellow', NEON.yellow],
  ['--orange', NEON.orange],
  ['--blue', NEON.blue],
  ['--magenta', NEON.fuchsia],
  ['--red', NEON.red],
  ['--violet', NEON.violet],
  ['--violet-text', TEXT.violet],
  ['--red-text', TEXT.red],
]
const BACKGROUNDS: [string, string][] = [
  ['--bg-darkest', SUBSTRATE.darkest],
  ['--bg-panel', SUBSTRATE.panel],
  ['--bg-elevated', SUBSTRATE.elevated],
]
const contrastRows = computed(() =>
  FOREGROUNDS.map(([name, hex]) => ({
    name,
    hex,
    ratios: BACKGROUNDS.map(([, bg]) => contrastRatio(hex, bg)),
  })),
)
function ratioClass(v: number) {
  return v >= 7 ? 'ok-aaa' : v >= 4.5 ? 'ok-aa' : v >= 3 ? 'ok-ui' : 'fail'
}
</script>

<template>
  <div class="ng-showcase">
    <!-- ══════════════════════════════════════════════════ TOKENS ══════════ -->
    <NgSectionDivider icon="ph:palette" label="Spectrum" />
    <NgPanel title="The neon spectrum" sub="Hex values are byte-identical to INDEX.md" icon="ph:swatches" arcs>
      <div class="sw-grid">
        <div v-for="(hex, name) in NEON" :key="name" class="sw">
          <div class="sw-chip" :style="{ background: hex, boxShadow: `0 0 18px ${hex}` }" />
          <div class="sw-name">{{ name }}</div>
          <code class="sw-hex">{{ hex.toUpperCase() }}</code>
        </div>
      </div>

      <NgSectionDivider label="Substrate + text" />
      <div class="sw-grid">
        <div v-for="(hex, name) in SUBSTRATE" :key="name" class="sw">
          <div class="sw-chip bordered" :style="{ background: hex }" />
          <div class="sw-name">{{ name }}</div>
          <code class="sw-hex">{{ hex.toUpperCase() }}</code>
        </div>
        <div v-for="(hex, name) in TEXT" :key="name" class="sw">
          <div class="sw-chip bordered" :style="{ background: hex }" />
          <div class="sw-name">text.{{ name }}</div>
          <code class="sw-hex">{{ hex.toUpperCase() }}</code>
        </div>
      </div>

      <NgSectionDivider label="Corners — 6 / 8 / 12 / 20" />
      <div class="corner-row">
        <div class="corner" style="border-radius: var(--radius-xs)">6</div>
        <div class="corner" style="border-radius: var(--radius-sm)">8</div>
        <div class="corner" style="border-radius: var(--radius)">12</div>
        <div class="corner" style="border-radius: var(--radius-lg)">20</div>
      </div>

      <NgSectionDivider label="Glow ramps" />
      <div class="glow-row">
        <span v-for="g in ['cyan', 'cyan-strong', 'green', 'red', 'violet', 'magenta', 'orange', 'blue', 'yellow']" :key="g" class="glow-swatch" :style="{ boxShadow: `var(--glow-${g})` }">
          {{ g }}
        </span>
      </div>
      <p class="form-hint">
        These respond live to the GLOW control below. At <code>soft</code> the radii shrink 30 %, the
        alphas halve and the third stop is dropped; at <code>off</code> they are <code>none</code>.
      </p>
    </NgPanel>

    <!-- ══════════════════════════════════════════ A11Y / GLOW CONTROL ═════ -->
    <NgSectionDivider icon="ph:eye" label="Reduced glow / high contrast" />
    <NgPanelGrid min="360px">
      <NgPanel title="Controls" icon="ph:sliders" flush>
        <NgGlowControl />
      </NgPanel>

      <NgPanel title="Live contrast audit" sub="WCAG 2.x, computed from the token module" icon="ph:ruler" flush>
        <div class="table-container">
          <table class="tron-table compact">
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th v-for="[bg] in BACKGROUNDS" :key="bg" scope="col" class="num">{{ bg }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in contrastRows" :key="row.name">
                <td><span class="sw-dot" :style="{ background: row.hex }" /> <code>{{ row.name }}</code></td>
                <td v-for="(v, i) in row.ratios" :key="i" class="num" :class="ratioClass(v)">{{ v.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="form-hint">
          AAA &ge; 7 · AA &ge; 4.5 · non-text UI &ge; 3. <code>--text-dim</code> and <code>--violet</code>
          sit below 4.5 by design — they are for dividers, disabled states and strokes only. Any
          visible label uses <code>--text-label</code>; any violet glyph uses <code>--violet-text</code>.
        </p>
      </NgPanel>
    </NgPanelGrid>

    <!-- ═══════════════════════════════════════════════ SURFACES ═══════════ -->
    <NgSectionDivider icon="ph:squares-four" label="Surfaces" />
    <div class="stats-grid">
      <NgStatCard label="Calls today" :value="1284" icon="ph:radio" />
      <NgStatCard label="Matches" :value="37" icon="ph:target" tone="positive" />
      <NgStatCard label="Sources dark" :value="2" icon="ph:warning-octagon" tone="alert" foot="YCSO TAC-2, Sedona PD" />
      <NgStatCard label="Teacher spend" value="$4.12" icon="ph:coins" foot="of $7.00 cap" />
    </div>

    <div class="kpi-grid">
      <NgKpiTile label="Calls / hour" :value="54" delta="+12% vs 7d" trend="up" :spark="seriesA" />
      <NgKpiTile label="Match rate" value="2.9%" delta="-0.4pt" trend="down" :spark="seriesB" :spark-color="NEON.green" />
      <NgKpiTile label="Median RTFx" value="11.4" delta="NPU, P0 queue" :spark="seriesA.slice().reverse()" :spark-color="NEON.violet" />
    </div>

    <NgPanelGrid>
      <NgPanel title="Default panel" sub="cyan accent" icon="ph:squares-four" flush arcs>
        <p class="ng-transcript">
          The gradient hairline across the top is inset 20px on each side, so it reads as a light bar
          rather than a border. Corner arcs are optional ornament.
        </p>
      </NgPanel>
      <NgPanel title="Alert panel" sub="red accent" icon="ph:warning" accent="red" flush>
        <NgDistBar
          :segments="[
            { key: 'critical', label: 'Critical', value: 3 },
            { key: 'high', label: 'High', value: 11 },
            { key: 'medium', label: 'Medium', value: 24 },
            { key: 'low', label: 'Low', value: 42 },
            { key: 'cleanup', label: 'Cleanup', value: 9 },
          ]"
        />
      </NgPanel>
      <NgPanel title="Violet panel" accent="violet" icon="ph:brain" flush>
        <NgHBar
          :rows="[
            { label: 'CPSCC Fire', value: 412 },
            { label: 'YCSO', value: 388 },
            { label: 'Cottonwood', value: 201 },
            { label: 'Camp Verde', value: 147 },
          ]"
        />
      </NgPanel>
    </NgPanelGrid>

    <!-- ═══════════════════════════════════════════════ CONTROLS ═══════════ -->
    <NgSectionDivider icon="ph:cursor-click" label="Controls" />
    <NgPanel title="Buttons" icon="ph:hand-pointing">
      <div class="row">
        <NgButton variant="primary" icon="ph:play">Primary</NgButton>
        <NgButton variant="success" icon="ph:check">Success</NgButton>
        <NgButton variant="violet" icon="ph:brain">Violet</NgButton>
        <NgButton variant="warning" icon="ph:warning">Warning</NgButton>
        <NgButton variant="danger" icon="ph:trash">Danger</NgButton>
        <NgButton variant="ghost" icon="ph:eye">Ghost</NgButton>
      </div>
      <div class="row">
        <NgButton variant="primary" size="sm">Small</NgButton>
        <NgButton variant="primary">Medium</NgButton>
        <NgButton variant="primary" size="lg">Large</NgButton>
        <NgButton variant="ghost" icon="ph:arrow-clockwise" icon-only label="Refresh" />
        <NgButton variant="ghost" icon="ph:pulse" icon-only label="Debug" />
        <NgButton variant="primary" loading>Loading</NgButton>
        <NgButton variant="primary" disabled>Disabled</NgButton>
        <NgButton variant="ghost" toggled icon="ph:funnel">Toggled</NgButton>
      </div>
      <div class="row">
        <NgActionMenu
          heading="Call actions"
          :items="[
            { key: 'play', label: 'Play clip', icon: 'ph:play' },
            { key: 'copy', label: 'Copy transcript', icon: 'ph:copy' },
            { key: 'fp', label: 'Mark false positive', icon: 'ph:thumbs-down', separatorBefore: true },
            { key: 'purge', label: 'Purge audio', icon: 'ph:trash', danger: true },
          ]"
          @select="push(`menu: ${$event}`, 'info')"
        />
        <NgTooltip text="Tooltips are mandatory on icon-only controls in this system">
          <NgButton variant="ghost" icon="ph:question" icon-only label="Help" />
        </NgTooltip>
        <NgButton variant="ghost" icon="ph:bell" @click="push('Toast pushed from the showcase', 'success')">
          Toast
        </NgButton>
        <NgButton variant="danger" icon="ph:warning-circle" @click="push('Assertive: this one interrupts', 'error')">
          Error toast
        </NgButton>
      </div>
    </NgPanel>

    <NgPanelGrid>
      <NgPanel title="Form primitives" icon="ph:textbox" flush>
        <NgInput v-model="inputVal" label="Watch term" hint="Address, plate, offence class or name" />
        <NgInput model-value="bad value" label="With error" error="No gazetteer match for this string" />
        <NgSelect
          v-model="selectVal"
          label="Accent"
          :options="SPECTRUM.map((h, i) => ({ value: String(i), label: h }))"
        />
        <NgTextarea v-model="textVal" label="What was actually said?" placeholder="Correct the transcript…" />
        <NgSwitch v-model="switchOn" label="Arm notifications" hint="Off during the two-week measurement run" />
        <NgSlider v-model="slider" label="Sensitivity" :format="(v) => `≈ ${(v / 100 * 1.6).toFixed(1)} false alerts/day`" />
      </NgPanel>

      <NgPanel title="Tabs" icon="ph:tabs" flush>
        <NgTabs
          v-model="tab"
          :tabs="[
            { value: 'transcript', label: 'Transcript', icon: 'ph:text-align-left' },
            { value: 'audio', label: 'Audio', icon: 'ph:waveform' },
            { value: 'ai', label: 'AI log', icon: 'ph:brain' },
            { value: 'off', label: 'Disabled', icon: 'ph:prohibit', disabled: true },
          ]"
        >
          <template #transcript>
            <p class="ng-transcript">Engine four eleven responding, <mark>1010 South Main</mark>, cross of Mingus.</p>
          </template>
          <template #audio><NgEmptyState icon="ph:waveform" message="Waveform lives in the app, not the theme." /></template>
          <template #ai><NgEmptyState icon="ph:brain" message="See the cockpit section below." /></template>
        </NgTabs>
      </NgPanel>
    </NgPanelGrid>

    <!-- ═════════════════════════════════════════════ INDICATORS ═══════════ -->
    <NgSectionDivider icon="ph:seal-check" label="Indicators" />
    <NgPanel title="Badges, chips, pills" icon="ph:tag">
      <div class="row">
        <NgBadge tone="success">success</NgBadge>
        <NgBadge tone="success" strong>strong</NgBadge>
        <NgBadge tone="danger">danger</NgBadge>
        <NgBadge tone="danger" strong>strong</NgBadge>
        <NgBadge tone="warning">warning</NgBadge>
        <NgBadge tone="info">info</NgBadge>
        <NgBadge tone="violet">violet</NgBadge>
        <NgBadge tone="magenta">magenta</NgBadge>
        <NgBadge tone="yellow">yellow</NgBadge>
        <NgBadge tone="blue">blue</NgBadge>
        <NgBadge tone="neutral">neutral</NgBadge>
      </div>
      <div class="row">
        <NgChip label="talkgroup" value="154.010" icon="ph:radio" />
        <NgChip label="unit" value="E411" icon="ph:fire-truck" />
        <NgChip label="errorCount" value="17" icon="ph:warning" />
        <NgChip label="selected" value="chip" icon="ph:check" selected clickable />
        <span class="fc-chip"><NgIcon name="ph:file" /> call_88215.opus</span>
        <span class="ix-chip"><span class="ix-k">K</span> keyboard chip</span>
      </div>
      <div class="row">
        <NgLivePill state="on" />
        <NgLivePill state="warn" />
        <NgLivePill state="off" />
        <NgStatusPill tone="live" icon="ph:broadcast">Live</NgStatusPill>
        <NgStatusPill tone="ok" icon="ph:check-circle">Healthy</NgStatusPill>
        <NgStatusPill tone="warn" icon="ph:warning">Degraded</NgStatusPill>
        <NgStatusPill tone="err" icon="ph:x-circle">Dark</NgStatusPill>
        <NgStatusPill tone="dead" icon="ph:prohibit">Retired</NgStatusPill>
      </div>
      <div class="row">
        <NgLifecyclePill stage="queued" />
        <NgLifecyclePill stage="planning" active />
        <NgLifecyclePill stage="implement" active />
        <NgLifecyclePill stage="deploy" active />
        <NgLifecyclePill stage="debug" />
        <NgLifecyclePill stage="resolve" />
        <NgLifecyclePill stage="blocked" />
        <NgLifecyclePill stage="aborted" strike />
      </div>
      <div class="row">
        <NgCounterPill :count="12" icon="ph:list-checks" label="items" />
        <NgCounterPill :count="3" icon="ph:bug" tone="warn" label="bugs" />
        <NgCounterPill :count="1" icon="ph:warning-octagon" tone="blocked" label="blocker" />
        <NgWorkerChip state="online" label="sdr-ingest" />
        <NgWorkerChip state="retrying" label="pulsepoint" />
        <NgWorkerChip state="waiting" label="batch teacher" />
        <NgWorkerChip state="needs-attn" label="asr worker" />
        <NgWorkerChip state="offline" label="broadcastify" />
      </div>
      <div class="row">
        <NgSevChips v-model="sevFilter" :counts="sevCounts" />
      </div>
      <p class="form-hint">Severity filter is <code>{{ sevFilter }}</code>.</p>
    </NgPanel>

    <!-- ═══════════════════════════════════════════════════ DATA ═══════════ -->
    <NgSectionDivider icon="ph:table" label="Data" />
    <NgPanel title="Recent calls" sub="tron-table, sortable, sticky head" icon="ph:list-magnifying-glass">
      <NgTable
        v-model:sort-key="sortKey"
        v-model:sort-dir="sortDir"
        :columns="callCols"
        :rows="callRows"
        :row-key="(r) => r.id"
        clickable
        caption="Recent radio calls"
        @row-click="push(`row: ${$event.id}`, 'info')"
      >
        <template #cell-id="{ value }"><span class="tag-hex">{{ value }}</span></template>
        <template #cell-err="{ value }">
          <NgBadge :tone="(value as number) > 10 ? 'danger' : (value as number) > 0 ? 'warning' : 'success'">
            {{ value }}
          </NgBadge>
        </template>
      </NgTable>
    </NgPanel>

    <NgPanelGrid>
      <NgPanel title="Event feed" icon="ph:broadcast" flush>
        <NgEventFeed :events="events" clickable max-height="280px" @select="push($event.ref ?? '', 'info')" />
      </NgPanel>

      <NgPanel title="Timeline" icon="ph:clock-counter-clockwise" flush>
        <NgTimeline :entries="timeline" />
      </NgPanel>

      <NgPanel title="Detail grid" icon="ph:info" flush>
        <NgDetailGrid
          :fields="[
            { label: 'Call id', value: 'C-88215', mono: true },
            { label: 'Talkgroup', value: '154.875' },
            { label: 'dBm', value: '-104.2' },
            { label: 'errorCount', value: 17 },
            { label: 'audio_sha256', value: '9f2c…ab41', mono: true, full: true },
          ]"
        />
      </NgPanel>
    </NgPanelGrid>

    <NgPanelGrid min="280px">
      <NgPanel title="Rings" icon="ph:circle-notch" flush>
        <div class="row ring-row">
          <NgRing :value="0.72" label="Coverage" />
          <NgRing :value="0.59" label="Budget" ramp="brand" :size="120" />
          <NgRing :value="0.18" label="Dark" ramp="danger" :size="100" />
        </div>
      </NgPanel>
      <NgPanel title="Source health" icon="ph:cell-tower" flush>
        <div class="ng-source-strip">
          <NgSourceCard name="CPSCC Fire 154.010" initials="FD" :color="NEON.green" state="working" activity="Engine 411 · 6.2 s ago" :progress="0.92" heartbeat="last call 6 s ago" />
          <NgSourceCard name="YCSO 155.740" initials="YC" :color="NEON.orange" state="idle" activity="Silent 41 min — below 1st percentile for this hour" heartbeat="last call 41 m ago" />
          <NgSourceCard name="Sedona PD 158.760" initials="SP" :color="NEON.red" state="blocked" activity="No decode since 18:04 — suspected encryption" heartbeat="dark 8 h" />
        </div>
      </NgPanel>
      <NgPanel title="Empty + loading" icon="ph:tray" flush>
        <NgEmptyState icon="ph:magnifying-glass" message="No calls match this filter.">
          <template #actions><NgButton variant="ghost" size="sm" icon="ph:x">Clear filters</NgButton></template>
        </NgEmptyState>
        <NgSpinner label="Replaying archive…" />
      </NgPanel>
    </NgPanelGrid>

    <NgPanel title="Record rows" sub="disclosure with aria-expanded, not a clickable div" icon="ph:rows">
      <div class="ng-record-list">
        <NgRecordRow
          v-model:open="rowOpen"
          :stripe="SEVERITY.critical"
          :dot-color="SEVERITY.critical"
          slug="ALERT-4471"
          title="Structure fire — 1010 S Main St, Cottonwood"
        >
          <template #head><NgBadge tone="danger" strong>critical</NgBadge></template>
          <p class="ng-transcript">Engine four eleven responding, 1010 South Main, cross of Mingus.</p>
          <div class="chip-row">
            <NgChip label="score" value="0.94" />
            <NgChip label="source" value="sdr" />
            <NgChip label="independence" value="cad" />
          </div>
        </NgRecordRow>
        <NgRecordRow :stripe="SEVERITY.medium" :dot-color="SEVERITY.medium" slug="ALERT-4470" title="Traffic stop — Finnie Flat Rd">
          <p class="ng-transcript">Camp Verde 21, traffic stop, Finnie Flat.</p>
        </NgRecordRow>
      </div>
    </NgPanel>

    <!-- ════════════════════════════════════════════════ CHARTS ════════════ -->
    <NgSectionDivider icon="ph:chart-line" label="Charts" />
    <div class="analytics-grid">
      <NgChartPanel title="Calls vs matches, 24 h" :config="trendConfig" span2 height="tall" />
      <NgChartPanel title="Severity mix" :config="sevConfig" />
      <NgChartPanel title="Call duration histogram" :config="histConfig" />
      <NgChartPanel title="Calls by talkgroup" :config="barCfg" />
    </div>
    <p class="form-hint">
      Canvas bloom is <code>ctx.shadowBlur</code>, multiplied by the live
      <code>--chart-glow-scale</code> token — switch GLOW to <strong>off</strong> above and the charts
      stop glowing too. CSS cannot reach canvas pixels; this is the only way that works.
    </p>

    <!-- ═══════════════════════════════════════════════ COCKPIT ════════════ -->
    <NgSectionDivider icon="ph:brain" label="AI cockpit" />
    <NgPanelGrid min="380px">
      <NgPanel title="Cost gauge" sub="cyan = spend / cap · violet = cache-read share" icon="ph:coins" flush>
        <NgCostGauge
          :cost-usd="4.12"
          :ceiling-usd="7"
          :turns="38"
          :tokens="{ input: 41200, output: 8800, cacheRead: 186000 }"
          next-action="nightly batch at 03:00 MST"
        />
        <NgCostGauge :cost-usd="9.4" :ceiling-usd="7" :turns="112" :tokens="{ input: 90000, output: 22000, cacheRead: 4000 }" />
        <p class="form-hint">
          The second gauge is over cap: spend arc goes red. Note the collapsed violet segment — a
          cache-hit rate that falls off a cliff is a fault signal, not a statistic.
        </p>
      </NgPanel>

      <NgPanel title="Tool ticker + approval" icon="ph:wrench" flush>
        <div class="hud-sec">
          <span class="hud-sec-label"><NgIcon name="ph:pulse" /> recent tool calls</span>
        </div>
        <NgGlyphTicker :glyphs="glyphs" />
        <NgActivityTicker text="teacher batch 3 of 7 · 2 200 tokens in flight" />
        <NgApprovalPill
          subject="claude.messages.create"
          detail="escalation_reason=GEOFENCE_UNCERTAIN · 1 payload · pseudonymised"
          @approve="push('approved', 'success')"
          @deny="push('denied', 'warning')"
        />
        <NgApprovalPill
          hard
          subject="person-linked payload"
          detail="router predicate refused: person entities present"
          icon="ph:shield-warning"
          @deny="push('dismissed', 'info')"
        />
        <NgTriad
          :stages="[
            { key: 'demod', label: 'Demod', state: 'pass', target: '154.010' },
            { key: 'asr', label: 'Transcribe', state: 'running', target: 'NPU' },
            { key: 'match', label: 'Match', state: 'idle' },
          ]"
        />
        <NgPlanCard
          :steps="[
            { label: 'Pseudonymise', icon: 'ph:mask-happy' },
            { label: 'Batch', icon: 'ph:stack' },
            { label: 'Submit', icon: 'ph:upload-simple' },
            { label: 'Absorb', icon: 'ph:brain' },
          ]"
          risk="Batch API is not ZDR-eligible — results stored server-side for 29 days."
          :files="['lexicon.jsonl', 'escalation_reason.enum']"
        />
      </NgPanel>
    </NgPanelGrid>

    <NgPanel title="Conversation viewer" sub="five row types: user / assistant / thinking / tool / result" icon="ph:chat-teardrop-dots" pad-none>
      <div class="convo-demo">
        <NgConvoLog :messages="convo" input @send="push(`sent: ${$event}`, 'info')" @copy="push('copied', 'success')" />
      </div>
    </NgPanel>

    <!-- ════════════════════════════════════════════════ MODALS ════════════ -->
    <NgSectionDivider icon="ph:browsers" label="Modals" />
    <NgPanel title="Dialogs" sub="Reka UI — focus trap, scroll lock, Esc, focus restore" icon="ph:app-window">
      <div class="row">
        <NgButton variant="primary" @click="modalSm = true">Small</NgButton>
        <NgButton variant="primary" @click="modalMd = true">Medium</NgButton>
        <NgButton variant="primary" @click="modalXl = true">XL (65vw × 80vh)</NgButton>
        <NgButton variant="violet" @click="modalCockpit = true">Cockpit (two-pane)</NgButton>
      </div>
    </NgPanel>

    <NgModal v-model:open="modalSm" size="sm" title="Purge audio?" icon="ph:trash" description="This cannot be undone.">
      <p class="ng-transcript">Call C-88215 · 11.4 s · 154.875</p>
      <template #footer>
        <NgButton variant="ghost" @click="modalSm = false">Cancel</NgButton>
        <NgButton variant="danger" icon="ph:trash" @click="modalSm = false">Purge</NgButton>
      </template>
    </NgModal>

    <NgModal v-model:open="modalMd" title="Call detail" icon="ph:radio">
      <NgDetailGrid
        :fields="[
          { label: 'Call id', value: 'C-88215', mono: true },
          { label: 'Talkgroup', value: '154.875' },
          { label: 'Duration', value: '11.4 s' },
          { label: 'errorCount', value: 17 },
        ]"
      />
      <div class="ng-section">
        <div class="sec-label">Transcript</div>
        <p class="sec-text">(garbled) …units respond code three…</p>
      </div>
      <template #footer>
        <NgButton variant="ghost" @click="modalMd = false">Close</NgButton>
        <NgButton variant="primary" icon="ph:play">Play clip</NgButton>
      </template>
    </NgModal>

    <NgModal v-model:open="modalXl" size="xl" title="ALERT-4471" icon="ph:fire">
      <div class="mx-scroll">
        <div class="mx-grid">
          <div>
            <h4 class="mx-title">Structure fire — 1010 S Main St, Cottonwood</h4>
            <NgTimeline :entries="timeline" />
            <div class="ng-section">
              <div class="sec-label">Transcript</div>
              <p class="sec-text">Engine four eleven responding, 1010 South Main, cross of Mingus.</p>
            </div>
            <div class="resolution-block">
              <div class="sec-label">Resolution</div>
              <div class="sec-text">Confirmed by PulsePoint incident 14102-88213 at 02:14:41.</div>
            </div>
          </div>
          <aside class="mx-rail">
            <div class="mx-rail-card">
              <div class="mini-label"><NgIcon name="ph:gauge" /> score</div>
              <NgRing :value="0.94" :size="110" label="confidence" />
            </div>
            <div class="mx-rail-card">
              <div class="mini-label"><NgIcon name="ph:tag" /> meta</div>
              <div class="chip-row">
                <NgChip label="source" value="sdr" />
                <NgChip label="independence" value="cad" />
              </div>
            </div>
          </aside>
        </div>
      </div>
      <template #footer>
        <NgButton variant="ghost" @click="modalXl = false">Close</NgButton>
        <NgButton variant="warning" icon="ph:thumbs-down">False positive</NgButton>
      </template>
    </NgModal>

    <NgModal v-model:open="modalCockpit" size="cockpit" title="Escalation ESC-2211" icon="ph:brain">
      <div class="cockpit-body">
        <div class="cockpit-hud">
          <NgCostGauge :cost-usd="0.057" :ceiling-usd="7" :turns="4" :tokens="{ input: 3000, output: 900, cacheRead: 9000 }" />
          <NgGlyphTicker :glyphs="glyphs" />
          <NgTriad
            :stages="[
              { key: 'pseudo', label: 'Pseudonymise', state: 'pass' },
              { key: 'submit', label: 'Submit', state: 'pass' },
              { key: 'absorb', label: 'Absorb', state: 'running' },
            ]"
          />
          <NgPlanCard
            :steps="[{ label: 'Diff lexicon' }, { label: 'Score' }, { label: 'Promote' }]"
            risk="Promotion is gated on the offline eval, not on this session."
          />
        </div>
        <NgConvoLog :messages="convo" input />
      </div>
    </NgModal>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 12px;
}
.ring-row {
  align-items: flex-end;
}

/* swatches */
.sw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
}
.sw {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sw-chip {
  height: 44px;
  border-radius: var(--radius-sm);
}
.sw-chip.bordered {
  border: 1px solid var(--border-base);
  box-shadow: none;
}
.sw-name {
  font-family: var(--font-display);
  font-size: 0.66rem;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--text-label);
}
.sw-hex {
  font-family: var(--font-mono);
  font-size: 0.84rem;
  color: var(--text-secondary);
}
.sw-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  vertical-align: middle;
  margin-right: 6px;
}

.corner-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.corner {
  width: 76px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-input);
  border: 1px solid var(--border-glow-dim);
  font-family: var(--font-display);
  color: var(--cyan);
}

.glow-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 10px 4px 18px;
}
.glow-swatch {
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  border: 1px solid var(--border-base);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* contrast table verdicts */
.ok-aaa {
  color: var(--green);
}
.ok-aa {
  color: var(--cyan);
}
.ok-ui {
  color: var(--orange);
}
.fail {
  color: var(--red-text);
  font-weight: 700;
}

.convo-demo {
  height: 380px;
  display: flex;
}
.convo-demo > * {
  flex: 1;
  min-height: 0;
}
</style>
