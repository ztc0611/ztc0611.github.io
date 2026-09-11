import * as THREE from './vendor/three.module.min.js';

function randomFrom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

function surfaceTexture(bark) {
  const size = 128, pixels = new Uint8Array(size * size * 4);
  const random = randomFrom(bark ? 419 : 991);
  const ridges = Array.from({ length: size }, () => random());
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const drift = Math.round(Math.sin(y / size * Math.PI * 2) * 2);
      const grainX = (x + drift + size) % size;
      const groove = grainX / 8;
      const blend = groove % 1;
      const ridge = THREE.MathUtils.lerp(ridges[Math.floor(groove)], ridges[(Math.floor(groove) + 1) % 16], blend * blend * (3 - 2 * blend));
      const fleck = random();
      const striation = bark ? ridge * .7 + fleck * .3 : .5 + .25 * Math.sin((x + y * 2) * .9) + fleck * .25;
      const value = bark ? .58 + striation * .38 : .79 + striation * .20;
      const i = (y * size + x) * 4;
      pixels[i] = Math.round(value * 255);
      pixels[i + 1] = Math.round(value * 255);
      pixels[i + 2] = Math.round(value * 255);
      pixels[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function meshBuilder() {
  const positions = [], uvs = [], colors = [], indices = [];
  return {
    point(x, y, z, u, v, brightness = 1) {
      const index = positions.length / 3;
      positions.push(x, y, z);
      uvs.push(u, v);
      colors.push(brightness, brightness, brightness);
      return index;
    },
    face(a, b, c) { indices.push(a, b, c); },
    finish() {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      return geometry;
    }
  };
}

function addStem(builder, start, end, radius, sides = 6) {
  const direction = end.clone().sub(start).normalize();
  const tangent = new THREE.Vector3(0, 0, 1).cross(direction).normalize();
  const bitangent = direction.clone().cross(tangent).normalize();
  const rings = [];
  for (let k = 0; k < 2; k++) {
    const center = k ? end : start;
    const ring = [];
    for (let j = 0; j <= sides; j++) {
      const angle = j / sides * Math.PI * 2;
      const offset = tangent.clone().multiplyScalar(Math.cos(angle)).addScaledVector(bitangent, Math.sin(angle));
      offset.multiplyScalar(radius * (k ? .32 : 1)).add(center);
      ring.push(builder.point(offset.x, offset.y, offset.z, j / sides * 2, k * 3, k ? 1 : .85));
    }
    rings.push(ring);
  }
  for (let j = 0; j < sides; j++) {
    builder.face(rings[0][j], rings[0][j + 1], rings[1][j]);
    builder.face(rings[0][j + 1], rings[1][j + 1], rings[1][j]);
  }
}

function createTreeGeometry(seed, near) {
  const random = randomFrom(seed);
  const foliage = meshBuilder(), wood = meshBuilder();
  const tiers = near ? 7 : 5;
  addStem(wood, new THREE.Vector3(0, -.2, 0), new THREE.Vector3(.009, .98, -.006), .025, near ? 8 : 5);
  for (let tier = 0; tier < tiers; tier++) {
    const progress = tier / tiers;
    const height = .24 + progress * .69;
    const reach = .26 * Math.pow(1 - progress, .83) * (.93 + random() * .14);
    const branches = near ? (tier < 4 ? 5 : 4) : 4;
    const phase = tier * 2.38 + random() * .45;
    for (let branch = 0; branch < branches; branch++) {
      const angle = phase + branch / branches * Math.PI * 2 + (random() - .5) * .28;
      const radius = reach * (.8 + random() * .30);
      const y = height + (random() - .5) * .038;
      const droop = .025 + radius * .15;
      const radialX = Math.cos(angle), radialZ = Math.sin(angle);
      const sideX = -radialZ, sideZ = radialX;
      const rings = [];
      // An elongated branch volume has open air between its neighbors. Its two
      // broad shoulders avoid both circular cone tiers and expensive alpha cards.
      const root = foliage.point(radialX * .014, y + .045, radialZ * .014, 0, tier, .77);
      for (let k = 0; k < (near ? 2 : 1); k++) {
        const distance = radius * (near ? (k ? .76 : .38) : .57);
        const width = radius * (k ? .46 : .54) * (.9 + random() * .15);
        const depth = (near ? .050 : .054) * (1 - progress * .62) * (k ? .67 : 1);
        const centerY = y + .025 - distance / radius * droop;
        const ring = [];
        for (let j = 0; j < 4; j++) {
          const theta = j / 4 * Math.PI * 2;
          const sideways = Math.cos(theta) * width;
          ring.push(foliage.point(radialX * distance + sideX * sideways,
            centerY + Math.sin(theta) * depth,
            radialZ * distance + sideZ * sideways,
            j / 4 * 2 + branch * .17, tier + (k ? 1.7 : .65), Math.sin(theta) > 0 ? 1.08 : .87));
        }
        rings.push(ring);
      }
      const tip = foliage.point(radialX * radius, y - droop, radialZ * radius, 1, tier + 2.3, .99);
      for (let j = 0; j < 4; j++) {
        const next = (j + 1) % 4;
        foliage.face(root, rings[0][j], rings[0][next]);
        if (near) {
          foliage.face(rings[0][j], rings[1][j], rings[0][next]);
          foliage.face(rings[0][next], rings[1][j], rings[1][next]);
        }
        const outer = rings[rings.length - 1];
        foliage.face(outer[j], tip, outer[next]);
      }
      if (near && tier < 4 && branch % 2 === 0) {
        addStem(wood, new THREE.Vector3(0, y + .028, 0),
          new THREE.Vector3(radialX * radius * .75, y - droop * .5, radialZ * radius * .75), .008 * (1 - progress * .6), 4);
      }
    }
  }
  // A shaded interior keeps sparse scenic planting reading as a canopy, while
  // the outer boughs still give each crown its irregular silhouette.
  const coreRings = [];
  for (let level = 0; level < 7; level++) {
    const t = level / 6, ring = [];
    for (let side = 0; side < 10; side++) {
      const angle = side / 10 * Math.PI * 2;
      const radius = .195 * Math.pow(1 - t, .88) * (.91 + random() * .18) + .006;
      ring.push(foliage.point(Math.cos(angle) * radius, .18 + t * .80,
        Math.sin(angle) * radius, side / 10 * 3, t * 5, .77 + random() * .12));
    }
    coreRings.push(ring);
  }
  for (let level = 0; level < 6; level++) for (let side = 0; side < 10; side++) {
    const next = (side + 1) % 10;
    foliage.face(coreRings[level][side], coreRings[level + 1][side], coreRings[level][next]);
    foliage.face(coreRings[level][next], coreRings[level + 1][side], coreRings[level + 1][next]);
  }
  // A narrow leader ties the separated upper branches into a fir silhouette.
  const top = foliage.point(.005, 1.015, -.006, .5, 1, 1.05);
  const bottom = foliage.point(0, .79, 0, .5, 0, .84);
  const leader = [];
  for (let j = 0; j < 7; j++) {
    const angle = j / 7 * Math.PI * 2;
    leader.push(foliage.point(Math.cos(angle) * .042, .88 + random() * .025, Math.sin(angle) * .042, j / 7, .4, .97));
  }
  for (let j = 0; j < 7; j++) {
    const next = (j + 1) % 7;
    foliage.face(leader[j], top, leader[next]);
    foliage.face(leader[next], bottom, leader[j]);
  }
  return { foliage: foliage.finish(), wood: wood.finish() };
}

export function createForest(treePlacements) {
  const forest = new THREE.Group();
  forest.name = 'Coastal fir forest';
  const needles = surfaceTexture(false), bark = surfaceTexture(true);
  const foliageMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff', vertexColors: true, map: needles, bumpMap: needles,
    bumpScale: .014, roughness: .94, roughnessMap: needles, metalness: 0
  });
  const barkMaterial = new THREE.MeshStandardMaterial({
    color: '#8e7861', vertexColors: true, map: bark, bumpMap: bark,
    bumpScale: .023, roughness: 1, metalness: 0
  });
  const batches = Array.from({ length: 5 }, () => []);
  treePlacements.forEach((tree, index) => {
    batches[tree.z > -100 ? index % 3 : 3 + index % 2].push(tree);
  });
  const transform = new THREE.Object3D();
  const leafColor = new THREE.Color(), woodColor = new THREE.Color();
  const lighter = new THREE.Color('#49664c'), darker = new THREE.Color('#294c3a');
  batches.forEach((placements, variant) => {
    if (!placements.length) return;
    const geometry = createTreeGeometry(749 + variant * 319, variant < 3);
    const crowns = new THREE.InstancedMesh(geometry.foliage, foliageMaterial, placements.length);
    const trunks = new THREE.InstancedMesh(geometry.wood, barkMaterial, placements.length);
    placements.forEach((tree, index) => {
      transform.position.set(tree.x, tree.y, tree.z);
      const girth = .91 + tree.shade * .18;
      transform.scale.set(tree.h * girth, tree.h, tree.h * girth);
      transform.rotation.set(0, tree.shade * Math.PI * 2, 0);
      transform.updateMatrix();
      crowns.setMatrixAt(index, transform.matrix);
      trunks.setMatrixAt(index, transform.matrix);
      leafColor.copy(lighter).lerp(darker, tree.shade * .83);
      crowns.setColorAt(index, leafColor);
      woodColor.setScalar(.81 + tree.shade * .19);
      trunks.setColorAt(index, woodColor);
    });
    crowns.instanceMatrix.needsUpdate = trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceColor.needsUpdate = trunks.instanceColor.needsUpdate = true;
    crowns.computeBoundingSphere();
    trunks.computeBoundingSphere();
    forest.add(trunks, crowns);
  });
  return forest;
}

