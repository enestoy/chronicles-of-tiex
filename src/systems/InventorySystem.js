import { items } from '../data/items.js';
export class InventorySystem {
  constructor(state, bus) { this.state = state; this.bus = bus; }
  use(id) {
    if (!this.state.inventory.includes(id) || !items[id]?.usable) return false;
    if (this.state.stats.health >= 100) { this.bus.emit('toast', { title: 'Your health is already full', text: 'Save this for later.' }); return false; }
    this.state.stats.health = Math.min(100, this.state.stats.health + items[id].heal);
    this.state.inventory.splice(this.state.inventory.indexOf(id), 1);
    this.bus.emit('state:changed'); this.bus.emit('save:request');
    return true;
  }
}
