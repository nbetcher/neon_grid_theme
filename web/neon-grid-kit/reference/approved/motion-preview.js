/* Presentation-only enhancement. Uses the original mockup's fictional data.
   No storage, network, audio, or changes to real application state. */
(() => {
  'use strict';
  const root = document.documentElement;
  const motion = document.querySelector('#motion-preference');
  const focusButton = document.querySelector('#focus-mode');
  const glowSelect = document.querySelector('#glow-intensity');
  const glowCheck = document.querySelector('#glow');
  const state = document.querySelector('#motion-state');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const forcedColors = matchMedia('(forced-colors: active)');
  const list = document.querySelector('#channel-list');
  let reading = false;
  let lastIntensity = 'balanced';
  let priorCalls = new Set();

  // Optics move around a fixed icon, label and hit area.
  const navItems = Array.from(document.querySelectorAll('.sidebar .nav-item'));
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  for (const button of navItems) {
    const content = document.createElement('span');
    content.className = 'nav-content';
    while (button.firstChild) content.append(button.firstChild);
    button.append(content);
    const optics = document.createElement('span');
    optics.className = 'nav-optics';
    optics.setAttribute('aria-hidden', 'true');
    optics.innerHTML = '<span class="nav-sweep"></span>';
    button.append(optics);
    const frame = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    frame.setAttribute('viewBox', '0 0 170 44');
    frame.setAttribute('preserveAspectRatio', 'none');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('class', 'nav-frame');
    frame.innerHTML = '<path class="nav-circuit nav-circuit-left" pathLength="1" d="M85 1H11L1 11V33L11 43H85"/><path class="nav-circuit nav-circuit-right" pathLength="1" d="M85 1H159L169 11V33L159 43H85"/><path class="nav-lock" d="M5 17v10M165 17v10"/><path class="nav-runner" pathLength="1" d="M85 1H159L169 11V33L159 43H11L1 33V11L11 1Z"/>';
    button.append(frame);
    button.dataset.navState = 'idle';
    const engage = () => { button.dataset.navState = root.dataset.ambient === 'running' ? 'enter' : 'idle'; };
    const release = () => { button.dataset.navState = root.dataset.ambient === 'running' ? 'leave' : 'idle'; };
    button.addEventListener('pointerenter', () => { if (finePointer.matches) engage(); });
    button.addEventListener('pointerleave', () => { if (finePointer.matches && !button.matches(':focus-visible')) release(); });
    button.addEventListener('focus', () => { if (button.matches(':focus-visible')) engage(); });
    button.addEventListener('blur', () => { if (!button.matches(':hover')) release(); });
  }
  const signal = document.querySelector('.mini-timeline');
  signal.setAttribute('aria-hidden', 'true');
  signal.innerHTML = `<svg class="signal-sequence" viewBox="0 0 120 28" aria-hidden="true">
    <defs><linearGradient id="study-signal-colors" gradientUnits="userSpaceOnUse" x1="6" y1="14" x2="114" y2="14"><stop stop-color="#00e0ff"/><stop offset=".5" stop-color="#8a45ff"/><stop offset="1" stop-color="#ff2daa"/></linearGradient><linearGradient id="study-packet-forward" gradientUnits="userSpaceOnUse" x1="-10" y1="14" x2="6" y2="14"><stop stop-color="#00e0ff" stop-opacity="0"/><stop offset="1" stop-color="#e7fdff"/></linearGradient><linearGradient id="study-packet-return" gradientUnits="userSpaceOnUse" x1="114" y1="14" x2="130" y2="14"><stop stop-color="#fce7ff"/><stop offset="1" stop-color="#ff2daa" stop-opacity="0"/></linearGradient></defs>
    <path class="signal-track" d="M6 14H114"/>
    <g class="signal-packet signal-forward"><path d="M-10 14H6" stroke="url(#study-packet-forward)"/><circle cx="6" cy="14" r="1.6"/></g>
    <g class="signal-packet signal-return"><path d="M114 14H130" stroke="url(#study-packet-return)"/><circle cx="114" cy="14" r="1.6"/></g>
    <rect class="signal-node node-cyan" x="3" y="11" width="6" height="6"/>
    <rect class="signal-node node-violet" x="57" y="11" width="6" height="6"/>
    <rect class="signal-node node-magenta" x="111" y="11" width="6" height="6"/>
  </svg>`;
  function syncNavigation() {
    for (const button of navItems) {
      if (button.classList.contains('selected')) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
  }
  document.addEventListener('click', event => {
    if (event.target.closest('button[data-view]')) syncNavigation();
    // The original mockup handles these buttons before this bubbling listener.
    // Consume arrival eligibility now, even when a filter hides the new call.
    if (event.target.closest('#advance-button, #catch-up')) trackArrivals(true);
  });
  syncNavigation();

  function sync() {
    const modalOpen = Boolean(document.querySelector('dialog[open]'));
    const pausedView = document.querySelector('#pause-button').getAttribute('aria-pressed') === 'true';
    const stop = reading || !motion.checked || reduceMotion.matches || forcedColors.matches ||
      document.hidden || modalOpen || pausedView || root.dataset.glow === 'off';
    root.dataset.reading = String(reading);
    root.dataset.ambient = stop ? 'stopped' : 'running';
    if (stop) {
      for (const button of navItems) button.dataset.navState = 'idle';
      // A canceled arrival stays canceled; resuming never replays old traffic.
      list.querySelectorAll('.fresh-call').forEach(row => row.classList.remove('fresh-call'));
      list.querySelectorAll('.arrival-field').forEach(field => field.remove());
    }
    focusButton.setAttribute('aria-pressed', String(reading));
    focusButton.textContent = reading ? 'Exit focus mode' : 'Focus mode';
    state.textContent = reading ? 'Focus mode · steady light, no decorative motion' :
      reduceMotion.matches ? 'Reduced motion · following your device setting' :
      forcedColors.matches ? 'High contrast · following your device setting' :
      root.dataset.glow === 'off' ? 'Glow off · decorative motion stopped' :
      !motion.checked ? 'Still accents · glow remains on' :
      pausedView ? 'View paused · decorative motion stopped' :
      modalOpen ? 'Reading a call · ambient motion stopped' : 'Gentle motion · text stays still';
  }

  function trackArrivals(allowArrival = false) {
    sync();
    const current = Array.from(list.querySelectorAll('.transmission[data-call]'));
    const next = new Set(current.map(row => row.dataset.call));
    // Only explicit demo arrivals get a one-shot marker. Filter/reflow changes
    // and the initial render never animate existing records.
    for (const row of current) {
      if (allowArrival === true && root.dataset.ambient === 'running' && row.dataset.call.startsWith('DEMO-') && !priorCalls.has(row.dataset.call)) {
        row.classList.add('fresh-call');
        row.addEventListener('animationend', () => row.classList.remove('fresh-call'), {once: true});
        const card = row.closest('.channel-card');
        if (!card.querySelector('.arrival-field')) {
          const field = document.createElement('span');
          field.className = 'arrival-field';
          field.setAttribute('aria-hidden', 'true');
          card.append(field);
          field.addEventListener('animationend', () => field.remove(), {once: true});
        }
      }
    }
    for (const id of next) priorCalls.add(id);
  }

  focusButton.addEventListener('click', () => { reading = !reading; sync(); });
  glowSelect.addEventListener('change', () => {
    const value = glowSelect.value;
    if (value !== 'off') lastIntensity = value;
    root.dataset.intensity = value === 'off' ? lastIntensity : value;
    root.dataset.glow = value === 'off' ? 'off' : 'soft';
    glowCheck.checked = value !== 'off';
    sync();
  });
  glowCheck.addEventListener('change', () => {
    glowSelect.value = glowCheck.checked ? lastIntensity : 'off';
    root.dataset.intensity = lastIntensity;
    sync();
  });
  motion.addEventListener('change', sync);
  reduceMotion.addEventListener('change', sync);
  forcedColors.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  const observer = new MutationObserver(() => trackArrivals());
  observer.observe(list, {childList: true});
  const stateObserver = new MutationObserver(sync);
  stateObserver.observe(document.querySelector('#pause-button'), {attributes: true, attributeFilter: ['aria-pressed']});
  for (const dialog of document.querySelectorAll('dialog')) {
    stateObserver.observe(dialog, {attributes: true, attributeFilter: ['open']});
  }
  // Freeze the old theme's full-list entrance animation at CSS level. Neither
  // adding a call nor changing a preference changes text opacity or position.
  trackArrivals();
  window.addEventListener('pagehide', () => {
    root.dataset.ambient = 'stopped';
  });
  window.addEventListener('pageshow', sync);
})();
