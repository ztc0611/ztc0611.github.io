(() => {
  'use strict';
  const canvas = document.getElementById('water');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) { document.getElementById('ripple').disabled = true; return; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const rippleButton = document.getElementById('ripple');
  function syncMotionControl() {
    rippleButton.disabled = reduce.matches;
    rippleButton.innerHTML = reduce.matches ? 'Still water <span aria-hidden="true">◌</span>' : 'Touch the water <span aria-hidden="true">◌</span>';
  }
  syncMotionControl();
  const vertex = 'attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const fragment = `precision highp float;
    varying vec2 uv;
    uniform vec2 resolution;
    uniform float time;
    uniform float night;
    uniform vec4 drops[12];
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
    float height(vec2 p){
      float h=sin(p.x*14.+p.y*6.+time*.24)*.025+sin(p.y*22.-p.x*5.-time*.19)*.018;
      h+=noise(p*15.+time*.013)*.035;
      for(int i=0;i<12;i++){
        float age=time-drops[i].z;
        if(age>0. && age<5.){
          float d=length(p-drops[i].xy);
          float front=d-age*.23;
          h+=sin(front*85.)*exp(-front*front*95.)*exp(-age*.75)*drops[i].w*.12;
        }
      }
      return h;
    }
    void main(){
      vec2 p=uv*vec2(resolution.x/resolution.y,1.);
      float h=height(p);float e=.0018;
      vec2 normal=vec2(height(p+vec2(e,0.))-h,height(p+vec2(0.,e))-h)/e;
      vec2 bed=p+normal*.018;
      float grain=noise(bed*115.)*.025;
      vec3 shallow=mix(vec3(.87,.94,.88),vec3(.60,.82,.79),smoothstep(0.,1.5,p.x));
      vec3 deep=mix(vec3(.39,.66,.72),vec3(.24,.56,.65),uv.y);
      vec3 color=mix(shallow,deep,smoothstep(.1,1.1,uv.x)*.65);
      vec2 tile=abs(fract(bed*5.)-.5);
      float seams=smoothstep(.475,.496,max(tile.x,tile.y));
      color-=seams*.033;
      float caustic=abs(sin(bed.x*29.+sin(bed.y*18.)+time*.10)+sin(bed.y*27.+sin(bed.x*13.)-time*.08));
      color+=pow(max(0.,1.-caustic*.7),12.)*.067;
      vec3 n=normalize(vec3(-normal*.38,1.));
      vec3 light=normalize(vec3(-.4,.65,1.));
      float diffuse=dot(n,light);
      float spec=pow(max(dot(reflect(-light,n),vec3(0.,0.,1.)),0.),22.);
      color+=diffuse*.08+spec*.24+grain;
      color-=normal.y*.022;
      vec3 evening=color*vec3(.20,.38,.48)+vec3(.015,.045,.075);
      evening+=spec*vec3(.28,.40,.39);
      color=mix(color,evening,night);
      gl_FragColor=vec4(color,1.);
    }`;
  function shader(type, source) {
    const item = gl.createShader(type); gl.shaderSource(item, source); gl.compileShader(item);
    if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(item));
    return item;
  }
  let program;
  try {
    program = gl.createProgram(); gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Water shader could not link');
  } catch (error) { canvas.remove(); document.getElementById('ripple').disabled = true; return; }
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const uResolution=gl.getUniformLocation(program,'resolution'),uTime=gl.getUniformLocation(program,'time'),uNight=gl.getUniformLocation(program,'night'),uDrops=gl.getUniformLocation(program,'drops[0]');
  const drops = new Float32Array(48); for(let i=0;i<12;i++) drops[i*4+2]=-99;
  let slot=0, frame=0, until=0, night=0, visible=true, lastPointer=0;
  const start=performance.now();
  const now=()=> (performance.now()-start)/1000;
  function render(){
    frame=0;if(!visible||document.hidden)return;
    const t=reduce.matches?0:now();
    gl.uniform2f(uResolution,canvas.width,canvas.height);gl.uniform1f(uTime,t);gl.uniform1f(uNight,night);gl.uniform4fv(uDrops,drops);gl.drawArrays(gl.TRIANGLES,0,6);
    if(!reduce.matches && now()<until)frame=requestAnimationFrame(render);
  }
  function wake(){if(!frame)frame=requestAnimationFrame(render);}
  function resize(){const bounds=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(bounds.width*dpr);canvas.height=Math.round(bounds.height*dpr);gl.viewport(0,0,canvas.width,canvas.height);wake();}
  function drop(x,y,strength){if(reduce.matches)return;const i=(slot++%12)*4;drops[i]=x*canvas.width/canvas.height;drops[i+1]=1-y;drops[i+2]=now();drops[i+3]=strength;until=now()+5.2;wake();}
  const scene=document.querySelector('.scene');
  scene.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||event.target.closest('a,button'))return;if(performance.now()-lastPointer<90)return;lastPointer=performance.now();const box=scene.getBoundingClientRect();drop((event.clientX-box.left)/box.width,(event.clientY-box.top)/box.height,.3);});
  scene.addEventListener('pointerdown',event=>{if(event.target.closest('a,button'))return;const box=scene.getBoundingClientRect();drop((event.clientX-box.left)/box.width,(event.clientY-box.top)/box.height,.9);});
  new ResizeObserver(resize).observe(scene);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;}}).observe(scene);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
  reduce.addEventListener('change',()=>{syncMotionControl();cancelAnimationFrame(frame);frame=0;wake();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);frame=0;canvas.style.opacity='0';document.getElementById('ripple').disabled=true;});
  window.portfolioWater={drop,setNight(value){night=value?1:0;wake();}};
  resize();
})();
