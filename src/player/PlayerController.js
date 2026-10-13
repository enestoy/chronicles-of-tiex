import * as THREE from 'three';
import { groundHeight } from '../world/primitives.js';
export class PlayerController {
  constructor(state, camera, canvas, world, settings) {
    this.state = state; this.camera = camera; this.canvas = canvas; this.world = world; this.settings = settings;
    this.keys = new Set(); this.yaw = 0; this.pitch = .24; this.enabled = false; this.moving = false; this.running = false; this.exhausted = false;
    this.target = new THREE.Vector3(); this.desired = new THREE.Vector3(); this.direction = new THREE.Vector3();
    window.addEventListener('keydown', e => { if (!e.target.matches('input, textarea, select')) this.keys.add(e.code); });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement) this.keys.clear(); });
    canvas.addEventListener('pointerdown', e => { if (this.enabled && e.pointerType === 'mouse') { const p = canvas.requestPointerLock?.(); p?.catch?.(() => {}); } });
    window.addEventListener('mousemove', e => {
      if (!this.enabled || document.pointerLockElement !== canvas && !(e.buttons === 1 && e.target === canvas)) return;
      this.yaw -= e.movementX * .0025 * this.settings.sensitivity; this.pitch = THREE.MathUtils.clamp(this.pitch + e.movementY * .0017 * this.settings.sensitivity, -.08, .95);
    });
  }
  release() { this.keys.clear(); if (document.pointerLockElement) document.exitPointerLock(); }
  resetCamera() { this.yaw = 0; this.pitch = .24; this.follow(1, true); }
  update(dt) {
    this.moving = false; this.running = false;
    if (!this.enabled) return;
    const x = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    const z = Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) - Number(this.keys.has('KeyW') || this.keys.has('ArrowUp'));
    this.direction.set(x, 0, z).normalize().applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.yaw);
    this.moving = x !== 0 || z !== 0;
    if (this.state.stats.stamina <= 1) this.exhausted = true;
    if (this.state.stats.stamina >= 25) this.exhausted = false;
    this.running = this.moving && this.keys.has('ShiftLeft') && !this.exhausted;
    this.state.stats.stamina = THREE.MathUtils.clamp(this.state.stats.stamina + dt * (this.running ? -12 : this.moving ? 7 : 15), 0, 100);
    if (this.moving) {
      const speed = this.running ? 7.5 : 4.1, p = this.state.position;
      const nx = THREE.MathUtils.clamp(p.x + this.direction.x * speed * dt, -67, 67), nz = THREE.MathUtils.clamp(p.z + this.direction.z * speed * dt, -222, 60);
      if (this.world.canMove(nx, p.z)) p.x = nx;
      if (this.world.canMove(p.x, nz)) p.z = nz;
      p.y = groundHeight(p.x, p.z);
      let angle = Math.atan2(-this.direction.x, -this.direction.z);
      while (angle - this.state.rotation > Math.PI) angle -= Math.PI * 2;
      while (angle - this.state.rotation < -Math.PI) angle += Math.PI * 2;
      this.state.rotation = angle;
    }
    this.follow(dt);
  }
  follow(dt, snap = false) {
    const p = this.state.position; this.target.set(p.x, p.y + 1.55, p.z);
    let distance = 6.8;
    // Probe the camera arm against authored geometry colliders.
    for (let d = .8; d < 6.8; d += .4) {
      const x = p.x + Math.sin(this.yaw) * d, z = p.z + Math.cos(this.yaw) * d;
      if (!this.world.canMove(x, z)) { distance = Math.max(1.2, d - .45); break; }
    }
    this.desired.set(p.x + Math.sin(this.yaw) * distance, p.y + 1.6 + Math.sin(this.pitch) * distance, p.z + Math.cos(this.yaw) * distance);
    this.desired.y = Math.max(this.desired.y, groundHeight(this.desired.x, this.desired.z) + .8);
    this.camera.position.lerp(this.desired, snap ? 1 : 1 - Math.exp(-7 * dt)); this.camera.lookAt(this.target);
  }
  dialogue(dt, subject) {
    const p = this.state.position;
    this.target.set(subject ? (p.x + subject.x) / 2 : p.x, p.y + 1.45, subject ? (p.z + subject.z) / 2 : p.z - .5);
    this.desired.set(p.x + 3.7, p.y + 2.7, p.z + 3.4);
    if (!this.world.canMove(this.desired.x, this.desired.z)) this.desired.x = p.x - 3.7;
    this.camera.position.lerp(this.desired, 1 - Math.exp(-2 * dt)); this.camera.lookAt(this.target);
  }
}
