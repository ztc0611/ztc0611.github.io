(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tabs = [...document.querySelectorAll('[data-tab]')];
  const panels = [...document.querySelectorAll('[data-panel]')];
  const video = document.querySelector('#watch-video');
  const watchLabel = document.querySelector('#watch-label');
  const watchStatus = document.querySelector('#watch-status');
  const watchButton = document.querySelector('#watch-play');
  function select(tab) {
    tabs.forEach(button => { const active = button === tab; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
    panels.forEach(panel => { panel.hidden = panel.dataset.panel !== tab.dataset.tab; });
    if (tab.dataset.tab !== 'aweigh') video.pause();
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if(event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if(event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if(event.key === 'Home') next = 0;
      if(event.key === 'End') next = tabs.length - 1;
      if(next === undefined) return;
      event.preventDefault(); select(tabs[next]); tabs[next].focus();
    });
  });
  watchButton.addEventListener('click', async () => {
    if (!video.paused) return video.pause();
    if (video.ended) video.currentTime = 0;
    try { await video.play(); } catch { watchStatus.textContent = 'Recording unavailable. Explore Aweigh in the case study.'; }
  });
  video.addEventListener('play', () => {watchLabel.textContent = 'Pause the recording'; watchStatus.textContent = 'Playing the actual watchOS app.'; watchButton.setAttribute('aria-pressed', 'true');});
  video.addEventListener('pause', () => {watchLabel.textContent = 'Play the recording'; watchStatus.textContent = 'Recording paused.'; watchButton.setAttribute('aria-pressed', 'false');});
  video.addEventListener('ended', () => {watchLabel.textContent = 'Replay the recording'; watchStatus.textContent = 'End of recording. Take another look any time.';});
  document.addEventListener('visibilitychange', () => {if(document.hidden) video.pause();});
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {if(!entries[0].isIntersecting) video.pause();}).observe(document.querySelector('#folio'));

  const canvas = document.querySelector('#photo');
  const ctx = canvas.getContext('2d');
  const mix = document.querySelector('#photo-mix');
  const photoStatus = document.querySelector('#photo-status');
  const small = document.createElement('canvas'); small.width=120; small.height=90;
  const pixels = small.getContext('2d', {willReadFrequently:true});
  const photograph = new Image(); let ready=false;
  const tones = [[33,53,48],[88,111,85],[154,168,119],[226,226,175]];
  const bayer = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  function render() {
    if(!ready) return;
    ctx.imageSmoothingEnabled=true; ctx.drawImage(photograph,0,0,480,360);
    pixels.drawImage(photograph,0,0,120,90);
    const data=pixels.getImageData(0,0,120,90);
    for(let y=0;y<90;y++) for(let x=0;x<120;x++) {
      const offset=(y*120+x)*4;
      const luminance=data.data[offset]*.299+data.data[offset+1]*.587+data.data[offset+2]*.114;
      const threshold=(bayer[y%4][x%4]/16-.46875)*76;
      data.data.set([...tones[Math.max(0,Math.min(3,Math.round((luminance+threshold)/85)))],255],offset);
    }
    pixels.putImageData(data,0,0); ctx.imageSmoothingEnabled=false; ctx.globalAlpha=Number(mix.value)/100;
    ctx.drawImage(small,0,0,480,360); ctx.globalAlpha=1;
  }
  photograph.onload=()=>{ready=true;render();};
  photograph.onerror=()=>{photoStatus.textContent='The sample photograph could not load.';document.querySelector('#shutter').disabled=true;};
  photograph.src='../objects/sample-photo.jpg';
  mix.addEventListener('input',()=>{document.querySelector('#mix-value').value=mix.value+'%';render();photoStatus.textContent='Mix set to '+mix.value+'%. Your last print stays as it was.';});
  document.querySelector('#shutter').addEventListener('click',()=>{
    if(!ready){photoStatus.textContent='The sample photograph is still loading.';return;}
    const print=document.querySelector('#print'); print.getContext('2d').drawImage(canvas,0,0);
    document.querySelector('#empty-print').hidden=true;
    document.querySelector('#print-caption').textContent='Four colors / '+mix.value+'% mix';
    photoStatus.textContent='Print kept at '+mix.value+'%. Try another mix.';
    if(!reduced.matches) print.animate([{opacity:.2},{opacity:1}],{duration:650,easing:'ease-out'});
  });

  const drawing=document.querySelector('#drawing');const ink=drawing.getContext('2d');
  const drawButton=document.querySelector('#draw-pass');const drawingStatus=document.querySelector('#drawing-status');
  const indicators=[...document.querySelectorAll('[data-pass]')];
  const half=['..........','........11','......1122','.....11222','....112222','...1122222','...1222222','...1224422','...1225522','...1222222','...1222222','...1122222','....122222','....112222','...12.12.2','...12.12.2','...12.12.2','......12.2','.........2','..........'];
  const grid=half.map(row=>row+[...row].reverse().join(''));
  const colors={'1':'#63415f','2':'#b77c92','4':'#fffdf2','5':'#1e2930'};
  const passes=[{key:'1',name:'outline'},{key:'2',name:'color'},{key:'4',name:'eyes'},{key:'5',name:'pupils'}];
  let pass=0,busy=false;
  function clear(){ink.fillStyle='#d9dcca';ink.fillRect(0,0,320,320);ink.strokeStyle='#c5ccb7';ink.lineWidth=.5;for(let i=16;i<320;i+=16){ink.beginPath();ink.moveTo(i,0);ink.lineTo(i,320);ink.moveTo(0,i);ink.lineTo(320,i);ink.stroke();}}
  function paint(cell,key){ink.fillStyle=colors[key];if(key==='5'){ink.fillRect(cell[0]*16+7,cell[1]*16-9,18,18);}else{ink.fillRect(cell[0]*16,cell[1]*16,16,16);}}
  drawButton.addEventListener('click',()=>{
    if(busy)return;
    if(pass===4){pass=0;clear();indicators.forEach(item=>item.classList.remove('complete'));drawButton.textContent='Draw the outline';drawingStatus.textContent='Canvas cleared. Ready for another drawing.';return;}
    const current=passes[pass],cells=[];
    grid.forEach((row,y)=>[...row].forEach((key,x)=>{if(key===current.key||(current.key==='4'&&key==='5')){if(current.key!=='5'||row[x-1]!=='5')cells.push([x,y]);}}));
    busy=true;drawButton.disabled=true;drawingStatus.textContent='Drawing the '+current.name+'…';
    let count=0,start;
    function finish(){indicators[pass].classList.add('complete');pass++;busy=false;drawButton.disabled=false;drawButton.textContent=pass===4?'Clear the drawing':'Draw the '+passes[pass].name;drawingStatus.textContent=pass===4?'Complete. Four colors, one squid.':'Pass '+pass+' of 4 complete.';}
    function frame(time){if(start===undefined)start=time;const target=reduced.matches?cells.length:Math.min(cells.length,Math.floor((time-start)/650*cells.length));while(count<target){paint(cells[count],current.key);count++;}if(count===cells.length)finish();else requestAnimationFrame(frame);}
    requestAnimationFrame(frame);
  });
  clear();
})();
