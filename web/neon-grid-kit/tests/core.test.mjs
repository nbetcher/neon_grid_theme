import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import postcss from 'postcss';
import { navMarkup, signalMarkup, identityMarkup, createThemeController } from '../packages/core/src/index.js';

test('core imports without browser globals and rejects unmounted initialization',()=>{
  assert.equal(typeof window,'undefined');
  assert.throws(()=>createThemeController(null),/mounted/);
  assert.match(navMarkup(),/nav-runner/);
});
test('SVG references are local, unique and safe across instances',()=>{
  for(const render of [signalMarkup,identityMarkup]){
    const a=render('fixture-one'), b=render('fixture-two');
    const ids=[...a.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
    assert.ok(ids.length>0);
    assert.equal(new Set(ids).size,ids.length);
    for(const match of a.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.includes(match[1]),match[1]);
    for(const id of ids)assert.ok(!b.includes(`id="${id}"`));
    for(const invalid of ['', 'a b','" onclick="x','<svg>',':r0:'])assert.throws(()=>render(invalid),/prefix/);
  }
});
test('generated selectors are scoped and all keyframes namespaced',async()=>{
  const css=await fs.readFile(new URL('../packages/core/dist/theme.css',import.meta.url),'utf8');
  const tree=postcss.parse(css);
  tree.walkRules(rule=>{
    if(rule.parent.type==='atrule' && rule.parent.name.endsWith('keyframes'))return;
    for(const selector of rule.selectors)assert.ok(selector.includes('.ng-theme'),selector);
  });
  tree.walkAtRules('keyframes',rule=>assert.ok(rule.params.startsWith('ng-'),rule.params));
  assert.ok(css.includes('.ng-theme .detail-call .detail-body'));
  assert.ok(!css.includes('.detail-.ng-theme'));
  assert.ok(!/url\(#(?:identity|study|ng-signal)-/.test(css));
});
test('approved spacing and net one-point type adjustment are preserved in tokens',async()=>{
  const tokens=JSON.parse(await fs.readFile(new URL('../packages/core/tokens/neon-grid.tokens.json',import.meta.url),'utf8'));
  for(let original=7;original<=16;original++)assert.equal(tokens.size[`type-${original}`].$value.value,original+4/3);
  assert.equal(tokens.space['page-x'].$value.value,34);
  assert.equal(tokens.space['page-y'].$value.value,32);
  assert.equal(tokens.space['panel-gap'].$value.value,13);
  assert.equal(tokens.size.heading.$value.value,58);
});
