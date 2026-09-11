import { createRequire } from 'node:module';
const require=createRequire('/Users/ztc0611/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:2,reducedMotion:"reduce"});
await page.addInitScript(()=>{
 const NativeDate=Date,fixed=new NativeDate();fixed.setHours(16,30,0,0);
 globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[fixed.getTime()]));}static now(){return fixed.getTime();}};
});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:8770/?motion-check',{waitUntil:'networkidle'});
await page.waitForSelector('#scene[data-ready="true"]');
await page.addStyleTag({content:`
.tide-hero{height:630px;min-height:630px;max-height:630px}
.tide-header,.scene-footer,.arrival-fog,.skip,.work,footer{display:none!important}
.scene-title{left:56px;top:55px;text-shadow:0 2px 30px #05182745}
.scene-title h1{font-size:80px;letter-spacing:-.055em}
.scene-title p{font-size:25px;margin-top:12px;letter-spacing:-.025em}
.scene-shade{background:linear-gradient(180deg,#061b2b60,transparent 52%,#071d2d10)}
`});
await page.screenshot({path:process.env.PREVIEW_OUTPUT || '/Users/ztc0611/Developer/portfolio-website/tmp/social-preview/coast.png',type:'png'});
console.log(JSON.stringify({errors,scene:await page.locator('#scene canvas').getAttribute('data-hour')}));
await browser.close();
