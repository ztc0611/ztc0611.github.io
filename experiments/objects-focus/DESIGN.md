# Closer look

An alternative portfolio experiment about picking something up and understanding it through use. The original bench's physicality is retained, but its distant shelf becomes a close inspection mat with one large object and a permanently visible story. Other projects remain in three tool rests across the top.

## Plan and pre-build critique

- Palette: paper `#e8edf0`, blue-grey mat `#c2d2da`, ink `#203743`, secondary ink `#49616d`, control blue `#235b81`, silver `#dce2e4`.
- Type: local Avenir Next / Avenir / Segoe UI. Medium, tightly spaced headline; quiet readable project descriptions. No remote font requests.
- Layout: introduction above three object rests. A single inspection surface below: large object on the left, its title, description, action, and project link on the right. On mobile the project title is followed by the object and its controls, then the full readable description and link. Controls stay adjacent to their visible outcomes.
- Principle: use physical form to make the interaction legible, and let ordinary links make the portfolio accessible without discovery.
- Critique: a row of miniature tools could still read as inert exhibits. The revision explicitly pairs each selected tool with a purposeful control and a visible outcome. The mat stays understated to avoid competing with those objects.

## Interactions

- Project rests are native buttons with `aria-pressed`. Click, Enter, and Space select. Left/right arrows and Home/End move through the rests. Selection does not capture page scroll or move focus into content.
- Aweigh uses the existing real watch frame, poster, and `watchos.mp4`. `#watch-play` explicitly plays/pauses it, completion offers replay, switching projects or hiding the page pauses it. No autoplay. Aweigh is labeled awaiting App Review.
- Pixellate's `#photo-mix` quantizes the local photo with a four-tone Bayer sketch and blends with the original. Focus, pointerdown, and input all select its project. `#shutter` captures the chosen canvas into the paper print. A subsequent shutter action updates the same print rather than accumulating decoration. The print sits beside the camera on desktop and below it on mobile, in normal layout so it cannot cover the controls.
- Printing's `#draw-pass` draws one color at a time with four explicit actions, then becomes a clear button. Motion-reduced mode completes each pass without drawing animation.
- All links stay local. The persistent footer provides all work and Godot links. Descriptions are present in HTML, not fetched or inferred.

## QA hooks and caveats

- Entry: `experiments/objects-focus/index.html`; CSS: `focus.css`; logic: `focus.js`.
- `[data-select="aweigh"]`, `[data-select="pixellate"]`, `[data-select="printing"]` control `[data-project]` panels.
- `#watch-play`, `#watch-video`, `#watch-status` for actual video behavior.
- `#photo-mix`, `#mix-value`, `#shutter`, `#photo-print`, `#photo-status` for photo response.
- `#draw-pass`, `#pass-label`, `#drawing` for the four drawing passes and reset.
- Recommended checks: 390px and 1440px viewport, keyboard project selection, slider arrows, print output, play/pause/replay, switching away during playback, reduced-motion drawing.
- Serve through a local static HTTP server for canvas export. Direct `file:` browsing may taint canvas: it falls back to filtered photography and a filtered source print. The browser sketches are explicitly identified once in the mat footer; they do not claim to reproduce shipping app output.
- Parent agent performs browser QA to avoid conflicting browser sessions. No deployment, dependency, or build step.

## Parent visual QA revisions

The first browser pass found that oversized desktop spacing put the watch action below the fold, and mobile story-first ordering separated playback from its visible result. Playback and drawing controls now live with their objects. Mobile presents title, object with controls, then complete descriptive copy. Desktop introduction/rest spacing is tighter. The photo proof now occupies normal layout rather than overlaying the camera controls. Parent confirmed watch playback, pause on project switch, photo input, and proof generation before these layout revisions.
