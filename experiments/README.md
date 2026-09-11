# Portfolio design studies

`tidal-poster/` is the latest immersive direction: a Three.js coastal scene with local-clock lighting, interactive water, and the portfolio below.

`living-poster/` explores a reflective interactive opening and an image-led portfolio in ordinary document flow. See its README for motion behavior and verification.

The newest comparison is at `fresh/`: two independent skeuomorphic directions, `instrument-desk/` and `working-folio/`. Each includes working specimens and the broader portfolio below.

Open `http://127.0.0.1:8770/experiments/` with the local preview server running:

```sh
python3 -m http.server 8770 --bind 127.0.0.1
```

Run the command from the repository root. There is no build step.

- **Water:** an interactive refractive surface, three selectable project artifacts, and daylight/after-hours lighting. The canvas settles after interaction and stops rendering offscreen. Reduced motion keeps a still surface; a CSS background remains available without WebGL.
- **Objects:** a shelf with an actual Aweigh watch screenshot, a photo-to-four-color dial, and a four-pass octopus drawing. The latter two are illustrative browser sketches. On a phone, swipe the shelf; labels also support left/right arrow keys.
- **Light table:** four mounted images with a pointer loupe. Use Inspect for touch, arrow keys when a slide is focused, and the magnification buttons for a closer look. Each project also has written content below.

These studies are isolated from the existing portfolio. Nothing has been published. The prototypes use existing project media and local resized photographs; Light table also requests Google Fonts, with local system fallbacks.

## Objects follow-up

`objects-next/` compares the original shelf with `objects-focus/` (pick up and inspect) and `objects-scroll/` (a physical display alongside readable project stories).

The original shelf now selects the camera story on slider input and when a control receives keyboard focus. Pending description transitions are cancelled when selection changes so the last selection wins.

Both Objects follow-up layouts were reviewed in the browser at 1280x720 and 390x844. Verified watch playback and pause on project change, camera input and resulting sample, drawing completion/reset, mobile control visibility, and scroll/story synchronization. Local HTML links and asset paths and JavaScript syntax checks pass.

## Combined direction

`objects-refined/` combines the refined materials and typography of Working collection with explicit project selection and controls from Closer look. The broader portfolio follows: additional app images, a compact project list, and expandable Godot contribution details. It is another isolated study, with no deployment or replacement of the current portfolio.
