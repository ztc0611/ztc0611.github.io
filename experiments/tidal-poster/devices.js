(() => {
  'use strict';
  const video = document.querySelector('#watch-video');
  const button = document.querySelector('#watch-play');
  if (!video || !button) return;

  const label = document.querySelector('#play-label');
  const symbol = document.querySelector('#play-symbol');
  const status = document.querySelector('#watch-status');
  const stage = video.closest('.watch') || video;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Reduced motion starts in the same state as a deliberate pause: the poster
  // frame stands still until someone asks for the recording.
  let paused = reduced.matches;
  let onscreen = false;
  let fetched = false;

  video.loop = !reduced.matches;

  function sync() {
    const playing = !video.paused && !video.ended;
    button.setAttribute('aria-pressed', String(playing));
    symbol.textContent = playing ? '❚❚' : '▶';
    label.textContent = playing ? 'Pause watch demo'
      : video.ended ? 'Replay watch demo'
      : 'Play watch demo';
  }

  function play(byRequest) {
    if (!fetched) {
      fetched = true;
      video.preload = 'auto';
      video.load();
    }
    if (video.ended) video.currentTime = 0;
    const started = video.play();
    if (!started || !started.catch) return;
    started.catch((error) => {
      // Scrolling away can interrupt a pending play. That is not an autoplay
      // refusal and must not prevent the next visible section from resuming.
      if (error.name === 'AbortError') return;
      // A browser refusing to start it on its own is ordinary, so leave the
      // control sitting on "Play" and say nothing. A refused press is not.
      if (byRequest) status.textContent = 'The recording could not play. Explore Aweigh to see more.';
      else paused = true;
      sync();
    });
  }

  function resume() {
    if (onscreen && !paused && !document.hidden) play(false);
  }

  function suspend() {
    if (!video.paused) video.pause();
  }

  button.addEventListener('click', () => {
    if (!video.paused) {
      paused = true;
      suspend();
      return;
    }
    paused = false;
    status.textContent = '';
    play(true);
  });

  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  video.addEventListener('ended', sync);

  new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    onscreen = entry.isIntersecting && entry.intersectionRatio >= 0.35;
    if (onscreen) resume(); else suspend();
  }, { threshold: 0.35 }).observe(stage);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspend(); else resume();
  });

  reduced.addEventListener('change', (event) => {
    video.loop = !event.matches;
    if (event.matches) {
      paused = true;
      suspend();
    }
  });

  button.hidden = false;
  sync();
})();
