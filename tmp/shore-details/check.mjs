import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from '../../assets/home/vendor/three.module.min.js';
import {terrainSurface,plantUnderstory} from '../../assets/home/habitat.js';
const outputs=[];
for(const path of ['tmp/shore-details/scene-before.js','assets/home/scene.js']) {
 const source=await fs.readFile(path,'utf8');
 const body=source.slice(source.indexOf('  function terrainNoise'),source.indexOf('  scene.add(createForest'));
 let seed=731902;
 const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)|0;return(seed>>>0)/4294967296;};
 const meshes=[],scene={add(mesh){meshes.push(mesh);}},smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
 const start=performance.now();
 const data=Function('THREE','scene','surfaceDetails','random','color','smooth','mix','terrainSurface','plantUnderstory',body+'\nreturn {treePlacements,shrubPlacements,driftwoodPlacements:typeof driftwoodPlacements!=="undefined"?driftwoodPlacements:[]};')(THREE,scene,{terrain(){}},random,x=>new THREE.Color(x),smooth,THREE.MathUtils.lerp,terrainSurface,plantUnderstory);
 const elapsed=performance.now()-start,hash=createHash('sha256');
 for(const mesh of meshes)for(const attribute of Object.values(mesh.geometry.attributes))hash.update(Buffer.from(attribute.array.buffer));
 hash.update(JSON.stringify(data.treePlacements));
 outputs.push({hash:hash.digest('hex'),...data});
 console.log({path,elapsed,trees:data.treePlacements.length,shrubs:data.shrubPlacements.length,logs:data.driftwoodPlacements});
}
assert.equal(outputs[0].hash,outputs[1].hash,'Terrain and forest must remain unchanged');
for(const p of [...outputs[1].shrubPlacements,...outputs[1].driftwoodPlacements])for(const key of ['x','y','z'])assert.ok(Number.isFinite(p[key]),`${key} must be finite`);

assert.ok(outputs[1].shrubPlacements.length>50);
await fs.writeFile('tmp/shore-details/placements.json',JSON.stringify(outputs[1]));
const geometry=new THREE.PlaneGeometry(10,8,2,2).rotateX(-Math.PI/2);
for(let i=0;i<geometry.attributes.position.count;i++)geometry.attributes.position.setY(i,Math.sin(i*1.9)*2);
geometry.computeVertexNormals();
const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld();
const surface=terrainSurface(geometry,()=>0),ray=new THREE.Raycaster();
for(let i=0;i<50;i++){
 const x=-4.9+(i*.713)%9.8,z=-3.9+(i*.519)%7.8;
 ray.set(new THREE.Vector3(x,20,z),new THREE.Vector3(0,-1,0));
 assert.ok(Math.abs(ray.intersectObject(mesh)[0].point.y-surface.elevation(x,z))<.00001,'Ground sampling must match rendered triangles');
}
console.log('Passed: unchanged terrain/trees, finite plant positions, exact mesh support sampling.');
