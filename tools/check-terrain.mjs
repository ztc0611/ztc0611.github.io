import assert from 'node:assert/strict';
import { createLandscape } from '../assets/home/terrain.js';
import { lighthouseSite, madroneSites } from '../assets/home/coast.js';
import { seasonForDate } from '../assets/home/season.js';

let seed = 731902;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
const landscape = createLandscape({ terrain() {} }, random, seasonForDate());

for (const mesh of landscape.group.children) {
  const { geometry } = mesh;
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    assert(attribute.array.every(Number.isFinite), `${mesh.name} has invalid ${name}`);
  }
  const { widthSegments: columns, heightSegments: rows } = geometry.parameters;
  const positions = geometry.attributes.position;
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= columns; col++) {
      if (row !== 0 && row !== rows && col !== 0 && col !== columns) continue;
      const index = row * (columns + 1) + col;
      assert(positions.getY(index) <= -1,
        `${mesh.name} has an exposed edge at ${positions.getX(index)}, ${positions.getZ(index)}`);
    }
  }
}

for (const tree of landscape.trees) {
  assert(landscape.shores.some(({ ground }) => Math.abs(ground.elevation(tree.x, tree.z) - tree.y - .08) < .0001),
    `Tree at ${tree.x}, ${tree.z} is detached from its terrain`);
}
const lighthouseShore = landscape.shores.find(land => land.peninsula);
const madroneShore = landscape.shores.find(land => land.madrones);
for (const [site, shore] of [[lighthouseSite, lighthouseShore], ...madroneSites.map(site => [site, madroneShore])]) {
  assert(shore.ground.elevation(site.x, site.z) > 1,
    `Landmark at ${site.x}, ${site.z} has no dry ground`);
}
for (let step = 0; step <= 128; step++) {
  const t = step / 128;
  const x = lighthouseShore.cx + (lighthouseSite.x - lighthouseShore.cx) * t;
  const z = lighthouseShore.cz + (lighthouseSite.z - lighthouseShore.cz) * t;
  assert(lighthouseShore.ground.elevation(x, z) > 1, 'The lighthouse peninsula is disconnected from the mainland');
}
for (const tree of landscape.broadleaves) {
  assert(landscape.shores.some(({ ground }) => Math.abs(ground.elevation(tree.x, tree.z) - tree.y - .1) < .0001),
    `Broadleaf at ${tree.x}, ${tree.z} is detached from its terrain`);
}
console.log(`Checked ${landscape.group.children.length} submerged mesh boundaries, ${landscape.trees.length + landscape.broadleaves.length} grounded trees, and all landmark sites.`);
