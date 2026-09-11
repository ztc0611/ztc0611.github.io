import * as THREE from './vendor/three.module.min.js';

export function createFerry() {
  const ferry = new THREE.Group();
  ferry.name = 'Double-ended island ferry';
  const ivory = new THREE.MeshStandardMaterial({ color: '#f0f1e8', roughness: .58 });
  const green = new THREE.MeshStandardMaterial({ color: '#176341', roughness: .49 });
  const hull = new THREE.MeshStandardMaterial({ color: '#172626', roughness: .64 });
  const deck = new THREE.MeshStandardMaterial({ color: '#928a72', roughness: .85 });
  const windowMat = new THREE.MeshStandardMaterial({ color: '#365760', emissive: '#ffc777', emissiveIntensity: .25, roughness: .26 });
  const orange = new THREE.MeshStandardMaterial({ color: '#ce693a', roughness: .62 });
  const lamp = new THREE.MeshBasicMaterial({ color: '#ffe3ad' });
  const batches = new Map();
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);

  function piece(geometry, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    position.set(x, y, z);
    quaternion.setFromEuler(new THREE.Euler(rx, ry, rz));
    matrix.compose(position, quaternion, scale);
    geometry.applyMatrix4(matrix);
    if (!batches.has(material)) batches.set(material, []);
    batches.get(material).push(geometry);
  }
  function box(w, h, d, x, y, z, material) {
    piece(new THREE.BoxGeometry(w, h, d), material, x, y, z);
  }
  function rail(ax, ay, az, bx, by, bz, radius = .017, material = green) {
    const a = new THREE.Vector3(ax, ay, az);
    const b = new THREE.Vector3(bx, by, bz);
    const direction = b.clone().sub(a);
    const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 5);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()));
    const middle = a.add(b).multiplyScalar(.5);
    piece(geometry, material, middle.x, middle.y, middle.z);
  }
  function planDeck(length, width, thickness, y, material, taper = .7) {
    const halfLength = length / 2;
    const halfWidth = width / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-halfLength, -halfWidth * .58);
    shape.lineTo(-halfLength + taper, -halfWidth);
    shape.lineTo(halfLength - taper, -halfWidth);
    shape.lineTo(halfLength, -halfWidth * .58);
    shape.lineTo(halfLength, halfWidth * .58);
    shape.lineTo(halfLength - taper, halfWidth);
    shape.lineTo(-halfLength + taper, halfWidth);
    shape.lineTo(-halfLength, halfWidth * .58);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, steps: 1 });
    piece(geometry, material, 0, y, 0, -Math.PI / 2);
  }

  // The repeated ends and open vehicle portals carry the silhouette at its small on-screen scale.
  planDeck(13.1, 2.68, .39, .02, hull, .83);
  planDeck(13.4, 2.9, .12, .41, hull, .8);
  planDeck(12.9, 2.79, .23, .53, green, .8);
  planDeck(13.0, 2.77, .06, .76, deck, .84);
  planDeck(11.48, 2.77, .11, 1.62, ivory, .36);
  planDeck(11.25, 2.75, .11, 2.32, ivory, .35);

  for (const side of [-1, 1]) {
    const z = side * 1.28;
    box(10.9, .85, .14, 0, 1.185, z, ivory);
    box(10.62, .57, .12, 0, 2.035, z, ivory);
    box(10.88, .065, .18, 0, 1.71, z, green);
    for (let i = 0; i < 19; i++) {
      const x = -4.94 + i * .549;
      box(.395, .32, .025, x, 2.04, side * 1.348, windowMat);
      if (i > 1 && i < 17) box(.35, .27, .025, x, 1.32, side * 1.358, windowMat);
    }
    rail(-5.2, 2.73, side * 1.31, 5.2, 2.73, side * 1.31);
    rail(-5.2, 2.54, side * 1.31, 5.2, 2.54, side * 1.31, .012);
    for (let i = 0; i <= 24; i++) {
      const x = -5.2 + i * 10.4 / 24;
      rail(x, 2.4, side * 1.31, x, 2.74, side * 1.31, .012);
    }
    for (const x of [-2.9, 2.9]) {
      piece(new THREE.TorusGeometry(.12, .032, 5, 12), orange, x, 2.6, side * 1.333);
      box(.46, .14, .19, x + .58, 2.53, side * .99, ivory);
    }
  }

  for (const end of [-1, 1]) {
    // Side piers leave the central car-deck opening physically empty, including in reflections.
    for (const side of [-1, 1]) {
      box(.32, .86, .32, end * 5.36, 1.19, side * 1.19, ivory);
      box(.25, .44, .16, end * 5.62, .99, side * 1.18, green);
      rail(end * 5.5, 1.03, side * 1.25, end * 6.35, 1.03, side * .83, .016);
    }
    box(.17, .23, 2.35, end * 5.34, 1.53, 0, ivory);
    box(.07, .59, 1.94, end * 4.86, 2.02, 0, ivory);
    for (let i = 0; i < 5; i++) box(.022, .32, .28, end * 4.905, 2.045, -.74 + i * .37, windowMat);

    const bridgeX = end * 4.12;
    box(1.25, .35, 1.61, bridgeX, 2.56, 0, ivory);
    box(1.53, .43, 1.94, bridgeX, 2.88, 0, ivory);
    box(1.72, .09, 2.14, bridgeX, 3.14, 0, green);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) box(.36, .285, .022, bridgeX - .48 + i * .48, 2.91, side * .982, windowMat);
    }
    for (const face of [-1, 1]) {
      for (let i = 0; i < 4; i++) box(.022, .285, .355, bridgeX + face * .778, 2.91, -.66 + i * .44, windowMat);
    }
    const mastX = bridgeX - end * .18;
    rail(mastX, 3.18, 0, mastX, 4.4, 0, .026, ivory);
    rail(mastX, 3.84, -.31, mastX, 3.84, .31, .018, ivory);
    rail(mastX, 4.16, -.21, mastX, 4.16, .21, .015, ivory);
    rail(mastX, 3.64, 0, mastX + end * .43, 4.05, 0, .014, ivory);
    box(.065, .075, .08, mastX, 4.42, 0, lamp);
    box(.06, .08, .08, end * 5.28, 2.53, 1.31, lamp);
  }

  // A flattened funnel reads as the broad central stack of the reference boats from shore.
  box(.72, .74, .8, 0, 2.8, 0, ivory);
  box(.76, .18, .84, 0, 2.5, 0, green);
  box(.78, .12, .86, 0, 3.19, 0, hull);
  for (const side of [-1, 1]) {
    piece(new THREE.CircleGeometry(.095, 12), green, 0, 2.83, side * .406, 0, side === -1 ? Math.PI : 0);
  }

  // Consolidation keeps railings and repeated windows from becoming separate draw calls.
  for (const [material, geometries] of batches) {
    const positions = [];
    const normals = [];
    for (const source of geometries) {
      const geometry = source.index ? source.toNonIndexed() : source;
      positions.push(geometry.getAttribute('position').array);
      normals.push(geometry.getAttribute('normal').array);
      if (geometry !== source) geometry.dispose();
      source.dispose();
    }
    function concatenate(arrays) {
      const result = new Float32Array(arrays.reduce((total, array) => total + array.length, 0));
      let offset = 0;
      for (const array of arrays) { result.set(array, offset); offset += array.length; }
      return result;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(concatenate(positions), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(concatenate(normals), 3));
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, material);
    ferry.add(mesh);
  }
  return { ferry, windowMat };
}
