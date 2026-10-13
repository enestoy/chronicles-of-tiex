import { createInitialState } from '../player/PlayerStats.js';
export const SAVE_KEY = 'tiex.velmora.save.v1';
export const SETTINGS_KEY = 'tiex.velmora.settings';
export function validateSave(data) {
  if (!data || data.version !== 1 || !data.state) return null;
  const s = data.state;
  if (!s.position || !['x', 'y', 'z'].every(k => Number.isFinite(s.position[k]))) return null;
  if (Math.abs(s.position.x) > 500 || Math.abs(s.position.z) > 1000 || !Number.isFinite(s.rotation)) return null;
  for (const key of ['inventory', 'flags', 'codex']) {
    if (!Array.isArray(s[key]) || s[key].some(v => typeof v !== 'string')) return null;
  }
  if (!s.stats || !Object.values(s.stats).every(Number.isFinite)) return null;
  if (!Number.isFinite(s.stats.health) || !Number.isFinite(s.stats.stamina) || !Number.isFinite(s.playTime) || s.playTime < 0) return null;
  if (!s.reputation || !Object.values(s.reputation).every(Number.isFinite)) return null;
  if (!s.npcs || !['kael', 'mira', 'edric'].every(k => typeof s.npcs[k]?.alive === 'boolean' && Array.isArray(s.npcs[k].memory))) return null;
  if (!Array.isArray(s.history) || s.history.some(h => !h || typeof h.text !== 'string')) return null;
  if (!Array.isArray(s.delayedEvents) || s.delayedEvents.some(e => !e || !Number.isFinite(e.at) || typeof e.id !== 'string' || !e.effects)) return null;
  if (!s.quests || typeof s.quests !== 'object' || Array.isArray(s.quests)) return null;
  if (Object.values(s.quests).some(status => !['active', 'completed', 'failed'].includes(status))) return null;
  if (s.currentEvent !== null && typeof s.currentEvent !== 'string') return null;
  if (typeof s.objective !== 'string' || typeof s.objectiveTarget !== 'string') return null;
  const base = createInitialState();
  return { ...base, ...s, stats: { ...base.stats, ...s.stats }, reputation: { ...base.reputation, ...s.reputation } };
}
export class SaveManager {
  constructor(storage) {
    try { this.storage = storage ?? globalThis.localStorage; } catch { this.storage = null; }
    this.error = null;
  }
  save(state) {
    try { this.storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), state })); this.error = null; return true; }
    catch { this.error = 'The save could not be written. Check your browser’s local storage.'; return false; }
  }
  load() { try { return validateSave(JSON.parse(this.storage.getItem(SAVE_KEY))); } catch { this.error = 'The save could not be read.'; return null; } }
  settings() {
    try {
      const data = JSON.parse(this.storage.getItem(SETTINGS_KEY)) ?? {};
      return {
        quality: ['low', 'medium', 'high'].includes(data.quality) ? data.quality : 'medium',
        volume: Number.isFinite(data.volume) ? Math.max(0, Math.min(1, data.volume)) : .55,
        muted: data.muted === true,
        sensitivity: Number.isFinite(data.sensitivity) ? Math.max(.3, Math.min(2, data.sensitivity)) : 1,
      };
    }
    catch { return { quality: 'medium', volume: 0.55, muted: false, sensitivity: 1 }; }
  }
  saveSettings(settings) { try { this.storage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* Play without storage. */ } }
}
