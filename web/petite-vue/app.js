/* ============================================================================
 * Neon Grid — Web / petite-vue · app.js  (Packet C, integration core)
 * Non-module. Defines global `App()` for `v-scope="App()"`.
 * Load order: Chart.js → data.js → charts.js → app.js → petite-vue.
 *
 * Everything renders fully populated & CONNECTED from window.NG_DATA — no fetch,
 * no SSE. Pure-presentation methods are ported verbatim from the source app.js
 * (adjusted to read this.*); every network / spawn / persist action is stubbed
 * to a toast + a benign local state change so nothing throws or is undefined.
 * ========================================================================== */
(function () {
  'use strict';

  // ---- baked-data handles (data.js has already run under `defer`) ----
  var NGD = window.NG_DATA || {};
  var NOW_MS = Date.parse((NGD && NGD.NOW) || '2026-07-20T17:42:00Z');
  var C = (NGD && NGD.colors) || {
    cyan: '#00E0FF', green: '#00FF95', fuchsia: '#FF2DAA', orange: '#FF9500',
    blue: '#1F9BFF', violet: '#8A45FF', red: '#FF3B5C', yellow: '#FFE11A', dim: '#62749C',
  };

  // ---- canonical severity ramp (ONE map; matches charts + badges) ----
  var SEV_ORDER = ['critical', 'high', 'medium', 'low', 'cleanup'];
  var SEV_COLORS = { critical: '#FF3B5C', high: '#FF9500', medium: '#FFE11A', low: '#00E0FF', cleanup: '#62749C' };
  var SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3, cleanup: 4 };
  var EFFORT_RANK = { S: 0, M: 1, L: 2, XL: 3 };
  var FAMILY_ICON = { edit: 'ph-pencil-simple', bash: 'ph-terminal', surface: 'ph-device-tablet', tracker: 'ph-database', read: 'ph-book-open' };

  // A worker whose live_state is older than this reads STALLED (kept generous so
  // the deterministic demo's freshly-timestamped missions read LIVE).
  var MISSION_STALE_MS = 30 * 60000;

  // Cockpit/internal event kinds kept OUT of the human-readable feed.
  var FEED_HIDDEN = { mission_state: 1, mission_msg: 1 };

  // ---- lifecycle → stepper stage + presentation (ported) ----
  var LIFECYCLE_STAGE = {
    queued: 'queued', planning: 'planning', implementing: 'implement', building: 'build',
    deploying: 'deploy', smoke: 'smoke', debugging: 'debug', resolved: 'resolve',
    blocked: 'blocked', aborted: 'aborted',
  };
  var STAGE_PRESENT = {
    queued:    { label: 'Queued',         icon: 'ph-circle',                color: '#62749c' },
    planning:  { label: 'Planning',       icon: 'ph-list-checks',           color: '#8a45ff' },
    implement: { label: 'Implementing',   icon: 'ph-code',                  color: '#00e0ff' },
    build:     { label: 'Building ARM32', icon: 'ph-hammer',                color: '#8a45ff' },
    deploy:    { label: 'Deploying',      icon: 'ph-upload-simple',         color: '#ff9500' },
    smoke:     { label: 'Smoke-Testing',  icon: 'ph-device-tablet-speaker', color: '#00e0ff' },
    debug:     { label: 'Debugging',      icon: 'ph-bug-beetle',            color: '#ff3b5c' },
    resolve:   { label: 'Resolved',       icon: 'ph-check-circle',          color: '#00ff95' },
    blocked:   { label: 'Blocked',        icon: 'ph-warning-octagon',       color: '#ff3b5c' },
    aborted:   { label: 'Aborted',        icon: 'ph-prohibit',              color: '#62749c' },
  };
  var STEPPER_DEF = [
    { stage: 'implement', short: 'IMPL', icon: 'ph-code',                  x: 8,   y: 20 },
    { stage: 'build',     short: 'BLD',  icon: 'ph-hammer',                x: 124, y: 20 },
    { stage: 'deploy',    short: 'DEP',  icon: 'ph-upload-simple',         x: 240, y: 20 },
    { stage: 'smoke',     short: 'SMK',  icon: 'ph-device-tablet-speaker', x: 356, y: 20 },
    { stage: 'debug',     short: 'DBG',  icon: 'ph-bug-beetle',            x: 472, y: 8  },
    { stage: 'resolve',   short: 'RSV',  icon: 'ph-check-circle',          x: 472, y: 36 },
  ];
  var STAGE_RANK = { implement: 0, build: 1, deploy: 2, smoke: 3, debug: 4, resolve: 5 };

  // ---- Home Assistant notify catalog + placeholders (ported) ----
  var NOTIFY_EVENT_CATALOG = [
    { value: 'question',    label: 'Approval needed', icon: 'ph-hand-palm' },
    { value: 'blocked',     label: 'Blocked',         icon: 'ph-warning-octagon' },
    { value: 'stall',       label: 'Stalled',         icon: 'ph-pulse' },
    { value: 'api_error',   label: 'API error',       icon: 'ph-bug-beetle' },
    { value: 'stop',        label: 'Stopped',         icon: 'ph-stop-circle' },
    { value: 'session_end', label: 'Session ended',   icon: 'ph-flow-arrow' },
    { value: 'done',        label: 'Resolved',        icon: 'ph-check-circle' },
    { value: 'compaction',  label: 'Compaction',      icon: 'ph-arrows-in' },
  ];
  var NOTIFY_PLACEHOLDERS = ['{event_type}', '{mission_key}', '{mission_title}', '{status}', '{agent}', '{phase}'];
  var NOTIFY_PLACEHOLDERS_EVENT = ['{reason}', '{message}', '{subtype}', '{exit_code}', '{state}', '{gate_id}', '{tool_name}', '{command}', '{trigger}'];

  function makeDefaultRule() {
    return {
      show: false, saving: false, id: null,
      name: '', enabled: true, events: [], service: '',
      title_template: '', message_template: '',
      channel: '', importance: 'default', priority: 'normal', ttl: '',
      persistent: false, sticky: false, tag: '', color: '', actions: [],
    };
  }

  // ---- persisted filter state (local only) ----
  var LS_KEY = 'neongrid.ui.v1';
  var PERSIST_KEYS = ['sevFilter', 'statusFilter', 'search', 'quickWins'];
  function loadPersisted() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }

  // hex -> rgba() (module-scope; used by geometry + exposed on HELPERS)
  function hexA(hex, a) {
    if (!hex) return 'rgba(98,116,156,' + a + ')';
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // ---- SVG phase-rail geometry constants (viewBox 0 0 1366 330) ----
  var NODE_W = 150, NODE_H = 92, GAP_X = 44, MARGIN_X = 26, RAIL_NODE_Y = 120;
  var SPACING = NODE_W + GAP_X;
  var RR_CIRC = 2 * Math.PI * 52;   // readiness ring r=52 (matches source markup)

  // ---- canonical default live_state (render-only fallback) ----
  function makeDefaultLiveState() {
    return {
      lifecycle: 'queued', stage_history: ['queued'], worker_online: false, session_id: null, model: null,
      permission_mode: 'default', activity: '', items: { done: 0, total: 0 }, bugs_found: 0, blockers: [],
      files_changed: [], files_changed_count: 0,
      triad: {
        build:  { state: 'idle', target: 'out/arm32_pgo', ts: null },
        deploy: { state: 'idle', target: 'Surface 2 RT', ts: null },
        smoke:  { state: 'idle', target: 'device', ts: null },
      },
      device: { process_alive: true, last_fault: null, exception_code: null, dump_captured: false },
      tools_recent: [], cost_usd: 0, tokens: { input: 0, output: 0, cache_read: 0 },
      turns: 0, duration_ms: 0, retries: 0, next_action: '', plan: null, approval_pending: null, updated_at: null,
    };
  }

  /* =========================================================================
   * HELPERS — pure presentation (colours / icons / text / time / stats).
   * Copied onto the app via defineProperty so `this === app` at call time.
   * ======================================================================= */
  var HELPERS = {
    hexA: hexA,
    sevOrder: SEV_ORDER,

    // colours / icons
    sevColor: function (s) { return SEV_COLORS[s] || '#62749C'; },
    sevIcon: function (s) {
      return ({ critical: 'ph-skull', high: 'ph-warning-octagon', medium: 'ph-warning', low: 'ph-info', cleanup: 'ph-broom' })[s] || 'ph-circle';
    },
    familyIcon: function (f) { return FAMILY_ICON[f] || 'ph-circle'; },
    phaseColor: function (k) { var p = this.phaseMap[k]; return p ? p.color : (C.dim || '#62749c'); },
    phaseName: function (k) { var p = this.phaseMap[k]; return p ? p.name : (k || '—'); },
    phaseIcon: function (k) { var p = this.phaseMap[k]; return p ? p.icon : 'ph-circle'; },

    // spectrum-correct event visuals — robust to (kind:string) OR (event:object)
    eventColor: function (e) {
      if (e && typeof e === 'object') { if (e.severity) return this.sevColor(e.severity); e = e.kind; }
      return ({ finding: C.cyan, comment: C.violet, phase: C.blue, workstream: C.green,
                agent: C.orange, heartbeat: C.dim, mission_state: C.cyan })[e] || C.dim;
    },
    eventIcon: function (e) {
      if (e && typeof e === 'object') e = e.kind;
      return ({ finding: 'ph-bug', comment: 'ph-chat-circle', phase: 'ph-flag',
                workstream: 'ph-git-branch', agent: 'ph-robot', heartbeat: 'ph-pulse' })[e] || 'ph-circle';
    },

    // badge CSS classes
    sevBadge: function (s) {
      if (s === 'critical') return 'badge-danger-strong';
      if (s === 'high') return 'badge-danger';
      if (s === 'medium') return 'badge-warning';
      if (s === 'low') return 'badge-info';
      return 'badge-neutral';
    },
    statusBadge: function (s) {
      if (s === 'open') return 'badge-info';
      if (s === 'in_progress') return 'badge-violet';
      if (s === 'resolved') return 'badge-success';
      if (s === 'verified') return 'badge-success-strong';
      if (s === 'wont_fix') return 'badge-neutral';
      if (s === 'deferred') return 'badge-warning';
      return 'badge-neutral';
    },

    // stat helpers (operate on this.stats.*)
    byStatus: function (s) { return (this.stats.by_status && this.stats.by_status[s]) || 0; },
    hasKeys: function (o) { return !!(o && Object.keys(o).length > 0); },
    sortedCounts: function (o) { return o ? Object.keys(o).map(function (k) { return { k: k, v: o[k] }; }).sort(function (a, b) { return b.v - a.v; }) : []; },
    pctOf: function (v, o) { var max = Math.max.apply(null, [1].concat(Object.values(o || {}))); return Math.round(v / max * 100); },
    sevCount: function (s) { return (this.stats.by_severity && this.stats.by_severity[s]) || 0; },
    sevPct: function (s) { var t = Object.values(this.stats.by_severity || {}).reduce(function (a, b) { return a + b; }, 0) || 1; return this.sevCount(s) / t * 100; },

    // overallPct derives from phase rollups
    get overallPct() {
      var ph = this.phases; if (!ph.length) return 0;
      var t = 0, d = 0;
      for (var i = 0; i < ph.length; i++) { t += ph[i].rollup.total; d += ph[i].rollup.done; }
      return t ? Math.round(d / t * 100) : 0;
    },

    // text / time  (timeAgo is DETERMINISTIC — measured against NG_DATA.NOW)
    truncate: function (v, n) { if (v === null || v === undefined) return ''; var s = String(v); return s.length > n ? s.slice(0, n) + '…' : s; },
    baseName: function (p) { if (!p) return ''; var s = String(p).replace(/\\/g, '/'); return s.split('/').pop() || s; },
    tokFmt: function (n) { n = n || 0; if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return Math.round(n / 1e3) + 'k'; return String(n); },
    formatTime: function (ts) {
      if (!ts) return '—';
      var d = new Date(ts); if (isNaN(d.getTime())) return ts;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
             d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    },
    timeAgo: function (ts) {
      if (!ts) return '—';
      var d = new Date(ts); if (isNaN(d.getTime())) return ts;
      var s = Math.max(0, Math.floor((NOW_MS - d.getTime()) / 1000));
      if (s < 10) return 'just now';
      if (s < 60) return s + 's ago';
      var m = Math.floor(s / 60); if (m < 60) return m + 'm ago';
      var h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
      return Math.floor(h / 24) + 'd ago';
    },
    shortModel: function (m) { if (!m) return ''; if (/opus/i.test(m)) return 'Opus'; if (/sonnet/i.test(m)) return 'Sonnet'; if (/haiku/i.test(m)) return 'Haiku'; return this.truncate(m, 16); },
  };

  /* =========================================================================
   * GEOMETRY — deterministic SVG geometry getters/helpers for the phase-rail
   * and readiness ring. Copied onto the app via defineProperty (preserves
   * getters + correct `this`).  NEVER spread — spreading invokes the getters.
   * ======================================================================= */
  var GEOMETRY = {
    nodeX: function (o) { return MARGIN_X + o * SPACING; },
    cx: function (o) { return MARGIN_X + o * SPACING + NODE_W / 2; },
    railTrunc: function (s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; },
    edgeWeight: function (a, b) {
      var ta = (a && a.rollup && a.rollup.total) || 0;
      var tb = (b && b.rollup && b.rollup.total) || 0;
      return ta + tb;
    },
    // greedy interval-coloring so overlapping connector channels don't collide
    assignChannels: function (items) {
      var self = this;
      var ranges = items.map(function (e, i) {
        return { i: i, lo: Math.min(self.cx(e.a), self.cx(e.b)), hi: Math.max(self.cx(e.a), self.cx(e.b)) };
      }).sort(function (p, q) { return p.lo - q.lo || p.hi - q.hi; });
      var ends = [], chan = new Array(items.length).fill(0);
      for (var r = 0; r < ranges.length; r++) {
        var row = ranges[r], placed = false;
        for (var k = 0; k < ends.length; k++) {
          if (row.lo >= ends[k]) { chan[row.i] = k; ends[k] = row.hi; placed = true; break; }
        }
        if (!placed) { chan[row.i] = ends.length; ends.push(row.hi); }
      }
      return chan;
    },

    get phaseNodes() {
      var self = this;
      return this.phases.map(function (p) {
        var out = {}; for (var kk in p) out[kk] = p[kk];
        out.x = self.nodeX(p.ordinal);
        out.fillBg = hexA(p.color, 0.10);
        return out;
      });
    },

    // dependency connectors — orthogonal light-cycle walls BELOW the lane
    get depArrows() {
      var edges = [];
      for (var i = 0; i < this.phases.length; i++) {
        var p = this.phases[i], deps = p.depends_on || [];
        for (var j = 0; j < deps.length; j++) {
          var d = this.phaseMap[deps[j]]; if (!d) continue;
          edges.push({ from: d, to: p, a: d.ordinal, b: p.ordinal });
        }
      }
      if (!edges.length) return [];
      var self = this;
      var chan = this.assignChannels(edges);
      var by = RAIL_NODE_Y + NODE_H, base = by + 12, step = 14;
      var weights = edges.map(function (e) { return self.edgeWeight(e.from, e.to); });
      var maxW = Math.max.apply(null, [1].concat(weights));
      return edges.map(function (e, i) {
        var sx = self.cx(e.from.ordinal), ex = self.cx(e.to.ordinal);
        var cy = base + chan[i] * step, norm = weights[i] / maxW;
        return {
          d: 'M ' + sx + ',' + by + ' L ' + sx + ',' + cy + ' L ' + ex + ',' + cy + ' L ' + ex + ',' + by,
          head: (ex - 5) + ',' + (by + 9) + ' ' + (ex + 5) + ',' + (by + 9) + ' ' + ex + ',' + (by + 1),
          color: e.from.color,
          dur: (4.2 - norm * 2.6).toFixed(2),
          width: (2.4 + norm * 2.6).toFixed(2),
          dash: Math.round(14 + norm * 28) + ' ' + Math.round(86 - norm * 28),
        };
      });
    },

    // overlap connectors — orthogonal walls ABOVE the lane
    get overlapArcs() {
      var seen = {}, edges = [];
      for (var i = 0; i < this.phases.length; i++) {
        var p = this.phases[i], ovs = p.overlaps || [];
        for (var j = 0; j < ovs.length; j++) {
          var o = this.phaseMap[ovs[j]]; if (!o) continue;
          var key = [p.ordinal, o.ordinal].sort(function (x, y) { return x - y; }).join('-');
          if (seen[key]) continue; seen[key] = 1;
          var lo = p.ordinal < o.ordinal ? p : o, hi = p.ordinal < o.ordinal ? o : p;
          edges.push({ lo: lo, hi: hi, a: lo.ordinal, b: hi.ordinal });
        }
      }
      if (!edges.length) return [];
      var self = this;
      var chan = this.assignChannels(edges);
      var topY = RAIL_NODE_Y, base = topY - 15, step = 14;
      var weights = edges.map(function (e) { return self.edgeWeight(e.lo, e.hi); });
      var maxW = Math.max.apply(null, [1].concat(weights));
      return edges.map(function (e, i) {
        var sx = self.cx(e.a), ex = self.cx(e.b);
        var cy = base - chan[i] * step, norm = weights[i] / maxW;
        return {
          d: 'M ' + sx + ',' + topY + ' L ' + sx + ',' + cy + ' L ' + ex + ',' + cy + ' L ' + ex + ',' + topY,
          color: '#00e0ff',
          dur: (4.6 - norm * 2.6).toFixed(2),
          width: (2.2 + norm * 2.4).toFixed(2),
          dash: Math.round(13 + norm * 26) + ' ' + Math.round(87 - norm * 26),
        };
      });
    },

    get agentMarkers() {
      var groups = {};
      for (var i = 0; i < this.agents.length; i++) {
        var a = this.agents[i];
        if (a.status !== 'working' || !a.phase_key) continue;
        var p = this.phaseMap[a.phase_key]; if (!p) continue;
        (groups[p.ordinal] = groups[p.ordinal] || []).push(a);
      }
      var out = [], self = this;
      Object.keys(groups).forEach(function (ord) {
        groups[ord].forEach(function (a, i) {
          out.push({
            name: a.name, initial: (a.name || '?')[0], activity: a.activity || '',
            color: a.color || '#00ff95',
            x: self.nodeX(+ord) + NODE_W - 15 - i * 18, y: RAIL_NODE_Y - 3,
            delay: (i * 0.55).toFixed(2) + 's',
          });
        });
      });
      return out;
    },

    // readiness ring
    get rrCirc() { return RR_CIRC; },
    get rrOffset() { return RR_CIRC * (1 - this.overallPct / 100); },
  };

  /* =========================================================================
   * App() factory
   * ======================================================================= */
  function App() {
    // per-render memo for the phase issue buckets
    var _bucketCache = { ref: null, sig: null, map: {} };

    var app = {
      // ---- routing ----
      page: 'dashboard',
      valid: ['dashboard', 'analytics', 'roadmap', 'mission', 'history', 'notify'],

      // ---- connection (seeded so the pill reads CONNECTED, banner hidden) ----
      live: true,
      liveFlash: false,
      refreshing: false,
      health: { ok: true, version: 'web-demo-1.0', total: (NGD.stats && NGD.stats.total) || 0 },
      authLoggedIn: true,

      // ---- toasts ----
      toasts: [],

      // ---- data (hydrated in init) ----
      stats: { by_severity: {}, by_status: {}, by_workflow: {}, by_subsystem: {}, recent: [] },
      meta: {
        severities: SEV_ORDER.slice(),
        statuses: ['open', 'in_progress', 'resolved', 'verified', 'wont_fix', 'deferred'],
        workflows: ['bringup', 'perf-hotpath', 'crash-triage', 'cleanup', 'compat-shim', 'security-audit'],
        subsystems: ['v8-arm', 'skia-neon', 'gpu-tegra', 'mem-partition', 'net-tls', 'ipc-mojo', 'ui-views', 'media-ffmpeg', 'base-threading', 'storage-disk-cache', 'sandbox-win', 'gl-angle'],
        categories: ['correctness', 'performance', 'resource', 'security', 'compat', 'polish', 'cleanup', 'infra'],
        sources: ['device-dump', 'pixel-diff', 'profiler', 'code-review', 'visual-qa', 'product'],
      },
      findings: [],
      findingsLoading: false,
      roadmapData: { phases: [], workstreams: [], agents: [] },
      events: [],
      charts: {},

      // ---- sprint queue + missions ----
      queue: [],
      missions: [],
      missionState: {},
      missionDetail: {},
      missionMessages: {},
      spawning: {},
      dispatching: false,
      queueAllBusy: false,
      preflightOpen: false,
      preflight: null,
      dispatchReasoningOverride: '',
      reasoningLevels: ['Medium', 'High', 'Extra', 'Ultracode'],
      effortTiers: ['low', 'medium', 'high', 'xhigh', 'max'],
      dispatchBulkEffort: 'high',
      dispatchVerifyEffort: 'xhigh',

      // ---- cockpit / conversation ----
      cockpitKey: null,
      convoOpen: {},
      convoFollow: true,
      steerDraft: '',

      // ---- filters ----
      sevFilter: 'all',
      statusFilter: '',
      searchRaw: '',
      search: '',
      quickWins: false,

      // ---- accordion open-state ----
      openPhases: {},
      openIssues: {},
      openMissions: {},

      // ---- constants used directly in the rail SVG ----
      railNodeY: RAIL_NODE_Y, nodeW: NODE_W, nodeH: NODE_H,

      // ---- modals ----
      detail: { show: false, loading: false, finding: null, history: [], comments: [], newComment: '', resolutionDraft: '', posting: false },
      resolveModal: { show: false, source: 'card', status: 'resolved', id: null, slug: '', title: '', resolution: '', loading: false },
      reopenModal: { show: false, key: null, reason: '', loading: false },
      loginModal: { show: false, phase: 'idle', url: '', login_id: null, code: '', email: '', error: '' },
      debug: { show: false, loading: false, data: null },
      ruleModal: makeDefaultRule(),

      // ---- Home Assistant notify ----
      notify: {
        loaded: false, enabled: false, base_url: '', default_service: '',
        token_set: false, token_last4: '', token_input: '', tokenEditing: false,
        rules: [], saving: false, testing: false,
      },
      notifyEventCatalog: NOTIFY_EVENT_CATALOG,
      notifyPlaceholders: NOTIFY_PLACEHOLDERS,
      notifyPlaceholdersEvent: NOTIFY_PLACEHOLDERS_EVENT,

      // ---- render-only fallback live_state ----
      _defaultLiveState: makeDefaultLiveState(),
      _toastId: 0,

      /* ===================== LIFECYCLE ===================== */
      init: function () {
        var saved = loadPersisted();
        for (var i = 0; i < PERSIST_KEYS.length; i++) {
          var k = PERSIST_KEYS[i];
          if (saved[k] !== undefined && saved[k] !== null) this[k] = saved[k];
        }
        this.searchRaw = this.search || '';
        this.hydrate();
        this.applyHash();
        var self = this;
        if (this.page === 'analytics' && window.NGCharts) requestAnimationFrame(function () { window.NGCharts.rebuild(self); });
      },

      hydrate: function () {
        var D = window.NG_DATA; if (!D) return;
        this.stats = D.stats || this.stats;
        this.findings = (D.findings || []).slice();
        this.roadmapData = {
          phases: D.phases || [],
          workstreams: (D.phases || []).reduce(function (acc, p) { return acc.concat(p.workstreams || []); }, []),
          agents: D.agents || [],
        };
        this.missions = (D.missions || []).slice();
        this.queue = (D.queue || []).slice();
        this.missionState = Object.assign({}, D.missionState || {});
        this.events = (D.events || []).slice();
        this.charts = D.charts || {};
        this.notify = Object.assign({}, this.notify, D.notify || {}, { loaded: true, token_input: '' });
        this.findingsLoading = false;
        this._seedMessages();
      },

      // seed a short baked transcript per mission so the cockpit conversation populates
      _seedMessages: function () {
        var msgs = {};
        for (var i = 0; i < this.missions.length; i++) {
          var m = this.missions[i];
          var st = this.missionState[m.key];
          if (!st) continue;
          var rows = [];
          var t0 = st.updated_at || NGD.NOW;
          rows.push({ id: m.key + '-u', ts: t0, role: 'user', body: m.title });
          if (st.activity) rows.push({ id: m.key + '-a1', ts: t0, role: 'assistant', body: st.activity });
          (st.tools_recent || []).forEach(function (tl, j) {
            rows.push({ id: m.key + '-t' + j, ts: t0, role: 'tool_use', body: tl.label || tl.family, json_payload: { name: tl.family } });
          });
          if (st.next_action) rows.push({ id: m.key + '-a2', ts: t0, role: 'assistant', body: '→ ' + st.next_action });
          msgs[m.key] = rows;
        }
        this.missionMessages = msgs;
      },

      go: function (p) {
        if (this.valid.indexOf(p) < 0) p = 'dashboard';
        var leaving = this.page;
        this.page = p;
        try { history.replaceState(null, '', '#' + p); } catch (e) {}
        var self = this;
        if (leaving === 'analytics' && p !== 'analytics' && window.NGCharts) window.NGCharts.dispose();
        if (p === 'analytics' && window.NGCharts) requestAnimationFrame(function () { window.NGCharts.rebuild(self); });
      },

      applyHash: function () {
        var h = (location.hash || '').replace(/^#/, '');
        if (this.valid.indexOf(h) >= 0) this.page = h;
      },

      persist: function () {
        try {
          var o = {};
          for (var i = 0; i < PERSIST_KEYS.length; i++) o[PERSIST_KEYS[i]] = this[PERSIST_KEYS[i]];
          localStorage.setItem(LS_KEY, JSON.stringify(o));
        } catch (e) {}
      },

      // stubbed refresh — re-hydrate from baked data (no network)
      refresh: function () {
        if (this.refreshing) return;
        this.refreshing = true;
        var self = this;
        this.hydrate();
        setTimeout(function () { self.refreshing = false; self.toast('success', 'Refreshed from baked data'); }, 300);
      },
      openDebug: function () {
        this.debug.show = true;
        this.debug.data = {
          mode: 'static demo', data_source: 'window.NG_DATA', clock: NGD.NOW,
          findings: this.findings.length, missions: this.missions.length,
          live_workers: this.liveAgents.length, queue: this.queue.length,
        };
      },

      /* ===================== TOASTS ===================== */
      toast: function (type, message) {
        var id = ++this._toastId;
        this.toasts.push({ id: id, type: type || 'info', message: message });
        var self = this;
        setTimeout(function () { self.toasts = self.toasts.filter(function (t) { return t.id !== id; }); }, 3600);
      },

      /* ===================== AUTH (stubbed) ===================== */
      openLogin: function () { this.loginModal = { show: true, phase: 'idle', url: '', login_id: null, code: '', email: this.loginModal.email || '', error: '' }; },
      beginLogin: function () { this.loginModal = Object.assign({}, this.loginModal, { phase: 'waiting', url: 'https://claude.ai/login (demo)' }); this.toast('info', 'Login is stubbed in this static demo'); },
      submitLoginCode: function () { this.loginModal = { show: false, phase: 'idle', url: '', login_id: null, code: '', email: '', error: '' }; this.toast('info', 'Login stubbed (demo)'); },
      cancelLogin: function () { this.loginModal = { show: false, phase: 'idle', url: '', login_id: null, code: '', email: '', error: '' }; },

      /* ===================== ROADMAP MODEL ===================== */
      get phases() { return this.roadmapData.phases || []; },
      get agents() { return this.roadmapData.agents || []; },
      get liveAgents() { return this.agents.filter(function (a) { return a && ['idle', 'offline'].indexOf(a.status) < 0; }); },
      get phaseMap() { var m = {}; var ph = this.phases; for (var i = 0; i < ph.length; i++) m[ph[i].key] = ph[i]; return m; },

      agentByName: function (n) { return this.agents.find(function (a) { return a.name === n; }); },
      agentColor: function (n) { var a = this.agentByName(n); return a ? (a.color || C.cyan) : (C.dim || '#62749c'); },
      phaseAgents: function (k) { return this.agents.filter(function (a) { return a.phase_key === k && a.status === 'working'; }); },
      wsName: function (key) { var w = (this.roadmapData.workstreams || []).find(function (x) { return x.key === key; }); return w ? w.name : key; },
      isWsLive: function (w) { var a = this.agentByName(w.agent); return !!(a && a.status === 'working' && a.workstream_key === w.key); },
      wsProgress: function (w) { var a = this.agentByName(w.agent); if (a && a.workstream_key === w.key) return a.progress || w.progress || 0; return w.progress || 0; },

      /* ===================== PHASE / ISSUE ACCORDIONS ===================== */
      // phases default OPEN (populated demo), issues default collapsed
      isPhaseOpen: function (k) { return this.openPhases[k] !== false; },
      togglePhase: function (k) { var o = {}; for (var kk in this.openPhases) o[kk] = this.openPhases[kk]; o[k] = !(this.openPhases[k] !== false); this.openPhases = o; },
      openPhase: function (k) { var o = {}; for (var kk in this.openPhases) o[kk] = this.openPhases[kk]; o[k] = true; this.openPhases = o; var self = this; setTimeout(function () { self.scrollPhase(k); }, 60); },
      get anyPhaseOpen() { var self = this; return this.phases.some(function (p) { return self.openPhases[p.key] !== false; }); },
      toggleAllPhases: function () { var t = !this.anyPhaseOpen; var o = {}; for (var i = 0; i < this.phases.length; i++) o[this.phases[i].key] = t; this.openPhases = o; },
      scrollPhase: function (k) {
        var o = {}; for (var kk in this.openPhases) o[kk] = this.openPhases[kk]; o[k] = true; this.openPhases = o;
        setTimeout(function () { var el = document.getElementById('phase-' + k); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
      },
      isIssueOpen: function (id) { return this.openIssues[id] === true; },
      toggleIssue: function (id) { var o = {}; for (var kk in this.openIssues) o[kk] = this.openIssues[kk]; o[id] = !this.openIssues[id]; this.openIssues = o; },

      /* ===================== FILTERS ===================== */
      onSearchInput: function () { this.search = this.searchRaw; this.persist(); },
      setSev: function (s) { this.sevFilter = s; this.persist(); },
      toggleQuickWins: function () { this.quickWins = !this.quickWins; this.persist(); },
      resetFilters: function () { this.sevFilter = 'all'; this.statusFilter = ''; this.searchRaw = ''; this.search = ''; this.quickWins = false; this.persist(); },
      matchFilter: function (f, ignoreSev) {
        var q = (this.search || '').trim().toLowerCase();
        if (!ignoreSev && this.sevFilter !== 'all' && f.severity !== this.sevFilter) return false;
        if (this.statusFilter && f.status !== this.statusFilter) return false;
        if (this.quickWins) {
          if (['open', 'in_progress', 'deferred'].indexOf(f.status) < 0) return false;
          if (f.effort !== 'S') return false;
          if (['critical', 'high'].indexOf(f.severity) < 0) return false;
        }
        if (q) {
          var hay = [f.title, f.slug, f.location, f.evidence, f.recommendation, f.subsystem]
            .map(function (x) { return (x || '').toLowerCase(); }).join(' ');
          if (hay.indexOf(q) < 0) return false;
        }
        return true;
      },
      get baseFiltered() { var self = this; return this.findings.filter(function (f) { return self.matchFilter(f, false); }); },
      sevChipCount: function (s) { var self = this; return this.findings.filter(function (f) { return (s === 'all' || f.severity === s) && self.matchFilter(f, true); }).length; },
      phaseBuckets: function () {
        var sig = [this.sevFilter, this.statusFilter, this.search, this.quickWins].join('');
        if (_bucketCache.ref === this.findings && _bucketCache.sig === sig) return _bucketCache.map;
        var map = {};
        for (var i = 0; i < this.findings.length; i++) {
          var f = this.findings[i];
          if (!this.matchFilter(f, false)) continue;
          (map[f.phase] = map[f.phase] || []).push(f);
        }
        Object.keys(map).forEach(function (k) {
          map[k].sort(function (a, b) {
            return (SEV_RANK[a.severity] == null ? 9 : SEV_RANK[a.severity]) - (SEV_RANK[b.severity] == null ? 9 : SEV_RANK[b.severity]) ||
                   (EFFORT_RANK[a.effort] == null ? 9 : EFFORT_RANK[a.effort]) - (EFFORT_RANK[b.effort] == null ? 9 : EFFORT_RANK[b.effort]) ||
                   String(a.slug || '').localeCompare(String(b.slug || ''));
          });
        });
        _bucketCache = { ref: this.findings, sig: sig, map: map };
        return map;
      },
      issuesForPhase: function (k) { return this.phaseBuckets()[k] || []; },
      // History page-2: status-terminal findings (source has none flagged 'historical')
      get historicalFindings() { return this.findings.filter(function (f) { return ['resolved', 'verified', 'wont_fix', 'deferred'].indexOf(f.status) >= 0; }); },

      /* ===================== SPRINT QUEUE (client-side) ===================== */
      isQueued: function (slug) { return this.queue.some(function (q) { return q.slug === slug; }); },
      queueableInPhase: function (phaseKey) {
        var done = ['resolved', 'verified', 'wont_fix'], self = this;
        return this.issuesForPhase(phaseKey).filter(function (f) { return done.indexOf(f.status) < 0 && !self.isQueued(f.slug); });
      },
      queueAllInPhase: function (phaseKey) {
        var targets = this.queueableInPhase(phaseKey);
        if (!targets.length) { this.toast('info', 'Nothing left to queue in this phase'); return; }
        var add = targets.map(function (f) { return { slug: f.slug, title: f.title, severity: f.severity, status: f.status, effort: f.effort }; });
        this.queue = this.queue.concat(add);
        this.toast('success', 'Queued ' + add.length + ' issue' + (add.length === 1 ? '' : 's') + ' from ' + phaseKey);
      },
      queueMove: function (idx, dir) {
        var j = idx + dir;
        if (j < 0 || j >= this.queue.length) return;
        var moved = this.queue.slice();
        var row = moved.splice(idx, 1)[0]; moved.splice(j, 0, row);
        this.queue = moved;
      },
      queueRemove: function (slug) { this.queue = this.queue.filter(function (q) { return q.slug !== slug; }); },
      clearQueue: function () { if (!this.queue.length) return; this.queue = []; this.toast('success', 'Queue cleared'); },
      toggleQueue: function (slug) {
        var f = this.findings.find(function (x) { return x.slug === slug; });
        if (this.isQueued(slug)) { this.queueRemove(slug); this.toast('info', slug + ' removed from queue'); }
        else { this.queue = this.queue.concat([{ slug: slug, title: f ? f.title : slug, severity: f ? f.severity : 'medium', status: f ? f.status : 'open', effort: f ? f.effort : 'M' }]); this.toast('success', 'Queued for sprint'); }
      },
      queueRowAction: function (f) {
        if (f.workflow === 'VALID' && !this.isQueued(f.slug)) { this.toggleQueue(f.slug); this.go('mission'); return; }
        this.toggleQueue(f.slug);
      },

      /* ===================== DISPATCH / PREFLIGHT (stubbed) ===================== */
      dispatchMission: function () {
        if (!this.queue.length) { this.toast('info', 'Queue is empty — nothing to dispatch'); return; }
        this.preflight = {
          queue_size: this.queue.length,
          included: this.queue.map(function (q) { return { slug: q.slug, title: q.title, severity: q.severity, status: q.status, effort: q.effort }; }),
          conflicts: [],
          within: [],
        };
        this.preflightOpen = true;
      },
      confirmDispatch: function () {
        if (this.dispatching) return;
        this.dispatching = true;
        var self = this;
        setTimeout(function () {
          self.dispatching = false;
          self.preflightOpen = false;
          self.preflight = null;
          self.dispatchReasoningOverride = ''; self.dispatchBulkEffort = 'high'; self.dispatchVerifyEffort = 'xhigh';
          self.toast('info', 'Demo build — no worker dispatched');
        }, 250);
      },
      cancelPreflight: function () { this.preflightOpen = false; this.preflight = null; this.dispatchReasoningOverride = ''; this.dispatchBulkEffort = 'high'; this.dispatchVerifyEffort = 'xhigh'; },

      // effort → reasoning/model preview (ported getters)
      get dispatchEffort() {
        var order = { S: 0, M: 1, L: 2, XL: 3 }, worst = -1;
        for (var i = 0; i < this.queue.length; i++) { var v = order[this.queue[i].effort]; if (v != null && v > worst) worst = v; }
        if (worst < 0) return this.queue.length ? 'M' : null;
        return ['S', 'M', 'L', 'XL'][worst];
      },
      get dispatchBand() { return ({ S: 'Minor', M: 'Moderate', L: 'Significant', XL: 'Major' })[this.dispatchEffort] || '—'; },
      get dispatchReasoning() { return ({ Minor: 'Medium', Moderate: 'High', Significant: 'Extra', Major: 'Ultracode' })[this.dispatchBand] || 'High'; },
      get dispatchModel() { return ({ Minor: 'Opus 4.8', Moderate: 'Opus 4.8', Significant: 'Opus 4.8', Major: 'Opus 4.8' })[this.dispatchBand] || 'Opus 4.8'; },
      get showTierSplit() { return (this.dispatchReasoningOverride || this.dispatchReasoning) === 'Ultracode'; },
      reactClass: function (reasoning) { return ({ Medium: 'react-medium', High: 'react-high', Extra: 'react-extra', Ultracode: 'react-ultra' })[reasoning] || 'react-high'; },

      /* ===================== MISSIONS ===================== */
      get activeMissions() {
        var a = { orchestrating: 1, dispatched: 1, in_progress: 1, running: 1, blocked: 1, debugging: 1 };
        return this.missions.filter(function (m) { return a[m.status]; });
      },
      get missionsSorted() {
        var active = [], terminal = [];
        for (var i = 0; i < this.missions.length; i++) {
          var m = this.missions[i];
          (m.status === 'aborted' || m.status === 'done' ? terminal : active).push(m);
        }
        function ts(m) { return Date.parse(m.dispatched_at || m.created_at || 0) || 0; }
        active.sort(function (a, b) { return ts(b) - ts(a); });
        terminal.sort(function (a, b) { return ts(b) - ts(a); });
        return active.concat(terminal);
      },
      get cockpitMission() { var self = this; return this.missions.find(function (m) { return m.key === self.cockpitKey; }) || {}; },

      ls: function (key) { return this.missionState[key] || this._defaultLiveState; },
      isMissionOpen: function (key) { return !!this.openMissions[key]; },
      toggleMission: function (key) { var o = {}; for (var kk in this.openMissions) o[kk] = this.openMissions[kk]; o[key] = !this.openMissions[key]; this.openMissions = o; },

      // freshness-gated liveness (pinned to NG_DATA.NOW so the demo is stable)
      missionFresh: function (ls) { if (!ls || !ls.updated_at) return false; var t = Date.parse(ls.updated_at); return !isNaN(t) && (NOW_MS - t) < MISSION_STALE_MS; },
      missionLive: function (ls) { return !!(ls && ls.worker_online) && this.missionFresh(ls); },
      missionStale: function (ls) { return !!(ls && ls.worker_online) && !this.missionFresh(ls); },
      missionLocked: function (m) { return !!m && m.status === 'done'; },

      lifecycleStageKey: function (ls) { return LIFECYCLE_STAGE[(ls && ls.lifecycle) || 'queued'] || 'queued'; },
      lifecycleLabel: function (ls) { var s = this.lifecycleStageKey(ls); return (STAGE_PRESENT[s] || STAGE_PRESENT.queued).label; },
      lifecycleIcon: function (ls) { var s = this.lifecycleStageKey(ls); return (STAGE_PRESENT[s] || STAGE_PRESENT.queued).icon; },
      lifecycleActive: function (ls) { var lc = (ls && ls.lifecycle) || 'queued'; return ls && ls.worker_online && ['queued', 'resolved', 'aborted'].indexOf(lc) < 0; },
      stageToLifecycle: function (stage) { return ({ implement: 'implementing', build: 'building', deploy: 'deploying', smoke: 'smoke', debug: 'debugging', resolve: 'resolved' })[stage] || 'implementing'; },

      missionBadge: function (status) {
        return ({ queued: 'badge-info', orchestrating: 'badge-violet', dispatched: 'badge-violet', in_progress: 'badge-violet', running: 'badge-violet', debugging: 'badge-danger', blocked: 'badge-warning', review: 'badge-warning', resolved: 'badge-success', done: 'badge-success-strong', aborted: 'badge-neutral' })[status] || 'badge-neutral';
      },
      missionLabel: function (status) {
        return ({ queued: 'Queued', orchestrating: 'Orchestrating', dispatched: 'Dispatched', in_progress: 'In progress', running: 'Running', debugging: 'Debugging', blocked: 'Blocked', review: 'Needs Review', resolved: 'Resolved', done: 'Done', aborted: 'Aborted' })[status] || status;
      },
      missionItemBadge: function (status) { return ({ planned: 'badge-info', in_progress: 'badge-violet', done: 'badge-success', removed: 'badge-neutral' })[status] || 'badge-neutral'; },
      missionItemLabel: function (status) { return ({ planned: 'Planned', in_progress: 'Working', done: 'Done', removed: 'Removed' })[status] || status; },

      // ONE derived status pill + recommended actions (ported verbatim, adjusted to this.*)
      missionView: function (m, ctx) {
        var key = m && m.key;
        var status = m && m.status;
        var ls = this.ls(key);
        var spin = !!(key && this.spawning[key]);
        var isCockpit = ctx === 'cockpit';
        var online = !!(ls && ls.worker_online);
        var live = this.missionLive(ls);
        var stale = this.missionStale(ls);
        var approval = ls && ls.approval_pending;
        var rwait = ls && ls.resource_wait;
        var reopened = ls && ls.reopened;
        var needsAttn = ls && ls.needs_attention;
        var plan = ls && ls.plan;
        var blockers = ls && ls.blockers;
        var hasBlockers = !!(blockers && blockers.length);
        var sessionId = ls && ls.session_id;
        var retries = (ls && ls.retries) || 0;

        var code, label, icon, pillClass;
        if (status === 'aborted') { code = 'aborted'; label = 'Aborted'; icon = 'ph-prohibit'; pillClass = 'sp-dead'; }
        else if (status === 'done') { code = 'done'; label = 'Done'; icon = 'ph-check-circle'; pillClass = 'sp-ok'; }
        else if (status === 'resolved' && !online) { code = 'resolved'; label = 'Resolved'; icon = 'ph-check-circle'; pillClass = 'sp-ok'; }
        else if (online && !this.missionFresh(ls)) { code = 'stalled'; label = 'Stalled'; icon = 'ph-warning'; pillClass = 'sp-warn'; }
        else if (online && approval) { code = 'approval'; label = 'Needs approval'; icon = 'ph-hand-palm'; pillClass = 'sp-warn'; }
        else if (online && rwait) { code = 'waiting'; label = 'Waiting · ' + (rwait.resource || ''); icon = 'ph-hourglass-medium'; pillClass = 'sp-warn'; }
        else if (online) { code = 'live'; label = this.lifecycleLabel(ls); icon = this.lifecycleIcon(ls); pillClass = 'sp-live'; }
        else if (reopened) { code = 'reopened'; label = 'Reopened'; icon = 'ph-lock-key-open'; pillClass = 'sp-warn'; }
        else if (needsAttn) { code = 'needs_attention'; label = 'Needs attention'; icon = 'ph-bell-ringing'; pillClass = 'sp-warn'; }
        else if (plan) { code = 'plan'; label = 'Plan ready'; icon = 'ph-list-checks'; pillClass = 'sp-info'; }
        else if (hasBlockers || status === 'blocked') { code = 'blocked'; label = 'Blocked'; icon = 'ph-warning-octagon'; pillClass = 'sp-warn'; }
        else if (sessionId) { code = 'paused'; label = 'Paused'; icon = 'ph-pause'; pillClass = 'sp-neutral'; }
        else if (retries > 0) { code = 'stalled_retry'; label = 'Stalled ×' + retries; icon = 'ph-arrows-clockwise'; pillClass = 'sp-warn'; }
        else { code = status || 'queued'; label = this.missionLabel(status); icon = status === 'review' ? 'ph-eye' : 'ph-circle'; pillClass = status === 'queued' ? 'sp-info' : (status === 'review' ? 'sp-warn' : 'sp-neutral'); }

        var primary;
        if (status === 'aborted') primary = null;
        else if (this.missionLocked(m)) primary = { verb: 'Reopen…', icon: 'ph-lock-key-open', act: 'openReopen' };
        else if (online) {
          primary = isCockpit
            ? { verb: 'Stop', icon: 'ph-stop-circle', act: 'stopMission', disabled: spin }
            : { verb: 'Steer', icon: 'ph-broadcast', act: 'openCockpit' };
        } else {
          var p;
          if (reopened) p = sessionId ? { verb: 'Relaunch', icon: 'ph-arrow-clockwise', act: 'resumeMission' } : { verb: 'Spawn', icon: 'ph-play-circle', act: 'spawnMission' };
          else if (sessionId) p = { verb: 'Resume', icon: 'ph-arrow-clockwise', act: 'resumeMission' };
          else if (plan) p = { verb: 'Dispatch Plan', icon: 'ph-play', act: 'dispatchPlan' };
          else p = { verb: 'Spawn', icon: 'ph-play-circle', act: 'spawnMission' };
          p.disabled = spin;
          primary = p;
        }

        var secondary = null;
        if (!isCockpit) {
          if (primary && primary.act === 'openCockpit') secondary = { verb: 'Stop', icon: 'ph-stop-circle', act: 'stopMission', disabled: spin };
          else secondary = { verb: 'Cockpit', icon: 'ph-broadcast', act: 'openCockpit' };
        }

        var headAction = null;
        if (!isCockpit) {
          if (approval) headAction = { verb: 'Review', icon: 'ph-hand-palm', act: 'openCockpit' };
          else if (live || stale || needsAttn || reopened) headAction = { verb: 'Steer', icon: 'ph-broadcast', act: 'openCockpit' };
        }

        var overflow = [];
        var canAbort = ['done', 'aborted'].indexOf(status) < 0;
        if (status !== 'aborted' && status !== 'done') {
          if (!online) {
            if (sessionId && (!primary || primary.act !== 'resumeMission')) overflow.push({ verb: 'Resume', icon: 'ph-arrow-clockwise', act: 'resumeMission', disabled: spin });
            if (!primary || primary.act !== 'spawnMission') overflow.push({ verb: 'Spawn fresh', icon: 'ph-play-circle', act: 'spawnMission', disabled: spin });
            if (plan && (!primary || primary.act !== 'dispatchPlan')) overflow.push({ verb: 'Dispatch Plan', icon: 'ph-play', act: 'dispatchPlan', disabled: spin });
            overflow.push({ verb: plan ? 'Re-plan' : 'Plan', icon: 'ph-list-checks', act: 'planMission', disabled: spin });
          } else if (stale) {
            if (sessionId) overflow.push({ verb: 'Resume', icon: 'ph-arrow-clockwise', act: 'resumeMission', disabled: spin });
            overflow.push({ verb: 'Spawn fresh', icon: 'ph-play-circle', act: 'spawnMission', disabled: spin });
            overflow.push({ verb: 'Re-plan', icon: 'ph-list-checks', act: 'planMission', disabled: spin });
          }
          if (canAbort) overflow.push({ verb: 'Abort', icon: 'ph-prohibit', act: 'abortMission', danger: true, disabled: spin });
        }

        return { code: code, label: label, icon: icon, pillClass: pillClass, live: live, stale: stale, headAction: headAction, primary: primary, secondary: secondary, overflow: overflow, showGate: !!approval };
      },

      // generic (key)->method dispatcher for the derived buttons (all stubbed but present)
      act: function (name, key) { if (name && typeof this[name] === 'function') this[name](key); },

      // ---- mission side-effects (stubbed to toast + benign local change) ----
      spawnMission: function (key) { this.spawning = Object.assign({}, this.spawning, {}); this.toast('info', 'Demo build — no worker spawned (' + key + ')'); },
      resumeMission: function (key) { this.toast('info', 'Resume stubbed (demo) · ' + key); },
      dispatchPlan: function (key) { this.toast('info', 'Dispatch plan stubbed (demo) · ' + key); },
      planMission: function (key) { this.toast('info', 'Planner stubbed (demo) · ' + key); this.openCockpit(key); },
      stopMission: function (key) { this.toast('warning', 'Stop stubbed (demo) · ' + key); },
      abortMission: function (key) { this.toast('warning', 'Abort stubbed (demo) · ' + key); },
      steerMission: function (key) {
        var body = (this.steerDraft || '').trim();
        if (!body) return;
        var arr = (this.missionMessages[key] || []).concat([{ id: 'local-' + Date.now(), ts: new Date().toISOString(), role: 'user', body: body }]);
        this.missionMessages = Object.assign({}, this.missionMessages, {}); this.missionMessages[key] = arr.slice(-200);
        this.steerDraft = '';
        this.toast('info', 'Steering is stubbed in this static demo');
        if (this.convoFollow) this.scrollConvo(key);
      },
      approveGate: function (key, gateId, decision) {
        var prev = this.missionState[key];
        if (prev) { var next = Object.assign({}, this.missionState); next[key] = Object.assign({}, prev, { approval_pending: null }); this.missionState = next; }
        this.toast(decision === 'allow' ? 'success' : 'warning', 'Gate ' + (decision || 'handled') + ' (demo)');
      },
      openReopen: function (key) { this.reopenModal = { show: true, key: key, reason: '', loading: false }; },
      submitReopen: function () {
        var reason = (this.reopenModal.reason || '').trim();
        if (!reason) return;
        this.reopenModal = { show: false, key: null, reason: '', loading: false };
        this.toast('info', 'Reopen stubbed (demo)');
      },

      /* ===================== COCKPIT ===================== */
      openCockpit: function (key) {
        this.cockpitKey = key;
        this.steerDraft = '';
        var self = this;
        setTimeout(function () { self.scrollConvo(key); }, 60);
      },
      closeCockpit: function () { this.cockpitKey = null; },
      toggleConvo: function (key) { var o = {}; for (var kk in this.convoOpen) o[kk] = this.convoOpen[kk]; o[key] = !this.convoOpen[key]; this.convoOpen = o; },
      scrollConvo: function () { setTimeout(function () { var el = document.querySelector('.cockpit-modal .cc-rows'); if (el) el.scrollTop = el.scrollHeight; }, 30); },
      copyTranscript: function (key) {
        var lines = (this.missionMessages[key] || []).map(function (m) { return '[' + m.role + '] ' + (m.body || ''); });
        this.copyText(lines.join('\n'));
      },
      copyText: function (text) {
        if (!text) return;
        try { if (navigator.clipboard) navigator.clipboard.writeText(text); this.toast('success', 'Copied'); }
        catch (e) { this.toast('error', 'Copy failed'); }
      },

      // conversation transcript rows
      msgPayload: function (msg) {
        var p = msg && msg.json_payload;
        if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = null; } }
        return (p && typeof p === 'object') ? p : null;
      },
      toolFamily: function (msg) {
        var p = this.msgPayload(msg);
        var name = (p && (p.name || p.tool_name)) || '';
        if (/^(Edit|Write|MultiEdit|edit)$/.test(name)) return 'edit';
        if (/^(Bash|bash)$/.test(name)) return 'bash';
        if (/^(Read|Grep|Glob|read)$/.test(name)) return 'read';
        if (/SurfaceMCP|surface/.test(name)) return 'surface';
        if (/tracker/.test(name)) return 'tracker';
        return name || 'bash';
      },
      resultErr: function (msg) { var p = this.msgPayload(msg); return !!(p && p.is_error); },
      _convoRow: function (msg) {
        var r = msg.role;
        if (r === 'user') return { cls: 'cr-text', badge: 'U', user: true, body: msg.body };
        if (r === 'assistant_thinking') return { cls: 'cr-think', icon: 'ph-brain', body: this.truncate(msg.body, 160) };
        if (r === 'tool_use') return { cls: 'cr-tool', icon: 'crt-glyph ' + this.familyIcon(this.toolFamily(msg)), cmd: msg.body };
        if (r === 'tool_result') return { cls: 'cr-result' + (this.resultErr(msg) ? ' err' : ''), icon: 'ph-corner-down-right', body: this.truncate(msg.body, 140) };
        if (r === 'assistant') return { cls: 'cr-text', badge: 'A', ai: true, body: msg.body };
        return { cls: 'cr-text', badge: r, body: msg.body };
      },
      get convoRows() {
        var msgs = this.missionMessages[this.cockpitKey] || [];
        var self = this;
        return msgs.map(function (msg, i) { return Object.assign({ key: (msg.id != null ? msg.id : ('m' + i)) }, self._convoRow(msg)); });
      },

      blockerReason: function (ls) {
        var b = ls && ls.blockers;
        if (!b || !b.length) return 'No blockers';
        return b.map(function (x) { return typeof x === 'string' ? x : (x.reason || '?'); }).join(' · ');
      },
      triadState: function (ls, which) { return (ls && ls.triad && ls.triad[which] && ls.triad[which].state) || 'idle'; },
      triadIcon: function (ls, which, base) {
        var s = this.triadState(ls, which);
        if (s === 'running') return 'ph-circle-notch';
        if (s === 'pass') return 'ph-check-circle';
        if (s === 'fail') return 'ph-x-circle';
        return base;
      },

      // cost gauge (270° arc, pathLength=100)
      costArc: function (ls) {
        var cost = (ls && ls.cost_usd) || 0;
        var ceil = (ls && ls.max_budget_usd) || 60;
        var frac = Math.max(0, Math.min(1, cost / ceil));
        var filled = (frac * 100).toFixed(1);
        return filled + ' ' + (100 - filled).toFixed(1);
      },
      cacheArc: function (ls) {
        var tk = (ls && ls.tokens) || {};
        var tot = (tk.input || 0) + (tk.output || 0) + (tk.cache_read || 0);
        if (!tot) return '0 100';
        var frac = Math.max(0, Math.min(1, (tk.cache_read || 0) / tot)) * 0.6;
        var filled = (frac * 100).toFixed(1);
        return filled + ' ' + (100 - filled).toFixed(1);
      },

      // lifecycle stepper nodes with hardcoded coords + per-node state colours
      _stepperFailed: function (ls) {
        if (!ls) return false;
        var t = ls.triad || {};
        var deployed = (ls.stage_history || []).indexOf('deploy') >= 0 || (t.deploy && t.deploy.state !== 'idle');
        return ((t.smoke && t.smoke.state === 'fail') || (t.deploy && t.deploy.state === 'fail')) && deployed;
      },
      stepperNodes: function (ls) {
        var hist = (ls && ls.stage_history) || [];
        var reachedSet = {}; for (var i = 0; i < hist.length; i++) reachedSet[hist[i]] = 1;
        var curStage = this.lifecycleStageKey(ls);
        var curRank = STAGE_RANK[curStage] !== undefined ? STAGE_RANK[curStage] : -1;
        var failed = this._stepperFailed(ls);
        return STEPPER_DEF.map(function (n) {
          var reached = !!reachedSet[n.stage] || (STAGE_RANK[n.stage] !== undefined && STAGE_RANK[n.stage] <= curRank && curRank >= 0);
          var isCurrent = n.stage === curStage;
          var stroke = '#20204a', fill = '#0e0e20';
          if (reached) { stroke = STAGE_PRESENT[n.stage].color; fill = 'rgba(0,224,255,0.05)'; }
          if (isCurrent && failed) { stroke = '#ff3b5c'; fill = 'rgba(255,59,92,0.08)'; }
          else if (isCurrent) { stroke = STAGE_PRESENT[n.stage].color; fill = 'rgba(0,224,255,0.1)'; }
          return { stage: n.stage, short: n.short, x: n.x, y: n.y, reached: reached, stroke: stroke, fill: fill };
        });
      },
      stepperSegments: function (ls) {
        var nodes = this.stepperNodes(ls);
        var segs = [];
        var self = this;
        var chain = [0, 1, 2, 3];
        for (var i = 0; i < chain.length - 1; i++) {
          var a = nodes[chain[i]], b = nodes[chain[i + 1]];
          var ax = a.x + 44, ay = a.y + 15, bx = b.x, by = b.y + 15;
          var midx = (ax + bx) / 2;
          segs.push({ points: ax + ',' + ay + ' ' + midx + ',' + ay + ' ' + midx + ',' + by + ' ' + bx + ',' + by, color: b.reached ? STAGE_PRESENT[b.stage].color : '#20204a', active: b.reached && self.lifecycleStageKey(ls) === b.stage });
        }
        var smoke = nodes[3], debug = nodes[4], resolve = nodes[5];
        (function () {
          var ax = smoke.x + 44, ay = smoke.y + 15, bx = debug.x, by = debug.y + 15;
          var midx = (ax + bx) / 2;
          var failed = self._stepperFailed(ls);
          segs.push({ points: ax + ',' + ay + ' ' + midx + ',' + ay + ' ' + midx + ',' + by + ' ' + bx + ',' + by, color: failed ? '#ff3b5c' : '#20204a', active: failed });
        })();
        (function () {
          var ax = smoke.x + 44, ay = smoke.y + 15, bx = resolve.x, by = resolve.y + 15;
          var midx = (ax + bx) / 2;
          var reached = resolve.reached;
          segs.push({ points: ax + ',' + ay + ' ' + midx + ',' + ay + ' ' + midx + ',' + by + ' ' + bx + ',' + by, color: reached ? STAGE_PRESENT.resolve.color : '#20204a', active: reached && self.lifecycleStageKey(ls) === 'resolve' });
        })();
        return segs;
      },

      /* ===================== EVENT FEED ===================== */
      get eventsReversed() { return this.events.filter(function (e) { return !FEED_HIDDEN[e.kind]; }).slice().reverse(); },
      maybeOpenEvent: function (e) { if (e.kind === 'finding' || e.kind === 'comment') this.openIssue(e.ref); },

      /* ===================== DETAIL / RESOLVE MODALS ===================== */
      openDetail: function (idOrSlug) {
        var f = this.findings.find(function (x) { return String(x.id) === String(idOrSlug) || x.slug === idOrSlug; }) || null;
        this.detail = { show: !!f, loading: false, finding: f, history: [], comments: [], newComment: '', resolutionDraft: (f && f.resolution) || '', posting: false };
      },
      openIssue: function (idOrSlug) { return this.openDetail(idOrSlug); },
      closeDetail: function () { this.detail.show = false; },
      addComment: function () {
        var body = (this.detail.newComment || '').trim();
        if (!body || !this.detail.finding) return;
        this.detail.comments = this.detail.comments.concat([{ id: 'c-' + Date.now(), author: 'you', body: body, ts: new Date().toISOString() }]);
        this.detail.newComment = '';
        this.toast('info', 'Comment added locally (demo)');
      },
      detailStatus: function (status) { if (!this.detail.finding) return; this.detail.finding.status = status; this.toast('info', 'Status → ' + status + ' (demo)'); },
      detailPromptResolve: function (status) {
        var f = this.detail.finding; if (!f) return;
        this.resolveModal = { show: true, source: 'detail', status: status, id: f.id, slug: f.slug, title: f.title, resolution: this.detail.resolutionDraft || f.resolution || '', loading: false };
      },
      promptResolve: function (f, status) { this.resolveModal = { show: true, source: 'card', status: status || 'resolved', id: f.id, slug: f.slug, title: f.title, resolution: f.resolution || '', loading: false }; },
      submitResolve: function () {
        var m = this.resolveModal;
        var f = this.findings.find(function (x) { return x.id === m.id; });
        if (f) { f.status = m.status; if (m.resolution) f.resolution = m.resolution; }
        this.resolveModal.show = false;
        this.toast('info', 'Marked ' + m.status + ' (demo)');
      },
      quickStatus: function (f, status) { f.status = status; this.toast('info', f.slug + ' → ' + status + ' (demo)'); },

      // valid-transition descriptors from the current status (ported)
      findingStatusActions: function (f) {
        if (!f) return [];
        var A = {
          start:   { verb: 'Start',     icon: 'ph-play',                    tone: 'btn-violet',  target: 'in_progress', mode: 'instant' },
          resolve: { verb: 'Resolve',   icon: 'ph-check',                   tone: 'btn-success', target: 'resolved',    mode: 'modal' },
          verify:  { verb: 'Verify',    icon: 'ph-seal-check',              tone: 'btn-success', target: 'verified',    mode: 'modal' },
          wontfix: { verb: "Won't fix", icon: 'ph-prohibit',                tone: 'btn-warning', target: 'wont_fix',    mode: 'modal' },
          defer:   { verb: 'Defer',     icon: 'ph-clock',                   tone: 'btn-warning', target: 'deferred',    mode: 'instant' },
          reopen:  { verb: 'Reopen',    icon: 'ph-arrow-counter-clockwise', tone: 'btn-ghost',   target: 'open',        mode: 'instant' },
        };
        var table = {
          open: ['start', 'resolve', 'verify', 'wontfix', 'defer'],
          in_progress: ['resolve', 'verify', 'wontfix', 'defer', 'reopen'],
          deferred: ['start', 'resolve', 'wontfix', 'reopen'],
          resolved: ['verify', 'reopen'],
          verified: ['reopen'],
          wont_fix: ['reopen', 'resolve'],
        };
        var out = [];
        (table[f.status] || []).forEach(function (k) {
          if (k === 'start' && f.workflow === 'VALID') return;
          out.push(A[k]);
        });
        return out;
      },
      findingRowOverflow: function (f) {
        if (!f) return [];
        var terminal = ['resolved', 'verified', 'wont_fix'].indexOf(f.status) >= 0;
        return this.findingStatusActions(f).filter(function (it) { return !(terminal && it.target === 'open'); });
      },
      runFindingAction: function (f, item) { item.mode === 'modal' ? this.promptResolve(f, item.target) : this.quickStatus(f, item.target); },
      runDetailAction: function (item) { item.mode === 'modal' ? this.detailPromptResolve(item.target) : this.detailStatus(item.target); },

      /* ===================== EXPORT (client-side blob) ===================== */
      csvCell: function (v) { var s = (v === null || v === undefined) ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; },
      exportCsv: function () {
        var rows = this.baseFiltered;
        if (!rows.length) { this.toast('warning', 'Nothing to export'); return; }
        var cols = ['slug', 'phase', 'severity', 'status', 'subsystem', 'workflow', 'effort', 'risk', 'title', 'location'];
        var self = this;
        var lines = [cols.join(',')];
        rows.forEach(function (f) { lines.push(cols.map(function (c) { return self.csvCell(f[c]); }).join(',')); });
        try {
          var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url; a.download = 'neon-grid-issues-' + new Date().toISOString().slice(0, 10) + '.csv';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
          this.toast('success', 'Exported ' + rows.length + ' issues');
        } catch (e) { this.toast('error', 'Export failed'); }
      },

      /* ===================== HOME ASSISTANT NOTIFY (stubbed) ===================== */
      notifyEventLabel: function (v) { var e = NOTIFY_EVENT_CATALOG.find(function (x) { return x.value === v; }); return e ? e.label : v; },
      notifyEventIcon: function (v) { var e = NOTIFY_EVENT_CATALOG.find(function (x) { return x.value === v; }); return e ? e.icon : 'ph-lightning'; },
      saveNotifyConfig: function () { this.toast('success', 'Connection saved locally (demo)'); },
      toggleNotifyEnabled: function () { this.notify.enabled = !this.notify.enabled; this.toast('info', 'Notifications ' + (this.notify.enabled ? 'enabled' : 'disabled') + ' (demo)'); },
      clearNotifyToken: function () { this.notify.token_input = ''; this.notify.token_set = false; this.toast('warning', 'Token cleared locally (demo)'); },
      sendTestNotification: function () { this.toast('info', 'Test notification stubbed (demo)'); },

      openRuleModal: function (r) {
        if (r) {
          this.ruleModal = {
            show: true, saving: false, id: r.id,
            name: r.name || '', enabled: r.enabled !== false,
            events: Array.isArray(r.event_types) ? r.event_types.slice() : [],
            service: r.service || '',
            title_template: r.title_template || '', message_template: r.message_template || '',
            channel: r.channel || '', importance: r.importance || 'default', priority: r.priority || 'normal',
            ttl: (r.ttl === 0 || r.ttl) ? String(r.ttl) : '',
            persistent: !!r.persistent, sticky: !!r.sticky, tag: r.tag || '', color: r.color || '',
            actions: Array.isArray(r.actions) ? r.actions.map(function (a) { return { title: a.title || '', action: a.action || '', uri: a.uri || '' }; }) : [],
          };
        } else {
          this.ruleModal = Object.assign(makeDefaultRule(), { show: true });
        }
      },
      toggleRuleEvent: function (v) {
        var has = this.ruleModal.events.indexOf(v) >= 0;
        this.ruleModal.events = has ? this.ruleModal.events.filter(function (x) { return x !== v; }) : this.ruleModal.events.concat([v]);
      },
      insertPlaceholder: function (ph) { this.ruleModal.message_template = (this.ruleModal.message_template || '') + ph; },
      addRuleAction: function () { if (this.ruleModal.actions.length >= 3) return; this.ruleModal.actions = this.ruleModal.actions.concat([{ title: '', action: '', uri: '' }]); },
      removeRuleAction: function (i) { this.ruleModal.actions = this.ruleModal.actions.filter(function (_, idx) { return idx !== i; }); },
      saveRule: function () {
        if (!this.ruleModal.name) { this.toast('warning', 'Name the rule first'); return; }
        this.ruleModal.show = false;
        this.toast('success', (this.ruleModal.id ? 'Rule updated' : 'Rule created') + ' locally (demo)');
      },
      toggleRuleEnabled: function (r) { r.enabled = !r.enabled; this.toast('info', 'Rule ' + (r.enabled ? 'enabled' : 'disabled') + ' (demo)'); },
      confirmDeleteRule: function (r) { this.notify.rules = this.notify.rules.filter(function (x) { return x.id !== r.id; }); this.toast('warning', 'Rule deleted locally (demo)'); },
      testRule: function () { this.toast('info', 'Test send stubbed (demo)'); },
      testRuleDraft: function () { this.toast('info', 'Draft test send stubbed (demo)'); },
    };

    // ---- CORRECTION #1: copy HELPERS + GEOMETRY preserving accessors (NO spread) ----
    [HELPERS, GEOMETRY].forEach(function (src) {
      Object.getOwnPropertyNames(src).forEach(function (k) {
        Object.defineProperty(app, k, Object.getOwnPropertyDescriptor(src, k));
      });
    });

    return app;
  }

  // expose globally for petite-vue `v-scope="App()"`
  window.App = App;
})();
