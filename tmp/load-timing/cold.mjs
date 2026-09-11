import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire('/Users/ztc0611/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const url=process.env.TEST_URL || 'https://zach-coleman.com/';
const results=[];
for(let run=0;run<2;run++) {
 const browser=await chromium.launch({headless:true,args:['--enable-gpu','--disable-gpu-shader-disk-cache']});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Network.enable');
 await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 if(process.env.THROTTLE)await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:1250000,uploadThroughput:625000});
 await page.addInitScript(()=>{
  const timing=window.__loadTiming={};
  const observer=new MutationObserver(()=>{
   const scene=document.querySelector('#scene'),fog=document.querySelector('.arrival-fog');
   if(scene?.dataset.ready==='true'&&timing.sceneReady===undefined)timing.sceneReady=performance.now();
   if(fog?.classList.contains('departing')&&timing.fadeStarted===undefined)timing.fadeStarted=performance.now();
   if(fog?.hidden&&timing.fadeDone===undefined){timing.fadeDone=performance.now();observer.disconnect();}
  });
  observer.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-ready','class','hidden']});
 });
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__loadTiming?.fadeDone!==undefined,{},{timeout:45000});
 const result=await page.evaluate(()=>{
  const nav=performance.getEntriesByType('navigation')[0];
  return {...window.__loadTiming,ttfb:nav.responseStart,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
   resources:performance.getEntriesByType('resource').map(x=>({name:new URL(x.name).pathname,start:Math.round(x.startTime),end:Math.round(x.responseEnd),transfer:x.transferSize,decoded:x.decodedBodySize})),error:document.querySelector('#scene').dataset.error};
 });
 results.push({run,url,throttled:!!process.env.THROTTLE,...result,errors});
 console.log(JSON.stringify(results.at(-1)));
 await browser.close();
}
await fs.writeFile(`tmp/load-timing/${process.env.RESULT_NAME || 'live-cold'}.json`,JSON.stringify(results,null,2));
