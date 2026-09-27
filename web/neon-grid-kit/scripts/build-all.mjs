import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run this command through npm run build');
function run(args) {
  const result=spawnSync(process.execPath,[npm,...args],{cwd:root,stdio:'inherit',windowsHide:true,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NUXT_TELEMETRY_DISABLED:'1'}});
  if(result.status!==0)process.exit(result.status??1);
}
run(['run','build:core']);
for(const name of ['react','vue','svelte']) run(['run','build','--workspace',`@neon-grid/kit-${name}`]);
for(const name of ['svelte']) run(['run','check','--workspace',`@neon-grid/kit-${name}`]);
for(const name of ['vanilla','react','vue','svelte','next','nuxt','tailwind']) run(['run','build','--workspace',`@neon-grid/example-${name}`]);
run(['run','check','--workspace','@neon-grid/example-svelte']);
run(['run','check:ssr','--workspace','@neon-grid/example-svelte']);
run(['run','check','--workspace','@neon-grid/example-nuxt']);
console.log('All framework packages and seven examples built and checked.');
