import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire('/Users/ztc0611/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for(const version of ['before','after']){
 const page=await browser.newPage({viewport:{width:1000,height:740},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const file=version==='before'?'tmp/resize-check/scene-before.js':'assets/home/scene.js';
 let source=await fs.readFile(file,'utf8');
 source=source.replace('renderer.setRenderTarget(null);renderer.render(scene,camera);',`renderer.setRenderTarget(null);renderer.render(scene,camera);
 window.__renderCheck={width:renderer.domElement.width,height:renderer.domElement.height,aspect:camera.aspect,fov:camera.fov,position:camera.position.toArray(),reflection:[reflection.width,reflection.height],lost:renderer.getContext().isContextLost()};`);
 await page.route('**/assets/home/scene.js*',r=>r.fulfill({body:source,contentType:'text/javascript'}));
 await page.goto('http://127.0.0.1:8771/?motion-check',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#scene[data-ready="true"]',{timeout:60000});
 await page.locator('#scene-motion').click();
 await page.evaluate(()=>{
  window.__resizeSnapshots=[];
  const canvas=document.querySelector('#scene canvas');
  new ResizeObserver(()=>{
   const r=window.__renderCheck;
   window.__resizeSnapshots.push({cssWidth:canvas.clientWidth,width:canvas.width,renderedWidth:r.width,height:canvas.height,renderedHeight:r.height,lost:canvas.getContext('webgl2').isContextLost()});
  }).observe(document.querySelector('#scene'));
 });
 const cameras=[];
 for(const width of [1000,900,800,710,667,665,650,600,500,390,600,666,668,710,900,1200,1500]){
  await page.setViewportSize({width,height:740});
  await page.waitForTimeout(180);
  cameras.push({width,...await page.evaluate(()=>window.__renderCheck)});
 }
 await page.waitForTimeout(300);
 await page.screenshot({path:`tmp/resize-check/${version}.png`});
 const snapshots=await page.evaluate(()=>window.__resizeSnapshots);
 const clearedFrames=snapshots.filter(s=>s.width!==s.renderedWidth||s.height!==s.renderedHeight);
 const result={version,errors,clearedFrames,totalResizeEvents:snapshots.length,cameras};
 await fs.writeFile(`tmp/resize-check/${version}.json`,JSON.stringify(result,null,2));
 console.log(JSON.stringify({version,errors,clearedFrames:clearedFrames.length,totalResizeEvents:snapshots.length,lost:cameras.some(c=>c.lost),breakpoint:cameras.filter(c=>[667,665,666,668].includes(c.width))}));
 await page.close();
}
await browser.close();
