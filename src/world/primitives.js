import * as THREE from 'three';
export const materials = {
  stone: new THREE.MeshStandardMaterial({ color: 0x535d5b, roughness: 0.94 }),
  darkStone: new THREE.MeshStandardMaterial({ color: 0x343f40, roughness: 0.95 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x433c31, roughness: 1 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x646c6b, metalness: 0.65, roughness: 0.45 }),
  cloth: new THREE.MeshStandardMaterial({ color: 0x58605b, side: THREE.DoubleSide, roughness: 1 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x263e50, side: THREE.DoubleSide, roughness: 1 }),
  flame: new THREE.MeshBasicMaterial({ color: 0xffba64, toneMapped: false }),
  window: new THREE.MeshBasicMaterial({ color: 0xffc889, toneMapped: false }),
};
export function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material); object.position.set(x, y, z);
  object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
}
export function box(parent, dimensions, position, material = materials.stone) { return mesh(new THREE.BoxGeometry(...dimensions), material, parent, ...position); }
export function seededRandom(seed = 417) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function groundHeight(x, z) { return Math.sin(x * .075) * .36 + Math.cos(z * .072) * .22 + Math.max(0, -z - 166) * .035; }
export function pathCenter(z) { return Math.sin(z * .029) * 3.2; }
export function torch(parent, x, y, z, { light = true, size = 1 } = {}) {
  const group = new THREE.Group(); group.userData.dynamic = true; group.position.set(x, y, z); parent.add(group);
  mesh(new THREE.CylinderGeometry(.07, .09, 1.4, 5), materials.wood, group, 0, .7, 0);
  mesh(new THREE.CylinderGeometry(.19, .12, .28, 6), materials.iron, group, 0, 1.42, 0);
  const flame = mesh(new THREE.IcosahedronGeometry(.22, 0), materials.flame, group, 0, 1.77, 0); flame.scale.set(.8, 2.2, .8);
  let point = null;
  if (light) { point = new THREE.PointLight(0xffa45b, 11 * size, 13 * size, 2); point.position.set(0, 2, 0); group.add(point); }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff9d4c, transparent: true, opacity: .24, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.y = 1.75; glow.scale.set(2.5, 3.5, 1); group.add(glow); group.scale.setScalar(size);
  return { group, flame, light: point, base: point?.intensity ?? 0, phase: Math.random() * 6 };
}
let glowMap;
export function glowTexture() {
  if (glowMap) return glowMap;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const c = canvas.getContext('2d'), gradient = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)'); gradient.addColorStop(.16, 'rgba(255,255,255,.55)'); gradient.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gradient; c.fillRect(0, 0, 64, 64); glowMap = new THREE.CanvasTexture(canvas); return glowMap;
}
