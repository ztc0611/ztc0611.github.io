(() => {
  'use strict';
  const video = document.querySelector('#watch-video');
  if (!video) return;

  const loader = document.querySelector('#watch-loader');
  const poster = document.querySelector('#watch-poster');
  const stage = video.closest('.watch') || video;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const h264 = video.querySelector('source:last-child');

  let onscreen = false;
  let prewarmed = false;
  let playPending = false;
  let frameShown = false;
  let autoplayBlocked = false;
  let fallbackTried = false;
  let fallbackRetryPending = false;
  let frameCallbackPending = false;

  function showLoader(on) {
    loader?.classList.toggle('hidden', !on);
  }

  function showFrame() {
    if (reduced.matches) return;
    frameShown = true;
    poster?.classList.add('hidden');
    showLoader(false);
  }

  function showPoster() {
    frameShown = false;
    poster?.classList.remove('hidden');
    showLoader(false);
  }

  function prewarm() {
    if (prewarmed || reduced.matches) return;
    prewarmed = true;
    video.preload = 'auto';
    video.load();
  }

  function tryH264() {
    if (fallbackTried || !h264 || !video.currentSrc.includes('watchos-loop.hevc.mp4')) return false;
    fallbackTried = true;
    fallbackRetryPending = playPending;
    frameCallbackPending = false;
    showPoster();
    video.src = h264.src;
    video.load();
    if (onscreen && !document.hidden && !reduced.matches) resume();
    return true;
  }

  function resume() {
    if (!onscreen || reduced.matches || document.hidden || autoplayBlocked) return;
    prewarm();
    if (playPending || !video.paused) return;
    if (!frameShown) showLoader(true);
    if (video.ended) video.currentTime = 0;
    playPending = true;
    const started = video.play();
    if (!started || !started.then) {
      playPending = false;
      return;
    }
    started.then(() => {
      playPending = false;
      if (fallbackRetryPending) {
        fallbackRetryPending = false;
        resume();
        return;
      }
      if (!onscreen || reduced.matches || document.hidden) suspend();
    }).catch((error) => {
      playPending = false;
      if (error.name === 'NotAllowedError') {
        autoplayBlocked = true;
        showPoster();
        return;
      }
      if (fallbackRetryPending) {
        fallbackRetryPending = false;
        resume();
        return;
      }
      if (error.name === 'AbortError') return;
      if (tryH264()) return;
      showPoster();
    });
  }

  function suspend() {
    if (!video.paused) video.pause();
    showLoader(false);
  }

  video.addEventListener('playing', () => {
    if (reduced.matches) return;
    if (frameShown) {
      showLoader(false);
    } else if ('requestVideoFrameCallback' in video && !frameCallbackPending) {
      frameCallbackPending = true;
      video.requestVideoFrameCallback(() => {
        frameCallbackPending = false;
        showFrame();
      });
    } else if (!('requestVideoFrameCallback' in video) && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      showFrame();
    }
  });
  video.addEventListener('waiting', () => {
    if (onscreen && !reduced.matches && !document.hidden) showLoader(true);
  });
  video.addEventListener('error', () => {
    if (!tryH264()) showPoster();
  });

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
  if (reduced.matches) showLoader(false);
})();
