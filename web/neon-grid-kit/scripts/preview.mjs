import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const children=[];
let stopping=false;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8'};
const routes=new Map(['vanilla','react','vue','svelte','tailwind'].map(name=>[`/${name}/`,path.join(root,'examples',name,'dist')]));
const server=http.createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    if(pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
    let base=root,relative=pathname.slice(1);
    for(const [prefix,folder] of routes){if(pathname===prefix.slice(0,-1)){res.writeHead(302,{Location:prefix});res.end();return;}if(pathname.startsWith(prefix)){base=folder;relative=pathname.slice(prefix.length);break;}}
    if(base===root && !['','index.html','gallery.js','gallery.css','README.md'].includes(relative) && !['packages/core/','reference/approved/','artifacts/'].some(prefix=>relative.startsWith(prefix))) {res.writeHead(404);res.end('Not found');return;}
    let file=path.resolve(base,relative||'index.html');
    if(!file.startsWith(base+path.sep) && file!==base){res.writeHead(403);res.end();return;}
    const stat=await fs.stat(file);
    if(stat.isDirectory())file=path.join(file,'index.html');
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(await fs.readFile(file));
  } catch {res.writeHead(404);res.end('Not found');}
});
function start(file,args,env={}) {
  const child=spawn(process.execPath,[file,...args],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NUXT_TELEMETRY_DISABLED:'1',...env}});
  children.push(child);
  child.stdout.on('data',data=>process.stdout.write(data));
  child.stderr.on('data',data=>process.stderr.write(data));
  child.on('error',error=>{console.error(error);stop(1);});
  child.on('exit',code=>{if(!stopping){console.error(`Preview child exited (${code})`);stop(code||1);}});
}
function stop(code=0) {if(stopping)return;stopping=true;for(const child of children)child.kill();server.close(()=>process.exit(code));setTimeout(()=>process.exit(code),1000).unref();}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
process.on('message',message=>{if(message==='shutdown')stop();});
server.on('error',error=>{console.error(error);stop(1);});
server.listen(4320,'127.0.0.1',()=>{
  if(!process.argv.includes('--static-only')) {
    start(path.join(root,'node_modules/next/dist/bin/next'),['start','examples/next','--hostname','127.0.0.1','--port','4314']);
    start(path.join(root,'examples/nuxt/.output/server/index.mjs'),[],{NITRO_HOST:'127.0.0.1',NITRO_PORT:'4315'});
  }
  console.log('Neon Grid gallery: http://127.0.0.1:4320/');
});
