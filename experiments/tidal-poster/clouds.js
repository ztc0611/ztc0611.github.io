import * as THREE from './vendor/three.module.min.js';

function cloudTexture() {
  const size=256, data=new Uint8Array(size*size*4);
  const hash=(x,y,n)=>{let h=Math.imul((x+n)%n,374761393)^Math.imul((y+n)%n,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};
  function noise(x,y,n){const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy,n),hash(ix+1,iy,n),fx),THREE.MathUtils.lerp(hash(ix,iy+1,n),hash(ix+1,iy+1,n),fx),fy);}
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    let value=0,weight=.55;
    for(let octave=0;octave<5;octave++){const n=4*2**octave;value+=noise(x/size*n,y/size*n,n)*weight;weight*=.5;}
    const i=(y*size+x)*4;data[i]=Math.round(value*255);data[i+1]=data[i+2]=data[i];data[i+3]=255;
  }
  const texture=new THREE.DataTexture(data,size,size);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
  return texture;
}

export function createLowClouds(scene) {
  let seed=88123;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
  const centers=[],shapes=[];
  // Back-to-front banks cross the ridges at different depths, leaving the inlet open.
  const banks=[[-125,65,-215,125,28],[20,66,-205,110,25],[140,62,-200,120,26],[-100,44,-92,112,20],[100,45,-88,112,21],[57,29,-36,64,12]];
  for(const [x,y,z,width,height] of banks)for(let i=0;i<4;i++){
    centers.push(x+(random()-.5)*width*.85,y+(random()-.5)*height*.7,z+random()*8);
    shapes.push(width*(.50+random()*.28),height*(.8+random()*.5),random(),random());
  }
  const plane=new THREE.PlaneGeometry(1,1),geometry=new THREE.InstancedBufferGeometry();
  geometry.index=plane.index;geometry.attributes.position=plane.attributes.position;geometry.attributes.uv=plane.attributes.uv;
  geometry.setAttribute('aCenter',new THREE.InstancedBufferAttribute(new Float32Array(centers),3));
  geometry.setAttribute('aShape',new THREE.InstancedBufferAttribute(new Float32Array(shapes),4));geometry.instanceCount=centers.length/3;
  const uniforms={uTime:{value:0},uRain:{value:0},uColor:{value:new THREE.Color()},uNoise:{value:cloudTexture()}};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,
    vertexShader:`attribute vec3 aCenter;attribute vec4 aShape;uniform float uTime,uRain;varying vec2 vUv;varying vec2 vSeed;
      void main(){vec3 center=aCenter;center.y+=mix(22.,-7.,uRain);center.x+=sin(uTime*.014+aShape.z*6.283)*9.;
      vec4 view=modelViewMatrix*vec4(center,1.);view.xy+=position.xy*aShape.xy;gl_Position=projectionMatrix*view;
      vUv=uv;vSeed=aShape.zw;}`,
    fragmentShader:`uniform sampler2D uNoise;uniform float uTime,uRain;uniform vec3 uColor;varying vec2 vUv,vSeed;
      void main(){vec2 p=vUv*2.-1.;
      vec2 drift=vec2(uTime*.0009,0.);
      float n=texture2D(uNoise,vUv*vec2(1.35,.65)+vSeed+drift).r;
      float tendrils=texture2D(uNoise,vUv*vec2(2.4,.52)+vSeed.yx-drift).r;
      p.y+=(tendrils-.5)*.72;
      float edge=1.-smoothstep(.18,1.,dot(p,p));
      float billow=smoothstep(.25,.63,n+edge*.18);
      vec2 boundary=smoothstep(vec2(0.),vec2(.16),vUv)*(1.-smoothstep(vec2(.84),vec2(1.),vUv));
      float alpha=edge*billow*boundary.x*boundary.y*mix(.025,.82,uRain);
      if(alpha<.002)discard;
      vec3 color=uColor*(.78+vUv.y*.16+n*.18);
      gl_FragColor=vec4(color,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`
  });
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=2;scene.add(mesh);
  return {mesh,update(time,rain,day){mesh.visible=rain>.002;uniforms.uTime.value=time;uniforms.uRain.value=rain;uniforms.uColor.value.setRGB(.30,.325,.33).multiplyScalar(.13+day*.87);}};
}
