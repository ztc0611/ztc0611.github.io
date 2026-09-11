/* =========================================================================
   PORTFOLIO
   One module, loaded with defer:
     1. the Aweigh watch video in the Apps section
   It is self contained and exits quietly if its markup is absent.
   ========================================================================= */

/* ===================================================================
   AWEIGH WATCH VIDEO

   Default: autoplay, muted, looping, with the spinner shown only while
   the stream is actually stalled. Under prefers-reduced-motion or
   Data Saver: no autoplay, no download, just the poster behind a play
   button that starts it on demand. Either way the video pauses while
   the entry is scrolled off screen.

   The loop crossfade is baked into the file, so one native looping
   video needs no buffer juggling here.
   =================================================================== */
(function () {
  'use strict';

  var screen = document.querySelector('.hero-watch-screen');
  if (!screen) return;

  var video = screen.querySelector('video');
  if (!video) return;

  var loader = screen.querySelector('.hero-loader');
  var well = screen.closest('.hero-slot');
  var playBtn = well ? well.querySelector('.hero-play') : null;
  var routeMap = well ? well.querySelector('.hero-route-map') : null;

  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var thrifty = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
                !!(conn && conn.saveData);

  var started = false;   /* the video has been asked to play at least once */
  var onScreen = true;   /* no observer means always treat it as on screen */

  var ROUTES = {
    'anacortes-friday-harbor': [
      [-122.67797316062789, 48.506542362941644], [-122.67250845412997, 48.516023886296495],
      [-122.75750088274263, 48.52947269282009], [-122.8256796019071, 48.52930036308521],
      [-122.86133030620307, 48.580800828380745], [-122.88327624152518, 48.570833606869485],
      [-122.87812999477507, 48.580247213807866], [-122.88902792906903, 48.58184935531747],
      [-122.90870475487733, 48.561017554593036], [-122.93716047219995, 48.544987252110246],
      [-122.97560596262525, 48.54178058214663], [-122.99770455160983, 48.54518766223745],
      [-123.01041880828592, 48.54298310719054], [-123.01495961424139, 48.5363688658947]
    ],
    'lopez-anacortes': [
      [-122.88327624152518, 48.570833606869485], [-122.86133030620307, 48.580800828380745],
      [-122.8256796019071, 48.52930036308521], [-122.75750088274263, 48.52947269282009],
      [-122.67250845412997, 48.516023886296495], [-122.67797316062789, 48.506542362941644]
    ],
    'lopez-friday-harbor': [
      [-122.88327624152518, 48.570833606869485], [-122.87812999477507, 48.580247213807866],
      [-122.88902792906903, 48.58184935531747], [-122.90870475487733, 48.561017554593036],
      [-122.93716047219995, 48.544987252110246], [-122.97560596262525, 48.54178058214663],
      [-122.99770455160983, 48.54518766223745], [-123.01041880828592, 48.54298310719054],
      [-123.01495961424139, 48.5363688658947]
    ],
    'lopez-orcas': [
      [-122.88327624152518, 48.570833606869485], [-122.87612667408156, 48.581821237098325],
      [-122.90089343618536, 48.586352902305265], [-122.91530289308182, 48.58863228665459],
      [-122.93045277415575, 48.58845800721318], [-122.94099182185982, 48.59072359306842],
      [-122.94362658378358, 48.5973454923882]
    ]
  };
  ROUTES['friday-harbor-anacortes'] = ROUTES['anacortes-friday-harbor'].slice().reverse();

  var TERMINALS = {
    anacortes: { lon: -122.6798, lat: 48.5065 },
    'friday-harbor': { lon: -123.0150, lat: 48.5365 },
    orcas: { lon: -122.9439, lat: 48.5975 },
    lopez: { lon: -122.8833, lat: 48.5708 }
  };

  var ENDPOINTS = {
    'anacortes-friday-harbor': ['anacortes', 'friday-harbor'],
    'friday-harbor-anacortes': ['friday-harbor', 'anacortes'],
    'lopez-anacortes': ['lopez', 'anacortes'],
    'lopez-friday-harbor': ['lopez', 'friday-harbor'],
    'lopez-lopez': ['lopez'],
    'lopez-orcas': ['lopez', 'orcas']
  };

  function routeAt(t) {
    if (t < 2.393333) return 'anacortes-friday-harbor';
    if (t < 6.486667) return 'friday-harbor-anacortes';
    if (t < 9.218333) return 'lopez-anacortes';
    if (t < 9.603333) return 'lopez-friday-harbor';
    if (t < 10.085000) return 'lopez-lopez';
    return 'lopez-orcas';
  }

  function setupRouteMap() {
    if (!routeMap) return Promise.resolve(null);
    return Promise.all([
      fetch('assets/aweigh/sanjuans.svg').then(function (r) { return r.text(); }),
      fetch('assets/aweigh/sanjuans-projection.json').then(function (r) { return r.json(); })
    ]).then(function (parts) {
      routeMap.innerHTML = parts[0];
      var svg = routeMap.querySelector('svg');
      if (!svg) return null;
      svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      var proj = parts[1];
      var project = function (lon, lat) {
        return [(lon - proj.view.west) * proj.lonScale * proj.scale, (proj.view.north - lat) * proj.scale];
      };
      var routePaths = {};
      var routesGroup = svg.querySelector('.map-routes');
      Object.keys(ROUTES).forEach(function (key) {
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', ROUTES[key].map(function (point, index) {
          var p = project(point[0], point[1]);
          return (index ? 'L' : 'M') + p[0].toFixed(2) + ',' + p[1].toFixed(2);
        }).join(''));
        routesGroup.appendChild(path);
        routePaths[key] = path;
      });
      var terminalCircles = {};
      var terminalsGroup = svg.querySelector('.map-terminals');
      Object.keys(TERMINALS).forEach(function (name) {
        var p = project(TERMINALS[name].lon, TERMINALS[name].lat);
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', p[0].toFixed(2));
        circle.setAttribute('cy', p[1].toFixed(2));
        circle.setAttribute('r', '6');
        terminalsGroup.appendChild(circle);
        terminalCircles[name] = circle;
      });
      var previous = '';
      return function (time) {
        var route = routeAt(time);
        if (route === previous) return;
        previous = route;
        Object.keys(routePaths).forEach(function (key) {
          routePaths[key].classList.toggle('is-active', key === route);
        });
        var endpoints = ENDPOINTS[route] || [];
        Object.keys(terminalCircles).forEach(function (name) {
          terminalCircles[name].classList.toggle('is-endpoint', endpoints.indexOf(name) !== -1);
        });
      };
    }).catch(function () { return null; });
  }

  var updateRouteMap = null;
  setupRouteMap().then(function (update) {
    updateRouteMap = update;
    if (updateRouteMap) updateRouteMap(video.currentTime);
  });
  video.addEventListener('timeupdate', function () {
    if (updateRouteMap) updateRouteMap(video.currentTime);
  });

  function showLoader(on) {
    if (loader) loader.classList.toggle('hidden', !on);
  }

  function play() {
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  /* The spinner goes away as soon as the poster is decodable: by then the
     reader sees the watch's first frame, and the spinner is noise on top of
     meaningful content. */
  var posterUrl = video.getAttribute('poster');
  if (posterUrl) {
    var poster = new Image();
    poster.onload = poster.onerror = function () { showLoader(false); };
    poster.src = posterUrl;
  }

  video.addEventListener('playing', function () { showLoader(false); });
  video.addEventListener('waiting', function () { showLoader(true); });

  function begin() {
    started = true;
    video.preload = 'auto';
    if (onScreen) play();
  }

  if (playBtn) {
    playBtn.addEventListener('click', function () {
      playBtn.hidden = true;
      begin();
    });
  }

  if (thrifty) {
    video.preload = 'none';
    showLoader(false);
    if (playBtn) playBtn.hidden = false;
  } else {
    begin();
  }

  /* Decoding frames nobody can see is pure battery. A browser without
     IntersectionObserver simply keeps playing. */
  if (typeof IntersectionObserver === 'function') {
    var target = well || screen;
    new IntersectionObserver(function (entries) {
      onScreen = entries[entries.length - 1].isIntersecting;
      if (!started) return;
      if (onScreen) play();
      else video.pause();
    }, { threshold: 0 }).observe(target);
  }
})();

/* ===================================================================
   THEME-FLIP WARMER
   Every <picture> swaps images when the color scheme changes. Fetching
   the other scheme's variants after load, at idle, makes a live
   light/dark flip paint instantly instead of popping image by image.
   Costs nothing before load and is skipped entirely under Data Saver.
   =================================================================== */
(function () {
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && conn.saveData) return;

  window.addEventListener('load', function () {
    var run = function () {
      var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.querySelectorAll('picture').forEach(function (pic) {
        var source = pic.querySelector('source[media*="dark"]');
        var img = pic.querySelector('img');
        if (!source || !img) return;
        /* Warm whichever variant is NOT currently displayed. */
        var url = dark ? img.getAttribute('src') : source.getAttribute('srcset');
        if (url) { (new Image()).src = url; }
      });
    };
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 4000 });
    else setTimeout(run, 1500);
  });
})();
