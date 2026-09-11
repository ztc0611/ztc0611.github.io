# Tidal poster: Aweigh device pair fix

## What was wrong

`experiments/living-poster/poster.css` (shared, not editable) rendered the watch as:

```css
.watch video{left:12.768%;top:21.818%;width:74.464%;height:56.477%;
             object-fit:fill;border-radius:24%}
```

Three separate faults:

1. `border-radius: 24%` on a non-square box resolves per axis, so the corners
   are ellipses with a 24%-of-width horizontal radius and a 24%-of-height
   vertical radius. Both are far rounder than the frame's cutout, so
   `.map-art` showed through at all four screen corners. This is the reported
   "bezel does not match the video scaling".
2. `object-fit: fill` stretched the 416x496 recording into whatever box the
   percentages produced.
3. The video was a sibling of the frame with no masking element and no opaque
   backing, so any mismatch fell through to the well.

The phone was an unframed screenshot inside a faked `7px solid #233644` border
with `height: 110%; top: 14%`, i.e. cropped off the bottom of the well.

`portfolio.css:844` already documents the same corner trap for the production
hero watch, and solves it with `border-radius: 11.5cqw`.

## Authority used

`aweigh/style.css` (read-only) and its markup in `aweigh/index.html`:

| | asset | frame px | screen px | aperture |
|---|---|---|---|---|
| watch | `watchos-frame.webp` | 1120x1760 | 834x994 at y=384 | top 21.818% left 12.768% w 74.464% h 56.477% |
| phone | `ios-frame.webp` | 1380x2880 | 1260x2736 at 60,73 | top 2.535% left 4.348% w 91.304% h 95% |

Both frames carry alpha (VP8X flag 0x10 / 0x34), so the frame image layers over
the screen at `inset: 0`, `z-index: 2`.

## Fit checks (computed, not eyeballed)

- Watch recording is 416x496 = 0.83871; the aperture is 834/994 = 0.83903.
  With `width: 100%; height: auto` centered, the video overflows the aperture
  by 0.039% vertically. No letterbox, no stretch.
- Phone screenshot `ios-delay-tracking.webp` is 1260x2736, exactly the
  aperture, so `object-fit: cover` is lossless.
- Watch corner radius: the target is 11.5% of the watch's width (the value
  `portfolio.css` arrived at via `cqw`). Expressed against the screen box that
  is `15.44% / 12.96%`, which resolves to 0.11497 and 0.11502 watch-widths.
  Equal pixels, circular corners, no container query needed.
- Phone corner radius `13% / 6%` is the Aweigh site's value: 163.8px and
  164.2px against the 1260x2736 screen.
- Pair proportions follow the Aweigh `device-pair` (300px iPhone next to a
  160px watch = 0.4016 height ratio). CSS uses 92% / 36.9% = 0.4011.
- Pair width vs. available width, floor line and 5% side padding included:

  | viewport | well | phone | watch | pair | available |
  |---|---|---|---|---|---|
  | 1440 | 1296x720 | 283x591 | 151x237 | 486 | 1166 |
  | 1100 | 990x550 | 208x434 | 111x174 | 368 | 891 |
  | 760 | 684x380 | 133x278 | 71x111 | 238 | 616 |
  | 600 | 540x514 | 204x425 | 109x171 | 339 | 497 |
  | 390 | 342x326 | 119x248 | 63x99 | 199 | 315 |
  | 320 | 272x259 | 89x185 | 47x74 | 150 | 250 |

- The pair stands on a floor line 78px (62px under 600px) above the bottom of
  the well. The play control's top edge sits ~66px (~50px) above the bottom,
  so the two never overlap at any width.

## Playback

`../living-poster/page.js` was the only script bound to `#watch-video` and did
nothing else on this page, so it was swapped for a local `devices.js` rather
than leaving two owners of the same state. `living-poster/index.html` still
loads `page.js` and is untouched.

`watchos-loop.mp4` / `.hevc.mp4` replaced `watchos.mp4`: the crossfade is baked
into the loop asset (see the note at `portfolio.html:100`), so a single native
`loop` video gives the smooth loop that the Aweigh hero needs a two-video
double-buffer and a 3s hold to fake. One element, one owner.

Behaviour: muted + playsinline, `preload="none"` until first needed; starts
when >=35% of the watch is on screen; pauses offscreen and on
`visibilitychange`; a deliberate pause sticks and is never auto-resumed.
`prefers-reduced-motion` starts in the paused state and clears `loop`, so a
requested play runs once and offers "Replay watch demo". A rejected autoplay is
silent (expected); a rejected press writes to the `role="status"` line.

## Possible follow-ups

- The watch screen could take the `watch-loader` spinner from the Aweigh hero
  if buffering ever reads as a dead black box. The poster frame currently
  covers that gap.
- The well is `aspect-ratio: 1.8` from shared `poster.css`. That is wide for a
  fully visible pair, so there is a lot of map on either side. Narrowing the
  well is the lever if the devices should read bigger, but it changes the
  page's rhythm and was left alone.
