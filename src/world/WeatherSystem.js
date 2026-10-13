import * as THREE from 'three';
import { seededRandom } from './primitives.js';
export class WeatherSystem {
  constructor(scene) {
    this.scene = scene; this.mode = 'rain'; this.count = 1500; this.random = seededRandom(23);
    const p = new Float32Array(this.count * 6);
    for (let i = 0; i < this.count; i++) { const x = (this.random() - .5) * 75, y = this.random() * 35, z = (this.random() - .5) * 75; p.set([x, y, z, x - .06, y + .5, z], i * 6); }
    this.geometry = new THREE.BufferGeometry(); this.geometry.setAttribute('position', new THREE.BufferAttribute(p, 3));
    this.rain = new THREE.LineSegments(this.geometry, new THREE.LineBasicMaterial({ color: 0xadc1c5, transparent: true, opacity: .18, depthWrite: false })); this.rain.frustumCulled = false; scene.add(this.rain);
  }
  setMode(mode) { this.mode = mode; this.rain.visible = ['rain', 'storm'].includes(mode); this.scene.fog.density = mode === 'clear' ? .003 : mode === 'storm' ? .009 : .006; }
  setQuality(quality) { this.geometry.setDrawRange(0, (quality === 'low' ? 450 : quality === 'high' ? 1500 : 900) * 2); }
  update(dt, position) {
    if (!this.rain.visible) return;
    this.rain.position.set(position.x, 0, position.z);
    const p = this.geometry.attributes.position.array;
    for (let i = 0; i < p.length; i += 6) { p[i + 1] -= dt * 14; if (p[i + 1] < 0) p[i + 1] = 35; p[i + 4] = p[i + 1] + .5; }
    this.geometry.attributes.position.needsUpdate = true;
  }
}
