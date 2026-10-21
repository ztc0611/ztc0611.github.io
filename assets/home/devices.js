(() => {
  'use strict';
  const video = document.querySelector('#aweigh-video');
  if (!video) return;

  const poster = document.querySelector('#aweigh-poster');
  const stage = video.closest('.loop') || video;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // The loop holds still for a beat after it first scrolls into view, so it
  // reads as a picture before it moves. Later resumes start straight away.
  const SETTLE_MS = 1000;

  let onscreen = false;
  let prewarmed = false;
  let playPending = false;
  let frameShown = false;
  let autoplayBlocked = false;
  let frameCallbackPending = false;
  let settled = false;
  let settleTimer = 0;

  // The poster stays over the video until a real frame has been drawn, so
  // the swap never flashes an empty video box.
  function showFrame() {
    if (reduced.matches) return;
    frameShown = true;
    poster?.classList.add('hidden');
  }

  function showPoster() {
    frameShown = false;
    poster?.classList.remove('hidden');
  }

  function prewarm() {
    if (prewarmed || reduced.matches) return;
    prewarmed = true;
    video.preload = 'auto';
    video.load();
  }

  function resume() {
    if (!onscreen || reduced.matches || document.hidden || autoplayBlocked) return;
    prewarm();
    if (!settled) {
      if (!settleTimer) {
        settleTimer = setTimeout(() => {
          settled = true;
          resume();
        }, SETTLE_MS);
      }
      return;
    }
    if (playPending || !video.paused) return;
    playPending = true;
    const started = video.play();
    if (!started || !started.then) {
      playPending = false;
      return;
    }
    started.then(() => {
      playPending = false;
      if (!onscreen || reduced.matches || document.hidden) suspend();
    }).catch((error) => {
      playPending = false;
      if (error.name === 'NotAllowedError') autoplayBlocked = true;
      if (error.name !== 'AbortError') showPoster();
    });
  }

  function suspend() {
    if (!settled) {
      clearTimeout(settleTimer);
      settleTimer = 0;
    }
    if (!video.paused) video.pause();
  }

  video.addEventListener('playing', () => {
    if (reduced.matches || frameShown) return;
    if ('requestVideoFrameCallback' in video) {
      if (frameCallbackPending) return;
      frameCallbackPending = true;
      video.requestVideoFrameCallback(() => {
        frameCallbackPending = false;
        showFrame();
      });
    } else if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      showFrame();
    }
  });
  video.addEventListener('error', showPoster);

  new IntersectionObserver((entries, observer) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    prewarm();
    observer.disconnect();
  }, { rootMargin: '600px', threshold: 0 }).observe(stage);

  new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    onscreen = entry.isIntersecting && entry.intersectionRatio >= 0.35;
    if (onscreen) resume(); else suspend();
  }, { threshold: 0.35 }).observe(stage);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspend(); else resume();
  });

  reduced.addEventListener('change', (event) => {
    if (event.matches) {
      suspend();
      showPoster();
    } else resume();
  });
})();