function createShrubGeometry() {
  const builder = meshBuilder(), random = randomFrom(70413);
  const lobes = [
    [0, .29, 0, .62, .42, .53],
    [-.36, .35, .02, .40, .34, .39],
    [.31, .39, .12, .44, .39, .38],
    [-.07, .47, -.24, .38, .42, .39],
    [.05, .31, .36, .40, .32, .35]
  ];
  for (const [cx, cy, cz, rx, ry, rz] of lobes) {
    const rings = [], phase = random() * Math.PI * 2;
    for (let row = 0; row <= 6; row++) {
      const latitude = row / 6 * Math.PI, ring = [];
      for (let side = 0; side <= 10; side++) {
        const angle = side / 10 * Math.PI * 2;
        const fold = 1 + Math.sin(angle * 3 + phase) * .075 * Math.sin(latitude);
        const y = cy + Math.cos(latitude) * ry;
        ring.push(builder.point(
          cx + Math.cos(angle) * Math.sin(latitude) * rx * fold,
          y,
          cz + Math.sin(angle) * Math.sin(latitude) * rz * fold,
          side / 10 * 2, row / 6 * 2,
          .68 + .27 * (Math.cos(latitude) * .5 + .5) + random() * .09
        ));
      }
      rings.push(ring);
    }
    for (let row = 0; row < 6; row++) for (let side = 0; side < 10; side++) {
      builder.face(rings[row][side], rings[row][side + 1], rings[row + 1][side]);
      builder.face(rings[row][side + 1], rings[row + 1][side + 1], rings[row + 1][side]);
    }
  }
  return builder.finish();
}

