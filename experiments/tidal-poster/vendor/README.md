# Three.js

Pinned local browser modules from Three.js 0.180.0:

- `three.module.min.js`
- `three.core.min.js`

Downloaded from the published `three@0.180.0` npm package through jsDelivr. Both modules are required because the renderer module imports the core module. The upstream MIT license is preserved in `LICENSE.three.txt`.

The inlet runs without remote requests, API keys, external textures, or geolocation. Its geometry, clouds, waves, and tree instances are deterministic procedural content in `../scene.js`.
