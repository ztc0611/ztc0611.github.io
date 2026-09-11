import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire('/Users/ztc0611/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,args:['--enable-gpu']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:2});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 const result=window.__loadTiming={};
 const observer=new MutationObserver(()=>{
  const scene=document.querySelector('#scene'),fog=document.querySelector('.arrival-fog');
  if(scene?.dataset.ready==='true'&&result.sceneReady===undefined)result.sceneReady=performance.now();
  if(fog?.classList.contains('departing')&&result.fadeStarted===undefined)result.fadeStarted=performance.now();
  if(fog?.hidden&&result.fadeDone===undefined){result.fadeDone=performance.now();observer.disconnect();}
 });
 observer.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-ready','class','hidden']});
});
const results=[];
for(let i=0;i<3;i++){
 if(i===0)await page.goto('http://127.0.0.1:8770/',{waitUntil:'domcontentloaded'});
 else await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__loadTiming?.fadeDone!==undefined,{},{timeout:45000});
 const timing=await page.evaluate(()=>{
  const canvas=document.querySelector('#scene canvas'),gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');
  const nav=performance.getEntriesByType('navigation')[0];
  return {...window.__loadTiming,ttfb:nav.responseStart,firstPaint:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),shaderError:document.querySelector('#scene').dataset.error,scriptTransfer:performance.getEntriesByType('resource').filter(x=>x.initiatorType==='script').reduce((sum,x)=>sum+x.transferSize,0)};
 });
 results.push({run:i===0?'First visit':'Reload '+i,...timing});console.log(JSON.stringify(results.at(-1)));
}
await fs.writeFile('tmp/load-timing/results.json',JSON.stringify({results,errors},null,2));
await browser.close();
