import * as THREE from 'three';
import { createCharacter } from './CharacterModel.js';
export const ANIMATIONS = ['Idle', 'Walk', 'Run', 'Interact', 'Attack', 'Hurt', 'Death'];
export class Player {
  constructor(scene, state) { this.state = state; Object.assign(this, createCharacter()); this.root = this.group; scene.add(this.root); this.animation = 'Idle'; this.actions = new Map(); }
  async loadModel(url) {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().loadAsync(url);
    this.root.clear(); this.root.add(gltf.scene); this.mixer = new THREE.AnimationMixer(gltf.scene);
    gltf.scene.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
    for (const clip of gltf.animations) this.actions.set(clip.name, this.mixer.clipAction(clip));
    this.animation = null; this.setAnimation('Idle');
  }
  setAnimation(name) {
    if (!ANIMATIONS.includes(name)) return;
    if (this.animation !== name && this.actions.size) { this.actions.get(this.animation)?.fadeOut(.2); this.actions.get(name)?.reset().fadeIn(.2).play(); }
    this.animation = name;
  }
  update(dt, time, moving, running) {
    this.root.position.set(this.state.position.x, this.state.position.y, this.state.position.z);
    this.root.rotation.y = THREE.MathUtils.damp(this.root.rotation.y, this.state.rotation, 14, dt);
    this.setAnimation(moving ? running ? 'Run' : 'Walk' : 'Idle');
    if (this.mixer) { this.mixer.update(dt); return; }
    const stride = moving ? Math.sin(time * (running ? 12 : 8)) * (running ? .75 : .5) : Math.sin(time * 1.7) * .025;
    this.limbs.leftLeg.rotation.x = stride; this.limbs.rightLeg.rotation.x = -stride;
    this.limbs.leftArm.rotation.x = -stride * .7; this.limbs.rightArm.rotation.x = stride * .7;
    this.cape.rotation.x = -.04 + Math.sin(time * 3.5) * .035 + (running ? -.2 : 0);
    this.root.position.y += moving ? Math.abs(Math.sin(time * 8)) * .055 : Math.sin(time * 1.7) * .012;
  }
}
