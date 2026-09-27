import { createThemeController, navMarkup, signalMarkup, identityMarkup } from '../../packages/core/src/index.js';

const root = document.querySelector('.ng-theme');
const list = root.querySelector('#channel-list');
const navs = [...root.querySelectorAll('[data-ng-nav]')];
for (const nav of navs) {
  const content = document.createElement('span');
  content.className = 'nav-content';
  while (nav.firstChild) content.append(nav.firstChild);
  nav.append(content);
  const decoration = document.createElement('span');
  decoration.className = 'ng-decoration';
  decoration.innerHTML = navMarkup();
  nav.append(decoration);
}
root.querySelector('.mini-timeline').innerHTML = signalMarkup('vanilla-status');
root.querySelector('.identity-field').outerHTML = identityMarkup('vanilla-heading');
const controller = createThemeController(root);
const glow = root.querySelector('[data-ng-glow]');
const motion = root.querySelector('[data-ng-motion]');
const focus = root.querySelector('[data-ng-focus]');
let reading = false;
let lastGlow = 'balanced';
function sync() {
  controller.update({glow:glow.value, motion:motion.checked, focus:reading,
    paused:root.querySelector('#pause-button').getAttribute('aria-pressed') === 'true'});
  focus.setAttribute('aria-pressed',String(reading));
  focus.textContent = reading ? 'Exit focus mode' : 'Focus mode';
  navs.forEach(nav => nav.classList.contains('selected') ? nav.setAttribute('aria-current','page') : nav.removeAttribute('aria-current'));
}
root.addEventListener('ng:statechange', event => {
  root.querySelector('#motion-state').textContent = event.detail.ambient === 'running' ? 'Gentle motion · text stays still' : `Still accents · ${event.detail.reason.replaceAll('-',' ')}`;
});
function decoratePanels() {
  for (const panel of list.querySelectorAll('.channel-card')) {
    panel.setAttribute('data-ng-panel','');
    if (!panel.querySelector('[data-ng-arrival]')) {
      const field = document.createElement('span');
      field.className = 'arrival-field';
      field.setAttribute('data-ng-arrival','');
      field.setAttribute('aria-hidden','true');
      panel.append(field);
    }
  }
}
decoratePanels();
document.addEventListener('mockup:arrivals', event => {
  decoratePanels();
  sync();
  const arrivals = new Set(event.detail.callIds);
  for (const row of list.querySelectorAll('[data-call]')) if (arrivals.has(row.dataset.call)) controller.pulse(row.closest('[data-ng-panel]'));
});
document.addEventListener('click', event => { if (root.contains(event.target)) sync(); });
const observer = new MutationObserver(decoratePanels);
observer.observe(list,{childList:true});
focus.addEventListener('click', () => { reading = !reading; sync(); });
glow.addEventListener('change', () => {
  if (glow.value !== 'off') lastGlow = glow.value;
  root.querySelector('#glow').checked = glow.value !== 'off';
  sync();
});
motion.addEventListener('change',sync);
root.querySelector('#glow').addEventListener('change', event => {glow.value=event.target.checked?lastGlow:'off';sync();});
sync();
window.addEventListener('pagehide', event => { if (!event.persisted) {observer.disconnect();controller.destroy();} },{once:true});
