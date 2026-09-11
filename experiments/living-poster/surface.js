(() => {
  'use strict';
  const canvas = document.querySelector('#surface');
  const poster = document.querySelector('.poster');
  const ripple = document.querySelector('#ripple');
  const motion = document.querySelector('#motion');
  const inspectMotion = new URLSearchParams(location.search).has('motion-check');
  const frameIntervals = [];
  let paintedFrames = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const gl = canvas.getContext('webgl', {alpha:false, antialias:false, powerPreference:'low-power'});
  if (!gl) return;
  const vertex = `attribute vec2 position; varying vec2 uv;
    void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `precision highp float;
    varying vec2 uv;
    uniform vec2 size;
    uniform float time;
    uniform vec4 waves[24];
    void main(){
      vec2 p=uv*vec2(size.x/size.y,1.);
      float bend=sin(p.y*2.4+p.x*.8);
      float a=p.x*5.1+p.y*3.7+bend*2.1;
      float b=p.x*9.7-p.y*6.4+sin(p.x*2.3)*1.8;
      vec2 slope=vec2(cos(a)*.18+sin(b)*.06,sin(a)*.22+cos(b)*.07);
      for(int i=0;i<24;i++){
        float age=time-waves[i].z;
        if(age>0. && age<3.6){
          vec2 delta=p-waves[i].xy;
          float d=length(delta);
          float q=d-age*.23;
          float fade=(1.-smoothstep(1.4,3.6,age))*smoothstep(0.,.12,age);
          float envelope=exp(-q*q*110.);
          float derivative=(65.*cos(q*65.)-220.*q*sin(q*65.))*envelope;
          slope+=delta/max(d,.015)*derivative*waves[i].w*.011*fade;
        }
      }
      vec2 reflected=p+slope*.32;
      float ribbon=sin(reflected.x*3.1+reflected.y*4.4+sin(reflected.y*2.2)*1.7);
      float silk=sin(reflected.y*9.-reflected.x*4.3+sin(reflected.x*3.)*1.3);
      vec3 color=mix(vec3(.68,.79,.86),vec3(.86,.91,.94),uv.y*.55+.25);
      color+=ribbon*.068+silk*.023;
      vec3 normal=normalize(vec3(slope,1.));
      float gloss=pow(max(dot(normal,normalize(vec3(-.25,.28,1.))),0.),40.);
      color+=gloss*vec3(.10,.105,.10);
      color-=pow(max(dot(normal,normalize(vec3(.5,-.3,1.))),0.),8.)*vec3(.075,.05,.035);
      color=mix(color,vec3(.88,.93,.96),smoothstep(.75,1.7,p.x)*.08);
      gl_FragColor=vec4(color,1.);
    }`;
  function compile(type, source) {
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error('Surface shader unavailable');
    return shader;
  }
  let program;
  try {
    program=gl.createProgram();
    gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Surface program unavailable');
  } catch { canvas.hidden=true;return; }
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const uniforms={size:gl.getUniformLocation(program,'size'),time:gl.getUniformLocation(program,'time'),waves:gl.getUniformLocation(program,'waves[0]')};
  const waves=new Float32Array(96);
  for(let i=0;i<24;i++)waves[i*4+2]=-10;
  let frame=0, clock=0, previous=0, activeUntil=0, slot=0, visible=true, still=false, lost=false;
  let lastDrop=-Infinity,lastPointer=null,bounds=poster.getBoundingClientRect();
  const enabled=()=>!reduced.matches&&!still&&!lost;
  function paint(timestamp){
    frame=0;
    if(!visible||document.hidden||lost)return;
    // Simulation time pauses with rendering, so returning to the poster cannot skip a wave ahead.
    const interval=previous?timestamp-previous:0;
    const dt=Math.min(interval/1000,.04);
    if(inspectMotion){
      if(interval)frameIntervals.push(interval);
      const sorted=frameIntervals.slice(-240).sort((a,b)=>a-b);
      canvas.dataset.motion=JSON.stringify({frames:++paintedFrames,median:sorted[Math.floor(sorted.length/2)]||0,p95:sorted[Math.floor(sorted.length*.95)]||0,time:clock});
    }
    previous=timestamp;
    if(enabled())clock+=dt;
    gl.uniform2f(uniforms.size,canvas.width,canvas.height);gl.uniform1f(uniforms.time,clock);gl.uniform4fv(uniforms.waves,waves);gl.drawArrays(gl.TRIANGLES,0,6);
    if(enabled()&&clock<activeUntil)frame=requestAnimationFrame(paint);
    else previous=0;
  }
  function wake(){if(!frame&&visible&&!document.hidden&&!lost)frame=requestAnimationFrame(paint);}
  function stop(){cancelAnimationFrame(frame);frame=0;previous=0;lastPointer=null;}
  function drop(x,y,strength){
    if(!enabled())return;
    const index=(slot++%24)*4;
    waves[index]=x*bounds.width/bounds.height;waves[index+1]=1-y;waves[index+2]=clock;waves[index+3]=strength;
    activeUntil=clock+3.65;wake();
  }
  function resize(){
    bounds=poster.getBoundingClientRect();
    const scale=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1450000/(bounds.width*bounds.height)));
    const w=Math.round(bounds.width*scale),h=Math.round(bounds.height*scale);
    if(canvas.width!==w||canvas.height!==h){
      // Remap horizontal wave coordinates rather than jumping their positions when the aspect ratio changes.
      const oldAspect=canvas.width/canvas.height,newAspect=w/h;
      for(let i=0;i<24;i++)waves[i*4]*=newAspect/oldAspect;
      canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);
    }
    lastPointer=null;wake();
  }
  poster.addEventListener('pointermove',event=>{
    if(!enabled()||event.pointerType==='touch'||event.target.closest('a,button'))return;
    const now=performance.now();
    const point={x:event.clientX-bounds.left,y:event.clientY-bounds.top};
    if(lastPointer&&Math.hypot(point.x-lastPointer.x,point.y-lastPointer.y)<8)return;
    if(now-lastDrop<165)return;
    lastDrop=now;lastPointer=point;drop(point.x/bounds.width,point.y/bounds.height,.24);
  },{passive:true});
  poster.addEventListener('pointerleave',()=>{lastPointer=null;});
  poster.addEventListener('pointerdown',event=>{
    if(event.target.closest('a,button'))return;
    bounds=poster.getBoundingClientRect();
    drop((event.clientX-bounds.left)/bounds.width,(event.clientY-bounds.top)/bounds.height,.75);
  },{passive:true});
  window.addEventListener('scroll',()=>{bounds=poster.getBoundingClientRect();},{passive:true});
  ripple.addEventListener('click',()=>drop(.67,.55,.8));
  function syncControls(){
    ripple.hidden=lost;ripple.disabled=!enabled();motion.hidden=reduced.matches||lost;
    motion.setAttribute('aria-pressed',String(still));motion.textContent=still?'Wake water':'Still water';
  }
  motion.addEventListener('click',()=>{
    still=!still;syncControls();
    // Pausing preserves the exact displayed surface. Resuming advances from the same simulation time.
    if(still)stop();else wake();
  });
  reduced.addEventListener('change',()=>{
    stop();for(let i=0;i<24;i++)waves[i*4+2]=-10;activeUntil=0;syncControls();wake();
  });
  new ResizeObserver(resize).observe(poster);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){bounds=poster.getBoundingClientRect();wake();}else stop();}).observe(poster);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else wake();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;stop();canvas.hidden=true;syncControls();});
  syncControls();resize();
})();
