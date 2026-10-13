import { meetsConditions } from '../player/PlayerStats.js';
export class ChoiceManager {
  constructor(state, consequences) { this.state = state; this.consequences = consequences; }
  available(event) {
    return event.choices.filter(c => !c.hideIf || !meetsConditions(this.state, c.hideIf)).map(c => ({ ...c, enabled: meetsConditions(this.state, c.requirements) }));
  }
  choose(event, id) {
    const choice = this.available(event).find(c => c.id === id);
    if (!choice?.enabled) return undefined;
    this.consequences.apply(choice.effects);
    this.state.history.push({ event: event.id, choice: id, text: choice.text, time: this.state.playTime });
    return choice.nextEvent;
  }
}
