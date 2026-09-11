import * as THREE from './vendor/three.module.min.js';

export function weatherForDate(date = new Date()) {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  let hash = 2166136261;
  for (const character of `inlet-weather-v1:${key}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return {key, rainy: (hash >>> 0) % 100 < 38};
}

export function createRain(scene) {
  let seed = 83117;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
  const origins = [], phases = [];
  const count=3200;
  for (let i = 0; i < count; i++) {
    origins.push((random() - .5) * 190, random() * 70, random() * 175 - 110);
    phases.push(random());
  }
  const plane=new THREE.PlaneGeometry(1,1);
  const geometry=new THREE.InstancedBufferGeometry();
  geometry.index=plane.index;geometry.attributes.position=plane.attributes.position;geometry.attributes.uv=plane.attributes.uv;
  geometry.setAttribute('aOrigin',new THREE.InstancedBufferAttribute(new Float32Array(origins),3));
  geometry.setAttribute('aPhase',new THREE.InstancedBufferAttribute(new Float32Array(phases),1));
  geometry.instanceCount=count;
  const uniforms = {uTime:{value:0}, uRain:{value:0}, uDay:{value:1}};
  const material = new THREE.ShaderMaterial({
    uniforms, transparent:true, depthWrite:false,
    vertexShader:`
      uniform float uTime; attribute float aPhase; attribute vec3 aOrigin;
      varying float vFade; varying vec2 vUv;
      void main(){
        vec3 p=aOrigin;
        p.y=mod(aOrigin.y-uTime*(23.+aPhase*8.),70.);
        p.x+=p.y*.11;
        float streakLength=.65+aPhase*.8;
        p.y+=uv.y*streakLength;p.x+=uv.y*streakLength*.11;
        vec4 view=modelViewMatrix*vec4(p,1.);
        vFade=smoothstep(0.,3.,p.y)*(1.-smoothstep(65.,70.,p.y))*(1.-smoothstep(45.,160.,-view.z));
        view.x+=position.x*max(.025,-view.z*.002);
        vUv=uv;
        gl_Position=projectionMatrix*view;
      }`,
    fragmentShader:`
      uniform float uRain,uDay; varying float vFade; varying vec2 vUv;
      void main(){
        float opacity=vFade*uRain*(.18+.25*uDay)*mix(.18,1.,vUv.y)*(1.-smoothstep(.05,.5,abs(vUv.x-.5)));
        gl_FragColor=vec4(mix(vec3(.48,.63,.78),vec3(.76,.86,.9),uDay),opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const streaks = new THREE.Mesh(geometry, material);
  streaks.frustumCulled = false;
  streaks.renderOrder = 3;
  scene.add(streaks);
  return {streaks, update(time, strength, daylight, animated) {
    uniforms.uTime.value=time;uniforms.uRain.value=strength;uniforms.uDay.value=daylight;
    streaks.visible=animated && strength>.002;
  }};
}
