(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rests = [...document.querySelectorAll('[data-select]')];
  const panels = [...document.querySelectorAll('[data-project]')];
  const video = document.querySelector('#watch-video');
  const playLabel = document.querySelector('#watch-play-label');
  const watchStatus = document.querySelector('#watch-status');
  let selected = 'aweigh';
  function select(project) {
    if (selected === project) return;
    selected = project;
    rests.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.select === project)));
    panels.forEach(panel => { panel.hidden = panel.dataset.project !== project; });
    if (project !== 'aweigh') video.pause();
  }
  rests.forEach((button, index) => {
    button.addEventListener('click', () => select(button.dataset.select));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % rests.length;
      if (event.key === 'ArrowLeft') next = (index + rests.length - 1) % rests.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = rests.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      rests[next].focus();
      select(rests[next].dataset.select);
    });
  });
  document.querySelectorAll('[data-owner]').forEach(control => {
    ['focus', 'input', 'pointerdown'].forEach(type => control.addEventListener(type, () => select(control.dataset.owner)));
  });
  document.querySelector('#watch-play').addEventListener('click', async () => {
    if (!video.paused) { video.pause(); return; }
    if (video.ended) video.currentTime = 0;
    try { await video.play(); }
    catch { watchStatus.textContent = 'The recording could not play. The case study includes the app in detail.'; }
  });
  video.addEventListener('play', () => {
    playLabel.textContent = 'Pause the demo';
    watchStatus.textContent = 'Playing the actual watchOS app recording.';
  });
  video.addEventListener('pause', () => {
    playLabel.textContent = video.ended ? 'Replay the watch demo' : 'Play the watch demo';
    watchStatus.textContent = video.ended ? 'Recording complete. Replay whenever you like.' : 'Recording paused.';
  });
  video.addEventListener('ended', () => {
    playLabel.textContent = 'Replay the watch demo';
    watchStatus.textContent = 'Recording complete. Replay whenever you like.';
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });

  const canvas = document.querySelector('#photo');
  const context = canvas.getContext('2d');
  const mix = document.querySelector('#photo-mix');
  const mixValue = document.querySelector('#mix-value');
  const photoStatus = document.querySelector('#photo-status');
  const small = document.createElement('canvas');
  small.width = 120; small.height = 90;
  const pixels = small.getContext('2d', {willReadFrequently:true});
  const photo = new Image();
  const tones = [[31,51,59],[82,112,108],[155,174,147],[230,235,205]];
  const bayer = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  let ready = false;
  let readable = true;
  function renderPhoto() {
    if (!ready) return;
    const amount = Number(mix.value) / 100;
    context.imageSmoothingEnabled = true;
    context.drawImage(photo, 0, 0, 480, 360);
    pixels.drawImage(photo, 0, 0, 120, 90);
    if (readable) {
      try {
        const image = pixels.getImageData(0, 0, 120, 90);
        for (let y = 0; y < 90; y++) {
          for (let x = 0; x < 120; x++) {
            const offset = (y * 120 + x) * 4;
            const luminance = image.data[offset] * .299 + image.data[offset + 1] * .587 + image.data[offset + 2] * .114;
            const threshold = (bayer[y % 4][x % 4] / 16 - .46875) * 76;
            const tone = tones[Math.max(0, Math.min(3, Math.round((luminance + threshold) / 85)))];
            image.data.set([...tone, 255], offset);
          }
        }
        pixels.putImageData(image, 0, 0);
      } catch { readable = false; }
    }
    context.imageSmoothingEnabled = false;
    context.globalAlpha = amount;
    if (!readable) context.filter = 'grayscale(1) contrast(180%)';
    context.drawImage(small, 0, 0, 480, 360);
    context.filter = 'none';
    context.globalAlpha = 1;
  }
  photo.onload = () => { ready = true; renderPhoto(); };
  photo.onerror = () => { photoStatus.textContent = 'The sample photo could not load.'; document.querySelector('#shutter').disabled = true; };
  photo.src = '../objects/sample-photo.jpg';
  mix.addEventListener('input', () => {
    select('pixellate');
    mixValue.textContent = mix.value + '%';
    renderPhoto();
    photoStatus.textContent = 'Mix set to ' + mix.value + '%. Develop to keep this version.';
  });
  document.querySelector('#shutter').addEventListener('click', () => {
    select('pixellate');
    if (!ready) { photoStatus.textContent = 'The sample photo is still loading.'; return; }
    const print = document.querySelector('#photo-print');
    const image = document.querySelector('#print-image');
    try { image.src = canvas.toDataURL('image/png'); }
    catch { image.src = photo.src; image.style.filter = 'grayscale(1) contrast(180%)'; }
    document.querySelector('#print-caption').textContent = 'San Juan Islands / ' + mix.value + '%';
    print.hidden = false;
    if (!reducedMotion.matches) print.animate([{transform:'translateY(-25px) rotate(2deg)',opacity:.4},{transform:'translateY(0) rotate(10deg)',opacity:1}], {duration:350,easing:'ease-out'});
    photoStatus.textContent = 'Photo developed at ' + mix.value + '%. Change the mix to make another.';
  });

  const drawing = document.querySelector('#drawing');
  const ink = drawing.getContext('2d');
  const drawButton = document.querySelector('#draw-pass');
  const passLabel = document.querySelector('#pass-label');
  const led = document.querySelector('#machine-led');
  const half = ['..........','........11','......1122','.....11222','....112222','...1122222','...1222222','...1224422','...1225522','...1222222','...1222222','...1122222','....122222','....112222','...12.12.2','...12.12.2','...12.12.2','......12.2','.........2','..........'];
  const grid = half.map(row => row + [...row].reverse().join(''));
  const colors = {'1':'#6c456b','2':'#ba7791','4':'#f1eee5','5':'#253a47'};
  const passes = [{key:'1',name:'outline'},{key:'2',name:'color'},{key:'4',name:'eyes'},{key:'5',name:'pupils'}];
  let pass = 0;
  let busy = false;
  function clearDrawing() {
    ink.fillStyle = '#293f49'; ink.fillRect(0,0,320,320);
    ink.strokeStyle = '#3a5059'; ink.lineWidth = .5;
    for (let i=16; i<320; i+=16) { ink.beginPath(); ink.moveTo(i,0); ink.lineTo(i,320); ink.moveTo(0,i); ink.lineTo(320,i); ink.stroke(); }
  }
  function paint(cell, key) { ink.fillStyle = colors[key]; ink.fillRect(cell[0]*16, cell[1]*16,16,16); }
  drawButton.addEventListener('click', () => {
    select('printing');
    if (busy) return;
    if (pass === passes.length) { pass = 0; clearDrawing(); drawButton.textContent = 'Draw the outline'; passLabel.textContent = 'Ready for the outline'; return; }
    const current = passes[pass];
    const cells = [];
    grid.forEach((row,y) => [...row].forEach((key,x) => { if(key === current.key) cells.push([x,y]); }));
    busy = true; drawButton.disabled = true; led.classList.add('is-on');
    passLabel.textContent = 'Drawing the ' + current.name;
    let count = 0;
    let start;
    function finish() {
      pass++; busy = false; drawButton.disabled = false; led.classList.remove('is-on');
      passLabel.textContent = pass === 4 ? 'Complete. Four color passes.' : 'Pass ' + pass + ' of 4 complete';
      drawButton.textContent = pass === 4 ? 'Clear the drawing' : 'Draw the ' + passes[pass].name;
    }
    function frame(time) {
      if (start === undefined) start = time;
      const target = reducedMotion.matches ? cells.length : Math.min(cells.length, Math.floor((time-start)/850*cells.length));
      while (count < target) { paint(cells[count],current.key); count++; }
      if (count === cells.length) finish(); else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
  clearDrawing();
})();
