import * as THREE from './vendor/three.module.min.js';
import { terrainSurface, plantUnderstory } from './habitat.js';
import { madroneSites, lighthouseSite } from './coast.js';

const mix = THREE.MathUtils.lerp;
const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function noise(x, z) {
  const hash = (a, b) => {
    let n = Math.imul(a, 374761393) ^ Math.imul(b, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const ix = Math.floor(x), iz = Math.floor(z);
  const u = smooth(0, 1, x - ix), v = smooth(0, 1, z - iz);
  return mix(mix(hash(ix, iz), hash(ix + 1, iz), u), mix(hash(ix, iz + 1), hash(ix + 1, iz + 1), u), v);
}

function coastalRelief(x, z) {
  return Math.sin(x * .14 + Math.sin(z * .13) * 2) * .44
    + Math.sin(x * .37 - z * .29) * .2 + Math.sin(x * .79 + z * .6) * .04;
}

function coastHeight({ cx, cz, rx, rz, height, seed, peninsula }, x, z) {
  const xx = (x - cx) / rx, zz = (z - cz) / rz;
  const edge = 1 - Math.hypot(xx, zz);
  const relief = coastalRelief(x + seed, z);
  const ridge = Math.max(0, edge + .075 * relief);
  const peak = .65 + .35 * Math.sin(x * .036 + z * .015 + seed);
  const base = Math.pow(ridge, 1.25) * height * peak + relief * Math.min(3, Math.max(0, edge) * 7) - 1.8;
  const shelf = smooth(-.85, .75, base) * (1 - smooth(3.5, 9, base));
  const headland = 2.5 + Math.sin(x * .061 + z * .037 + seed) * 1.05;
  const strata = .22 * Math.sin(x * .33 + z * .22) + .1 * Math.sin(z * .61 - x * .19);
  const coast = base + shelf * (headland + strata);
  if (!peninsula) return coast;
  const rootX = -37, rootZ = -118;
  const dx = lighthouseSite.x - rootX, dz = lighthouseSite.z - rootZ;
  const along = THREE.MathUtils.clamp(((x - rootX) * dx + (z - rootZ) * dz) / (dx * dx + dz * dz), 0, 1);
  const distance = Math.hypot(x - rootX - dx * along, z - rootZ - dz * along);
  const width = mix(8, 5.6, along);
  const edgeRelief = coastalRelief(x + 13, z) * .28;
  const point = -1.8 + (6.1 + edgeRelief) * (1 - smooth(.45, 1.12, (distance + edgeRelief) / width));
  // Form the point in the island's heightfield so its neck and submerged shore
  // share vertices with the mainland, with no overlapping meshes or open seam.
  const join = Math.max(0, 1 - Math.abs(coast - point) / 2);
  return Math.max(coast, point) + join * join * .5 * smooth(0, 2, point);
}

const ridgeProfile = [
  [-1, 0], [-.87, .2], [-.72, .32], [-.63, .56], [-.51, .4],
  [-.35, .69], [-.27, .6], [-.13, .84], [-.04, .72], [.08, 1],
  [.16, .8], [.26, .86], [.39, .56], [.48, .65], [.62, .36], [.76, .29], [1, 0]
];

function mountainHeight({ cx, cz, rx, rz, height, seed, volcano }, x, z) {
  const xx = (x - cx) / rx, zz = (z - cz) / rz;
  if (volcano) {
    const angle = Math.atan2(zz, xx);
    const radius = Math.hypot(xx + zz * .14, zz) * (1 + Math.cos(angle * 3 + .8) * .09 + Math.sin(angle * 5) * .035);
    const flank = Math.max(0, 1 - radius);
    const cap = Math.min(.94, Math.pow(flank, 1.65) * 1.19);
    const crown = Math.exp(-((xx + .055) ** 2 + (zz - .015) ** 2) / .006) * .045;
    const summit = cap + crown + (Math.sin(xx * 19 + .8) * .023 + Math.sin(zz * 23) * .014) * smooth(.76, .92, cap);
    const shoulder = Math.max(0, 1 - Math.hypot((xx + .35) * 1.45, (zz + .015) * 1.35)) * .65;
    const mass = Math.max(summit, shoulder);
    const drainage = Math.pow(.5 + .5 * Math.sin(angle * 11 + radius * 6 + noise(x * .027, z * .027) * 2), 3);
    const ravines = drainage * smooth(.05, .28, radius) * (1 - smooth(.7, 1, radius)) * .105;
    const relief = (noise(x * .065 + seed, z * .085) - .5) * 3.4 * smooth(0, .3, flank);
    const ribs = Math.abs(Math.sin(angle * 19 + radius * 9)) * .018 * smooth(.1, .3, radius) * (1 - smooth(.65, 1, radius));
    return (mass - ravines + ribs) * height + relief - 2;
  }
  if (xx <= -1 || xx >= 1) return -2;
  let segment = 1;
  while (ridgeProfile[segment][0] < xx) segment++;
  const a = ridgeProfile[segment - 1], b = ridgeProfile[segment];
  const crest = mix(a[1], b[1], (xx - a[0]) / (b[0] - a[0])) * (.94 + noise(x * .18, seed) * .06);
  const spine = Math.sin(xx * 5 + seed) * .14;
  const cross = Math.max(0, 1 - Math.abs(zz - spine));
  const ribs = 1 - Math.abs(Math.sin(xx * 21 + zz * 4 + seed));
  const relief = ribs * .08 * Math.sin(Math.PI * cross);
  return Math.max(0, crest * Math.pow(cross, 1.35) + relief) * height - 2;
}

export function createLandscape(surfaceDetails, random, season) {
  const group = new THREE.Group();
  group.name = 'Washington coastal landscape';
  const trees = [], shrubs = [], shores = [], broadleaves = [];
  const rock = new THREE.Color('#707672'), forest = new THREE.Color('#253e31');
  const grass = new THREE.Color('#aa9055').lerp(new THREE.Color('#5f7040'), 1 - season.cured);
  const lava = new THREE.Color('#57504e'), scree = new THREE.Color('#6d6660');
  const granite = new THREE.Color('#646a6b'), timber = new THREE.Color('#1d352e'), larch = new THREE.Color('#b08a3a');
  const tint = new THREE.Color();
  const landMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  const mountainMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  surfaceDetails.terrain(landMaterial);
  surfaceDetails.terrain(mountainMaterial, true);
  const mineralShader = mountainMaterial.onBeforeCompile;
  const glow = { value: new THREE.Color(0, 0, 0) };
  mountainMaterial.onBeforeCompile = shader => {
    mineralShader(shader);
    shader.uniforms.uAlpenglow = glow;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float snowline;\nvarying float vSnowline;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSnowline = snowline;');
    // The snowline varies slowly enough for per-vertex sampling, but the edge
    // itself is resolved per pixel against the exact surface height; vertex
    // colours at this mesh density smear glaciers into soft blotches.
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uAlpenglow;\nvarying float vSnowline;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 snowNormal = normalize(vSurfaceNormal);
        float snowBreakup = (texture2D(uSurfaceMineral, vSurfaceWorld.xz * .023).r - .5) * 7.0 + (texture2D(uSurfaceMineral, vSurfaceWorld.xz * .11).g - .5) * 2.4;
        float snowCover = smoothstep(vSnowline - .35, vSnowline + .35, vSurfaceWorld.y + snowBreakup)
          * smoothstep(.16, .3, snowNormal.y + snowBreakup * .02);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.74, .77, .8), snowCover);
      `);
    // Compress aerial distance to keep the glacier legible at this scenic scale.
    // The same fog uniform still obscures it naturally when rain comes in.
    // Low sun keeps lighting the summits after the shoreline has gone into
    // shadow, and snow throws that red light back far more than rock does.
    shader.fragmentShader = shader.fragmentShader.replace('#include <fog_fragment>', `
      gl_FragColor.rgb += uAlpenglow * smoothstep(30.0, 85.0, vSurfaceWorld.y) * (.25 + surfaceSnow * .75);
      #ifdef USE_FOG
        float mountainFog = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * .46);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, mountainFog);
      #endif
    `);
  };
  mountainMaterial.customProgramCacheKey = () => 'inlet-glacier-v3';
  const landforms = [
    { cx: -183, cz: -325, rx: 197, rz: 83, height: 91, seed: 4, mountain: true },
    { cx: 47, cz: -300, rx: 169, rz: 99, height: 96, seed: 8, mountain: true, volcano: true },
    { cx: 235, cz: -327, rx: 158, rz: 80, height: 83, seed: 2, mountain: true },
    { cx: -105, cz: -123, rx: 87, rz: 61, height: 56, seed: 4, peninsula: true },
    { cx: 114, cz: -131, rx: 93, rz: 67, height: 58, seed: 1 },
    { cx: 61, cz: -49, rx: 46, rz: 52, height: 32, seed: 7, madrones: true },
    { cx: -109, cz: -37, rx: 70, rz: 55, height: 30, seed: 12 },
    { cx: 36, cz: 27, rx: 24, rz: 24, height: 9, seed: 3 }
  ];
  for (const land of landforms) {
    const { cx, cz, rx, rz, height, seed, mountain, volcano, peninsula, madrones } = land;
    const columns = mountain ? (volcano ? 128 : 112) : 144, rows = mountain ? 72 : 112;
    // Warped shores can extend beyond the nominal radii. The mesh needs a
    // submerged margin on every side, or its cut edge exposes empty space.
    const margin = 1.28;
    const geometry = new THREE.PlaneGeometry(rx * 2 * margin, rz * 2 * margin, columns, rows).rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position, colors = new Float32Array(positions.count * 3);
    const heightAt = (x, z) => (mountain ? mountainHeight : coastHeight)(land, x, z);
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) + cx, z = positions.getZ(i) + cz;
      positions.setXYZ(i, x, heightAt(x, z), z);
    }
    geometry.computeVertexNormals();
    const normals = geometry.attributes.normal;
    const exposure = (x, z, y) => {
      const shore = 1 - smooth(2.2, 6.4, y + coastalRelief(x * .3, z * .3) * 1.4);
      if (shore >= .8) return shore;
      const slope = Math.hypot(heightAt(x + 1, z) - heightAt(x - 1, z), heightAt(x, z + 1) - heightAt(x, z - 1)) / 2;
      return Math.max(shore, smooth(1.05, 2.1, slope) * .76);
    };
    const ground = terrainSurface(geometry, exposure);
    const snowlines = mountain ? new Float32Array(positions.count) : null;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const up = Math.max(.001, normals.getY(i));
      const slope = Math.sqrt(Math.max(0, 1 - up * up)) / up;
      const broad = noise(x * .038 + seed, z * .038);
      if (mountain) {
        const radius = Math.hypot((x - cx) / rx, (z - cz) / rz);
        const altitude = y / height, grain = broad - .5;
        // Conifers climb to a ragged treeline; larches gild its upper edge in October.
        const treeline = (volcano ? .24 : .34) + grain * .12 + noise(x * .11, z * .11) * .06;
        const forested = 1 - smooth(treeline - .05, treeline + .03, altitude);
        tint.copy(volcano ? lava : granite).lerp(scree, smooth(.2, .9, noise(x * .09 + seed, z * .05)) * .5);
        tint.multiplyScalar(.86 + smooth(.4, .95, up) * .2);
        tint.lerp(larch, season.larch * smooth(.35, .75, noise(x * .2, z * .2 + seed)) * (1 - smooth(treeline + .02, treeline + .12, altitude)) * smooth(treeline - .08, treeline, altitude) * (volcano ? .3 : .85));
        tint.lerp(timber, forested * smooth(.35, .7, up));
        let snowline;
        if (volcano) {
          const angle = Math.atan2((z - cz) / rz, (x - cx) / rx);
          const drainage = .5 + .5 * Math.sin(angle * 11 + radius * 6 + noise(x * .027, z * .027) * 2);
          // Glaciers fill the drainages and reach furthest down them; the
          // narrow cleavers between them stay bare well into the ice cap.
          const tongue = smooth(.45, .95, drainage), cleaver = 1 - smooth(.01, .05, drainage + (noise(x * .08, z * .08) - .5) * .06);
          snowline = Math.min(.86, mix(.31, .23, tongue) + (noise(x * .06 + seed, z * .06) - .5) * .07 + cleaver * .08);
        } else {
          // Granite walls shed snow that the volcano's glaciers would hold.
          snowline = .66 + (noise(x * .05 + seed, z * .05) - .5) * .22 + (1 - smooth(.5, .8, up)) * .3;
        }
        snowlines[i] = (snowline - season.dusting * (volcano ? .03 : .08) + grain * .05) * height;
      } else {
        const stone = Math.max(1 - smooth(2.2, 6.4, y + coastalRelief(x * .3, z * .3) * 1.4), smooth(1.05, 2.1, slope) * .76);
        const patch = noise(x * .065 + seed * 9.3, z * .065) * .75 + noise(x * .17 - seed, z * .17) * .25;
        const meadow = smooth(.29, .7, patch) * (1 - stone);
        tint.copy(forest).lerp(grass, meadow * .67).lerp(rock, stone).multiplyScalar(.88 + coastalRelief(x * .8 + seed, z * .8) * .2);
      }
      tint.toArray(colors, i * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    if (snowlines) geometry.setAttribute('snowline', new THREE.BufferAttribute(snowlines, 1));
    const mesh = new THREE.Mesh(geometry, mountain ? mountainMaterial : landMaterial);
    mesh.name = volcano ? 'Glaciated Cascade volcano' : mountain ? 'Distant ridgeline' : 'Forested headland';
    group.add(mesh);
    if (mountain) continue;
    shores.push({ ...land, ground });
    const firstTree = trees.length;
    for (let i = 0; i < 1600; i++) {
      const x = cx + (random() * 2 - 1) * rx * .96, z = cz + (random() * 2 - 1) * rz * .96;
      const y = ground.elevation(x, z), clearing = noise(x * .06 + seed, z * .06);
      const coastalClearing = (madrones && madroneSites.some(site => Math.hypot(x - site.x, z - site.z) < 2.8))
        || (peninsula && Math.hypot(x - lighthouseSite.x, z - lighthouseSite.z) < 5.5);
      if (y > 2.8 && y < height * .85 && exposure(x, z, y) < .7 && clearing > .23 && !coastalClearing) {
        const h = (1.8 + random() * 3.4) * (cz < -100 ? 1.5 : 1), shade = random();
        // Alder and bigleaf maple take the damp lower slopes in loose stands;
        // choosing them by position leaves the random sequence untouched.
        const stand = noise(x * .09 - seed * 3.1, z * .09 + seed);
        if (y < 10 && stand + (10 - y) * .01 > .74) broadleaves.push({ x, y: y - .1, z, h: h * .78, shade });
        else trees.push({ x, y: y - .08, z, h, shade });
      }
    }
    shrubs.push(...plantUnderstory(ground, trees.slice(firstTree), seed, cz > -80 ? (rx < 30 ? 3 : 9) : 5));
  }
  return { group, trees, shrubs, broadleaves, shores, alpenglow: glow.value };
}
