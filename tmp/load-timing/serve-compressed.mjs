import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {gzipSync} from 'node:zlib';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4'};
for(const [port,root] of [[8781,'/private/tmp/portfolio-release-20260909'],[8782,process.cwd()]]) {
 const cache=new Map();
 createServer(async(req,res)=>{
  try {
   const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file=resolve(root,'.'+(path.endsWith('/')?path+'index.html':path));
   if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
   if(!cache.has(file)) {
    const original=await readFile(file),type=types[extname(file)]||'application/octet-stream';
    const compressed=/^text\/|svg/.test(type);
    cache.set(file,{bytes:compressed?gzipSync(original):original,type,compressed});
   }
   const data=cache.get(file);
   res.writeHead(200,{'Content-Type':data.type,'Content-Length':data.bytes.length,'Cache-Control':'no-store',...(data.compressed?{'Content-Encoding':'gzip'}:{})});res.end(data.bytes);
  } catch {res.writeHead(404).end();}
 }).listen(port,'127.0.0.1',()=>console.log(`Serving ${root} on ${port}`));
}
