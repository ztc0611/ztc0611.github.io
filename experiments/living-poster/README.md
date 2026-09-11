# Living poster

Open `http://127.0.0.1:8770/experiments/living-poster/` with the repository's local static server running. This is an isolated design study; it does not replace the current portfolio.

The opening uses an analytic WebGL surface with bounded local wave impulses. Pointer movement, touch and the ripple button disturb it. The text stays in the DOM and remains anchored. Still water freezes the current surface, and waking it resumes the same simulation time. The control area keeps its dimensions in both states.

The renderer stops after waves settle and pauses offscreen or while the document is hidden. Reduced motion suppresses waves and smooth scrolling. WebGL failure leaves a static CSS surface and usable portfolio. Pixel resolution is capped independently of layout. No third-party libraries, fonts or remote requests are needed to render the page.

The watch recording plays deliberately and pauses offscreen. The rest of the work uses existing imagery with reserved layout space and native navigation.

## Verification

Reviewed at 1280×720 and 390×844. No horizontal overflow at those sizes. Verified native ripple activation without scroll movement, identical title/footer positions when pausing, mobile work layout, watch playback, and local image loading. Active renderer measurements in the in-app browser were 16.7ms median frame intervals and 17.5–17.6ms at the 95th percentile. This is a local observation, not a guarantee on other hardware. Reduced-motion and visibility lifecycle paths were reviewed in source.

For an optional local diagnostic, append `?motion-check` and inspect the canvas `data-motion` attribute. It records render count, simulation time and recent frame intervals, without displaying a diagnostic UI. The ordinary URL does not collect those samples.
