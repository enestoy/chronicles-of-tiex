export function createInitialState() {
  return {
    position: { x: 0, y: 0, z: 46 }, rotation: 0, playTime: 0,
    stats: { health: 100, stamina: 100, gold: 12, honor: 0, fear: 0, mercy: 0, infamy: 0, awareness: 0 },
    reputation: { crown: 0, army: 0, folk: 0, merchants: 0, clans: 0, ashen: 0 },
    inventory: ['sword', 'cloak', 'bandage'], flags: [],
    quests: { road: 'active' }, codex: ['velmora', 'third_age', 'traveler'],
    npcs: { kael: { alive: true, relationship: 0, memory: [], location: 'forest' }, mira: { alive: true, relationship: 0, memory: [], location: 'camp' }, edric: { alive: true, relationship: 0, memory: [], location: 'gate' } },
    currentAct: 1, currentEvent: null, history: [], delayedEvents: [],
    objective: 'Follow the North Road', objectiveTarget: 'scream', completed: false,
  };
}
export function meetsConditions(state, conditions = {}) {
  return (!conditions.flags || conditions.flags.every(f => state.flags.includes(f)))
    && (!conditions.notFlags || conditions.notFlags.every(f => !state.flags.includes(f)))
    && (!conditions.items || conditions.items.every(i => state.inventory.includes(i)))
    && (!conditions.stats || Object.entries(conditions.stats).every(([k, v]) => (state.stats[k] ?? 0) >= v))
    && (!conditions.reputation || Object.entries(conditions.reputation).every(([k, v]) => (state.reputation[k] ?? 0) >= v));
}
