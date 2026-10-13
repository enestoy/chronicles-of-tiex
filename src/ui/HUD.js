import * as THREE from 'three';
import { locations } from '../data/locations.js';
import { icon, escapeHtml } from './icons.js';
export class HUD {
  constructor(root, onPanel) {
    root.innerHTML = `<div class="hud-top"><div class="region"><span class="region-mark">I</span><div><span class="eyebrow">WHISPERS BEFORE WAR</span><p id="region-name">Velmora Forest</p></div></div><div class="compass"><span>W</span><i></i><span id="compass-heading">N</span><i></i><span>E</span><div>◆</div></div><button class="objective" data-panel="journal"><span class="eyebrow">BEFORE THE STORM</span><span id="objective-text"></span><small id="objective-distance"></small></button></div><div class="world-marker" id="world-marker"><span>◇</span><small></small></div><div id="tutorial" class="tutorial"><span><kbd>W A S D</kbd> Move</span><span><kbd>SHIFT</kbd> Run</span><span>Click, then use the mouse to look around</span><button id="hide-tutorial" aria-label="Close controls hint">×</button></div><div class="hud-bottom"><div class="vitals"><span class="vitals-icon">${icon('sword')}</span><div><div class="vital health"><span>HEALTH</span><div><i id="health-fill"></i></div><small id="health-number">100</small></div><div class="vital stamina"><span>STAMINA</span><div><i id="stamina-fill"></i></div></div></div></div><div id="interaction-prompt" class="interaction-prompt" hidden></div><div class="hud-actions"><button data-panel="inventory"><kbd>I</kbd> Inventory</button><button data-panel="journal"><kbd>J</kbd> Journal</button><button data-panel="codex"><kbd>C</kbd> Codex</button><button data-panel="map"><kbd>M</kbd> Map</button><button data-panel="pause" aria-label="Pause"><kbd>ESC</kbd></button></div></div>`;
    this.root = root; this.point = new THREE.Vector3(); this.lastUpdate = 0;
    root.querySelectorAll('[data-panel]').forEach(b => b.addEventListener('click', () => onPanel(b.dataset.panel)));
    root.querySelector('#hide-tutorial').addEventListener('click', () => root.querySelector('#tutorial').hidden = true);
    this.health = root.querySelector('#health-fill'); this.stamina = root.querySelector('#stamina-fill'); this.healthNumber = root.querySelector('#health-number');
    this.objective = root.querySelector('#objective-text'); this.distance = root.querySelector('#objective-distance'); this.marker = root.querySelector('#world-marker'); this.region = root.querySelector('#region-name'); this.heading = root.querySelector('#compass-heading');
  }
  interaction(encounter) { const el = this.root.querySelector('#interaction-prompt'); el.hidden = !encounter; if (encounter) el.innerHTML = `<kbd>E</kbd> ${escapeHtml(encounter.label)}`; }
  update(state, camera, yaw, time) {
    if (time - this.lastUpdate < .08) return; this.lastUpdate = time;
    this.health.style.width = `${state.stats.health}%`; this.stamina.style.width = `${state.stats.stamina}%`; this.healthNumber.textContent = Math.ceil(state.stats.health);
    this.objective.textContent = state.objective;
    const target = locations[state.objectiveTarget] ?? locations.gate, distance = Math.round(Math.hypot(state.position.x - target.x, state.position.z - target.z));
    this.distance.textContent = `${distance} m  ·  Map: M`;
    this.region.textContent = state.position.z < -173 ? 'Velmora Ridge' : state.position.z < -112 ? 'North Road' : 'Velmora Forest';
    this.heading.textContent = ['N', 'NW', 'W', 'SW', 'S', 'SE', 'E', 'NE'][((Math.round(yaw / (Math.PI / 4)) % 8) + 8) % 8];
    this.point.set(target.x, 3.5, target.z).project(camera);
    const visible = this.point.z < 1 && this.point.z > -1 && Math.abs(this.point.x) < .9 && Math.abs(this.point.y) < .8 && distance > 6;
    this.marker.hidden = !visible;
    if (visible) { this.marker.style.left = `${(this.point.x * .5 + .5) * 100}%`; this.marker.style.top = `${(-this.point.y * .5 + .5) * 100}%`; this.marker.querySelector('small').textContent = `${distance} m`; }
    if (state.playTime > 32) this.root.querySelector('#tutorial').hidden = true;
  }
}
