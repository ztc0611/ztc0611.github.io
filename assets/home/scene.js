import * as THREE from './vendor/three.module.min.js';
import { createSurfaceDetails } from './materials.js';
import { createForest, createUnderstory, createDriftwood } from './trees.js?v=20260909-details';
import { terrainSurface, plantUnderstory } from './habitat.js';
import { createFerry } from './ferry.js';
import { createLowClouds } from './clouds.js?v=20260909-details';
import { createRain, weatherForDate } from './weather.js';
import { sunAtLocalHour } from './solar.js';

const mount = document.querySelector('#scene');
const range = document.querySelector('#time-range');
const timeLabel = document.querySelector('#time-label');
const timeMode = document.querySelector('#time-mode');
const motionButton = document.querySelector('#scene-motion');
const liveButton = document.querySelector('#live-time');
const rainButton = document.querySelector('#rain-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const debug = new URLSearchParams(location.search).has('motion-check');

try {
  createInlet();
} catch (error) {
  console.error('The inlet could not start.', error);
  mount.dataset.error = String(error.message || error);
  mount.dataset.ready = 'false';
  mount.classList.add('scene-fallback');
  const message = document.createElement('p');
  message.className = 'scene-fallback-message';
  message.textContent = 'The inlet is taking a rest. You can still explore the work below.';
  mount.append(message);
}

function createInlet() {
  let randomSeed = 731902;
  let needsRender = true;
  const random = () => { randomSeed = (Math.imul(1664525, randomSeed) + 1013904223) | 0; return (randomSeed >>> 0) / 4294967296; };
  const clamp = THREE.MathUtils.clamp;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const mix = THREE.MathUtils.lerp;
  const color = (hex) => new THREE.Color(hex);
  const surfaceDetails = createSurfaceDetails();
  let dailyWeather = weatherForDate(), weatherOverride = false;
  let targetRain = dailyWeather.rainy ? 1 : 0, currentRain = targetRain;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#95afbb', 0.0036);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
  mount.append(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(46, 1, 0.5, 1600);
  const cameraBase = new THREE.Vector3(0, 13, 44);
  const aim = new THREE.Vector3(0, 8, -80);
  camera.position.copy(cameraBase);
  camera.lookAt(aim);
  const hemi = new THREE.HemisphereLight('#ceeaff', '#344b3c', 2.6);
  const sun = new THREE.DirectionalLight('#fff1ce', 2.6);
  const fill = new THREE.DirectionalLight('#78b8d6', 0.45);
  fill.position.set(-70, 50, 70);
  scene.add(hemi, sun, fill);

  const noiseGLSL = `
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p) { vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
    float fbm(vec2 p) { float n=0., a=.5; for(int i=0;i<5;i++){n+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return n; }
  `;
  const skyUniforms = {
    uTop: {value:color('#5585a7')}, uHorizon:{value:color('#bdccd0')},
    uSun:{value:new THREE.Vector3(-0.5,0.4,-0.7).normalize()}, uSunColor:{value:color('#fff1d5')},
    uDay:{value:1}, uDusk:{value:0}, uTime:{value:0}, uRain:{value:currentRain},uFog:{value:scene.fog.color}
  };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 40, 24), new THREE.ShaderMaterial({
    side:THREE.BackSide, depthWrite:false, uniforms:skyUniforms,
    vertexShader:`varying vec3 vWorld; void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vWorld; uniform vec3 uTop,uHorizon,uSun,uSunColor,uFog; uniform float uDay,uDusk,uTime,uRain; ${noiseGLSL}
      vec2 cloudGradient(vec2 cell){float a=hash(cell)*6.283185;return vec2(cos(a),sin(a));}
      float cloudNoise(vec2 p){
        vec2 cell=floor(p),f=fract(p),u=f*f*f*(f*(f*6.-15.)+10.);
        float a=dot(cloudGradient(cell),f);
        float b=dot(cloudGradient(cell+vec2(1.,0.)),f-vec2(1.,0.));
        float c=dot(cloudGradient(cell+vec2(0.,1.)),f-vec2(0.,1.));
        float d=dot(cloudGradient(cell+vec2(1.,1.)),f-vec2(1.,1.));
        return .5+.7*mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
      }
      float cloudField(vec2 p){
        p+=vec2(cloudNoise(p*.47+11.),cloudNoise(p*.43-19.))*.9;
        float value=0.,weight=.53;
        for(int i=0;i<4;i++){value+=weight*cloudNoise(p);p=mat2(1.63,1.19,-1.19,1.63)*p+vec2(7.1,3.7);weight*=.5;}
        return value;
      }
      void main(){
        vec3 rd=normalize(vWorld-cameraPosition); float h=max(rd.y,0.);
        vec3 c=mix(uHorizon,uTop,pow(h,.46));
        float sd=max(dot(rd,uSun),0.);
        c+=uSunColor*(pow(sd,16.)*.15+pow(sd,180.)*.4+smoothstep(.99955,.99985,sd)*2.2)*smoothstep(-.09,.025,uSun.y);
        vec2 cp=rd.xz/max(rd.y+mix(.22,.12,uRain),.1)*mix(1.8,2.4,uRain)+vec2(uTime*.0017,0.);
        float cloudMass=cloudField(cp);
        float clearClouds=smoothstep(.47,.72,cloudMass)*smoothstep(-.03,.13,rd.y)*(1.-smoothstep(.55,.93,rd.y));
        float clouds=mix(clearClouds,.94+.06*cloudMass,uRain);
        vec3 cloudColor=mix(vec3(.07,.11,.18),mix(vec3(.77,.83,.85),vec3(.98,.69,.46),uDusk*.65),uDay);
        vec3 overcast=mix(vec3(.032,.040,.049),vec3(.29,.315,.32),uDay);
        overcast*=.68+smoothstep(.23,.75,cloudMass)*.48;
        cloudColor=mix(cloudColor,overcast,uRain);
        c=mix(c,cloudColor,clouds*mix(.78,1.,uRain));
        vec2 sp=rd.xz/(rd.y+.4)*210.; vec2 cell=floor(sp); vec2 f=fract(sp)-.5;
        float star=pow(max(0.,1.-length(f)*3.1),9.)*step(.985,hash(cell));
        c+=star*(1.-uDay)*smoothstep(.03,.23,rd.y)*1.1*(1.-uRain*.9);
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        float horizonHaze=(1.-smoothstep(mix(.015,.22,uRain),mix(.24,.62,uRain),h))*mix(.92,1.,uRain);
        gl_FragColor.rgb=mix(gl_FragColor.rgb,linearToOutputTexel(vec4(uFog,1.)).rgb,horizonHaze);
      }`
  }));
  sky.renderOrder=-10;
  scene.add(sky);

  function terrainNoise(x,z) {
    return Math.sin(x*.14+Math.sin(z*.13)*2)*.44+Math.sin(x*.37-z*.29)*.24+Math.sin(x*.79+z*.6)*.13+Math.sin(x*1.67-z*1.27)*.07;
  }
  function groundNoise(x,z){
    const hash=(a,b)=>{let n=Math.imul(a,374761393)^Math.imul(b,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
    const ix=Math.floor(x),iz=Math.floor(z);let u=x-ix,v=z-iz;u=u*u*(3-2*u);v=v*v*(3-2*v);
    return mix(mix(hash(ix,iz),hash(ix+1,iz),u),mix(hash(ix,iz+1),hash(ix+1,iz+1),u),v);
  }
  const treePlacements=[],shrubPlacements=[];
  function island(cx,cz,rx,rz,height,seed, trees=true, snow=false) {
    const columns=snow?100:144, rows=snow?76:112;
    const geometry=new THREE.PlaneGeometry(rx*2,rz*2,columns,rows);
    geometry.rotateX(-Math.PI/2);
    const pos=geometry.attributes.position, colors=[];
    const rock=color(snow?'#697e86':'#536456'), green=color('#253e31'), snowColor=color('#d2dfe0');
    const dryGrass=color('#aa9055'),stoneColor=color('#707672'),vertexColor=new THREE.Color(),stoneTint=new THREE.Color();
    function elevation(x,z) {
      const xx=(x-cx)/rx,zz=(z-cz)/rz;
      const edge=1-Math.sqrt(xx*xx+zz*zz);
      const ridge=Math.max(0,edge+.075*terrainNoise(x+seed,z));
      const peak=(.65+.35*Math.sin(x*.036+z*.015+seed));
      const base=Math.pow(ridge,1.25)*height*peak + terrainNoise(x+seed,z)*Math.min(4,Math.max(0,edge)*8)-1.8;
      if(snow)return base;
      // The coastal rise belongs to the terrain, so exposed ledges join the
      // headland continuously instead of forming a separate ring of objects.
      const shelf=smooth(-.85,.75,base)*(1-smooth(3.5,9.,base));
      const headland=2.5+Math.sin(x*.061+z*.037+seed)*1.05;
      const folded=.28*Math.sin(x*.33+z*.22)+.14*Math.sin(z*.61-x*.19);
      return base+shelf*(headland+folded);
    }
    function exposure(x,z,y){
      const shore=1-smooth(2.2,6.4,y+terrainNoise(x*.3,z*.3)*1.4);
      // The slope contribution is capped at .76, so it cannot change this result.
      if(shore>=.76)return shore;
      const slope=Math.hypot(elevation(x+2,z)-elevation(x-2,z),elevation(x,z+2)-elevation(x,z-2))/4;
      return Math.max(shore,smooth(1.05,2.1,slope)*.76);
    }
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i)+cx,z=pos.getZ(i)+cz,y=elevation(x,z);
      pos.setXYZ(i,x,y,z);
      const n=terrainNoise(x*.8+seed,z*.8);
      const c=vertexColor.copy(rock).lerp(green,smooth(1,7,y)*.7).multiplyScalar(.88+n*.2);
      if(!snow){
        const stone=exposure(x,z,y);
        const patch=groundNoise(x*.065+seed*9.3,z*.065)*.75+groundNoise(x*.17-seed,z*.17)*.25;
        const meadow=smooth(.29,.72,patch)*(1-stone);
        c.lerp(dryGrass,meadow*.67);
        c.lerp(stoneTint.copy(stoneColor).multiplyScalar(.87+n*.13),stone);
      }
      if(snow) c.lerp(snowColor,smooth(height*.38,height*.6,y+n*5));
      colors.push(c.r,c.g,c.b);
    }
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3)); geometry.computeVertexNormals();
    const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
    surfaceDetails.terrain(material,snow);
    scene.add(new THREE.Mesh(geometry,material));
    if(trees){
      const firstTree=treePlacements.length;
      for(let i=0;i<1800;i++){
        const x=cx+(random()*2-1)*rx*.96,z=cz+(random()*2-1)*rz*.96,y=elevation(x,z);
        if(y>1.2 && y<height*.8 && exposure(x,z,y)<.72){
          const h=(1.8+random()*3.4)*(cz < -100 ? 1.5:1);
          treePlacements.push({x,y,z,h,shade:random()});
        }
      }
      const ground=terrainSurface(geometry,exposure);
      shrubPlacements.push(...plantUnderstory(ground,treePlacements.slice(firstTree),seed,cz>-80?(rx<30?3:9):5));

    }
  }
  island(-176,-260,168,60,118,4,false,true);
  island(38,-290,173,62,135,8,false,true);
  island(195,-275,151,75,98,2,false,true);
  island(-105,-123,87,61,56,4);
  island(114,-131,93,67,58,1);
  island(61,-49,46,52,32,7);
  island(-109,-37,70,55,30,12);
  island(36,27,24,24,10,3);

  scene.add(createForest(treePlacements),createUnderstory(shrubPlacements));
  if(debug)mount.dataset.shrubs=String(shrubPlacements.length);

  const rockMaterial=new THREE.MeshStandardMaterial({color:'#52646a',roughness:.92,vertexColors:true});
  surfaceDetails.rock(rockMaterial);
  const rockGeometry=new THREE.IcosahedronGeometry(1,2);
  const rp=rockGeometry.attributes.position, rcolors=[];
  for(let i=0;i<rp.count;i++){
    const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i); const n=terrainNoise(x*8+4,z*9+y*5);
    rp.setXYZ(i,x*(1+n*.14),y*(1+n*.15),z*(1+n*.13));
    const c=color('#84958d').lerp(color('#b0ac8e'),smooth(.1,.8,y)*.35).multiplyScalar(.85+n*.22);rcolors.push(c.r,c.g,c.b);
  }
  rockGeometry.setAttribute('color',new THREE.Float32BufferAttribute(rcolors,3));rockGeometry.computeVertexNormals();
  function rock(x,y,z,sx,sy,sz){const m=new THREE.Mesh(rockGeometry,rockMaterial);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.set(random()*.3,random()*6,random()*.3);scene.add(m);}
  for(let i=0;i<58;i++){
    const a=random()*Math.PI*2,r=19+random()*9;
    const x=36+Math.cos(a)*r,z=27+Math.sin(a)*r;
    const size=.6+random()*2.5; rock(x,-.3,z,size,size*.52,size*.8);
  }
  rock(16,-.1,26,4.5,2.2,3.4);rock(11,-.25,32,2.8,1.2,2.1);rock(-18,-.2,35,2.8,.8,2.4);
  rock(24,.1,12,3.4,2.0,2.8);

  const {ferry, windowMat}=createFerry();
  ferry.position.set(-4,0,-52);ferry.rotation.y=.12+THREE.MathUtils.degToRad(40)+Math.PI;scene.add(ferry);

  const reflection=new THREE.WebGLRenderTarget(960,640,{type:THREE.HalfFloatType,depthBuffer:true});
  const reflectionCamera=camera.clone();
  const textureMatrix=new THREE.Matrix4();
  const biasMatrix=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
  const ripples=Array.from({length:6},()=>new THREE.Vector4(0,0,-100,0));
  const waterUniforms={uReflection:{value:reflection.texture},uMatrix:{value:textureMatrix},uTime:{value:0},uSun:{value:new THREE.Vector3()},uSunColor:{value:color('#fff2cd')},uWater:{value:color('#164c58')},uFog:{value:scene.fog.color},uFogDensity:{value:scene.fog.density},uDay:{value:1},uRain:{value:currentRain},uFerry:{value:new THREE.Vector3()},uFerryHeading:{value:ferry.rotation.y},uRipples:{value:ripples}};
  const waveGLSL=`
    uniform float uTime; uniform vec4 uRipples[6];
    float wave(vec2 p){
      vec2 drift=vec2(uTime*.075,-uTime*.048);
      vec2 q=mat2(.8,.6,-.6,.8)*p;
      float y=(noise(p*.11+drift)-.5)*.34;
      y+=(noise(q*.29-drift*.73+vec2(19.,7.))-.5)*.13;
      y+=(noise(mat2(.39,-.92,.92,.39)*p*.73+drift*1.4+vec2(41.,13.))-.5)*.045;
      for(int i=0;i<6;i++){float t=uTime-uRipples[i].z;float d=length(p-uRipples[i].xy);float shell=d-t*2.4;y+=sin(d*4.-t*7.)*exp(-shell*shell*.26)*exp(-t*.6)*smoothstep(0.,.3,t)*uRipples[i].w;}
      return y;
    }
  `;
  const water=new THREE.Mesh(new THREE.PlaneGeometry(1300,1300,180,180).rotateX(-Math.PI/2),new THREE.ShaderMaterial({
    uniforms:waterUniforms, transparent:false,
    vertexShader:`${noiseGLSL} ${waveGLSL} varying vec3 vWorld; varying vec4 vReflection; uniform mat4 uMatrix;
      void main(){vec3 p=position;p.y+=wave(p.xz);vWorld=(modelMatrix*vec4(p,1.)).xyz;vReflection=uMatrix*vec4(vWorld,1.);gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
    fragmentShader:`${noiseGLSL} ${waveGLSL} uniform sampler2D uReflection;uniform vec3 uSun,uSunColor,uWater,uFog,uFerry;uniform float uDay,uRain,uFogDensity,uFerryHeading;varying vec3 vWorld;varying vec4 vReflection;
      vec3 rainImpact(vec2 p){
        vec2 grid=p*.55, cell=floor(grid), slope=vec2(0.);float crest=0.;
        for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
          vec2 id=cell+vec2(float(x),float(y));
          float clock=uTime*.85+hash(id+73.);float age=fract(clock);
          vec2 seed=id+floor(clock)*17.31;
          vec2 center=id+vec2(.15)+vec2(hash(seed),hash(seed+29.))*.7;
          vec2 delta=grid-center;float d=length(delta),q=d-age*.48;
          float envelope=exp(-q*q*150.)*sin(age*3.14159)*sin(age*3.14159);
          slope+=delta/max(d,.01)*sin(q*38.)*envelope*.075;
          crest+=exp(-q*q*900.)*envelope;
        }
        return vec3(slope,crest);
      }
      void main(){
        vec2 p=vWorld.xz;float e=.1;float h=wave(p);
        vec3 normal=normalize(vec3((h-wave(p+vec2(e,0.)))/e,1.,(h-wave(p+vec2(0.,e)))/e));
        float detailFade=1.-smoothstep(.15,1.2,length(fwidth(p)));
        normal.xz+=vec2(noise(p*1.2+uTime*.08)-.5,noise(p*1.4-uTime*.07+34.)-.5)*.022*detailFade;
        vec3 impact=vec3(0.);
        if(uRain>.002){
          impact=rainImpact(p)*uRain*detailFade;
          normal.xz+=impact.xy;

        }
        normal=normalize(normal);
        vec3 viewDir=normalize(cameraPosition-vWorld);float fresnel=.12+.78*pow(1.-max(dot(viewDir,normal),0.),3.);
        vec2 uv=vReflection.xy/vReflection.w;
        uv+=normal.xz*.022;
        vec3 reflected=texture2D(uReflection,clamp(uv,vec2(.001),vec2(.999))).rgb;
        vec3 c=mix(uWater,reflected,fresnel);
        c+=vec3(.48,.62,.65)*impact.z*.035*(.25+.75*uDay);
        float spec=pow(max(dot(normal,normalize(uSun+viewDir)),0.),340.);
        c+=uSunColor*spec*(.8+uDay*1.3)*(1.-uRain*.88);
        float shimmer=pow(max(dot(normal,normalize(uSun+viewDir)),0.),28.)*.035;
        c+=uSunColor*shimmer;
        vec2 rel=p-uFerry.xz;
        float headingCos=cos(uFerryHeading),headingSin=sin(uFerryHeading);
        vec2 wakeRel=vec2(headingCos*rel.x-headingSin*rel.y,headingSin*rel.x+headingCos*rel.y);
        float wakeWidth=.22+max(-wakeRel.x,0.)*.15;
        float wake=exp(-pow((abs(wakeRel.y)-wakeWidth)*2.2,2.))*smoothstep(1.,3.,-wakeRel.x)*(1.-smoothstep(5.,26.,-wakeRel.x));
        wake*=.6+.4*sin(wakeRel.x*4.+uTime*2.);
        c=mix(c,vec3(.62,.77,.75)*(.18+.82*uDay),wake*.24);
        float lamp=exp(-pow(rel.x*.65,2.))*exp(-abs(rel.y)*.17)*(.5+.5*sin(rel.y*8.+uTime*2.));
        c+=vec3(1.,.53,.19)*lamp*(1.-uDay)*.2;
        float fogDepth=-(viewMatrix*vec4(vWorld,1.)).z;float fog=1.-exp(-uFogDensity*uFogDensity*fogDepth*fogDepth);
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        gl_FragColor.rgb=mix(gl_FragColor.rgb,linearToOutputTexel(vec4(uFog,1.)).rgb,fog);
      }`
  }));
  // Keep the finite edge beyond the coastline while waves and pointer rings share world coordinates.
  water.geometry.translate(0,0,-220);
  scene.add(water);
  const driftwoodPlacements=[
    {x:14,y:.035,z:7,length:3.4,radius:.17,direction:new THREE.Vector3(.91,0,-.41).normalize()},
    {x:14.5,y:.025,z:-39,length:2.6,radius:.14,direction:new THREE.Vector3(.65,0,.76).normalize()}
  ];
  scene.add(createDriftwood(driftwoodPlacements,waterUniforms,noiseGLSL+waveGLSL));
  if(debug)mount.dataset.driftwood=JSON.stringify(driftwoodPlacements.map(({x,z})=>({x,z})));
  const rain = createRain(scene);
  const lowClouds = createLowClouds(scene);
  if(debug){
    const gl=renderer.getContext(),timer=gl.getExtension('EXT_disjoint_timer_query_webgl2');
    renderer.domElement.dataset.cloudGpuTimer=timer?'available':'unavailable';
    renderer.domElement.dataset.cloudParticles=String(lowClouds.mesh.geometry.instanceCount);
    if(timer){
      const pending=[],samples={main:[],reflection:[]};let activeQuery=null,passes=0;
      lowClouds.mesh.onBeforeRender=(_renderer,_scene,passCamera)=>{
        const disjoint=gl.getParameter(timer.GPU_DISJOINT_EXT);
        while(pending.length&&gl.getQueryParameter(pending[0].query,gl.QUERY_RESULT_AVAILABLE)){
          const {query,kind}=pending.shift();
          if(!disjoint){samples[kind].push(gl.getQueryParameter(query,gl.QUERY_RESULT)/1e6);if(samples[kind].length>60)samples[kind].shift();}
          gl.deleteQuery(query);
        }
        for(const kind of ['main','reflection'])if(samples[kind].length){const sorted=[...samples[kind]].sort((a,b)=>a-b);renderer.domElement.dataset[kind+'CloudGpuMs']=sorted[Math.floor(sorted.length*.5)].toFixed(3);}
        if(++passes%15===0&&pending.length<8){activeQuery={query:gl.createQuery(),kind:passCamera===camera?'main':'reflection'};gl.beginQuery(timer.TIME_ELAPSED_EXT,activeQuery.query);}
      };
      lowClouds.mesh.onAfterRender=()=>{if(activeQuery){gl.endQuery(timer.TIME_ELAPSED_EXT);pending.push(activeQuery);activeQuery=null;}};
    }
  }

  let live=true, paused=reduced.matches, onscreen=true, sceneTime=0, last=performance.now(), currentHour=localHour(), targetHour=currentHour;
  let rippleIndex=0,rippleCount=0,frameCount=0;
  let pressedWater=null, draggedWater=false;
  const pointer=new THREE.Vector2(),pointerTarget=new THREE.Vector2();
  const raycaster=new THREE.Raycaster(),waterPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),intersection=new THREE.Vector3();
  function localHour(){const d=new Date();return d.getHours()+d.getMinutes()/60+d.getSeconds()/3600;}
  function writeTime(){
    const shown=live?localHour():targetHour;
    if(range && document.activeElement!==range)range.value=String(shown);
    const minutes=Math.floor(shown*60+1e-7)%1440;
    const date=new Date(2020,0,1,Math.floor(minutes/60),minutes%60);
    if(timeLabel)timeLabel.textContent=date.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
    if(timeMode)timeMode.textContent=live?'Local time':'Exploring the day';
    if(liveButton)liveButton.setAttribute('aria-pressed',String(live));
  }
  function writeMotion(){if(motionButton){motionButton.textContent=paused?'Resume scene':'Pause scene';motionButton.setAttribute('aria-pressed',String(paused));}}
  range?.addEventListener('input',()=>{live=false;targetHour=Number(range.value)%24;needsRender=true;writeTime();});
  liveButton?.addEventListener('click',()=>{live=true;targetHour=localHour();writeTime();});
  motionButton?.addEventListener('click',()=>{paused=!paused;writeMotion();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;writeMotion();});
  function pointerCoordinates(event){
    const bounds=mount.getBoundingClientRect();
    return new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);
  }
  function addRipple(event){
    if(paused||reduced.matches)return;
    raycaster.setFromCamera(pointerCoordinates(event),camera);
    if(raycaster.ray.intersectPlane(waterPlane,intersection)&&intersection.z>-95&&intersection.z<40){
      ripples[rippleIndex].set(intersection.x,intersection.z,sceneTime,.23);
      rippleIndex=(rippleIndex+1)%ripples.length;rippleCount++;
    }
  }
  mount.addEventListener('pointermove',event=>{
    if(event.pointerType!=='touch'&&!paused&&!reduced.matches)pointerTarget.copy(pointerCoordinates(event));
    if(pressedWater&&Math.hypot(event.clientX-pressedWater.x,event.clientY-pressedWater.y)>7)draggedWater=true;
  },{passive:true});
  mount.addEventListener('pointerdown',event=>{if(event.button===0){pressedWater={x:event.clientX,y:event.clientY};draggedWater=false;}},{passive:true});
  mount.addEventListener('click',event=>{if(!draggedWater)addRipple(event);pressedWater=null;},{passive:true});
  mount.addEventListener('pointercancel',()=>{pressedWater=null;draggedWater=true;});
  mount.addEventListener('pointerleave',()=>{pointerTarget.set(0,0);if(pressedWater)draggedWater=true;pressedWater=null;});
  function writeWeather(){rainButton?.setAttribute('aria-pressed',String(targetRain>.5));mount.dataset.weather=targetRain>.5?'rain':'clear';}
  rainButton?.addEventListener('click',()=>{weatherOverride=true;targetRain=targetRain>.5?0:1;needsRender=true;writeWeather();});
  new IntersectionObserver(entries=>{onscreen=entries[0].isIntersecting;},{threshold:0}).observe(mount);
  let renderWidth=0,renderHeight=0,renderPixelRatio=0;
  function resize(){
    const w=mount.clientWidth,h=mount.clientHeight,pixelRatio=Math.min(devicePixelRatio,1.6);
    if(!w||!h||(w===renderWidth&&h===renderHeight&&pixelRatio===renderPixelRatio))return;
    renderWidth=w;renderHeight=h;renderPixelRatio=pixelRatio;
    // Resizing clears the drawing buffer. Do it immediately before rendering,
    // never in a ResizeObserver that can run after that frame's render.
    renderer.setDrawingBufferSize(w,h,pixelRatio);
    camera.aspect=w/h;
    const portrait=1-smooth(.72,1.15,camera.aspect);
    camera.fov=mix(46,64,portrait);
    cameraBase.set(mix(0,8,portrait),mix(13,12,portrait),mix(44,58,portrait));
    aim.set(mix(0,4,portrait),mix(8,7,portrait),-80);
    camera.updateProjectionMatrix();
    const reflectionScale=Math.min(1,1200/w,800/h);
    reflection.setSize(Math.max(1,Math.round(w*reflectionScale)),Math.max(1,Math.round(h*reflectionScale)));
    needsRender=true;
  }
  function updateCamera(){
    camera.position.set(cameraBase.x+pointer.x*.7,cameraBase.y+pointer.y*.28,cameraBase.z);
    camera.lookAt(aim.x+pointer.x*.25,aim.y+pointer.y*.1,aim.z);
  }
  resize();updateCamera();
  const dayTop=color('#4e7fa0'),nightTop=color('#071326'),duskTop=color('#344d75');
  const dayHorizon=color('#b5c9cc'),nightHorizon=color('#26394f'),duskHorizon=color('#ed9270');
  const dayWater=color('#205160'),nightWater=color('#102936');
  const rainSky=color('#758181'),rainHorizon=color('#929d9b'),rainWater=color('#344b4c');
  const rainLight=color('#bac2be'),rainNight=color('#66717f');
  function lighting(){
    const solar=sunAtLocalHour(currentHour);
    const elevation=Math.sin(solar.altitude);
    const day=smooth(Math.sin(-6*Math.PI/180),Math.sin(5*Math.PI/180),elevation);
    const dusk=Math.exp(-Math.pow(elevation/.12,2))*day;
    // Keep the sun within the composed view; its height and daylight follow
    // the real sun, while the scene has no fixed geographic camera bearing.
    const sunDir=new THREE.Vector3(Math.sin(solar.azimuth)*.74,Math.max(elevation,.025),-.7).normalize();
    sunDir.lerp(new THREE.Vector3(.38,.46,-.8).normalize(),1-smooth(-.35,-.08,elevation)).normalize();
    skyUniforms.uTop.value.copy(nightTop).lerp(dayTop,day).lerp(duskTop,dusk*.5);
    skyUniforms.uHorizon.value.copy(nightHorizon).lerp(dayHorizon,day).lerp(duskHorizon,dusk*.9);
    skyUniforms.uTop.value.lerp(rainSky.clone().multiplyScalar(.16+day*.84),currentRain);
    skyUniforms.uHorizon.value.lerp(rainHorizon.clone().multiplyScalar(.13+day*.87),currentRain);
    skyUniforms.uRain.value=currentRain;
    skyUniforms.uSun.value.copy(sunDir);skyUniforms.uDay.value=day;skyUniforms.uDusk.value=dusk;
    skyUniforms.uSunColor.value.set('#aecbfa').lerp(color('#ffdfaf'),day);
    sun.position.copy(sunDir).multiplyScalar(200);sun.color.copy(skyUniforms.uSunColor.value);sun.intensity=mix(.38,2.6,day)*(1-dusk*.25)*(1-currentRain*.85);
    hemi.intensity=mix(.54,2.25,day)*(1-currentRain*.23);hemi.color.set('#6f94bb').lerp(color('#c4dfed'),day).lerp(rainNight.clone().lerp(rainLight,day),currentRain);fill.intensity=mix(.22,.5,day)*(1-currentRain*.35);fill.color.set('#78b8d6').lerp(rainLight,currentRain);
    scene.fog.color.copy(skyUniforms.uHorizon.value).lerp(skyUniforms.uTop.value,.13);
    scene.fog.density=mix(.0036,.0065,currentRain);
    waterUniforms.uFogDensity.value=scene.fog.density;
    waterUniforms.uRain.value=currentRain;
    surfaceDetails.setWetness(currentRain);
    rain.update(sceneTime,currentRain,day,!reduced.matches);
    lowClouds.update(sceneTime,currentRain,day);

    waterUniforms.uSun.value.copy(sunDir);waterUniforms.uSunColor.value.copy(skyUniforms.uSunColor.value);
    waterUniforms.uWater.value.copy(nightWater).lerp(dayWater,day).lerp(rainWater.clone().multiplyScalar(.24+day*.76),currentRain);waterUniforms.uDay.value=day;
    windowMat.emissiveIntensity=mix(2.8,.12,day)+currentRain*day*.78;
    renderer.toneMappingExposure=mix(1.15,1.04,day);
    mount.dataset.daylight=day.toFixed(3);
  }
  const reflectedTarget=new THREE.Vector3(),lookDirection=new THREE.Vector3();
  const clippingPlane=new THREE.Plane(new THREE.Vector3(0,1,0),.16);
  function render(){
    camera.updateMatrixWorld();camera.getWorldDirection(lookDirection);
    reflectedTarget.copy(camera.position).add(lookDirection);reflectedTarget.y*=-1;
    reflectionCamera.position.copy(camera.position);reflectionCamera.position.y*=-1;
    reflectionCamera.up.set(0,-1,0);reflectionCamera.lookAt(reflectedTarget);
    reflectionCamera.projectionMatrix.copy(camera.projectionMatrix);reflectionCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);reflectionCamera.updateMatrixWorld();
    textureMatrix.copy(biasMatrix).multiply(reflectionCamera.projectionMatrix).multiply(reflectionCamera.matrixWorldInverse);
    const rainVisible=rain.streaks.visible;rain.streaks.visible=false;
    water.visible=false;renderer.clippingPlanes=[clippingPlane];renderer.setRenderTarget(reflection);renderer.render(scene,reflectionCamera);
    renderer.clippingPlanes=[];water.visible=true;rain.streaks.visible=rainVisible;renderer.setRenderTarget(null);renderer.render(scene,camera);
  }
  renderer.debug.onShaderError=(gl,program,vs,fs)=>{mount.dataset.error=[gl.getProgramInfoLog(program),gl.getShaderInfoLog(vs),gl.getShaderInfoLog(fs)].join('\n');};
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();mount.dataset.error='The graphics context was interrupted.';mount.dataset.ready='false';});
  writeTime();writeMotion();writeWeather();lighting();document.documentElement.style.setProperty('--arrival-fog',scene.fog.color.getStyle());waterUniforms.uFerry.value.copy(ferry.position);render();mount.dataset.ready=mount.dataset.error?'false':'true';
  let lastLabel=0;
  const frameIntervals=[];
  let lastMetrics=0;
  function frame(now){
    requestAnimationFrame(frame);
    const elapsed=now-last;const dt=Math.min(elapsed/1000,.05);last=now;
    if(document.hidden||!onscreen)return;
    resize();
    if(live)targetHour=localHour();
    const hourDifference=((targetHour-currentHour+36)%24)-12;
    const changing=Math.abs(hourDifference)>.0005;
    currentHour=(currentHour+hourDifference*(1-Math.exp(-dt*4.2))+24)%24;
    const weatherChanging=Math.abs(currentRain-targetRain)>.0005;
    currentRain+= (targetRain-currentRain)*(1-Math.exp(-dt*1.6));
    if(!weatherChanging)currentRain=targetRain;
    const active=!paused;
    if(active)sceneTime+=dt;
    if(active&&!reduced.matches)pointer.lerp(pointerTarget,1-Math.exp(-dt*2));
    updateCamera();
    ferry.position.x=-4-Math.sin(sceneTime*.009)*15;ferry.position.y=Math.sin(sceneTime*.7)*.055;ferry.rotation.z=Math.sin(sceneTime*.45)*.003;
    waterUniforms.uFerry.value.copy(ferry.position);waterUniforms.uTime.value=sceneTime;skyUniforms.uTime.value=sceneTime;
    if(active||changing||weatherChanging||needsRender){lighting();render();needsRender=false;frameCount++;}
    if(now-lastLabel>1000){
      writeTime();lastLabel=now;
      const today=weatherForDate();
      if(today.key!==dailyWeather.key){dailyWeather=today;if(!weatherOverride){targetRain=today.rainy?1:0;writeWeather();}}
    }
    if(debug){
      if(active){frameIntervals.push(elapsed);if(frameIntervals.length>180)frameIntervals.shift();}
      if(now-lastMetrics>1000&&frameIntervals.length){const sorted=[...frameIntervals].sort((a,b)=>a-b);renderer.domElement.dataset.frameMedian=sorted[Math.floor(sorted.length*.5)].toFixed(2);renderer.domElement.dataset.frameP95=sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))].toFixed(2);renderer.domElement.dataset.calls=String(renderer.info.render.calls);lastMetrics=now;}
      renderer.domElement.dataset.ripples=String(rippleCount);renderer.domElement.dataset.rain=currentRain.toFixed(4);renderer.domElement.dataset.weatherDate=dailyWeather.key;renderer.domElement.dataset.frame=String(frameCount);renderer.domElement.dataset.time=sceneTime.toFixed(4);renderer.domElement.dataset.hour=currentHour.toFixed(5);renderer.domElement.dataset.delta=dt.toFixed(5);renderer.domElement.dataset.paused=String(paused);renderer.domElement.dataset.triangles=String(renderer.info.render.triangles);}
  }
  requestAnimationFrame(frame);
}
