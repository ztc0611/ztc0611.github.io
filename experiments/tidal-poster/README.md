# A little further out

Open `http://127.0.0.1:8770/` using the repository's local static server. This design is now the homepage, authored in the root `index.html`. The scene and presentation modules remain in this directory. Both `/portfolio.html` and the old experiment URL redirect home, preserving query parameters and section anchors.

A real Three.js scene opens across a forested inlet: layered terrain, instanced fir trees, a moving ferry, foreground rocks, reflective water, clouds and stars. It extends the atmospheric landscape idea from `mountains.html` into three dimensions. The work remains ordinary HTML below the opening.

## Interactions

- Click or tap the water to make a ripple. Hover and drag do not make ripples. Camera response is deliberately small and eased.
- Fog covers scene initialization and softly disperses once rendering is ready.
- Rain or clear weather is chosen from a deterministic hash of the local calendar date. The Rain button overrides it until reload; this is an imagined atmosphere, not a forecast.
- Lighting starts at the browser's local clock time. Drag the time slider to explore daylight, dusk and night; Use local time restores the live clock.
- Pause scene freezes water, ferry, clouds, rain and camera response. Lighting controls remain usable.
- The scene suspends animation and rendering while hidden or fully offscreen. Reduced motion starts paused and disables pointer parallax/ripples.

SunCalc 1.9.0 calculates solar altitude for 48.54193° N, 122.83040° W using the visitor's date and selected local clock time. Daylight and twilight follow the real sun and vary with the seasons. The sun's horizontal placement remains art-directed for the camera composition. No location permission or remote service is used. The BSD-licensed source is vendored in `vendor/suncalc.mjs`, with only its module wrapper adapted; its license is beside it.

## Implementation

Three.js 0.180.0 browser modules are pinned locally in `vendor/`, with their upstream MIT license. The scene makes no runtime requests to third parties. Terrain, trees, boat, cloud textures and surface patterns are generated locally. Water reflections render the actual mirrored scene. Rocks and terrain share a small triplanar detail texture with mineral grain, moss, and rain-dependent wetness. Five instanced fir variants use rooted trunks, irregular branch volumes around a shaded, filled crown, shared bark/needle maps, and simpler distant geometry. The reference-inspired double-ended ferry has twin wheelhouses, open deck ends and warm windows, consolidated into seven meshes. Low clouds use 24 textured particles in one instanced mesh, placed at several depths across the hilltops. They descend and thicken during rain, render in the water reflection, and skip drawing in clear weather. Their shared procedural texture is 256 pixels square. Rain uses one instanced mesh with GPU-animated streaks and builds near-total overcast. Randomized expanding impact rings perturb the water normal; clear and rainy weather share the same underlying swell and reflection sharpness. WebGL failure leaves the title, fallback background and all project content usable.

Three.js is a JavaScript 3D library; WebAssembly is not required. See the [official project](https://threejs.org/) and [source repository](https://github.com/mrdoob/three.js/).

## Verification

Parent browser QA covered 1280×720 and 390×844, noon/evening/midnight lighting, restoring local time, click-only raycast water interaction (including drag rejection), fog removal, local-date weather selection, rain toggling and pause behavior, rooted forest geometry, fixed title/control bounds while paused, frozen animation time, mobile camera framing, and no horizontal overflow. The browser reported no shader or console errors. In the local in-app browser, active rendering measured 16.7ms median frame intervals and approximately 17.3–17.7ms at the 95th percentile. These measurements use desktop hardware at the two viewport sizes, not a physical phone performance test.

Optional `?motion-check` records canvas data attributes for render count, simulation time, displayed hour, pause state, recent frame timing, draw calls and triangles. Metrics collection is disabled at the ordinary URL. Native local links, assets and JavaScript syntax have been checked.

When available, `?motion-check` also measures the low-cloud draw using asynchronous GPU timer queries, separately for the main view and reflection. This measures the cloud draw, not whole-frame GPU time. The normal page does not run these queries.

Rocky shorelines are formed directly in the island terrain as continuous low cliffs and broad shelves. Slope and elevation determine exposed bedrock, green ground and patches of dry golden grass; trees avoid bare cliff faces. The original foreground boulders remain.

Local low-cloud GPU samples at 1280×720 measured approximately 1.5ms for the main view and 0.7ms for the reflection. At a 390×844 viewport on the same desktop hardware, the corresponding samples were approximately 0.6ms and 0.3ms. These are cloud-draw timings, not whole-frame GPU timings or measurements on a phone.

Sky horizon haze and water fog use the same output-space fog color as Three.js terrain materials, including the linear reflection pass. Rain raises the haze into the mountain silhouettes.

The Aweigh project uses the existing Apple Watch and iPhone Air frame assets with opaque, clipped screen apertures. The watch plays the pre-crossfaded loop recording while at least 35% visible, pauses offscreen or when the page is hidden, and preserves deliberate pauses. Reduced motion starts with a still poster and permits a single requested play. Device framing was checked at 1280×900 and 390×844; autoplay, offscreen suspension, automatic resume and persistent manual pause were verified in the browser.

The page includes all seven Godot contribution entries and six additional project rows. System/light/dark appearance changes page colors without alternative image downloads. The appearance choice is saved locally. Native technical disclosures retain keyboard support. Link actions and release statuses share one consistent column edge.
