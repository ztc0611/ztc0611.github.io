import * as THREE from './vendor/three.module.min.js';

function randomFrom(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
}

export function terrainSurface(geometry, exposure) {
  const positions = geometry.attributes.position;
  const { width, height, widthSegments: columns, heightSegments: rows } = geometry.parameters;
  const x0 = positions.getX(0), z0 = positions.getZ(0), stride = columns + 1;
  function elevation(x, z) {
    const u = (x - x0) / width * columns, v = (z - z0) / height * rows;
    if (u < 0 || v < 0 || u >= columns || v >= rows) return -Infinity;
    const col = Math.floor(u), row = Math.floor(v), a = row * stride + col;
    const fx = u - col, fz = v - row;
    // Match the actual triangles, including the diagonal through each grid cell.
    // Sampling the terrain formula instead can leave small objects above the mesh.
    return fx + fz <= 1
      ? positions.getY(a) * (1 - fx - fz) + positions.getY(a + 1) * fx + positions.getY(a + stride) * fz
      : positions.getY(a + stride + 1) * (fx + fz - 1) + positions.getY(a + stride) * (1 - fx) + positions.getY(a + 1) * (1 - fz);
  }
  function at(x, z) {
    const y = elevation(x, z);
    const dx = elevation(x + .6, z) - elevation(x - .6, z);
    const dz = elevation(x, z + .6) - elevation(x, z - .6);
    return { y, dx: dx / 1.2, dz: dz / 1.2, stone: exposure(x, z, y) };
  }
  return { elevation, at };
}

export function plantUnderstory(surface, trees, seed, groupLimit) {
  const random = randomFrom(seed * 917 + 90731), placements = [], centers = [];
  const cells = new Map(), cellSize = 6;
  const cellKey = (x, z) => `${Math.floor(x / cellSize)},${Math.floor(z / cellSize)}`;
  for (const tree of trees) {
    const key = cellKey(tree.x, tree.z);
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(tree);
  }
  function neighbors(x, z) {
    const cx = Math.floor(x / cellSize), cz = Math.floor(z / cellSize), found = [];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      for (const tree of cells.get(`${cx + i},${cz + j}`) || []) {
        const distance = Math.hypot(x - tree.x, z - tree.z);
        if (distance < 5.5) found.push(distance);
      }
    }
    return found;
  }
  for (let attempt = 0; attempt < 160 && centers.length < groupLimit; attempt++) {
    const anchor = trees[Math.floor(random() * trees.length)];
    if (!anchor) break;
    const angle = random() * Math.PI * 2;
    const x = anchor.x + Math.cos(angle) * 2.7, z = anchor.z + Math.sin(angle) * 2.7;
    const ground = surface.at(x, z), nearby = neighbors(x, z);
    if (ground.y < 3.5 || ground.stone > .3 || Math.hypot(ground.dx, ground.dz) > .58) continue;
    if (nearby.length < 2 || nearby.length > 9 || centers.some(c => Math.hypot(c.x - x, c.z - z) < 9)) continue;
    const contour = Math.atan2(-ground.dx, ground.dz), reach = 2.7 + random() * 1.8;
    const group = [];
    for (let candidate = 0; candidate < 35 && group.length < 7; candidate++) {
      const theta = random() * Math.PI * 2, radius = Math.sqrt(random());
      const along = Math.cos(theta) * radius * reach, across = Math.sin(theta) * radius * 1.6;
      const px = x + Math.cos(contour) * along - Math.sin(contour) * across;
      const pz = z + Math.sin(contour) * along + Math.cos(contour) * across;
      const size = (1.05 + random() * .7) * (1.15 - radius * .28), soil = surface.at(px, pz);
      if (soil.y < 3.3 || soil.stone > .35 || Math.hypot(soil.dx, soil.dz) > .65) continue;
      if (neighbors(px, pz).some(distance => distance < size * .7)) continue;
      if (group.some(p => Math.hypot(p.x - px, p.z - pz) < (p.size + size) * .55)) continue;
      let supported = true;
      for (let side = 0; side < 8; side++) {
        const a = side * Math.PI / 4, ox = Math.cos(a) * size * .7, oz = Math.sin(a) * size * .7;
        const edge = surface.at(px + ox, pz + oz);
        const plane = soil.y + soil.dx * ox + soil.dz * oz;
        if (edge.stone > .43 || Math.abs(edge.y - plane) > size * .16) { supported = false; break; }
      }
      if (!supported) continue;
      group.push({ x: px, y: soil.y - size * .15, z: pz, size, shade: .2 + random() * .65,
        yaw: random() * Math.PI * 2, normal: new THREE.Vector3(-soil.dx, 1, -soil.dz).normalize() });
    }
    if (group.length >= 3) { centers.push({ x, z }); placements.push(...group); }
  }
  return placements;
}
