import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const example=path.join(root,'examples/tailwind');
await fs.mkdir(path.join(example,'dist'),{recursive:true});
const result=spawnSync(process.execPath,[path.join(root,'node_modules/@tailwindcss/cli/dist/index.mjs'),'-i','input.css','-o','dist/theme.css','--minify'],{cwd:example,stdio:'inherit',windowsHide:true});
if(result.status!==0)process.exit(result.status??1);
await fs.copyFile(path.join(example,'index.html'),path.join(example,'dist/index.html'));
await fs.cp(path.join(root,'packages/core/dist/fonts'),path.join(example,'dist/fonts'),{recursive:true});
// Tailwind preserves these relative font URLs; keep the standalone output portable.
let css=await fs.readFile(path.join(example,'dist/theme.css'),'utf8');
css=css.replaceAll(/url\((?:["'])?[^)"']*fonts\/([^)'" ]+)["']?\)/g,'url(./fonts/$1)');
await fs.writeFile(path.join(example,'dist/theme.css'),css);
