/* Standalone design prototype. All traffic is fictional and stays in memory.
 * This demonstrates presentation, not the production context heuristic or ASR.
 * No network, storage, synthesized audio, or production endpoint is used. */
'use strict';
const $ = (selector) => document.querySelector(selector);
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chars = (text) => Array.from(text);
const stamp = (ms) => new Date(ms).toLocaleTimeString('en-GB', {timeZone:'America/Phoenix',hour12:false});
const span = (ms) => `${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`;
const epoch = Date.parse('2026-09-07T14:32:18-07:00');
let demoNow = epoch, displayedNow = epoch, paused = false, queued = 0, currentView = 'live', filter = 'all', selected = null, addition = 0;
const terms = ['State Route 89A', 'Mingus Avenue', 'Main Street', 'Engine 11', 'Medic 12', 'Unit 24', 'Unit 32', 'Unit 7', 'eastbound lane', 'lane is clear'];
const highlight = (text) => esc(text).replace(new RegExp(terms.join('|'), 'gi'), (match) => `<mark>${match}</mark>`);
const makeCall = (id, secondsAgo, text, duration = 8, state = 'processed') => ({id, start:epoch-secondsAgo*1000,text,duration,state});
const channels = [
  {id:'ycso-mingus',name:'YCSO · Mingus Mountain',frequency:'154.7400',color:'#00e0ff',window:90000,reason:'Busy channel · 1:30 floor',calls:[
    makeCall('YM-040',130,'Unit 24, continue eastbound. Caller advises the vehicle is just past the intersection.'),
    makeCall('YM-041',84,'Unit 24, check a disabled vehicle on State Route 89A near Mingus Avenue. Caller reports it is partly in the eastbound lane.',12),
    makeCall('YM-042',58,'Copy. Unit 24 en route from Main Street.',5),
    makeCall('YM-043',24,'I have the vehicle in sight. Moving it to the shoulder now. Stand by for a lane update.',9),
    makeCall('YM-044',10,'',6,'processing')
  ]},
  {id:'cpscc-fire-ems',name:'Fire & EMS · Dispatch',frequency:'154.0100',color:'#ff9500',window:250000,reason:'Widened · 4 nearby activity calls',calls:[
    makeCall('FE-111',235,'Engine 11, Medic 12, respond to a medical assist near Main Street. Caller is outside and will meet you at the entrance. No additional access information at this time.',15),
    makeCall('FE-112',200,'Engine 11 copies the medical assist on Main Street. Responding from station one, crew of three. We will advise when we arrive.',10),
    makeCall('FE-113',170,'Medic 12 is responding. Confirm the caller will be waiting outside at the main entrance.',7),
    makeCall('FE-114',110,'Affirmative, caller is outside the entrance. Engine 11 is approaching from the north.',7),
    makeCall('FE-115',46,'Engine 11 on scene. Patient contact made. Medic 12, use the south entrance.',8)
  ]},
  {id:'cottonwood-pd',name:'Cottonwood · Police',frequency:'154.8750',color:'#ff2daa',window:90000,reason:'Busy channel · 1:30 floor',calls:[
    makeCall('CP-071',83,'Unit 32, check the traffic signal at Main Street. Caller says it is flashing red in all directions.',10),
    makeCall('CP-072',61,'Copy, I am one block out.',4),
    makeCall('CP-073',32,'Confirmed, all directions flashing red. Traffic is moving. Request public works be notified.',9)
  ]},
  {id:'clarkdale-jerome-pd',name:'Clarkdale & Jerome · Police',frequency:'155.7225',color:'#b794ff',window:420000,reason:'Adaptive look-back · 7:00',calls:[
    makeCall('CJ-021',730,'Unit 7, clear of the traffic stop. Returning to patrol.',6)
  ]},
  {id:'camp-verde-p25',name:'Camp Verde · Marshal',frequency:'155.5125',color:'#a2b1b8',window:600000,reason:'Sample adaptive look-back · 10:00',digital:true,calls:[
    makeCall('CV-009',98,'',11,'unsupported')
  ]}
];
// Display is a derived projection of the original call objects. Two independent
// ceilings: start >= snapshot time - sample look-back, and <=500 text code points.
// A production response must reuse the core's computed window and provenance.
function projection(channel, now = displayedNow) {
  const eligible = channel.calls.filter(c => c.start >= now-channel.window && c.start <= now).sort((a,b)=>a.start-b.start || a.id.localeCompare(b.id));
  const excerpts = []; let remaining = 500, truncated = false;
  for (const call of [...eligible].reverse()) {
    if (!call.text || call.state !== 'processed') continue;
    const full = chars(call.text);
    if (!remaining) {truncated = true; continue;}
    let text = call.text, clipped = false;
    if (full.length > remaining) {
      text = full.slice(-remaining).join('');
      // Discard an incomplete first word. Do not add invented content to budget.
      if (full[full.length-remaining-1] && !/\s/.test(full[full.length-remaining-1])) {
        const space = text.search(/\s/); text = space >= 0 ? text.slice(space+1) : '';
      }
      clipped = true; truncated = true;
    }
    if(text) {excerpts.unshift({call,text,clipped});remaining -= chars(text).length;}
    if (clipped) break;
  }
  return {eligible,excerpts,count:500-remaining,truncated,pending:eligible.filter(c => c.state==='processing'),hasRecent:eligible.some(c=>c.text || c.state==='processing')};
}
function ago(start) {const seconds = Math.max(0,Math.round((displayedNow-start)/1000));return seconds<60?`${seconds}s ago`:`${Math.floor(seconds/60)}m ago`;}
function renderChannel(channel,index) {
  const p = projection(channel), last = [...channel.calls].filter(c=>c.start<=displayedNow).sort((a,b)=>b.start-a.start)[0];
  const status = channel.digital ? 'Text unavailable' : p.pending.length ? 'Transcribing' : p.hasRecent ? `Last call ${ago(last.start)}` : 'No recent calls';
  const heading = `<header class="channel-header"><div class="channel-identity"><span class="channel-number">${String(index+1).padStart(2,'0')}</span><h2>${esc(channel.name)}</h2><span class="channel-frequency">${channel.frequency} MHz</span></div><div class="channel-actions"><span class="channel-status ${!p.hasRecent?'quiet-status':''}"><span class="status-dot"></span>${status}</span><button class="text-link" data-open="${channel.id}">${p.hasRecent?'Read context':'Open history'} ${icon('arrow')}</button></div></header>`;
  let body;
  if (p.excerpts.length) {
    body = `<div class="transmissions">${p.excerpts.map((ex,i)=>`<button class="transmission ${i===p.excerpts.length-1?'latest':''}" data-open="${channel.id}" data-call="${ex.call.id}" aria-label="Open call at ${stamp(ex.call.start)} on ${esc(channel.name)}"><time>${stamp(ex.call.start)}</time><span class="transmission-text">${ex.clipped?'<span title="Earlier words are in the source call">… </span>':''}${highlight(ex.text)}${i===p.excerpts.length-1?'<span class="latest-label">LATEST TEXT</span>':''}</span></button>`).join('')}${p.pending.length?`<div class="pending-line"><span class="pending-indicator"><i></i><i></i><i></i></span>New call captured ${ago(p.pending.at(-1).start)} · transcript pending</div>`:''}</div>`;
  } else if (p.pending.length) {body = '<div class="quiet-message">A new call is being transcribed.<span>The words will appear here when ready.</span></div>';}
  else if (channel.digital) {body = '<div class="quiet-message">Digital capture received. No readable transcript.<span>Decoder support is needed to show what was said.</span></div>';}
  else {body = `<div class="quiet-message">No calls inside this channel’s ${span(channel.window)} look-back.<span>Last captured call ${last?ago(last.start):'not available'}. Earlier words are available in history.</span></div>`;}
  const meta = `<div class="channel-meta"><div class="meta-left"><span>${p.excerpts.length} ${p.excerpts.length===1?'transmission':'transmissions'} shown</span><span class="dot-sep">·</span><span title="${esc(channel.reason)}">${span(channel.window)} look-back</span>${p.truncated?'<span class="dot-sep">·</span><span>Earlier words in history</span>':''}</div><span>${p.count} / 500 chars</span></div>`;
  return `<article class="channel-card ${!p.hasRecent?'quiet':''}" data-channel="${channel.id}" style="--channel-color:${channel.color}">${heading}${body}${meta}</article>`;
}
function render() {
  const query = $('#search').value.toLowerCase().trim();
  const channelMatches = c => `${c.name} ${c.frequency}`.toLowerCase().includes(query);
  const shown = channels.filter(c => (!query || channelMatches(c) || (currentView==='live'
    ? projection(c).excerpts.some(x=>x.text.toLowerCase().includes(query))
    : c.calls.some(x=>x.start<=displayedNow && x.text.toLowerCase().includes(query)))) && (currentView==='archive'||filter==='all'||projection(c).hasRecent));
  $('#channel-list').innerHTML = shown.map(c=>renderChannel(c,channels.indexOf(c))).join('');
  const archiveCalls = shown.flatMap(channel=>channel.calls.filter(c=>c.start<=displayedNow && (!query || channelMatches(channel) || c.text.toLowerCase().includes(query))).map(call=>({channel,call}))).sort((a,b)=>b.call.start-a.call.start);
  $('#archive').innerHTML = archiveCalls.map(({channel,call})=>`<button class="archive-row" data-open="${channel.id}" data-call="${call.id}"><time>${stamp(call.start)}</time><strong>${esc(channel.name)}</strong><span>${call.text?highlight(call.text):`<span class="archive-state">${call.state==='processing'?'Transcript pending':'Digital capture · text unavailable'}</span>`}</span></button>`).join('');
  $('#empty').hidden = shown.length!==0;
  $('#recent-count').textContent = `${channels.filter(c=>projection(c).hasRecent).length} channels with recent calls`;
  $('#as-of').textContent = `${paused?'Paused at':'Snapshot'} · ${stamp(displayedNow)} MST`;
  $('#pending-count').textContent = queued;
  $('#pause-button').innerHTML = paused?`${icon('arrow')}Resume view`:`${icon('pause')}Pause view`;
  $('#pause-button').setAttribute('aria-pressed',String(paused));
  $('#paused-banner').hidden=!paused;
}
function openDetail(channelId,callId) {
  const channel=channels.find(c=>c.id===channelId);
  const p=projection(channel);
  const visible=channel.calls.filter(c=>c.start<=displayedNow).sort((a,b)=>a.start-b.start || a.id.localeCompare(b.id));
  const call=visible.find(c=>c.id===callId) || [...visible].reverse().find(c=>c.text) || visible.at(-1);
  selected={channelId,callId:call.id};
  const text=call.text?highlight(call.text):call.state==='processing'?'This call is still being transcribed.':'No transcript is available for this digital capture.';
  const rows = p.eligible.some(c=>c.id===call.id) ? p.eligible : visible.filter(c=>Math.abs(c.start-call.start)<=channel.window);
  $('.detail-content').innerHTML=`<div class="dialog-top"><span class="eyebrow">CALL AT A GLANCE</span><button class="icon-button" data-close="detail-dialog" aria-label="Close call detail">${icon('close')}</button></div><h2 id="detail-title">${esc(channel.name)}</h2><p class="detail-sub">${stamp(call.start)} MST · ${channel.frequency} MHz · ${esc(call.id)}</p><div class="small-label">${call.text?'EXACT TRANSCRIPT · SELECTED CALL':'TRANSCRIPT STATUS'}</div><blockquote class="detail-quote">${call.text?'“':''}${text}${call.text?'”':''}</blockquote><div class="quote-caption">${call.text?'Sample watch terms are highlighted. Speaker identity is not assigned.':'Capture and transcription are separate states.'}</div><div class="detail-facts"><div><span>DURATION</span>${call.duration} seconds</div><div><span>SOURCE</span>Original call ${esc(call.id)}</div><div><span>TEXT</span>${call.text?'Full transcript':call.state==='processing'?'Pending':'Unavailable'}</div></div><div class="audio-note">${icon('radio')}Audio is not included in this visual mockup.</div><div class="detail-section-head"><h3>The surrounding exchange</h3><span>${rows.length} calls · full words</span></div><p class="quote-caption">Nearby calls on this channel. A shared incident or speaker is not assumed.</p><div class="detail-timeline">${rows.map(c=>`<div class="detail-call ${c.id===call.id?'selected':''}"><time>${stamp(c.start)}</time><div class="detail-body"><p>${c.text?highlight(c.text):`<span class="muted">${c.state==='processing'?'Transcript pending…':'Digital capture · no transcript'}</span>`}</p><small>${esc(c.id)} · ${c.duration}s${c.id===call.id?' · SELECTED':''}</small>${c.id!==call.id?`<button data-open="${channel.id}" data-call="${c.id}">Focus this call</button>`:''}</div></div>`).join('')}</div><p class="quote-caption">Fictional demo traffic · This panel stays fixed while you read.</p>`;
  if(!$('#detail-dialog').open) $('#detail-dialog').showModal();
}
let pendingArrivalIds = [];
function announceArrivals(callIds) { document.dispatchEvent(new CustomEvent('mockup:arrivals',{detail:{callIds}})); }
function setPaused(next) {paused=next;const arrivals=paused?[]:pendingArrivalIds;if(!paused){displayedNow=demoNow;queued=0;pendingArrivalIds=[];}render();announceArrivals(arrivals);}
function addDemoCall() {
  demoNow+=18000; addition++;
  // Add a new immutable fixture call. Existing visible calls do not mutate while paused.
  const examples=[
    ['ycso-mingus','Unit 24, vehicle is on the shoulder. The eastbound lane is clear.'],
    ['cottonwood-pd','Public works has been notified. Unit 32 will remain at Main Street until they arrive.'],
    ['clarkdale-jerome-pd','Unit 7, starting a patrol check on Main Street.'],
    ['cpscc-fire-ems','Medic 12 on scene at the south entrance. We have patient contact.']
  ];
  const [id,text]=examples[(addition-1)%examples.length];
  channels.find(c=>c.id===id).calls.push({id:`DEMO-${String(addition).padStart(3,'0')}`,start:demoNow-3000,text,duration:3,state:'processed'});
  const callId=`DEMO-${String(addition).padStart(3,'0')}`;
  if(paused) {queued++;pendingArrivalIds.push(callId);} else displayedNow=demoNow;
  render();$('#announcement').textContent=paused?`${queued} demo updates waiting.`:'One demo transmission added. Sample time advanced 18 seconds.';
  if(!paused) announceArrivals([callId]);
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.open){openDetail(button.dataset.open,button.dataset.call);return;}
  if(button.dataset.close){$('#'+button.dataset.close).close();return;}
  if(button.dataset.filter){filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});render();}
  if(button.dataset.view){currentView=button.dataset.view;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b===button));$('#channel-list').hidden=currentView!=='live';$('#archive').hidden=currentView!=='archive';$('#budget-caption').hidden=currentView!=='live';$('.segmented').hidden=currentView!=='live';$('#search').placeholder=currentView==='live'?'Find a channel or phrase…':'Search call history…';const title=currentView==='live'?'Live channels':'Call archive';$('#page-title').innerHTML=(currentView==='live'?'Live <span class="title-outline">channels</span>':'Call <span class="title-outline">archive</span>')+'<span class="title-dot">.</span>';$('#breadcrumb-view').textContent=title;$('#page-description').textContent=currentView==='live'?'What’s being said, channel by channel. The latest words, with the exchange behind them.':'Every original transmission, including calls outside the live look-back.';$('#list-caption').textContent=currentView==='live'?'01 / CHANNEL READOUT':'02 / CALL ARCHIVE';render();}
});
$('#pause-button').addEventListener('click',()=>setPaused(!paused));
$('#catch-up').addEventListener('click',()=>setPaused(false));
$('#advance-button').addEventListener('click',addDemoCall);
$('#search').addEventListener('input',render);
$('#settings-button').addEventListener('click',()=>{const panel=$('#settings-panel');panel.hidden=!panel.hidden;$('#settings-button').setAttribute('aria-expanded',String(!panel.hidden));});
$('#glow').addEventListener('change',event=>document.querySelector('.ng-theme').dataset.glow=event.target.checked?'soft':'off');
$('#highlights').addEventListener('change',event=>document.querySelector('.ng-theme').classList.toggle('no-highlights',!event.target.checked));
$('#large-text').addEventListener('change',event=>document.querySelector('.ng-theme').style.setProperty('--transcript-size',event.target.checked?'18px':'var(--type-15, 15px)'));
for(const id of ['design-button','window-help']) $('#'+id).addEventListener('click',()=>$('#design-dialog').showModal());
document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)){event.preventDefault();$('#search').focus();}});
for(const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
render();