export function createUnderstory(placements) {
  const geometry = createShrubGeometry(), leaves = surfaceTexture(false);
  const material = new THREE.MeshStandardMaterial({
    color: '#ffffff', vertexColors: true, map: leaves, bumpMap: leaves,
    bumpScale: .045, roughness: .96, metalness: 0
  });
  const shrubs = new THREE.InstancedMesh(geometry, material, placements.length);
  shrubs.name = 'Coastal understory';
  const transform = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
  const leafColor = new THREE.Color(), shade = new THREE.Color('#405639'), sun = new THREE.Color('#7b8250');
  placements.forEach((plant, index) => {
    transform.position.set(plant.x, plant.y, plant.z);
    transform.quaternion.setFromUnitVectors(up, plant.normal);
    transform.rotateY(plant.shade * Math.PI * 2);
    transform.scale.set(plant.size, plant.size * (.62 + plant.shade * .23), plant.size * (.8 + plant.shade * .3));
    transform.updateMatrix();
    shrubs.setMatrixAt(index, transform.matrix);
    shrubs.setColorAt(index, leafColor.copy(shade).lerp(sun, plant.shade * .83));
  });
  shrubs.instanceMatrix.needsUpdate = true;
  if (shrubs.instanceColor) shrubs.instanceColor.needsUpdate = true;
  shrubs.computeBoundingSphere();
  return shrubs;
}
