import { createCharacter } from '../player/CharacterModel.js';
import { groundHeight } from '../world/primitives.js';
export class NPCManager {
  constructor(scene) {
    this.models = {};
    const entries = [['kael', 15, 7, 0x334c60, true], ['mira', -22, -29, 0x625346, false], ['edric', 0, -215, 0x364c62, true], ['deserter', 1, -133, 0x485349, true], ['ashen', 16, -156, 0x646862, false]];
    for (const [id, x, z, color, armor] of entries) {
      const model = createCharacter({ color, armor }); model.group.position.set(x, groundHeight(x, z), z); model.group.rotation.y = Math.PI; scene.add(model.group); this.models[id] = model;
    }
  }
  update(time, state) {
    const kael = this.models.kael.group;
    if (state.npcs.kael.location === 'road') { kael.position.set(-2, groundHeight(-2, -133), -133); kael.rotation.z = 0; }
    else { kael.position.set(15, groundHeight(15, 7) - .2, 7); kael.rotation.z = state.npcs.kael.alive ? .7 : Math.PI / 2; }
    for (const [id, m] of Object.entries(this.models)) { m.cape.rotation.x = Math.sin(time * 2 + m.group.position.x) * .03; if (id !== 'kael') m.limbs.leftArm.rotation.x = Math.sin(time + m.group.position.x) * .04; }
  }
}
