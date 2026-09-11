The site is served as static files by GitHub Pages.

The homepage scene source is in `assets/home/scene.js` and its adjacent modules.
After editing those files, run:

```sh
npm ci
npm run build
```

The build removes unused library exports and combines the scene into
`assets/home/dist/scene.min.js`. It also updates the matching preload and script
URLs in `index.html` with a content revision. Commit the generated file and HTML
alongside source changes; GitHub Pages does not run a JavaScript build.

Preview with `python3 -m http.server 8770 --bind 127.0.0.1`.
Keep the Three.js and SunCalc licenses in `assets/home/vendor/` when publishing.
