(() => {
  'use strict';
  const collection = document.querySelector('.collection');
  const stories = [...document.querySelectorAll('[data-story]')];
  const panels = [...document.querySelectorAll('.object-panel')];
  const projectLinks = [...document.querySelectorAll('[data-project]')];
  const names = { aweigh: 'Aweigh', pixellate: 'Pixellate Camera', printing: 'Printing the Dream' };
  const video = document.querySelector('#watch-video');
  const play = document.querySelector('#watch-play');
  const playLabel = document.querySelector('#watch-label');
  let current = 'aweigh';
  function pauseWatch() {
    video.pause();
    play.setAttribute('aria-pressed', 'false');
    playLabel.textContent = 'Play watch demo';
  }
  function activate(id) {
    if (id === current) return;
    const focusedControl = document.querySelector('.object-panel:not([hidden])')?.contains(document.activeElement);
    current = id;
    // A scroll can leave focus on a control whose exhibit is departing.
    // Move it to the corresponding story so keyboard navigation stays visible.
    if (focusedControl) {
      const story = document.getElementById(id);
      story.setAttribute('tabindex', '-1');
      story.focus({ preventScroll: true });
    }
    collection.dataset.active = id;
    document.querySelector('#stage-name').textContent = names[id];
    panels.forEach(panel => { panel.hidden = panel.id !== `object-${id}`; });
    projectLinks.forEach(link => {
      if (link.dataset.project === id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    if (id !== 'aweigh') pauseWatch();
  }
  function syncScroll() {
    const stage = document.querySelector('.stage');
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const readingLine = mobile ? stage.getBoundingClientRect().bottom + 110 : innerHeight * .48;
    let selected = stories[0];
    stories.forEach(story => { if (story.getBoundingClientRect().top <= readingLine) selected = story; });
    activate(selected.dataset.story);
  }
  let scheduled = false;
  window.addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => { syncScroll(); scheduled = false; });
    }
  }, { passive: true });
  window.addEventListener('resize', syncScroll);
  document.querySelector('.stage').addEventListener('focusout', () => setTimeout(syncScroll, 0));
  projectLinks.forEach(link => link.addEventListener('click', () => activate(link.dataset.project)));
  play.addEventListener('click', async () => {
    if (!video.paused) { pauseWatch(); return; }
    try {
      await video.play();
      play.setAttribute('aria-pressed', 'true');
      playLabel.textContent = 'Pause recording';
      document.querySelector('#watch-status').textContent = 'Recorded on watchOS';
    } catch {
      document.querySelector('#watch-status').textContent = 'Recording unavailable. The watch shows a real app screenshot.';
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseWatch(); });
  const photo = document.querySelector('#photo');
  const context = photo.getContext('2d');
  const dither = document.querySelector('#dither');
  const source = document.createElement('canvas');
  source.width = photo.width; source.height = photo.height;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  const sample = new Image();
  const palette = [[31,37,52], [83,90,116], [157,168,174], [230,233,207]];
  const bayer = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  let original;
  function renderPhoto() {
    document.querySelector('#dither-value').textContent = `${dither.value}%`;
    if (!original) return;
    const out = context.createImageData(photo.width, photo.height);
    const strength = Number(dither.value) / 100;
    for (let y = 0; y < photo.height; y++) {
      for (let x = 0; x < photo.width; x++) {
        const index = (y * photo.width + x) * 4;
        const pixel = ((Math.floor(y / 2) * 2) * photo.width + Math.floor(x / 2) * 2) * 4;
        const grey = original.data[pixel] * .2126 + original.data[pixel + 1] * .7152 + original.data[pixel + 2] * .0722;
        const threshold = (bayer[Math.floor(y / 2) % 4][Math.floor(x / 2) % 4] / 16 - .5) * 62;
        const color = palette[Math.min(3, Math.max(0, Math.round((grey + threshold) / 85)))];
        for (let c = 0; c < 3; c++) out.data[index + c] = original.data[index + c] * (1 - strength) + color[c] * strength;
        out.data[index + 3] = 255;
      }
    }
    context.putImageData(out, 0, 0);
  }
  sample.onload = () => {
    const ratio = Math.max(photo.width / sample.width, photo.height / sample.height);
    sourceContext.drawImage(sample, (photo.width - sample.width * ratio) / 2, (photo.height - sample.height * ratio) / 2, sample.width * ratio, sample.height * ratio);
    original = sourceContext.getImageData(0, 0, photo.width, photo.height);
    renderPhoto();
  };
  sample.onerror = () => { document.querySelector('#photo-status').textContent = 'The sample photograph could not load.'; };
  sample.src = '../objects/sample-photo.jpg';
  dither.addEventListener('input', renderPhoto);
  const save = document.createElement('a');
  save.className = 'save-photo'; save.textContent = 'Save this sample'; save.download = 'pixellate-browser-sample.png'; save.hidden = true;
  document.querySelector('#object-pixellate .object-controls').appendChild(save);
  document.querySelector('#shutter').addEventListener('click', () => {
    if (!original) return;
    save.href = photo.toDataURL('image/png'); save.hidden = false;
    document.querySelector('#photo-status').textContent = 'Sample captured.';
    const camera = document.querySelector('.camera'); camera.classList.add('flash');
    window.setTimeout(() => camera.classList.remove('flash'), 160);
  });
  const drawing = document.querySelector('#drawing');
  const drawingContext = drawing.getContext('2d');
  const pixels = [
    '0000000000000000','0000011111100000','0001111111111000','0011122222211100',
    '0011222222221100','0011233223321100','0011233223321100','0011222222221100',
    '0001222222221000','0001122222211000','0011111111111100','0111011111101110',
    '0110011001100110','0010001000100100','0000000000000000','0000000000000000'
  ];
  const colors = ['#f4edcf', '#824470', '#c87584', '#28394b'];
  let pass = 0;
  function renderDrawing() {
    drawingContext.fillStyle = colors[0]; drawingContext.fillRect(0, 0, 240, 240);
    pixels.forEach((row, y) => [...row].forEach((color, x) => {
      if (Number(color) > pass) return;
      drawingContext.fillStyle = colors[Number(color)]; drawingContext.fillRect(x * 15, y * 15, 15, 15);
    }));
  }
  renderDrawing();
  const print = document.querySelector('#print');
  print.addEventListener('click', () => {
    const plotter = document.querySelector('.plotter');
    if (pass === 3) { pass = 0; renderDrawing(); print.textContent = 'Draw'; document.querySelector('#print-status').textContent = 'Ready for a color pass'; return; }
    pass++;
    renderDrawing(); plotter.classList.add('drawing');
    document.querySelector('#print-status').textContent = pass === 3 ? 'Drawing complete. Three colors, one octopus.' : `Color ${pass} of 3 drawn. Keep going.`;
    if (pass === 3) print.textContent = 'Reset';
    window.setTimeout(() => plotter.classList.remove('drawing'), 550);
  });
  syncScroll();
})();
