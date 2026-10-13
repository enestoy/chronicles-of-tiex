import { locations } from '../data/locations.js';
const encounters = [
  { id: 'kael', event: 'wounded_knight', label: 'Talk to Kael Varen', visible: s => !s.flags.includes('kael_resolved') },
  { id: 'camp', event: 'camp', label: 'Talk to Mira' },
  { id: 'tower', event: 'tower', label: 'Examine the watchtower' },
  { id: 'farm', event: 'farm', label: 'Search the farm' },
  { id: 'ashen', event: 'ashen', label: 'Talk to the Ashen wanderer' },
  { id: 'gate', event: 'gate', label: 'Talk to Ser Edric' },
];
export class InteractionSystem {
  constructor(state, bus, story) { this.state = state; this.bus = bus; this.story = story; this.nearest = null; }
  update() {
    let nearest = null, distance = 5.3;
    for (const e of encounters) {
      if (e.visible && !e.visible(this.state)) continue;
      const p = locations[e.id];
      const d = Math.hypot(p.x - this.state.position.x, p.z - this.state.position.z);
      if (d < distance) { nearest = e; distance = d; }
    }
    if (this.nearest?.id !== nearest?.id) { this.nearest = nearest; this.bus.emit('interaction:changed', nearest); }
  }
  interact() {
    // Revalidate at input time: a choice may have resolved the previous target
    // between frames, or a loaded save may have changed the player position.
    this.update();
    if (this.nearest) return this.story.start(this.nearest.event);
    return false;
  }
}
