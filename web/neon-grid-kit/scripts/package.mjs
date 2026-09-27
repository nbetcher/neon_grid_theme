import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.join(root,'artifacts/packages');
await fs.mkdir(destination,{recursive:true});
if(!process.env.npm_execpath)throw new Error('Run through npm run package');
const packages=[];
for(const name of ['core','react','vue','svelte']){
  const result=spawnSync(process.execPath,[process.env.npm_execpath,'pack','--workspace',`@neon-grid/kit-${name}`,'--pack-destination',destination,'--json'],{cwd:root,encoding:'utf8',windowsHide:true});
  if(result.status!==0)throw new Error(result.stderr||result.stdout);
  const [pack]=JSON.parse(result.stdout);
  const files=pack.files.map(item=>item.path);
  assert.ok(files.includes('README.md'),`${name}: README missing`);
  if(name==='core')for(const file of ['NOTICE.md','dist/theme.css','dist/fonts/orbitron-variable.woff2','dist/fonts/share-tech-mono-400.woff2'])assert.ok(files.includes(file),file);
  packages.push({name:pack.name,filename:pack.filename,integrity:pack.integrity,size:pack.size,files});
}
await fs.writeFile(path.join(root,'artifacts/package-manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),packages},null,2));
const priorPath=path.join(root,'artifacts/packaging-validation.json');
try {
  const prior=JSON.parse(await fs.readFile(priorPath,'utf8'));
  prior.finalPackVerifiedAt=new Date().toISOString();
  for(const item of prior.packages){const pack=packages.find(p=>p.name===item.name);if(pack){item.files=pack.files;item.bytes=pack.size;item.missingDocs=[];}}
  prior.documentationFindingResolved=true;
  await fs.writeFile(priorPath,JSON.stringify(prior,null,2));
} catch(error){if(error.code!=='ENOENT')throw error;}
console.log(JSON.stringify(packages.map(({name,filename,size})=>({name,filename,size})),null,2));
