(() => {
  const hour = new Date().getHours();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.style.setProperty('--arrival-fog', hour < 6 || hour >= 19 ? '#20354b' : '#91a6b3');
  document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('#scene');
    const fog = document.querySelector('.arrival-fog');
    let revealing = false;
    function depart() {
      if (revealing) return;
      revealing = true;
      if (reduced.matches) fog.hidden = true;
      // Let the first rendered canvas reach the compositor before uncovering it.
      else requestAnimationFrame(() => requestAnimationFrame(() => fog.classList.add('departing')));
      observer.disconnect();
    }
    function reveal() {if(scene.dataset.ready === 'true' || scene.dataset.error)depart();}
    const observer = new MutationObserver(reveal);
    observer.observe(scene, {attributes:true,attributeFilter:['data-ready','data-error']});
    fog.addEventListener('transitionend', event => {if (event.target === fog && event.propertyName === 'opacity') fog.hidden = true;});
    reveal();
    // A failed module request must not leave an opaque loading layer over the fallback indefinitely.
    setTimeout(depart, 12000);
  }, {once:true});
})();
