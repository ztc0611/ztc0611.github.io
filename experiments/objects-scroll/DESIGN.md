# The working collection

A portfolio treated as a museum of usable things. The physical exhibit stays in one place while ordinary scrolling tells the story behind each object. The objects give the work a memorable silhouette; the text explains what it actually does without requiring exploration.

## Design

- Slate blue `#657d92`, mist `#dce5e9`, ink `#183042`, lilac `#c5bed8`, pale paper `#f3f3eb`.
- Georgia supplies the broad, quietly peculiar collection title; system sans gives descriptions the clarity of exhibit writing.
- Desktop: one sticky sculptural niche on the left, flowing project stories on the right. Mobile: a compact sticky stage above the stories. No scroll hijacking, no scroll lock, no mandatory object selection.
- A single rounded alcove and metal plinth provide material continuity. Project changes alter the object and the room color. No disappearing text, repeated feature cards, or entry animations.

## Interactions

- Scroll or use the three project dots to pair the stage with each story.
- Aweigh's play button starts an actual local watchOS recording and becomes a pause button. Playback stops when leaving Aweigh or hiding the browser tab. It never autoplays.
- Pixellate's dial mixes a local photo into an illustrative four-color dither. Its shutter captures the current canvas and offers a local PNG download. It does not access a camera or transmit anything.
- Printing the Dream's Draw button renders a pixel octopus one color pass at a time. Reset clears it. This is explicitly labeled an illustrative browser drawing machine, not the original hardware.
- Keyboard focus is visible. When scrolling changes the exhibit, focus on a departing object control moves to the corresponding story without changing the scroll position. Reduced motion removes smooth scrolling and decorative transitions; explicit video playback remains available.

## QA selectors

- `.intro`, `.collection`, `.stage`, `.stories`, `.story`, `.outro`
- `#aweigh`, `#pixellate`, `#printing`
- `[data-project="aweigh"]`, `[data-project="pixellate"]`, `[data-project="printing"]`
- `#watch-play`, `#watch-video`, `#watch-status`
- `#dither`, `#dither-value`, `#shutter`, `.save-photo`, `#photo-status`
- `#print`, `#drawing`, `#print-status`

## Caveats

This is an isolated design experiment. App and hardware facts come from the existing portfolio and object experiment. Aweigh is labeled awaiting App Review. No outside service or native app behavior is simulated as real. The comparison page is owned by the parent agent. Browser visual QA is delegated to the parent; this agent only performs static checks. Without JavaScript, project narratives and links remain readable, and the watch poster remains visible.
