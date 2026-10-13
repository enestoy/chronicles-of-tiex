import * as THREE from 'three';
import { mesh, box, materials } from '../world/primitives.js';

export function createCharacter({ color = 0x374344, armor = false } = {}) {
  const group = new THREE.Group();
  const fabric = new THREE.MeshStandardMaterial({ color, roughness: 1 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x342d26, roughness: .94 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x937764, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x171e1d, roughness: 1 });
  const torso = mesh(new THREE.CapsuleGeometry(.29, .53, 4, 8), armor ? materials.iron : fabric, group, 0, 1.27, 0); torso.scale.x = 1.22;
  mesh(new THREE.SphereGeometry(.28, 10, 8), fabric, group, 0, 1.96, .025).scale.set(1.22, 1.27, 1.1);
  const face = mesh(new THREE.SphereGeometry(.2, 8, 8), skin, group, 0, 1.97, -.145); face.scale.set(1, 1.13, .7);
  box(group, [.29, .08, .05], [0, 2.04, -.294], dark);
  mesh(new THREE.CylinderGeometry(.32, .31, .12, 8), leather, group, 0, 1.02, 0);
  box(group, [.13, .12, .04], [0, 1.02, -.32], materials.iron);
  const limbs = {};
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(side * .17, .88, 0); group.add(leg);
    mesh(new THREE.CylinderGeometry(.12, .1, .6, 6), dark, leg, 0, -.27, 0);
    box(leg, [.23, .3, .35], [0, -.64, -.05], leather); limbs[side === -1 ? 'leftLeg' : 'rightLeg'] = leg;
    const arm = new THREE.Group(); arm.position.set(side * .38, 1.53, 0); group.add(arm);
    mesh(new THREE.CapsuleGeometry(.115, .37, 3, 6), fabric, arm, 0, -.2, 0);
    mesh(new THREE.SphereGeometry(.1, 6, 6), leather, arm, 0, -.52, 0); limbs[side === -1 ? 'leftArm' : 'rightArm'] = arm;
    if (armor) mesh(new THREE.SphereGeometry(.22, 8, 6), materials.iron, group, side * .36, 1.57, .015).scale.y = .58;
  }
  const capeGeometry = new THREE.BufferGeometry();
  capeGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-.36,1.64,.17,.36,1.64,.17,-.51,.42,.39,.36,1.64,.17,.51,.42,.39,-.51,.42,.39],3)); capeGeometry.computeVertexNormals();
  const cape = mesh(capeGeometry, new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 1 }), group);
  const sword = new THREE.Group(); sword.position.set(-.39, 1.1, 0); sword.rotation.z = -.18; group.add(sword);
  box(sword, [.065, .85, .12], [0, -.48, 0], materials.iron); box(sword, [.29, .045, .11], [0, 0, 0], materials.iron); box(sword, [.075, .24, .07], [0, .12, 0], leather);
  return { group, limbs, cape, sword };
}
