export const factions = {
  crown: { name: 'Crown of Velmora', description: 'The old dynasty that rules behind stone walls.' },
  army: { name: 'Army of Velmora', description: 'Those keeping their last watch as the gates close.' },
  folk: { name: 'The Common Folk', description: 'The people whose names history never writes down.' },
  merchants: { name: 'Merchants’ Guild', description: 'Those who see a new market in every disaster.' },
  clans: { name: 'Northern Clans', description: 'Oath-bound families beyond the mountains.' },
  ashen: { name: 'The Ashen Order', description: 'Those who believe in what remains after the fire dies.' },
};
export function reputationLabel(v) { return v <= -100 ? 'Hated' : v <= -50 ? 'Hostile' : v >= 100 ? 'Revered' : v >= 50 ? 'Respected' : 'Neutral'; }
