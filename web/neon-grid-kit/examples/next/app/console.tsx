'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Identity, NavItem, Panel, Signal, Theme, type ThemeController, type ThemeOptions } from '@neon-grid/kit-react';

type Call = { id: number; time: string; text: string };
const initialCalls: Call[] = [
  { id: 1, time: '14:31:42', text: 'Dispatch, Unit 12. We are at the north entrance. The access road is clear.' },
  { id: 2, time: '14:32:18', text: 'Copy, Unit 12. Continue to the visitor center and check in with the site manager.' },
];
const fieldCall: Call = { id: 20, time: '14:30:56', text: 'Crew 4, the east trail is clear. Returning to the staging area now.' };
const framework = 'Next.js';

function Icon({ name = 'radio' }: { name?: 'radio' | 'clock' | 'search' | 'check' }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{name === 'clock'
    ? <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>
    : name === 'search' ? <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>
    : name === 'check' ? <path d="m5 12 4 4L19 6"/>
    : <><path d="M8 16a6 6 0 0 1 0-8m8 8a6 6 0 0 0 0-8M5 19a10 10 0 0 1 0-14m14 14a10 10 0 0 0 0-14"/><circle cx="12" cy="12" r="2"/><path d="M12 14v7"/></>}</svg>;
}

export default function App() {
  const [glow, setGlow] = useState<ThemeOptions['glow']>('balanced');
  const [focus, setFocus] = useState(false);
  const [motion, setMotion] = useState(true);
  const [view, setView] = useState<'live' | 'archive'>('live');
  const [query, setQuery] = useState('');
  const [calls, setCalls] = useState(initialCalls);
  const [sequence, setSequence] = useState(0);
  const [controller, setController] = useState<ThemeController | null>(null);
  const firstPanel = useRef<HTMLElement>(null);
  const shownCalls = view === 'live' ? calls.slice(-3) : calls;
  const matches = (name: string, lines: Call[]) => `${name} ${lines.map(line => line.text).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase());

  useEffect(() => {
    if (sequence && firstPanel.current) controller?.pulse(firstPanel.current);
  }, [sequence, controller]);

  function addCall() {
    const next = sequence + 1;
    const seconds = 14 * 3600 + 32 * 60 + 18 + next * 18;
    const time = [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60].map(part => String(part).padStart(2, '0')).join(':');
    setCalls(previous => [...previous, { id: next + 2, time, text: `Unit 12, update ${next}. Site manager contacted. The visitor center is open and everything is clear.` }].slice(-12));
    setSequence(next);
  }

  return <Theme glow={glow} motion={motion} focus={focus} onController={setController}>
    <a className="sr-only skip-link" href="#main">Skip to content</a>
    <aside className="sidebar">
      <a className="brand" href="#main"><span className="brand-icon"><Icon/></span><span>NEON<span className="brand-sub">GRID</span></span></a>
      <div className="workspace-label">VERDE VALLEY</div>
      <nav aria-label="Workspace views">
        <NavItem selected={view === 'live'} onClick={() => setView('live')}><Icon/>Live channels<span className="nav-dot"/></NavItem>
        <NavItem selected={view === 'archive'} onClick={() => setView('archive')}><Icon name="clock"/>Call archive</NavItem>
      </nav>
      <div className="sidebar-note"><div className="small-label">A LITTLE MORE CONTEXT</div><p>Every transmission has a place. Read the exchange without opening every call.</p><Signal id="next-signal"/></div>
      <div className="sidebar-bottom"><span className="avatar">NG</span><div>Neon Grid<span>Local operator console</span></div></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="breadcrumb">Workspace<span>/</span><strong>{view === 'live' ? 'Live channels' : 'Call archive'}</strong></div><div className="demo-label"><span/>{framework.toUpperCase()} TEMPLATE <b>Fictional radio traffic</b></div></header>
      <main id="main" tabIndex={-1}>
        <section className="preview-controls" aria-label="Theme preferences">
          <div><div className="study-label">NEON GRID // LIGHT &amp; MOTION</div><p>A little atmosphere. Room to read.</p><span className="study-state">{focus ? 'Focus mode · a quieter canvas' : 'Your workspace, at your pace'}</span></div>
          <div className="preview-options">
            <label>Glow <select data-ng-glow="" value={glow} onChange={event => setGlow(event.target.value as ThemeOptions['glow'])}><option value="subtle">Subtle</option><option value="balanced">Balanced</option><option value="off">Off</option></select></label>
            <label><input data-ng-motion="" type="checkbox" checked={motion} onChange={event => setMotion(event.target.checked)}/> Animated accents</label>
            <Button data-ng-focus="" aria-pressed={focus} onClick={() => setFocus(value => !value)}>{focus ? 'Exit focus mode' : 'Focus mode'}</Button>
          </div>
        </section>
        <div className="page-heading"><div><div className="eyebrow">VERDE VALLEY // THE CHANNEL, IN CONTEXT</div><h1>{view === 'live' ? 'Live' : 'Call'} <span className="title-outline">{view === 'live' ? 'channels' : 'archive'}</span><span className="title-dot">.</span></h1><p>{view === 'live' ? 'What’s being said, channel by channel. The latest words, with the exchange behind them.' : 'The calls behind the conversation. A small, fictional history to explore.'}</p></div>
          <Identity id="next-identity"/>
          <div className="heading-actions"><Button variant="primary" data-ng-demo-add="" onClick={addCall}><span>+</span> Add demo call</Button></div>
        </div>
        <div className="overview-line"><div><span className="status-dot"/><strong>3 sample channels</strong><span className="overview-separator">/</span><span>Local demonstration</span></div><span className="mono">Snapshot · {calls.at(-1)?.time} MST</span></div>
        <section className="toolbar" aria-label="Find sample text"><label className="search"><Icon name="search"/><input type="search" placeholder="Find a channel or phrase…" aria-label="Find a channel or phrase" value={query} onChange={event => setQuery(event.target.value)}/></label><div className="toolbar-options"><span className="study-state">{view === 'live' ? 'Newest three sample calls' : 'Last twelve sample calls'}</span></div></section>
        <div className="list-caption"><span>{view === 'live' ? '01 / CHANNEL READOUT' : '02 / SAMPLE HISTORY'}</span><span>Fictional text · kept in memory</span></div>
        <section aria-label={view === 'live' ? 'Recent speech by channel' : 'Sample call history'}>
          {matches('Valley dispatch', shownCalls) && <Panel ref={firstPanel} color="#00e0ff">
            <header className="channel-header"><div className="channel-identity"><span className="channel-number">01</span><h2>Valley dispatch</h2><span className="channel-frequency">CHANNEL A</span></div><div className="channel-actions"><span className="channel-status"><span className="status-dot"/>Latest sample</span></div></header>
            <div className="transmissions">{shownCalls.map((call, index) => <div key={call.id} className={`transmission ${index === shownCalls.length - 1 ? 'latest' : ''}`}><time>{call.time}</time><span className="transmission-text">{call.text}{index === shownCalls.length - 1 && <span className="latest-label">LATEST TEXT</span>}</span></div>)}</div>
            <div className="channel-meta"><div className="meta-left"><span>{shownCalls.length} transmissions shown</span><span className="dot-sep">·</span><span>Source call boundaries retained</span></div><span>{shownCalls.reduce((count, call) => count + call.text.length, 0)} chars</span></div>
          </Panel>}
          {matches('Field operations', [fieldCall]) && <Panel color="#b694ff">
            <header className="channel-header"><div className="channel-identity"><span className="channel-number">02</span><h2>Field operations</h2><span className="channel-frequency">CHANNEL B</span></div><div className="channel-actions"><span className="channel-status"><span className="status-dot"/>Earlier sample</span></div></header>
            <div className="transmissions"><div className="transmission latest"><time>{fieldCall.time}</time><span className="transmission-text">{fieldCall.text}<span className="latest-label">LATEST TEXT</span></span></div></div>
            <div className="channel-meta"><span>1 transmission shown</span><span>{fieldCall.text.length} chars</span></div>
          </Panel>}
          {matches('Community support', []) && <Panel color="#ff2daa" className="quiet">
            <header className="channel-header"><div className="channel-identity"><span className="channel-number">03</span><h2>Community support</h2><span className="channel-frequency">CHANNEL C</span></div><div className="channel-actions"><span className="channel-status quiet-status">No recent calls</span></div></header>
            <div className="quiet-message">A little quiet on this channel.<span>New words will appear here when a call is transcribed.</span></div>
            <div className="channel-meta"><span>No sample transmissions</span><span>0 chars</span></div>
          </Panel>}
          {!matches('Valley dispatch', shownCalls) && !matches('Field operations', [fieldCall]) && !matches('Community support', []) && <div className="empty-result">No sample channels or phrases match.</div>}
        </section>
        <footer className="page-footer"><span><Icon name="check"/>Original call boundaries preserved</span><span>{framework} · <b className="theme-credit">NEON GRID</b></span></footer>
        <div className="sr-only" role="status" aria-live="polite">{sequence ? `Sample call ${sequence} added to Valley dispatch.` : ''}</div>
      </main>
    </div>
  </Theme>;
}
