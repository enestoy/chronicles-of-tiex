import * as THREE from 'three';
export class Lighting {
  constructor(scene) {
    this.ambient = new THREE.AmbientLight(0x9cbdc9, .5); scene.add(this.ambient);
    scene.add(new THREE.HemisphereLight(0xaac9d6, 0x292e23, 1.45));
    this.moon = new THREE.DirectionalLight(0xa8c6d9, 2.25); this.moon.position.set(50, 75, -90); this.moon.castShadow = true;
    const c = this.moon.shadow.camera; c.left = -35; c.right = 35; c.top = 35; c.bottom = -35; c.far = 190;
    this.moon.shadow.mapSize.set(2048, 2048); this.moon.shadow.bias = -.0004; this.moon.shadow.normalBias = .3;
    scene.add(this.moon, this.moon.target);
    this.war = new THREE.DirectionalLight(0xd79468, .75); this.war.position.set(-35, 20, -180); scene.add(this.war);
    this.flash = new THREE.DirectionalLight(0xbadbea, 0); this.flash.position.set(-30, 65, -230); scene.add(this.flash);
    this.spot = new THREE.SpotLight(0xffbf78, 30, 35, .65, .7, 1.5); this.spot.position.set(0, 15, -231); this.spot.target.position.set(0, 0, -213); scene.add(this.spot, this.spot.target);
  }
  update(time, position) {
    this.moon.position.set(position.x + 50, 75, position.z - 45); this.moon.target.position.set(position.x, 0, position.z);
    const cycle = time % 31; this.flash.intensity = cycle > 29.5 && cycle < 29.65 ? 2 : cycle > 29.85 && cycle < 29.92 ? 3 : 0;
  }
}
