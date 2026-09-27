import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

assert.equal(typeof document, 'undefined', 'SSR check must run without a browser DOM');
const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({
  root,
  server: { middlewareMode: true, watch: null },
  appType: 'custom',
  logLevel: 'error'
});
try {
  // Load renderer and components through the same Vite module graph so they share
  // Svelte's SSR context rather than mixing optimized and direct Node runtimes.
  const { render } = await server.ssrLoadModule('svelte/server');
  const { default: Probe } = await server.ssrLoadModule('/src/SSRProbe.svelte');
  const first = render(Probe, { idPrefix: 'neon-ssr-' }).body;
  const second = render(Probe, { idPrefix: 'neon-ssr-' }).body;
  assert.equal(first, second, 'Rendering with the same prefix must be deterministic');
  assert.equal((first.match(/data-ambient="stopped"/g) ?? []).length, 2, 'Both theme roots must start still');
  assert.match(first, /data-glow="off"[^>]*data-reading="true"/, 'Non-default preferences must be represented in server markup');
  const ids = [...first.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(ids.length >= 6, 'The fixture must render multiple SVG definitions');
  assert.equal(new Set(ids).size, ids.length, 'Automatic decoration IDs must be unique across instances');
  assert.ok(ids.every((id) => /^[A-Za-z][A-Za-z0-9_-]*$/.test(id)), 'SVG IDs must satisfy the core prefix contract');
  for (const reference of first.matchAll(/url\(#([^\)]+)\)/g)) {
    assert.ok(ids.includes(reference[1]), `Missing SVG definition ${reference[1]}`);
  }
  console.log('Svelte SSR passed: no DOM, deterministic markup, stopped roots, preference props, unique linked SVG IDs.');
} finally {
  await server.close();
}
