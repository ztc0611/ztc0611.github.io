import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire('/Users/ztc0611/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,args:['--enable-gpu']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:2});
let source=await fs.readFile('assets/home/scene.js','utf8');
const mark=name=>`performance.mark('${name}');`;
for(const [find,name] of [
 ["function createInlet() {",'scene-start'],
 ['const surfaceDetails = createSurfaceDetails();','surface-textures'],
 ["const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });",'renderer-created'],
 ['scene.add(sky);','sky-created'],
 ['island(36,27,24,24,10,3);','islands-created'],
 ['scene.add(createForest(treePlacements),createUnderstory(shrubPlacements));','forest-created'],
 ['const rain = createRain(scene);','ferry-water-rain-created'],
 ['const lowClouds = createLowClouds(scene);','low-clouds-created']
]){if(!source.includes(find))throw Error(find);source=source.replace(find,find+mark(name));}
source=source.replace('function render(){',`function render(){const firstDraw=!performance.getEntriesByName('first-reflection-start').length;if(firstDraw){${mark('first-reflection-start')}}`);
source=source.replace('renderer.render(scene,reflectionCamera);',`renderer.render(scene,reflectionCamera);if(firstDraw){${mark('first-reflection-end')}}`);
source=source.replace('renderer.render(scene,camera);',`renderer.render(scene,camera);if(firstDraw){${mark('first-main-end')}}`);
await page.route('**/assets/home/scene.js*',r=>r.fulfill({body:source,contentType:'text/javascript'}));
await page.goto('http://127.0.0.1:8770/',{waitUntil:'domcontentloaded'});
await page.waitForSelector('#scene[data-ready="true"]');
const report=await page.evaluate(()=>({marks:performance.getEntriesByType('mark').map(x=>({name:x.name,ms:Math.round(x.startTime)})),resources:performance.getEntriesByType('resource').filter(x=>x.initiatorType==='script').map(x=>({name:x.name.split('/').at(-1),start:Math.round(x.startTime),end:Math.round(x.responseEnd),bytes:x.transferSize})),nav:performance.getEntriesByType('navigation').map(x=>({responseEnd:x.responseEnd,domContentLoaded:x.domContentLoadedEventEnd}))}));
console.log(JSON.stringify(report,null,2));await fs.writeFile('tmp/load-timing/breakdown.json',JSON.stringify(report,null,2));
await browser.close();
