import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const kit = fileURLToPath(new URL('../../..', import.meta.url));
const react = fileURLToPath(new URL('..', import.meta.url));
const next = fileURLToPath(new URL('../../next', import.meta.url));
const servers = [];
const failures = [];
function start(args, cwd) {
  const child = spawn(process.execPath, args, { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  servers.push(child);
  return { child, output: () => output };
}
async function ready(url, server) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.child.exitCode !== null) throw Error(server.output());
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw Error(`Server did not start: ${url}\n${server.output()}`);
}

let browser;
try {
  const vite = start([`${kit}/node_modules/vite/bin/vite.js`, '--host', '127.0.0.1', '--port', '4311', '--strictPort'], react);
  const nextServer = start([`${kit}/node_modules/next/dist/bin/next`, 'start', '--hostname', '127.0.0.1', '--port', '4314'], next);
  await Promise.all([ready('http://127.0.0.1:4311', vite), ready('http://127.0.0.1:4314', nextServer)]);
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });

  for (const [name, port] of [['React', 4311], ['Next', 4314]]) {
    if (name === 'Next') {
      const source = await (await fetch(`http://127.0.0.1:${port}`)).text();
      assert(source.includes('data-ambient="stopped"'), 'Next server output starts with stopped ambient motion');
      assert(source.includes('Valley dispatch'), 'Next server output contains native rendered content');
    }
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('.ng-theme')?.dataset.ambient === 'running');
    assert.equal(await page.locator('.channel-card').count(), 3);
    const text = await page.locator('.transmission-text').first().textContent();
    assert(text.includes('Dispatch'));
    const ids = await page.locator('[id]').evaluateAll(elements => elements.map(element => element.id));
    assert.equal(new Set(ids).size, ids.length, `${name} IDs are unique`);
    await page.locator('[data-ng-demo-add]').click();
    await page.getByText('Unit 12, update 1.', { exact: false }).waitFor();
    await page.waitForFunction(() => document.querySelector('[data-ng-arrival]')?.classList.contains('is-arriving'));
    await page.locator('[data-ng-focus]').click();
    assert.equal(await page.locator('.ng-theme').getAttribute('data-ambient'), 'stopped');
    await page.locator('[data-ng-focus]').click();
    await page.locator('[data-ng-motion]').uncheck();
    assert.equal(await page.locator('.ng-theme').getAttribute('data-ambient'), 'stopped');
    await page.locator('[data-ng-motion]').check();
    await page.locator('[data-ng-glow]').selectOption('off');
    assert.equal(await page.locator('.ng-theme').getAttribute('data-glow'), 'off');
    await page.locator('[data-ng-glow]').selectOption('balanced');
    await page.locator('[data-ng-nav]').nth(1).click();
    assert.equal(await page.locator('[data-ng-nav]').nth(1).getAttribute('aria-current'), 'page');
    assert.match(await page.locator('h1').textContent(), /Call archive/);
    await page.locator('[data-ng-nav]').first().click();
    await mkdir(`${react}/.verification`, { recursive: true });
    await page.screenshot({ path: `${react}/.verification/${name.toLowerCase()}-desktop.png`, fullPage: true });
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} overflows at ${width}px`);
    }
    await page.setViewportSize({ width: 1440, height: 1050 });
    console.log(`${name}: rendering, unique SVG IDs, preferences, arrival, navigation, and 5 responsive widths passed`);
  }

  await page.addInitScript(() => {
    const watched = new Set(['pointerover', 'pointerout', 'focusin', 'focusout', 'pointercancel', 'visibilitychange', 'pageshow', 'pagehide', 'change']);
    const registrations = [];
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function(type, callback, options) {
      if (watched.has(type) && !registrations.some(row => row.target === this && row.type === type && row.callback === callback && row.capture === !!(typeof options === 'boolean' ? options : options?.capture))) {
        registrations.push({ target: this, type, callback, capture: !!(typeof options === 'boolean' ? options : options?.capture) });
      }
      return add.call(this, type, callback, options);
    };
    EventTarget.prototype.removeEventListener = function(type, callback, options) {
      const index = registrations.findIndex(row => row.target === this && row.type === type && row.callback === callback && row.capture === !!(typeof options === 'boolean' ? options : options?.capture));
      if (index >= 0) registrations.splice(index, 1);
      return remove.call(this, type, callback, options);
    };
    const observers = new Map();
    const NativeObserver = MutationObserver;
    window.MutationObserver = class extends NativeObserver {
      observe(...args) { observers.set(this, { target: args[0] }); return super.observe(...args); }
      disconnect() { observers.delete(this); return super.disconnect(); }
    };
    window.lifecycleCounts = () => ({ listeners: registrations.length, observers: [...observers.values()].filter(row => row.target instanceof Element && row.target.matches('.ng-theme')).length });
  });
  await page.goto('http://127.0.0.1:4311/lifecycle-check.html', { waitUntil: 'networkidle' });
  const baseline = await page.evaluate(() => window.lifecycleCounts());
  await page.locator('#mount').click();
  await page.waitForFunction(() => document.querySelector('.ng-theme')?.dataset.ambient === 'running');
  const mounted = await page.evaluate(() => window.lifecycleCounts());
  assert.equal(mounted.listeners - baseline.listeners, 10, 'Strict Mode leaves exactly one controller listener set');
  assert.equal(mounted.observers - baseline.observers, 1, 'Strict Mode leaves exactly one controller observer');
  const fixtureIds = await page.locator('[id]').evaluateAll(elements => elements.map(element => element.id));
  assert.equal(new Set(fixtureIds).size, fixtureIds.length, 'Multiple default Signal/Identity IDs do not collide');
  await page.locator('#extra').click();
  await page.locator('[data-ng-nav]').nth(1).hover();
  assert.equal(await page.locator('[data-ng-nav]').nth(1).getAttribute('data-nav-state'), 'enter', 'Dynamically mounted NavItem inherits delegated hover');
  const retained = await page.locator('.ng-theme').elementHandle();
  await page.locator('#mount').click();
  assert.deepEqual(await page.evaluate(() => window.lifecycleCounts()), baseline, 'Unmount removes all controller listeners and observers');
  assert.equal(await retained.getAttribute('data-ambient'), 'stopped', 'Cleanup restores deterministic root attributes');
  await page.locator('#mount').click();
  await page.waitForFunction(() => document.querySelector('.ng-theme')?.dataset.ambient === 'running');
  await page.locator('#mount').click();
  assert.deepEqual(await page.evaluate(() => window.lifecycleCounts()), baseline, 'Repeated mounting does not accumulate resources');
  assert.deepEqual(failures, [], 'No browser errors or hydration warnings');
  console.log('React Strict Mode: single active controller, dynamic navigation, unique default decoration IDs, and complete unmount/remount cleanup passed');
} finally {
  await browser?.close();
  for (const child of servers) child.kill();
  await Promise.all(servers.map(child => child.exitCode !== null ? Promise.resolve() : new Promise(resolve => child.once('exit', resolve))));
}
