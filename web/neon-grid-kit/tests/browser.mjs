import { chromium } from 'playwright';
import { fork } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=path.join(root,'artifacts');
await fs.mkdir(artifacts,{recursive:true});
const server=fork(path.join(root,'scripts/preview.mjs'),[],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
let serverLog=''; server.stdout.on('data',d=>serverLog+=d);server.stderr.on('data',d=>serverLog+=d);
let browser;
const report={browser:'Microsoft Edge',examples:[],runtime:[],errors:[]};
try {
  for(const url of ['http://127.0.0.1:4320','http://127.0.0.1:4314','http://127.0.0.1:4315']){
    let ready=false;
    for(let i=0;i<100;i++){try{if((await fetch(url)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,150));}
    assert.ok(ready,`Preview not ready: ${url}\n${serverLog}`);
  }
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  for(const [name,url,interactive] of [
    ['gallery','http://127.0.0.1:4320/',false],['vanilla','http://127.0.0.1:4320/vanilla/',true],
    ['react','http://127.0.0.1:4320/react/',true],['vue','http://127.0.0.1:4320/vue/',true],
    ['svelte','http://127.0.0.1:4320/svelte/',true],['next','http://127.0.0.1:4314/',true],
    ['nuxt','http://127.0.0.1:4315/',true],['tailwind','http://127.0.0.1:4320/tailwind/',false]
  ]){
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    page.on('requestfailed',request=>errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    await page.goto(url,{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);
    assert.ok(await page.evaluate(()=>document.fonts.check('12px "Share Tech Mono"')),`${name}: local font`);
    assert.equal(await page.locator('.ng-theme').count(),1,`${name}: one theme root`);
    if(name==='tailwind') {
      assert.equal(await page.locator('[data-tailwind-panel]').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(17, 17, 37)');
      assert.equal(await page.locator('[data-tailwind-panel]').evaluate(el=>getComputedStyle(el).paddingLeft),'18px');
    }
    if(interactive){
      await page.waitForFunction(()=>document.querySelector('.ng-theme').dataset.ambient==='running');
      const text=await page.locator('.transmission-text').allTextContents();
      await page.locator('[data-ng-demo-add]').click();
      await page.waitForFunction(()=>!!document.querySelector('.arrival-field.is-arriving'));
      assert.notDeepEqual(await page.locator('.transmission-text').allTextContents(),text,`${name}: add updates content`);
      await page.locator('[data-ng-focus]').click();
      await page.waitForFunction(()=>document.querySelector('.ng-theme').dataset.ambient==='stopped');
      assert.equal(await page.locator('.arrival-field.is-arriving').count(),0,`${name}: focus clears arrivals`);
      await page.locator('[data-ng-focus]').click();
      await page.locator('[data-ng-glow]').selectOption('off');
      await page.waitForFunction(()=>document.querySelector('.ng-theme').dataset.glow==='off');
      assert.equal(await page.locator('.channel-card').first().evaluate(el=>getComputedStyle(el).boxShadow),'none');
      await page.locator('[data-ng-glow]').selectOption('balanced');
      await page.locator('[data-ng-motion]').evaluate(el=>el.click());
      await page.waitForFunction(()=>document.querySelector('.ng-theme').dataset.ambient==='stopped');
      await page.locator('[data-ng-motion]').evaluate(el=>el.click());
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>document.querySelector('.ng-theme').dataset.ambient==='stopped');
      assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.effect.getTiming().iterations===Infinity).length),0,`${name}: no reduced-motion loops`);
      await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'active'});
      await page.waitForFunction(()=>document.querySelector('.ng-theme').dataset.ambient==='stopped');
      await page.emulateMedia({forcedColors:'none'});
      await page.waitForFunction(()=>document.querySelector('.ng-theme').dataset.ambient==='running');
      const nav=page.locator('[data-ng-nav]').nth(1);
      await nav.hover();
      await page.waitForFunction(()=>[...document.querySelectorAll('[data-ng-nav]')].some(el=>el.dataset.navState==='enter'));
      await page.mouse.move(800,80);
      const ids=await page.locator('svg [id]').evaluateAll(els=>els.map(el=>el.id));
      assert.equal(new Set(ids).size,ids.length,`${name}: no duplicate SVG ids`);
      assert.equal(await page.locator('.transmission-text').first().evaluate(el=>getComputedStyle(el).textShadow),'none');
    }
    await page.screenshot({path:path.join(artifacts,`${name}-desktop.png`),fullPage:true});
    for(const width of [1440,1024,768,390,320]){
      await page.setViewportSize({width,height:1000});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}: ${width}px overflow`);
      const clipped=await page.locator('.sidebar .nav-content').evaluateAll(els=>els.filter(el=>el.getClientRects().length && el.scrollWidth>el.clientWidth+1).map(el=>el.textContent));
      assert.deepEqual(clipped,[],`${name}: clipped nav at ${width}`);
      if(width===390)await page.screenshot({path:path.join(artifacts,`${name}-mobile.png`),fullPage:true});
    }
    assert.deepEqual(errors,[],`${name}: browser errors`);
    report.examples.push({name,url,pass:true,interactive,widths:[1440,1024,768,390,320]});
    await page.close();
  }
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:4320/');
  const result=await page.evaluate(async()=>{
    const {createThemeController,navMarkup}=await import('/packages/core/src/index.js');
    const fixture=document.createElement('div');fixture.className='ng-theme';fixture.innerHTML='<div class="channel-card" data-ng-panel><article class="channel-card" data-ng-panel><span class="arrival-field" data-ng-arrival></span></article><span class="arrival-field" data-ng-arrival></span></div>';
    document.body.append(fixture);
    const controller=createThemeController(fixture);
    const panels=fixture.querySelectorAll('[data-ng-panel]');
    const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const checks=[];
    checks.push(controller.pulse(panels[0]) && !panels[1].querySelector('[data-ng-arrival]').classList.contains('is-arriving'));
    await wait(120);controller.pulse(panels[0]);await wait(120);
    checks.push(panels[0].querySelector(':scope > [data-ng-arrival]').classList.contains('is-arriving'));
    await wait(950);checks.push(fixture.querySelectorAll('.is-arriving').length===0);
    controller.pulse(panels[1]);controller.update({paused:true});checks.push(fixture.querySelectorAll('.is-arriving').length===0);
    controller.update({paused:false});checks.push(fixture.querySelectorAll('.is-arriving').length===0);
    const nav=document.createElement('button');nav.dataset.ngNav='';nav.className='nav-item';nav.innerHTML='<span class="nav-content">Dynamic</span>'+navMarkup();fixture.append(nav);
    nav.dispatchEvent(new PointerEvent('pointerover',{bubbles:true}));checks.push(nav.dataset.navState==='enter');
    controller.destroy();controller.destroy();nav.dataset.navState='sentinel';nav.dispatchEvent(new PointerEvent('pointerover',{bubbles:true}));checks.push(nav.dataset.navState==='sentinel');
    const second=createThemeController(fixture,{motion:false});checks.push(fixture.dataset.ambient==='stopped');second.destroy();fixture.remove();
    return checks;
  });
  assert.ok(result.every(Boolean),`Controller lifecycle: ${JSON.stringify(result)}`);
  report.runtime=['rapid pulse restart','nested panel isolation','arrival completion','pause cancels without replay','dynamic nav delegation','idempotent teardown','remount'];
  report.pass=true;
  console.log(JSON.stringify(report,null,2));
} catch(error){report.pass=false;report.errors.push(error.stack);console.error(error);process.exitCode=1;}
finally {
  await fs.writeFile(path.join(artifacts,'browser-validation.json'),JSON.stringify(report,null,2));
  await browser?.close();
  if(server.connected)server.send('shutdown');
  await new Promise(resolve=>{server.once('exit',resolve);setTimeout(resolve,2000).unref();});
  if(server.exitCode===null)server.kill();
}
