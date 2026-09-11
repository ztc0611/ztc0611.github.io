# Refined instruments

## Plan

Palette: porcelain #f3f3eb, ink #183042, muted ink #526777, slate #c5d0d5, lilac #cdc8d8, aluminum #e0e3e1. Georgia carries project titles, with the platform system sans for navigation, explanation and instrument markings.

An open two-column display places one substantial physical object to the left and its explanation to the right. The three project names remain visible above. A low horizontal shelf grounds the object, while generous empty space separates material detail from text.

```
Aweigh        Pixellate Camera        Printing the Dream
[                                      ]   platform
[           physical instrument        ]   project title
[              active controls         ]   clear description
[______________________________________]   case study
```

## Review before build

A generic editorial split would remove the most characteristic part of this work: tools visitors can operate. The revised plan therefore increases physical detail on the camera and drawing console, using recessed glass, chamfered metal, seams and grounded shadows. The selector is typographic so those physical details belong only to the useful instruments. Rounded geometry follows hardware construction instead of wrapping the whole section in a card. Copy identifies each project immediately and keeps its action adjacent to the result. No invented product claims or contact fields.

## Implementation

The fragment is a scoped section. Parent supplies page typography and lower portfolio. Local styles use only `.featured` selectors. Selection controls use `[data-select]`; project articles use `[data-project]`. Root `data-active` reflects selection. Watch playback is user initiated and pauses on selection change, document hiding, and leaving the section viewport. Photo processing and four-pass drawing are illustrative browser tools, identified once in the section footnote. Reduced motion removes transition and progressive drawing animation.

## Self-critique and checks

Kept the increased tactile detail on the objects, then removed miniature navigation props and excess instructional copy. The camera's developed print occupies its own layout space so it cannot cover the shutter or slider. Mobile narrative leads into a compact object stage, with actions beside their result. Text aligns to the page's 5% inset while the stage retains an open edge. The parent agent owns visual browser verification of the assembled page. This component's static checks verify JavaScript syntax, unique IDs, control references, local media paths and visible copy punctuation.

## Assembled page

`index.html` is the complete, directly served page. `featured.html` is the source fragment for the marked featured region; changes to it should also be copied into `index.html` between the FEATURED START/END comments. `featured.css` and `featured.js` load directly. `site.css` styles the identity, broader project collection, Godot details, and contact footer.

The remaining project content was adapted from the existing `portfolio.html`: three additional apps, seven compact project entries, and seven Godot contribution groups. Existing destinations and technical details were retained. The existing live portfolio has not been replaced.

Browser review covered desktop1280x720 and phone390x844, playback and pause when selecting another project, adjustable camera/developed print, four drawing passes/reset, and opening Godot details. Mobile camera stage has extra height for the developed print and44px controls. Page width matches viewport; local references and JS syntax checks passed.
