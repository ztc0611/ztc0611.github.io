(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const video = document.querySelector('#watch-video');
  const playButton = document.querySelector('#watch-play');
  const playLabel = document.querySelector('#watch-play-label');
  const watchStatus = document.querySelector('#watch-status');
  const watchLight = document.querySelector('#watch-light');
  playButton.addEventListener('click', async () => {
    if (!video.paused) { video.pause(); return; }
    if (video.ended) video.currentTime = 0;
    try { await video.play(); }
    catch { watchStatus.textContent = 'The recording could not play. Explore the project to see more.'; }
  });
  video.addEventListener('play', () => {
    playLabel.textContent = 'Pause watch demo';
    watchLight.classList.add('playing');
    watchStatus.textContent = 'Playing the actual watchOS app recording.';
  });
  video.addEventListener('pause', () => {
    playLabel.textContent = video.ended ? 'Replay watch demo' : 'Play watch demo';
    watchLight.classList.remove('playing');
    watchStatus.textContent = video.ended ? 'Recording complete. Awaiting App Review.' : 'Recording paused. Awaiting App Review.';
  });
  video.addEventListener('ended', () => {
    playLabel.textContent = 'Replay watch demo';
    watchStatus.textContent = 'Recording complete. Awaiting App Review.';
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  new IntersectionObserver(entries => { if (!entries[0].isIntersecting) video.pause(); }).observe(video);

  const canvas = document.querySelector('#photo');
  const context = canvas.getContext('2d');
  const mix = document.querySelector('#photo-mix');
  const photoStatus = document.querySelector('#photo-status');
  const shutter = document.querySelector('#shutter');
  const small = document.createElement('canvas');
  small.width = 120; small.height = 90;
  const pixels = small.getContext('2d', {willReadFrequently:true});
  const photo = new Image();
  const tones = [[36,48,30],[89,109,66],[162,175,118],[228,229,181]];
  const bayer = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  let ready = false;
  let printAnimation;
  function renderPhoto() {
    if (!ready) return;
    context.imageSmoothingEnabled = true;
    context.drawImage(photo, 0, 0, 480, 360);
    pixels.drawImage(photo, 0, 0, 120, 90);
    const image = pixels.getImageData(0, 0, 120, 90);
    for (let y = 0; y < 90; y++) {
      for (let x = 0; x < 120; x++) {
        const offset = (y * 120 + x) * 4;
        const luminance = image.data[offset] * .299 + image.data[offset + 1] * .587 + image.data[offset + 2] * .114;
        const threshold = (bayer[y % 4][x % 4] / 16 - .46875) * 76;
        const tone = tones[Math.max(0, Math.min(3, Math.round((luminance + threshold) / 85)))];
        image.data.set([...tone,255], offset);
      }
    }
    pixels.putImageData(image, 0, 0);
    context.imageSmoothingEnabled = false;
    context.globalAlpha = Number(mix.value) / 100;
    context.drawImage(small, 0, 0, 480, 360);
    context.globalAlpha = 1;
  }
  photo.onload = () => { ready = true; renderPhoto(); };
  photo.onerror = () => { photoStatus.textContent = 'The sample photo could not load.'; shutter.disabled = true; };
  photo.src = '../objects/sample-photo.jpg';
  mix.addEventListener('input', () => {
    document.querySelector('#mix-value').textContent = mix.value + '%';
    renderPhoto();
    photoStatus.textContent = 'Dither set to ' + mix.value + '%. Press the shutter to develop.';
  });
  shutter.addEventListener('click', () => {
    if (!ready) { photoStatus.textContent = 'The sample photo is still loading.'; return; }
    const print = document.querySelector('#photo-print');
    document.querySelector('#print-image').src = canvas.toDataURL('image/png');
    document.querySelector('#print-caption').textContent = mix.value + '% dither / a little experiment';
    document.querySelector('#print-instruction').hidden = true;
    document.querySelector('.desk').classList.add('has-print');
    print.hidden = false;
    printAnimation?.cancel();
    if (!reducedMotion.matches) {
      printAnimation = print.animate([
        {transform:'translateX(-50%) translateY(-140px) rotate(0deg)'},
        {transform:'translateX(-50%) translateY(0) rotate(-4deg)'}
      ], {duration:700,easing:'cubic-bezier(.2,.6,.3,1)'});
    }
    photoStatus.textContent = 'Your print is ready at ' + mix.value + '% dither. Adjust the mix to make another.';
  });

  const drawing = document.querySelector('#drawing');
  const ink = drawing.getContext('2d');
  const drawButton = document.querySelector('#draw-pass');
  const passStatus = document.querySelector('#pass-status');
  const indicators = [...document.querySelectorAll('[data-pass]')];
  const half = ['..........','........11','......1122','.....11222','....112222','...1122222','...1222222','...1224422','...1225522','...1222222','...1222222','...1122222','....122222','....112222','...12.12.2','...12.12.2','...12.12.2','......12.2','.........2','..........'];
  const grid = half.map(row => row + [...row].reverse().join(''));
  const colors = {'1':'#355c55','2':'#7b9b84','4':'#fffef4','5':'#1d332e'};
  const passes = [{key:'1',name:'outline'},{key:'2',name:'color'},{key:'4',name:'eyes'},{key:'5',name:'pupils'}];
  let pass = 0;
  let busy = false;
  function clearDrawing() {
    ink.fillStyle = '#e4e7db'; ink.fillRect(0,0,320,320);
    ink.strokeStyle = '#c9d0bf'; ink.lineWidth = .5;
    for (let i=16; i<320; i+=16) { ink.beginPath(); ink.moveTo(i,0); ink.lineTo(i,320); ink.moveTo(0,i); ink.lineTo(320,i); ink.stroke(); }
  }
  function paint(cell,key) {
    const inset = key === '5' ? 3 : 0;
    ink.fillStyle = colors[key];
    ink.fillRect(cell[0]*16+inset,cell[1]*16+inset,16*(cell[2] || 1)-inset*2,16-inset*2);
  }
  drawButton.addEventListener('click', () => {
    if (busy) return;
    if (pass === 4) {
      pass = 0; clearDrawing(); indicators.forEach(light => light.className = '');
      drawButton.innerHTML = 'Draw the outline <span aria-hidden="true">↵</span>';
      passStatus.textContent = 'Ready for pass 1 of 4';
      return;
    }
    const current = passes[pass];
    const cells = [];
    grid.forEach((row,y) => [...row].forEach((key,x) => {
      // The eye pass lays white beneath the smaller pupils, preserving an eye surround.
      if (current.key === '5' && key === '5') {
        if (row[x - 1] !== '5') cells.push([x,y,row.slice(x).match(/^5+/)[0].length]);
      } else if (key === current.key || (current.key === '4' && key === '5')) {
        cells.push([x,y]);
      }
    }));
    busy = true; drawButton.disabled = true; indicators[pass].className = 'active';
    passStatus.textContent = 'Drawing the ' + current.name;
    let count = 0;
    let start;
    function frame(time) {
      if (start === undefined) start = time;
      const target = reducedMotion.matches ? cells.length : Math.min(cells.length,Math.floor((time-start)/750*cells.length));
      while (count < target) { paint(cells[count],current.key); count++; }
      if (count < cells.length) { requestAnimationFrame(frame); return; }
      indicators[pass].className = 'complete'; pass++; busy = false; drawButton.disabled = false;
      passStatus.textContent = pass === 4 ? 'Complete. One squid, four color passes.' : 'Pass ' + pass + ' of 4 complete';
      drawButton.innerHTML = (pass === 4 ? 'Clear the drawing' : 'Draw the ' + passes[pass].name) + ' <span aria-hidden="true">↵</span>';
    }
    requestAnimationFrame(frame);
  });
  clearDrawing();
})();
