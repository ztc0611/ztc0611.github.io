import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from '../../assets/home/vendor/three.module.min.js';
const hashes=[];
for(const name of ['tmp/load-timing/scene-before-optimization.js','assets/home/scene.js']){
 const source=await fs.readFile(name,'utf8');
 const body=source.slice(source.indexOf('  function terrainNoise'),source.indexOf('  scene.add(createForest'));
 let seed=731902;
 const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)|0;return(seed>>>0)/4294967296;};
 const meshes=[],scene={add(mesh){meshes.push(mesh);}},smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
 const data=Function('THREE','scene','surfaceDetails','random','color','smooth','mix',body+'\nreturn {treePlacements,shrubPlacements};')(THREE,scene,{terrain(){}},random,x=>new THREE.Color(x),smooth,THREE.MathUtils.lerp);
 const hash=createHash('sha256');
 for(const mesh of meshes)for(const attribute of Object.values(mesh.geometry.attributes))hash.update(Buffer.from(attribute.array.buffer));
 hash.update(JSON.stringify(data));hashes.push(hash.digest('hex'));
 console.log(name,meshes.length,'islands,',data.treePlacements.length,'trees,',data.shrubPlacements.length,'shrubs');
}
if(hashes[0]!==hashes[1])throw Error('Generated terrain changed');
console.log('Terrain vertices, colors, normals, trees, and shrubs match exactly.');
