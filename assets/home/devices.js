(() => {
  'use strict';
  const video = document.querySelector('#watch-video');
  if (!video) return;

  const loader = document.querySelector('#watch-loader');
  const stage = video.closest('.watch') || video;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let autoplayBlocked = false;
  let onscreen = false;

  video.loop = true;

  function resume() {
    if (!onscreen || reduced.matches || document.hidden || autoplayBlocked) return;
    // preload="none" keeps the clip off the wire until someone reaches the card;
    // play() starts that fetch by itself. load() would do it too, but it runs the
    // full media load algorithm first, emptying the element and blanking the
    // poster frame to the screen's black backing for a paint or two.
    if (video.preload !== 'auto') video.preload = 'auto';
    if (video.ended) video.currentTime = 0;
    const started = video.play();
    if (!started || !started.catch) return;
    started.catch((error) => {
      // Scrolling away can interrupt a pending play. That is not an autoplay
      // refusal and must not prevent the next visible section from resuming.
      if (error.name === 'AbortError') return;
      autoplayBlocked = true;
      showLoader(false);
    });
  }

  function suspend() {
    if (!video.paused) video.pause();
    showLoader(false);
  }

  function showLoader(on) {
    if (loader) loader.classList.toggle('hidden', !on);
  }

  // The poster is on the wire from first paint even though preload="none" keeps
  // the clip off it, so the throbber stands only over a screen with genuinely
  // nothing on it. Once the watch's first frame is up, a spinner on top of it is
  // noise over meaningful content.
  const posterUrl = video.getAttribute('poster');
  if (posterUrl) {
    const poster = new Image();
    poster.onload = poster.onerror = () => showLoader(false);
    poster.src = posterUrl;
  }
  video.addEventListener('playing', () => showLoader(false));
  video.addEventListener('error', () => showLoader(false));
  // Only a stall that interrupts playback already under way earns the throbber
  // back. The first fetch happens behind the poster, which is content enough.
  video.addEventListener('waiting', () => { if (video.currentTime > 0) showLoader(true); });

  new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    onscreen = entry.isIntersecting && entry.intersectionRatio >= 0.35;
    if (onscreen) resume(); else suspend();
  }, { threshold: 0.35 }).observe(stage);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspend(); else resume();
  });

  reduced.addEventListener('change', (event) => {
    if (event.matches) suspend(); else resume();
  });
})();
