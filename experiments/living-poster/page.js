(() => {
  'use strict';
  const video=document.querySelector('#watch-video');
  const button=document.querySelector('#watch-play');
  const label=document.querySelector('#play-label');
  const symbol=document.querySelector('#play-symbol');
  const status=document.querySelector('#watch-status');
  button.addEventListener('click',async()=>{
    if(!video.paused){video.pause();return;}
    if(video.ended)video.currentTime=0;
    try{await video.play();}catch{status.textContent='The recording could not play. Explore Aweigh to see more.';}
  });
  function sync(){const playing=!video.paused&&!video.ended;button.setAttribute('aria-pressed',String(playing));label.textContent=playing?'Pause watch demo':video.ended?'Replay watch demo':'Play watch demo';symbol.textContent=playing?'Ⅱ':'▶';}
  video.addEventListener('play',sync);video.addEventListener('pause',sync);video.addEventListener('ended',sync);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)video.pause();}).observe(video);
})();
