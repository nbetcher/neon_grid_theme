export { navMarkup, signalMarkup, identityMarkup } from './decorations.js';

const owners = new WeakMap();
const defaults = Object.freeze({ glow: 'balanced', motion: true, focus: false, paused: false });
function checked(options) {
  if (!['balanced', 'subtle', 'off'].includes(options.glow)) throw new TypeError('glow must be balanced, subtle, or off');
  for (const key of ['motion', 'focus', 'paused']) {
    if (typeof options[key] !== 'boolean') throw new TypeError(`${key} must be a boolean`);
  }
  return options;
}

/** Import-safe on the server; initialize after the root is mounted. */
export function createThemeController(root, initial = {}) {
  if (!root?.ownerDocument?.defaultView || !root.classList.contains('ng-theme')) {
    throw new TypeError('A mounted .ng-theme HTMLElement is required');
  }
  if (owners.has(root)) throw new Error('This theme root already has a controller');
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  let options = checked({ ...defaults, ...initial });
  let destroyed = false;
  let previousState = '';
  const attrs = ['data-glow', 'data-intensity', 'data-ambient', 'data-reading'];
  const original = new Map(attrs.map(name => [name, root.getAttribute(name)]));
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
  const contrast = win.matchMedia('(forced-colors: active)');
  const pointer = win.matchMedia('(hover: hover) and (pointer: fine)');
  const releases = [];
  const arrivals = new Map();
  const belongs = element => element?.closest('.ng-theme') === root;
  function listen(target, name, fn) {
    target.addEventListener(name, fn);
    releases.push(() => target.removeEventListener(name, fn));
  }
  function cancelArrivals() {
    for (const cleanup of [...arrivals.values()]) cleanup();
  }
  function sync() {
    if (destroyed) return;
    for (const [field, cleanup] of arrivals) if (!root.contains(field)) cleanup();
    const dialog = [...root.querySelectorAll('dialog[open]')].some(belongs);
    const reason = options.focus ? 'focus' : reduced.matches ? 'reduced-motion' : contrast.matches ? 'forced-colors' :
      !options.motion ? 'motion-off' : options.glow === 'off' ? 'glow-off' : options.paused ? 'paused' :
      doc.hidden ? 'hidden' : dialog ? 'dialog' : 'running';
    const ambient = reason === 'running' ? 'running' : 'stopped';
    root.dataset.glow = options.glow === 'off' ? 'off' : 'soft';
    root.dataset.intensity = options.glow === 'subtle' ? 'subtle' : 'balanced';
    root.dataset.reading = String(options.focus);
    root.dataset.ambient = ambient;
    if (ambient === 'stopped') {
      root.querySelectorAll('[data-ng-nav]').forEach(nav => { if (belongs(nav)) nav.dataset.navState = 'idle'; });
      cancelArrivals();
    }
    const detail = { ...options, ambient, reason };
    const serialized = JSON.stringify(detail);
    if (serialized !== previousState) {
      previousState = serialized;
      root.dispatchEvent(new win.CustomEvent('ng:statechange', { detail }));
    }
  }
  function navFor(event) {
    const nav = event.target instanceof win.Element ? event.target.closest('[data-ng-nav]') : null;
    return belongs(nav) ? nav : null;
  }
  function setNav(nav, state) {
    nav.dataset.navState = root.dataset.ambient === 'running' ? state : 'idle';
  }
  listen(root, 'pointerover', event => {
    const nav = navFor(event);
    if (nav && pointer.matches && !(event.relatedTarget instanceof win.Node && nav.contains(event.relatedTarget))) setNav(nav, 'enter');
  });
  listen(root, 'pointerout', event => {
    const nav = navFor(event);
    if (nav && pointer.matches && !nav.matches(':focus-visible') && !(event.relatedTarget instanceof win.Node && nav.contains(event.relatedTarget))) setNav(nav, 'leave');
  });
  listen(root, 'focusin', event => { const nav = navFor(event); if (nav?.matches(':focus-visible')) setNav(nav, 'enter'); });
  listen(root, 'focusout', event => { const nav = navFor(event); if (nav && !nav.matches(':hover')) setNav(nav, 'leave'); });
  listen(root, 'pointercancel', event => { const nav = navFor(event); if (nav) nav.dataset.navState = 'idle'; });
  listen(reduced, 'change', sync);
  listen(contrast, 'change', sync);
  listen(doc, 'visibilitychange', sync);
  listen(win, 'pageshow', sync);
  listen(win, 'pagehide', () => {
    root.dataset.ambient = 'stopped';
    cancelArrivals();
  });
  const observer = new win.MutationObserver(sync);
  observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['open'], childList: true });
  releases.push(() => observer.disconnect());
  const controller = {
    update(partial) {
      if (destroyed) return;
      options = checked({ ...options, ...partial });
      sync();
    },
    pulse(panel) {
      sync();
      if (destroyed || root.dataset.ambient !== 'running' || !belongs(panel) || !root.contains(panel)) return false;
      const field = panel.querySelector(':scope > [data-ng-arrival]');
      if (!field || !belongs(field)) return false;
      arrivals.get(field)?.();
      let animation;
      const cleanup = () => {
        if (arrivals.get(field) !== cleanup) return;
        arrivals.delete(field);
        field.classList.remove('is-arriving');
        animation?.cancel();
      };
      arrivals.set(field, cleanup);
      field.classList.remove('is-arriving');
      void field.offsetWidth;
      field.classList.add('is-arriving');
      animation = field.getAnimations().find(item => item.animationName === 'ng-power-on');
      if (!animation) { cleanup(); return false; }
      // Each promise belongs to one animation instance. A canceled older run
      // cannot clear a newer pulse on the same panel.
      animation.finished.then(cleanup, cleanup);
      return true;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelArrivals();
      releases.forEach(release => release());
      root.querySelectorAll('[data-ng-nav]').forEach(nav => { if (belongs(nav)) delete nav.dataset.navState; });
      for (const [name, value] of original) value === null ? root.removeAttribute(name) : root.setAttribute(name, value);
      owners.delete(root);
    }
  };
  owners.set(root, controller);
  sync();
  return controller;
}
