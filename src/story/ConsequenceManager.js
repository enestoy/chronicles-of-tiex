import { meetsConditions } from '../player/PlayerStats.js';
export class ConsequenceManager {
  constructor(state, bus) { this.state = state; this.bus = bus; }
  apply(effects = {}) {
    const s = this.state;
    for (const flag of effects.flags ?? []) if (!s.flags.includes(flag)) s.flags.push(flag);
    for (const [key, value] of Object.entries(effects.stats ?? {})) {
      s.stats[key] = (s.stats[key] ?? 0) + value;
      if (['health', 'stamina'].includes(key)) s.stats[key] = Math.max(0, Math.min(100, s.stats[key]));
      if (key === 'gold') s.stats.gold = Math.max(0, s.stats.gold);
    }
    for (const [key, value] of Object.entries(effects.reputation ?? {})) s.reputation[key] = Math.max(-100, Math.min(100, (s.reputation[key] ?? 0) + value));
    for (const item of effects.removeItems ?? []) s.inventory = s.inventory.filter(i => i !== item);
    for (const item of effects.items ?? []) if (!s.inventory.includes(item)) { s.inventory.push(item); this.bus.emit('item:added', item); }
    for (const entry of effects.codex ?? []) if (!s.codex.includes(entry)) { s.codex.push(entry); this.bus.emit('codex:added', entry); }
    Object.assign(s.quests, effects.quests);
    for (const [id, patch] of Object.entries(effects.npcs ?? {})) {
      if (!s.npcs[id]) continue;
      const memory = [...new Set([...s.npcs[id].memory, ...(patch.memory ?? [])])];
      Object.assign(s.npcs[id], patch, { memory });
    }
    for (const event of effects.delayed ?? []) {
      if (!s.delayedEvents.some(e => e.id === event.id) && !s.flags.includes(`delayed:${event.id}`)) s.delayedEvents.push({ ...event, at: s.playTime + event.seconds });
    }
    if (effects.objective) s.objective = effects.objective;
    if (effects.objectiveTarget) s.objectiveTarget = effects.objectiveTarget;
    this.bus.emit('state:changed');
  }
  update() {
    const ready = this.state.delayedEvents.filter(e => this.state.playTime >= e.at && meetsConditions(this.state, e.conditions));
    this.state.delayedEvents = this.state.delayedEvents.filter(e => !ready.includes(e));
    for (const event of ready) { this.apply(event.effects); this.apply({ flags: [`delayed:${event.id}`] }); }
  }
}
