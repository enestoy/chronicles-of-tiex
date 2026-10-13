import * as THREE from 'three';
import { box, mesh, materials, torch, groundHeight, seededRandom } from './primitives.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export class Structures {
  constructor(scene, colliders) { this.scene = scene; this.colliders = colliders; this.torches = []; this.groups = []; this.r = seededRandom(218); this.castle(); this.landmarks(); this.batchStaticMeshes(); }
  group(x, z) { const g = new THREE.Group(); g.position.set(x, groundHeight(x, z), z); this.scene.add(g); this.groups.push(g); return g; }
  addTorch(parent, x, y, z, options) { const t = torch(parent, x, y, z, options); this.torches.push(t); return t; }
  tower(parent, x, z, height = 23, radius = 5) {
    mesh(new THREE.CylinderGeometry(radius, radius * 1.1, height, 12), materials.stone, parent, x, height / 2, z);
    mesh(new THREE.CylinderGeometry(radius * 1.13, radius * 1.1, 1.2, 12), materials.darkStone, parent, x, height - .8, z);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const b = box(parent, [1.3, 2, 1.2], [x + Math.sin(a) * radius, height + .2, z + Math.cos(a) * radius]); b.rotation.y = a; }
    for (let y = 7; y < height - 3; y += 6) { box(parent, [.48, 1.65, .13], [x, y, z + radius + .05], materials.window); }
    this.addTorch(parent, x, height, z + radius, { light: false, size: 1.2 });
  }
  castle() {
    const g = this.group(0, -245); this.city = g;
    for (const side of [-1, 1]) {
      box(g, [71, 15, 5], [side * 43, 7.5, 0]);
      box(g, [71, .6, 5.5], [side * 43, 13.8, 0], materials.darkStone);
      for (let i = 0; i < 24; i++) { box(g, [1.3, 1.6, 5], [side * (9 + i * 3), 15.4, 0]); if (i % 3 === 0) this.addTorch(g, side * (9 + i * 3), 12, 3, { light: false }); }
      this.tower(g, side * 11, 1, 25, 5);
      this.tower(g, side * 46, -1, 22, 4.7);
      this.tower(g, side * 81, -4, 28, 5.5);
      box(g, [10, 17, 9], [side * 29, 8.5, -26]);
      mesh(new THREE.ConeGeometry(8.5, 14, 4), materials.darkStone, g, side * 29, 24, -26).rotation.y = Math.PI / 4;
      this.tower(g, side * 20, -48, 40, 5);
      mesh(new THREE.ConeGeometry(7, 16, 8), materials.darkStone, g, side * 20, 48, -48);
    }
    box(g, [12, 8, 6], [0, 18.2, 1]);
    // Open, pointed portal with a visible portcullis, rather than a solid box.
    const arch = new THREE.Shape(); arch.moveTo(-6, 0); arch.lineTo(-6, 12); arch.quadraticCurveTo(0, 21, 6, 12); arch.lineTo(6, 0); arch.lineTo(4.5, 0); arch.lineTo(4.5, 11.5); arch.quadraticCurveTo(0, 17, -4.5, 11.5); arch.lineTo(-4.5, 0);
    mesh(new THREE.ExtrudeGeometry(arch, { depth: 4, bevelEnabled: false }), materials.darkStone, g, 0, 0, 2);
    for (let i = -4; i <= 4; i++) box(g, [.14, 6, .17], [i, 13, 2.4], materials.iron);
    box(g, [24, 30, 22], [0, 15, -42]);
    box(g, [27, 2, 25], [0, 30, -42], materials.darkStone);
    this.tower(g, 0, -43, 55, 6);
    mesh(new THREE.ConeGeometry(8, 17, 8), materials.darkStone, g, 0, 62, -43);
    for (let i = 0; i < 25; i++) {
      const x = (this.r() - .5) * 120, z = -13 - this.r() * 50, h = 5 + this.r() * 8;
      box(g, [5 + this.r() * 3, h, 7], [x, h / 2, z], i % 2 ? materials.stone : materials.darkStone);
      for (let y = 3; y < h; y += 3) box(g, [.7, 1.3, .12], [x, y, z + 3.56], materials.window);
    }
    for (const x of [-7, 7]) this.addTorch(g, x, 3, 7, { size: 2 });
    // Retaining walls narrow the approach naturally, without blocking the playable gate.
    for (const x of [-9, 9]) { box(g, [1.2, 2, 30], [x, 1, 20]); for (let z = 9; z < 35; z += 8) this.addTorch(g, x, 2, z); }
    this.banner = box(g, [2.6, 6, .07], [-10.5, 15, 6.1], materials.blue); this.banner.visible = false;
  }
  landmarks() {
    // Refugee camp.
    const camp = this.group(-22, -29);
    for (const [x, z, angle] of [[-5, -3, .2], [5, -5, -.4], [-6, 4, .5]]) {
      const tent = new THREE.Group(); tent.position.set(x, 0, z); tent.rotation.y = angle; camp.add(tent);
      const geometry = new THREE.CylinderGeometry(1, 1, 4.7, 3, 1, true); geometry.rotateZ(Math.PI / 2); geometry.rotateY(Math.PI / 2); geometry.scale(2, 2, 1);
      mesh(geometry, materials.cloth, tent, 0, 1, 0);
      box(tent, [.12, 2.8, .12], [0, 1.4, 2.3], materials.wood);
    }
    this.addTorch(camp, -2, -.8, -1.5, { size: 1.7 });
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; mesh(new THREE.DodecahedronGeometry(.35), materials.stone, camp, -2 + Math.sin(a), .1, -1.5 + Math.cos(a)); }
    box(camp, [3.5, .35, .6], [0, .3, 2.7], materials.wood);
    // A ruined watchtower; the interactive chest is outside its open southern face.
    const tower = this.group(23, -75);
    for (let y = 0; y < 7; y++) for (let a = 0; a < 11; a++) {
      if (a > 3 && a < 7 || y > 4 && (a + y) % 3 === 0) continue;
      const angle = a / 12 * Math.PI * 2, b = box(tower, [2.25, 1.3, 1.2], [Math.sin(angle) * 4.5, y * 1.32 + .6, Math.cos(angle) * 4.5]); b.rotation.y = angle;
    }
    box(tower, [2, 1.15, 1.1], [0, .57, 6], materials.wood); box(tower, [2.1, .17, 1.2], [0, 1.2, 6], materials.iron);
    this.addTorch(tower, -3, 0, 7);
    for (let i = 0; i < 12; i++) { const x = (this.r() - .5) * 10, z = (this.r() - .5) * 10; box(tower, [1.2, .6, .9], [x, .2, z]).rotation.y = this.r() * 6; }
    // Farm with collapsed roof and a small fenced herb garden.
    const farm = this.group(-25, -106);
    box(farm, [8, 3.8, .5], [0, 1.9, -3]); box(farm, [.5, 3.8, 6], [-4, 1.9, 0]); box(farm, [.5, 2.5, 6], [4, 1.25, 0]);
    for (let i = 0; i < 7; i++) { const roof = box(farm, [5, .16, .8], [-1.6, 4, -3 + i], materials.wood); roof.rotation.z = -.45; }
    for (let i = 0; i < 6; i++) { box(farm, [.15, 1.3, .15], [8, .65, -4 + i * 1.5], materials.wood); }
    box(farm, [.12, .12, 8.5], [8, .9, 0], materials.wood);
    this.addTorch(farm, 5, 0, 5);
    // Broken cart on the first path, scattered shields and roadside markers.
    const cart = this.group(-6, 32); cart.rotation.y = -.35;
    box(cart, [2.8, .3, 4], [0, .8, 0], materials.wood); box(cart, [.18, 1, 4], [-1.3, 1.35, 0], materials.wood);
    for (const x of [-1.5, 1.5]) for (const z of [-1.25, 1.25]) { const wheel = mesh(new THREE.TorusGeometry(.7, .1, 5, 12), materials.wood, cart, x, .65, z); wheel.rotation.y = Math.PI / 2; }
    box(cart, [.14, .14, 3], [.7, .5, 3], materials.wood).rotation.z = .12;
    for (let i = 0; i < 10; i++) {
      const z = 22 - i * 18, x = (i % 2 ? 1 : -1) * (6 + this.r() * 2), g = this.group(x, z);
      if (i % 2 === 0) this.addTorch(g, 0, 0, 0);
      else { const shield = mesh(new THREE.CylinderGeometry(.6, .6, .08, 7), materials.iron, g, 0, .1, 0); shield.rotation.z = .2; }
    }
    this.addTorch(this.scene, 14, groundHeight(14, 7), 7);
    this.addTorch(this.scene, 3, groundHeight(3, -133), -133);
    this.addTorch(this.scene, 18, groundHeight(18, -156), -156);
    // Coarse colliders are authored separately from decorative geometry.
    this.colliders.push({ x: -25, z: -109, radius: 3.4 }, { x: 23, z: -77, radius: 4 }, { x: -6, z: 32, radius: 1.6 });
  }
  batchStaticMeshes() {
    this.scene.updateMatrixWorld(true);
    for (const group of this.groups) {
      const batches = new Map(), removed = [];
      group.traverse(object => {
        if (!object.isMesh || object === this.banner) return;
        let node = object;
        while (node && node !== group) { if (node.userData.dynamic) return; node = node.parent; }
        const list = batches.get(object.material) ?? [];
        const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
        list.push(geometry.applyMatrix4(object.matrixWorld)); batches.set(object.material, list); removed.push(object);
      });
      for (const [material, geometries] of batches) {
        const merged = new THREE.Mesh(mergeGeometries(geometries), material); merged.castShadow = true; merged.receiveShadow = true; this.scene.add(merged);
        geometries.forEach(g => g.dispose());
      }
      removed.forEach(object => { object.removeFromParent(); object.geometry.dispose(); });
    }
  }
  update(time, state, camera) {
    const points = this.torches.filter(t => t.light);
    if (!this.lastLightUpdate || time - this.lastLightUpdate > 1) {
      const position = new THREE.Vector3();
      points.sort((a, b) => a.group.getWorldPosition(position).distanceToSquared(camera.position) - b.group.getWorldPosition(position).distanceToSquared(camera.position));
      points.forEach((t, index) => t.light.visible = index < 5); this.lastLightUpdate = time;
    }
    for (const t of this.torches) {
      const f = 1 + Math.sin(time * 8 + t.phase) * .12 + Math.sin(time * 17 + t.phase) * .06;
      if (t.light) t.light.intensity = t.base * f;
      t.flame.scale.y = 2.2 * f; t.flame.rotation.y = time + t.phase;
    }
    this.banner.visible = state.flags.includes('returned_banner');
  }
}
