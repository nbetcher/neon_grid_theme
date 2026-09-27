import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Identity, NavItem, Signal, Theme } from '@neon-grid/kit-react';
import '@neon-grid/kit-core/theme.css';

function Harness() {
  const [mounted, setMounted] = useState(false);
  const [extra, setExtra] = useState(false);
  return <>
    <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 100 }}>
      <button id="mount" onClick={() => setMounted(value => !value)}>{mounted ? 'Unmount' : 'Mount'} theme</button>
      <button id="extra" onClick={() => setExtra(value => !value)}>Toggle extra navigation</button>
    </div>
    {mounted && <Theme><aside className="sidebar"><nav><NavItem selected>First</NavItem>{extra && <NavItem>Added later</NavItem>}</nav><Signal/><Signal/></aside><div className="workspace"><div className="page-heading"><Identity/><Identity/></div></div></Theme>}
  </>;
}

createRoot(document.getElementById('root')!, { identifierPrefix: 'lifecycle-' }).render(<StrictMode><Harness/></StrictMode>);
