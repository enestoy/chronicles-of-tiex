import { storyEvents } from '../data/storyEvents.js';
import { meetsConditions } from '../player/PlayerStats.js';
import { ChoiceManager } from './ChoiceManager.js';
export class StoryManager {
  constructor(state, bus, consequences) {
    this.state = state; this.bus = bus; this.consequences = consequences;
    this.choices = new ChoiceManager(state, consequences); this.active = null;
  }
  start(id) {
    const event = storyEvents[id];
    if (!event) return false;
    this.active = { ...event, id };
    this.state.currentEvent = id;
    if (event.enter && !this.state.flags.includes(`event:${id}`)) this.consequences.apply({ ...event.enter, flags: [...(event.enter.flags ?? []), `event:${id}`] });
    const variant = event.variants?.find(v => meetsConditions(this.state, v.conditions));
    this.bus.emit('story:open', { ...this.active, text: variant?.text ?? event.text, choices: this.choices.available(event) });
    return true;
  }
  choose(id) {
    if (!this.active) return;
    const next = this.choices.choose(this.active, id);
    if (next === undefined) return;
    this.active = null; this.state.currentEvent = null;
    if (next === '$ending') { this.bus.emit('story:close'); this.bus.emit('story:ending'); }
    else if (next) this.start(next);
    else this.bus.emit('story:close');
    this.bus.emit('save:request');
  }
  update() {
    if (this.active) return;
    if (this.state.position.z < 20 && !this.state.flags.includes('heard_scream')) { this.bus.emit('audio:scream'); this.start('forest_scream'); }
    if (this.state.position.z < -119 && !this.state.flags.includes('passed_patrol')) this.start('road');
  }
}
