const sharp=require('/Users/ztc0611/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('fs');
(async()=>{
 await sharp('favicon.svg',{density:768}).resize(512,512).png().toFile('favicon.png');
 await sharp('favicon.svg',{density:768}).resize(180,180).flatten({background:'#183b48'}).png().toFile('apple-touch-icon.png');
 const sizes=[16,32,48,64,128,256];
 const images=await Promise.all(sizes.map(size=>sharp('favicon.svg',{density:768}).resize(size,size).png().toBuffer()));
 const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
 let offset=header.length;
 sizes.forEach((size,i)=>{const at=6+16*i;header[at]=size%256;header[at+1]=size%256;header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(images[i].length,at+8);header.writeUInt32LE(offset,at+12);offset+=images[i].length;});
 fs.writeFileSync('favicon.ico',Buffer.concat([header,...images]));
 await sharp({create:{width:640,height:200,channels:3,background:'#f4f6f5'}}).composite(await Promise.all([16,32,64,128].map(async(size,i)=>({input:await sharp('favicon.svg',{density:768}).resize(size,size).toBuffer(),left:40+i*140,top:Math.round((200-size)/2)})))).png().toFile('tmp/social-preview/icon-sizes.png');
})();
