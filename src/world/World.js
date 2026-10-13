import * as THREE from 'three';
import { Environment } from './Environment.js';
import { Structures } from './Structures.js';
import { Lighting } from './Lighting.js';
import { WeatherSystem } from './WeatherSystem.js';
export class World {
  constructor(scene) {
    this.colliders = []; scene.fog = new THREE.FogExp2(0x3a5056, .006);
    this.environment = new Environment(scene, this.colliders); this.structures = new Structures(scene, this.colliders);
    this.lighting = new Lighting(scene); this.weather = new WeatherSystem(scene);
  }
  update(dt, time, state, camera) { this.environment.update(time); this.structures.update(time, state, camera); this.lighting.update(time, camera.position); this.weather.update(dt, camera.position); }
  canMove(x, z) { return !this.colliders.some(c => (x - c.x) ** 2 + (z - c.z) ** 2 < (c.radius + .35) ** 2); }
}
