import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const core = path.join(root, 'packages/core');
const check = process.argv.includes('--check');
const tokens = JSON.parse(await fs.readFile(path.join(core, 'tokens/neon-grid.tokens.json'), 'utf8'));
const flat = [];
function flatten(group, keys = [], inheritedType) {
  if (!group || typeof group !== 'object') throw new Error('Invalid token group');
  const type = group.$type ?? inheritedType;
  if ('$value' in group) {
    const value = group.$value;
    let css;
    if (type === 'color') {
      if (value.colorSpace !== 'srgb' || value.components.length !== 3 || value.components.some(n => typeof n !== 'number' || n < 0 || n > 1)) throw new Error('Invalid sRGB color');
      css = `rgb(${value.components.map(n => +(n * 255).toFixed(5)).join(' ')} / ${value.alpha ?? 1})`;
    } else if (type === 'dimension' || type === 'duration') {
      const units = type === 'dimension' ? ['px', 'rem'] : ['ms', 's'];
      if (!Number.isFinite(value.value) || !units.includes(value.unit)) throw new Error('Invalid typed dimension/duration');
      css = `${value.value}${value.unit}`;
    } else if (type === 'fontFamily') {
      if (!Array.isArray(value) || value.some(n => typeof n !== 'string')) throw new Error('Invalid font family');
      css = value.map(n => n.includes(' ') ? JSON.stringify(n) : n).join(', ');
    } else throw new Error(`Unsupported token type ${type}`);
    flat.push({ name: keys.join('-'), css, type });
    return;
  }
  for (const [name, child] of Object.entries(group)) if (!name.startsWith('$')) flatten(child, [...keys, name], type);
}
flatten(tokens);
const aliases = {
  bg:'color-background',panel:'color-panel','panel-light':'color-panel-raised',text:'color-text',muted:'color-muted',
  ...Object.fromEntries(['cyan','green','amber','orange','blue','violet','magenta'].map(n => [n,`color-${n}`])),
  mono:'font-mono',display:'font-display',...Object.fromEntries(Array.from({length:10}, (_,i) => [`type-${i+7}`,`size-type-${i+7}`]))
};
const tokenCss = `/* Generated from neon-grid.tokens.json. */\n:where(.ng-theme) {\n${flat.map(t => `  --ng-${t.name}: ${t.css};`).join('\n')}\n}\n`;
const aliasCss = `.ng-theme {\n${Object.entries(aliases).map(([name, target]) => `  --${name}: var(--ng-${target});`).join('\n')}\n}\n`;
const inputs = ['styles.css','neon-grid.css','motion-preview.css','compact-preview.css'];
const combined = (await Promise.all(inputs.map(name => fs.readFile(path.join(core, 'src/approved', name),'utf8')))).join('\n');
const tree = postcss.parse(combined);
tree.walkComments(comment => comment.remove());
const keyframes = new Map();
tree.walkAtRules('keyframes', rule => {
  const name = rule.params.startsWith('study-') ? rule.params.replace('study-', 'ng-') : `ng-${rule.params}`;
  keyframes.set(rule.params, name);
  rule.params = name;
});
tree.walkRules(rule => {
  for (let ancestor = rule.parent; ancestor; ancestor = ancestor.parent) if (ancestor.type === 'atrule' && ancestor.name.endsWith('keyframes')) return;
  rule.selectors = rule.selectors.map(selector => {
    let result = selector.replaceAll(':root', '.ng-theme').replace(/(^|[\s>+~,(])html(?=[\s[.:#>+~),]|$)/g, '$1.ng-theme');
    result = result.replace(/(\.ng-theme(?:\[[^\]]+\])*)\s+body(?=[\s[.:#>+~),]|$)/g, '$1').replace(/(^|[\s>+~,(])body(?=[\s[.:#>+~),]|$)/g, '$1.ng-theme');
    result = result.replaceAll('#detail-content', '.detail-content').replaceAll('#motion-preference', '[data-ng-motion]');
    if (!result.includes('.ng-theme')) result = `.ng-theme ${result}`;
    if (rule.nodes.some(node => node.type === 'decl' && node.prop === 'animation') && result.endsWith('.arrival-field')) result += '.is-arriving';
    return result;
  });
});
tree.walkDecls(decl => {
  if (['animation', 'animation-name'].includes(decl.prop)) {
    for (const [before, after] of keyframes) decl.value = decl.value.replace(new RegExp(`\\b${before}\\b`, 'g'), after);
  }
  decl.value = decl.value.replaceAll('study-', 'ng-');
  const owner = decl.parent.selector ?? '';
  if (owner === '.ng-theme main' && decl.prop === 'padding' && decl.value === '32px 34px 18px') decl.value='var(--ng-space-page-y) var(--ng-space-page-x) 18px';
  if (owner === '.ng-theme h1' && decl.prop === 'font-size') {
    const name = {'58px':'heading','66px':'heading-wide','47px':'heading-mobile'}[decl.value];
    if(name) decl.value=`var(--ng-size-${name})`;
  }
  if (owner === '.ng-theme .channel-card' && decl.prop === 'margin-bottom' && decl.value === '13px') decl.value='var(--ng-space-panel-gap)';
  if (owner === '.ng-theme .channel-header' && decl.prop === 'padding' && decl.value === '15px 18px 11px') decl.value='var(--ng-space-panel-y) var(--ng-space-panel-x) 11px';
  if (owner === '.ng-theme .button' && decl.prop === 'padding' && decl.value === '10px 12px') decl.value='var(--ng-space-control-y) var(--ng-space-control-x)';
  if (owner === '.ng-theme .page-heading' && decl.prop === 'margin-bottom' && decl.value === '25px') decl.value='var(--ng-space-section)';
  if (owner === '.ng-theme .preview-controls' && decl.prop === 'margin' && decl.value === '0 0 29px') decl.value='0 0 var(--ng-space-preview-gap)';
  if (decl.prop === 'background-size' && decl.value === '42px 42px') decl.value='var(--ng-size-grid) var(--ng-size-grid)';
  const spectral = {'0,224,255':'cyan','138,69,255':'violet','255,45,170':'magenta','0,255,149':'green','255,149,0':'orange'};
  decl.value=decl.value.replace(/rgba\(\s*(\d+\s*,\s*\d+\s*,\s*\d+)\s*,\s*([.\d]+)\s*\)/g,(original,rgb,alpha)=>{
    const color=spectral[rgb.replaceAll(/\s/g,'')];
    return color ? `color-mix(in srgb,var(--${color}) ${+(Number(alpha)*100).toFixed(4)}%,transparent)` : original;
  });
  // SVG paint is per instance; never couple a component to another one's id.
  if (/url\(#(?:identity-|ng-signal-)/.test(decl.value)) decl.remove();
});
const extras = `
/* Package boundary and layout primitives. */
.ng-theme { position:relative; isolation:isolate; min-height:100dvh; color:var(--text); background:var(--bg); font-family:var(--ng-font-body); }
.ng-theme::before, .ng-theme::after { z-index:0; }
.ng-theme > .workspace, .ng-theme > .ng-content { position:relative; z-index:1; }
.ng-theme .ng-decoration { display:contents; }
.ng-theme .ng-decoration svg, .ng-theme .nav-optics { pointer-events:none; }
.ng-theme .nav-item { text-decoration:none; }
.ng-theme .ng-main { max-width:1535px; margin:auto; padding:var(--ng-space-page-y) var(--ng-space-page-x) 18px; }
.ng-theme .arrival-field { animation:none; }
@media (prefers-reduced-motion:no-preference) {
 .ng-theme[data-ambient="running"] .arrival-field.is-arriving { animation:ng-power-on var(--ng-motion-arrival) cubic-bezier(.18,.7,.25,1) 1; }
}
.ng-theme .preview-controls select { max-width:100%; }
.ng-theme .skip-link:focus-visible { position:fixed; z-index:100; inset:12px auto auto 12px; width:auto; height:auto; margin:0; clip:auto; overflow:visible; white-space:normal; padding:12px 16px; color:var(--cyan); background:var(--panel); }
@media (max-width:1250px) and (min-width:761px) {
 .ng-theme .sidebar { width:190px; }
 .ng-theme .workspace { margin-left:190px; }
}
@media (forced-colors:active) {
 .ng-theme { color:CanvasText; background:Canvas; }
 .ng-theme::before, .ng-theme::after { display:none; }
}
`;
const theme = `/* Neon Grid Kit 1.0.0 — approved spacing and net +1pt small type. */\n${tree.toString()}\n${tokenCss}${aliasCss}${extras}`;
const tailwind = `/* Tailwind 4 bridge. Import theme.css once, then this file after tailwindcss. */\n@theme inline {\n${flat.filter(t => ['color','fontFamily','dimension'].includes(t.type)).map(t => {
  const name = t.name.startsWith('color-') ? `color-ng-${t.name.slice(6)}` : t.name.startsWith('font-') ? `font-ng-${t.name.slice(5)}` : t.name.startsWith('size-type-') ? `text-ng-${t.name.slice(10)}` : t.name.startsWith('space-') ? `spacing-ng-${t.name.slice(6)}` : t.name.startsWith('radius-') ? `radius-ng-${t.name.slice(7)}` : null;
  return name ? `  --${name}: var(--ng-${t.name});` : '';
}).filter(Boolean).join('\n')}\n}\n`;
const scss = `// Generated static Sass values; runtime themes should use CSS variables.\n${flat.map(t => `$ng-${t.name}: ${t.css};`).join('\n')}\n`;
const outputs = new Map([['theme.css',theme],['tokens.css',tokenCss],['tailwind.css',tailwind],['_tokens.scss',scss]]);
await fs.mkdir(path.join(core,'dist/fonts'),{recursive:true});
for (const [name, body] of outputs) {
  const file = path.join(core,'dist',name);
  if (check) { if (await fs.readFile(file,'utf8') !== body) throw new Error(`Stale generated file: ${name}`); }
  else await fs.writeFile(file,body);
}
for (const name of await fs.readdir(path.join(core,'fonts'))) {
  const source = await fs.readFile(path.join(core,'fonts',name));
  const destination = path.join(core,'dist/fonts',name);
  if (check) { if (!source.equals(await fs.readFile(destination))) throw new Error(`Font differs: ${name}`); }
  else await fs.writeFile(destination,source);
}
console.log(`${check ? 'Verified' : 'Built'} ${flat.length} typed tokens, scoped CSS, Tailwind/Sass exports and local fonts.`);
