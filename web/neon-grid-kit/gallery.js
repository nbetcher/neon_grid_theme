import { createThemeController, navMarkup, signalMarkup, identityMarkup } from './packages/core/src/index.js';
const root = document.querySelector('.ng-theme');
for (const nav of root.querySelectorAll('[data-ng-nav]')) {
  const ornament = document.createElement('span'); ornament.className='ng-decoration'; ornament.innerHTML=navMarkup(); nav.append(ornament);
}
root.querySelector('.mini-timeline').innerHTML=signalMarkup('gallery-signal');
root.querySelector('#gallery-identity').innerHTML=identityMarkup('gallery-identity');
const controller=createThemeController(root);
let focus=false;
root.addEventListener('ng:statechange',event=>{root.querySelector('#gallery-state').textContent=event.detail.ambient==='running'?'Gentle motion · text stays still':`Still accents · ${event.detail.reason.replaceAll('-',' ')}`;});
root.querySelector('[data-ng-focus]').addEventListener('click',event=>{focus=!focus;controller.update({focus});event.currentTarget.setAttribute('aria-pressed',String(focus));event.currentTarget.textContent=focus?'Exit focus mode':'Focus mode';});
root.querySelector('[data-ng-glow]').addEventListener('change',event=>controller.update({glow:event.target.value}));
root.querySelector('[data-ng-motion]').addEventListener('change',event=>controller.update({motion:event.target.checked}));
window.addEventListener('pagehide',event=>{if(!event.persisted)controller.destroy();},{once:true});
