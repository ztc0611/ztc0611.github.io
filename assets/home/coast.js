import * as THREE from './vendor/three.module.min.js';

export const lighthouseSite = { x: -17, z: -107 };

export const madroneSites = [
  { x: 28, z: -30, size: 1, yaw: .3 },
  { x: 34, z: -20, size: .82, yaw: 2.1 }
];

// Painted structures and trees share one mesh; only the lantern and its halo
// draw separately. Neither needs a texture download.
function haloTexture() {
  const size = 64, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.hypot(x + .5 - size / 2, y + .5 - size / 2) / (size / 2);
    const v = Math.round(255 * Math.max(0, Math.exp(-d * d * 9) * 1.02 - .02));
    data.set([255, 255, 255, v], (y * size + x) * 4);
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createCoastalLandmarks(shores) {
  const group = new THREE.Group();
  group.name = 'Coastal landmarks and madrones';
  const positions = [], normals = [], colors = [];
  const transform = new THREE.Object3D(), tint = new THREE.Color();
  function add(geometry, color, x, y, z, rotation = 0) {
    transform.position.set(x, y, z);
    transform.rotation.set(0, rotation, 0);
    transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);
    const triangles = geometry.index ? geometry.toNonIndexed() : geometry;
    positions.push(...triangles.attributes.position.array);
    normals.push(...triangles.attributes.normal.array);
    tint.set(color);
    for (let i = 0; i < triangles.attributes.position.count; i++) colors.push(tint.r, tint.g, tint.b);
    if (triangles !== geometry) triangles.dispose();
    geometry.dispose();
  }
  const shore = shores.find(land => land.peninsula).ground;
  const { x, z } = lighthouseSite, y = shore.elevation(x, z) - .3;
  add(new THREE.CylinderGeometry(1.45, 1.65, 1, 8), '#85877a', x, y + .15, z);
  add(new THREE.CylinderGeometry(.65, 1.05, 4.3, 8), '#e7e6d6', x, y + 2.65, z);
  add(new THREE.CylinderGeometry(1.03, .87, .18, 8), '#475354', x, y + 4.85, z);
  add(new THREE.CylinderGeometry(.68, .68, .93, 8), '#4e666c', x, y + 5.4, z);
  add(new THREE.ConeGeometry(.99, .65, 8), '#963f30', x, y + 6.18, z);
  add(new THREE.CylinderGeometry(.035, .035, .4, 5), '#354349', x, y + 6.6, z);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    add(new THREE.CylinderGeometry(.035, .035, .9, 4), '#e2ded0', x + Math.cos(a) * .66, y + 5.4, z + Math.sin(a) * .66);
    add(new THREE.CylinderGeometry(.025, .025, .52, 4), '#475354', x + Math.cos(a) * .96, y + 5.13, z + Math.sin(a) * .96);
  }
  add(new THREE.TorusGeometry(.96, .027, 4, 16).rotateX(Math.PI / 2), '#475354', x, y + 5.4, z);
  add(new THREE.BoxGeometry(.4, .75, .025), '#344c4e', x, y + 1.55, z + .98);
  add(new THREE.BoxGeometry(.23, .44, .035), '#344c4e', x, y + 3.4, z + .76);
  const hx = x - 2.6, hz = z - 1.5, hy = shore.elevation(hx, hz) - .45;
  add(new THREE.BoxGeometry(2.7, 1.7, 2.3), '#dadcce', hx, hy + .85, hz);
  const roof = new THREE.CylinderGeometry(0, 1, 1, 4, 1).rotateY(Math.PI / 4);
  roof.scale(2.2, .95, 1.95);
  add(roof, '#884235', hx, hy + 2.14, hz);
  add(new THREE.BoxGeometry(.32, .9, .36), '#e0d9c4', hx - .65, hy + 2.22, hz - .3);
  for (const dx of [-.75, .7]) add(new THREE.BoxGeometry(.38, .52, .035), '#40585b', hx + dx, hy + 1.02, hz + 1.17);

  const madroneShore = shores.find(land => land.madrones).ground;
  for (const { x: mx, z: mz, size, yaw } of madroneSites) {
    const base = new THREE.Vector3(mx, madroneShore.elevation(mx, mz) - .14, mz);
    const axis = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
    function branch(a, b, radius) {
      const delta = b.clone().sub(a);
      const wood = new THREE.CylinderGeometry(radius * .57, radius, delta.length(), 7);
      wood.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
      const center = a.clone().add(b).multiplyScalar(.5);
      add(wood, '#a46a46', center.x, center.y, center.z);
    }
    const bend = base.clone().addScaledVector(axis, .25 * size).add(new THREE.Vector3(0, 1.3 * size, 0));
    branch(base, bend, .16 * size);
    for (const [reach, rise, spread] of [[-.65, 1.8, -.3], [.85, 1.4, .1], [.3, 2.1, .8]]) {
      const tip = bend.clone().addScaledVector(axis, reach * size).add(new THREE.Vector3(-axis.z * spread * size, rise * size, axis.x * spread * size));
      branch(bend, tip, .095 * size);
      for (let i = 0; i < 3; i++) {
        const angle = i * 2.4 + yaw;
        const leaves = new THREE.SphereGeometry(1, 9, 6).scale(.88 * size, .46 * size, .71 * size);
        add(leaves, i === 0 ? '#546444' : '#425638', tip.x + Math.cos(angle) * .42 * size,
          tip.y + .12 + i * .09, tip.z + Math.sin(angle) * .42 * size, angle);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .87 });
  group.add(new THREE.Mesh(geometry, material));
  const lanternMaterial = new THREE.MeshBasicMaterial({ color: '#ffd9a0' });
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(.24, 8, 6), lanternMaterial);
  lantern.position.set(x, y + 5.4, z + .58);
  // At this distance the lantern is a pixel wide; the halo is what reads as light.
  const haloMaterial = new THREE.SpriteMaterial({ map: haloTexture(), color: '#ffcf8a', transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const halo = new THREE.Sprite(haloMaterial);
  // Seated just in front of the lantern room so its mullions do not cut the glow.
  halo.position.copy(lantern.position).add(new THREE.Vector3(0, 0, 1.1));
  group.add(lantern, halo);
  const dim = new THREE.Color('#5d5a50'), lit = new THREE.Color('#ffd9a0');
  return { group, update(time, daylight) {
    // One short flash every six seconds over a faint standing glow.
    const cycle = time % 6, flash = Math.exp(-Math.pow((cycle - .5) / .22, 2));
    const night = 1 - daylight;
    lanternMaterial.color.copy(dim).lerp(lit, Math.max(flash, .12) * night);
    halo.scale.setScalar(4 + flash * 9);
    haloMaterial.opacity = (.12 + flash * .88) * night;
    halo.visible = night > .02;
  } };
}
