import * as THREE from './vendor/three.module.min.js';

function createMineralTexture() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  const wrap = (value, period) => ((value % period) + period) % period;
  function hash(x, y, period) {
    let n = Math.imul(wrap(x, period) + 11, 374761393) ^ Math.imul(wrap(y, period) + 37, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }
  function noise(x, y, period) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(hash(ix, iy, period), hash(ix + 1, iy, period), sx),
      THREE.MathUtils.lerp(hash(ix, iy + 1, period), hash(ix + 1, iy + 1, period), sx), sy);
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const broad = noise(u * 8, v * 8, 8);
      const middle = noise(u * 24, v * 24, 24);
      const fine = noise(u * 80, v * 80, 80);
      const grain = noise(u * 128, v * 128, 128);
      const lichen = noise(u * 12 + broad * 1.4, v * 12 + middle * .7, 12);
      const index = (y * size + x) * 4;
      data[index] = Math.round((broad * .64 + middle * .27 + fine * .09) * 255);
      data[index + 1] = Math.round((middle * .23 + fine * .44 + grain * .33) * 255);
      data[index + 2] = Math.round(lichen * 255);
      data[index + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

const surfacePars = `
  uniform sampler2D uSurfaceMineral;
  uniform float uSurfaceWetness;
  varying vec3 vSurfaceWorld;
  varying vec3 vSurfaceNormal;
  vec3 surfaceSample(vec3 p, vec3 weights) {
    return texture2D(uSurfaceMineral, p.yz).rgb * weights.x
      + texture2D(uSurfaceMineral, p.xz).rgb * weights.y
      + texture2D(uSurfaceMineral, p.xy).rgb * weights.z;
  }
`;

// Shared world-space mapping prevents UV stretching on steep coastlines and keeps
// the material identical when the inlet renders through its reflection camera.
export function createSurfaceDetails() {
  const mineral = { value: createMineralTexture() };
  const wetness = { value: 0 };
  function apply(material, kind, snow) {
    const isRock = kind === 'rock';
    if (isRock) material.color.set('#9cadaa');
    material.roughness = isRock ? .88 : .97;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uSurfaceMineral = mineral;
      shader.uniforms.uSurfaceWetness = wetness;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vSurfaceWorld;\nvarying vec3 vSurfaceNormal;')
        .replace('#include <defaultnormal_vertex>', `#include <defaultnormal_vertex>
          vSurfaceNormal = inverseTransformDirection(transformedNormal, viewMatrix);`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vSurfaceWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${surfacePars}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          vec3 surfaceWorldNormal = normalize(vSurfaceNormal);
          vec3 surfaceWeights = pow(abs(surfaceWorldNormal), vec3(4.0));
          surfaceWeights /= max(dot(surfaceWeights, vec3(1.0)), .0001);
          vec3 surfaceCoarse = surfaceSample(vSurfaceWorld * .065, surfaceWeights);
          vec3 surfaceFine = surfaceSample(vSurfaceWorld * .43 + vec3(.19, .37, .11), surfaceWeights);
          float surfaceSnow = ${snow ? 'smoothstep(.28, .54, dot(diffuseColor.rgb, vec3(.2126, .7152, .0722)))' : '0.0'};
          float surfaceDetail = 1.0 - surfaceSnow * .82;
          float surfaceUp = smoothstep(.24, .86, surfaceWorldNormal.y);
          float surfaceLichen = smoothstep(.52, .72, surfaceCoarse.b + (surfaceFine.b - .5) * .22);
          float surfaceGrain = (surfaceFine.g - .5) * ${isRock ? '.34' : '.20'};
          float surfaceLayerPhase = vSurfaceWorld.y * ${isRock ? '3.1' : '1.8'} + vSurfaceWorld.x * .11 + surfaceCoarse.r * 7.0;
          float surfaceLayerFade = 1.0 - smoothstep(.55, 2.6, fwidth(surfaceLayerPhase));
          float surfaceLayers = sin(surfaceLayerPhase) * surfaceLayerFade * (1.0 - surfaceUp * .75);
          diffuseColor.rgb *= 1.0 + ((surfaceCoarse.r - .5) * .32 + surfaceGrain + surfaceLayers * ${isRock ? '.08' : '.045'}) * surfaceDetail;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(.91, 1.045, .83), surfaceLichen * surfaceUp * surfaceDetail * ${isRock ? '.62' : '.42'});
          float surfaceShore = 1.0 - smoothstep(.15, 2.0, vSurfaceWorld.y + (surfaceCoarse.r - .5) * .48);
          float surfaceWet = clamp(surfaceShore * .32 + uSurfaceWetness * (.56 + surfaceShore * .25), 0.0, 1.0) * (1.0 - surfaceSnow);
          diffuseColor.rgb *= 1.0 - surfaceWet * ${isRock ? '.25' : '.19'};
          float bedrock = (1.0 - smoothstep(3.0, 8.0, vSurfaceWorld.y)) * (1.0 - surfaceSnow);
          float jointPhase = vSurfaceWorld.x * .46 + vSurfaceWorld.z * .27 + vSurfaceWorld.y * .14 + surfaceCoarse.r * 2.4;
          float jointWidth = max(.045, fwidth(jointPhase) * .7);
          float joints = (1.0 - smoothstep(jointWidth, jointWidth * 2.8, abs(sin(jointPhase)))) * bedrock * (1.0 - surfaceUp * .55);
          diffuseColor.rgb *= 1.0 - joints * .15;
          float surfaceHeight = ((surfaceFine.g - .5) * .045 + (surfaceCoarse.r - .5) * .07 + surfaceLayers * .009) * surfaceDetail - joints * .012;
        `)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          roughnessFactor = clamp(roughnessFactor - surfaceFine.g * .10 - surfaceWet * ${isRock ? '.32' : '.18'} + surfaceSnow * .07, .36, 1.0);
        `)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          vec3 surfaceDx = dFdx(-vViewPosition);
          vec3 surfaceDy = dFdy(-vViewPosition);
          vec3 surfaceR1 = cross(surfaceDy, normal);
          vec3 surfaceR2 = cross(normal, surfaceDx);
          float surfaceDet = dot(surfaceDx, surfaceR1);
          vec3 surfaceGradient = (dFdx(surfaceHeight) * surfaceR1 + dFdy(surfaceHeight) * surfaceR2) * sign(surfaceDet);
          normal = normalize(abs(surfaceDet) * normal - surfaceGradient);
        `);
    };
    material.customProgramCacheKey = () => `inlet-mineral-v1-${kind}-${snow}`;
    material.needsUpdate = true;
    return material;
  }
  return {
    terrain(material, snow = false) { return apply(material, 'terrain', snow); },
    rock(material) { return apply(material, 'rock', false); },
    setWetness(value) { wetness.value = THREE.MathUtils.clamp(value, 0, 1); }
  };
}
