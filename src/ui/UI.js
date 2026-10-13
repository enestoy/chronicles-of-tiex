import { HUD } from './HUD.js';
import { DialogueUI } from './DialogueUI.js';
import { inventoryPanel, journalPanel, codexPanel, factionsPanel, mapPanel, settingsPanel } from './PanelContent.js';
import { items } from '../data/items.js';
import { codex } from '../data/codex.js';
import { icon, escapeHtml as e } from './icons.js';
const panelTitles = { inventory: 'What you carry.', journal: 'A traveler’s journal.', codex: 'The unforgotten.', factions: 'Your place in the world.', map: 'The road north.', settings: 'Shape your journey.', pause: 'The night is waiting.', confirm: 'A new story.' };

export class UI {
  constructor(game) {
    this.game = game; this.panel = null; this.selectedItem = 'sword'; this.selectedEntry = 'velmora'; this.category = 'All'; this.toastQueue = [];
    document.querySelector('#app').innerHTML = `
      <div class="vignette"></div><div class="grain"></div>
      <section id="main-menu" class="main-menu">
        <header class="menu-header"><a class="wordmark" href="#" aria-label="Tiex World main menu"><img src="/crest.svg" alt=""/><span>TIEX<span>WORLD</span></span></a><span class="header-note">EVERY ENDING LEAVES A STORY BEHIND.</span><div class="header-controls"><button id="sound-toggle" class="icon-button" aria-label="Toggle sound">${icon('sound')}</button><span class="header-separator"></span><button class="icon-button" data-panel="settings" aria-label="Settings">${icon('settings')}</button></div></header>
        <div class="menu-content"><div class="chapter-eyebrow"><span></span><p>A CHRONICLE FROM THE TIEX WORLD</p></div><h1>CHRONICLES<span>OF <em>TIEX</em></span></h1><div class="game-subtitle"><span></span>THE FALL OF VELMORA<span></span></div><p class="menu-description">Some kingdoms fall in war.<br>Others, long before their gates are breached.</p><div class="menu-buttons"><button id="new-game" class="primary-button"><span>Begin the story</span>${icon('arrow')}</button><button id="continue-game" class="continue-button" disabled><span class="continue-dot"></span>Continue your journey <small>NO SAVE</small></button></div><button class="lore-link" data-panel="codex">${icon('book')}<span>Discover the story of this world</span><span>↗</span></button></div>
        <div class="landscape-caption"><span class="caption-line"></span><p>VELMORA</p><span>Three days before the fall.</span><div class="coordinates">41° 17′ N &nbsp; / &nbsp; THE NORTHERN LANDS</div></div>
        <footer class="menu-footer"><div class="chapter-number">I</div><div class="chapter-title"><span>ACT ONE</span><p>Whispers Before War</p></div><div class="footer-rule"></div><p>The kingdom’s fate is written.<br><em>Yours is not.</em></p><span class="version">CHAPTER I <span>◆</span> VERTICAL SLICE</span></footer>
      </section>
      <section id="hud" hidden aria-label="Game HUD"></section>
      <section id="dialogue" class="dialogue" hidden aria-label="Story dialogue"></section>
      <section id="cinematic" class="cinematic" hidden><div id="cinematic-text"></div><button id="skip-cinematic">Skip cinematic <kbd>SPACE</kbd></button></section>
      <section id="ending" class="ending" hidden></section>
      <div id="modal-backdrop" class="modal-backdrop" hidden><section class="panel" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="panel-header"><div><p class="eyebrow">CHRONICLES OF TIEX</p><h2 id="panel-title"></h2></div><button id="close-panel" class="icon-button" aria-label="Close">${icon('close')}</button></header><nav id="panel-tabs" class="panel-tabs"></nav><div id="panel-content" class="panel-content"></div><footer class="panel-footer"><span>THIRD AGE · 417</span><span><kbd>ESC</kbd> Back</span></footer></section></div>
      <div id="toasts" class="toasts" aria-live="polite"></div><div id="save-indicator" class="save-indicator" hidden>◇ &nbsp; YOUR STORY HAS BEEN SAVED</div>
      <pre id="debug" class="debug" hidden></pre><div id="loading" class="loading"><img src="/crest.svg" alt=""/><span>TIEX WORLD</span><small>The world is waking…</small></div>`;
    this.menu = document.querySelector('#main-menu'); this.hudElement = document.querySelector('#hud'); this.modal = document.querySelector('#modal-backdrop');
    this.hud = new HUD(this.hudElement, type => game.openPanel(type));
    this.dialogue = new DialogueUI(document.querySelector('#dialogue'), id => game.story.choose(id));
    document.querySelector('#new-game').addEventListener('click', () => game.save.load() ? game.openPanel('confirm') : game.newGame());
    document.querySelector('#continue-game').addEventListener('click', () => game.continueGame());
    document.querySelector('#sound-toggle').addEventListener('click', () => { game.settings.muted = !game.settings.muted; game.audio.start().catch(() => {}); game.applySettings(); this.updateSound(); });
    document.querySelectorAll('.main-menu [data-panel]').forEach(b => b.addEventListener('click', () => game.openPanel(b.dataset.panel)));
    document.querySelector('#close-panel').addEventListener('click', () => game.closePanel());
    document.querySelector('#skip-cinematic').addEventListener('click', () => game.finishOpening());
    this.modal.addEventListener('click', event => { if (event.target === this.modal) game.closePanel(); });
    document.addEventListener('keydown', event => this.trapFocus(event));
    this.updateContinue(); this.updateSound(); this.listen();
  }
  listen() {
    const bus = this.game.bus;
    bus.on('codex:added', id => this.toast('CODEX UPDATED', codex[id]?.title ?? id, 'book'));
    bus.on('item:added', id => this.toast('ADDED TO YOUR BAG', items[id]?.name ?? id, items[id]?.icon ?? 'bag'));
    bus.on('toast', t => this.toast(t.title, t.text));
    bus.on('interaction:changed', e => this.hud.interaction(e));
    bus.on('save:success', () => { const el = document.querySelector('#save-indicator'); el.hidden = false; clearTimeout(this.saveTimer); this.saveTimer = setTimeout(() => el.hidden = true, 1900); });
  }
  loaded() { document.querySelector('#loading').classList.add('loaded'); setTimeout(() => document.querySelector('#loading').hidden = true, 1000); }
  updateContinue() {
    const s = this.game.save.load(), b = document.querySelector('#continue-game'); b.disabled = !s;
    b.querySelector('small').textContent = s ? s.completed ? 'CHAPTER COMPLETE' : `${Math.floor(s.playTime / 60)} MIN · ACT I` : 'NO SAVE';
  }
  updateSound() { document.querySelector('#sound-toggle').innerHTML = icon(this.game.settings.muted ? 'mute' : 'sound'); }
  showMenu() { this.menu.hidden = false; this.hudElement.hidden = true; this.dialogue.hide(); document.querySelector('#ending').hidden = true; document.querySelector('#cinematic').hidden = true; this.updateContinue(); }
  showGame() { this.menu.hidden = true; this.hudElement.hidden = false; document.querySelector('#cinematic').hidden = true; document.querySelector('#ending').hidden = true; }
  showCinematic(stage) {
    this.menu.hidden = true; this.hudElement.hidden = true;
    const root = document.querySelector('#cinematic'); root.hidden = false;
    const stages = [
      '<p class="eyebrow">TIEX WORLD</p><h2>VELMORA</h2><span>Year 417 of the Third Age</span><div class="ornament">─── ◆ ───</div>',
      '<blockquote>“Some kingdoms fall in war.<br>Others, long before their gates are breached.”</blockquote>',
      '<p class="eyebrow">ACT ONE</p><h3>Whispers Before War</h3><span>Velmora Forest · Three days before the fall</span>',
    ];
    root.classList.toggle('reveal-world', stage === 2); document.querySelector('#cinematic-text').innerHTML = stages[stage];
  }
  showEnding(lines, final = false) {
    this.dialogue.hide(); this.hudElement.hidden = true; const root = document.querySelector('#ending'); root.hidden = false;
    root.classList.toggle('epilogue', final);
    root.innerHTML = final ? `<div class="epilogue-content"><p class="eyebrow">END OF THE FIRST CHAPTER</p><h2>Before the ashes.</h2><div class="ornament">─── ◆ ───</div><div class="epilogue-lines">${lines.map(line => `<p>${e(line)}</p>`).join('')}</div><p class="to-be-continued">TO BE CONTINUED</p><button id="ending-menu" class="secondary-button">Return to main menu ${icon('arrow')}</button><small>Your end-of-chapter save has been kept.</small></div>` : '<div class="ending-title"><p class="eyebrow">THE LAST KINGDOM OF THE NORTH</p><h2>VELMORA</h2><span>Three days before the fall.</span></div>';
    document.querySelector('#ending-menu')?.addEventListener('click', () => this.game.toMenu());
  }
  openPanel(type) {
    this.lastFocus = document.activeElement; this.panel = type; this.modal.hidden = false;
    document.querySelector('#panel-title').textContent = panelTitles[type];
    const tabs = [['inventory', 'Inventory'], ['journal', 'Journal'], ['codex', 'Codex'], ['factions', 'Relations'], ['map', 'Map']];
    document.querySelector('#panel-tabs').innerHTML = tabs.some(([key]) => key === type) ? tabs.map(([key, label]) => `<button data-tab="${key}" class="${type === key ? 'active' : ''}">${label}</button>`).join('') : '';
    document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => this.openPanel(b.dataset.tab)));
    this.renderPanel(); document.querySelector('#close-panel').focus({ preventScroll: true });
  }
  renderPanel() {
    const s = this.game.state, root = document.querySelector('#panel-content');
    const render = { inventory: () => inventoryPanel(s, this.selectedItem), journal: () => journalPanel(s), codex: () => codexPanel(s, this.selectedEntry, this.category), factions: () => factionsPanel(s), map: () => mapPanel(s), settings: () => settingsPanel(this.game.settings),
      pause: () => `<div class="pause-menu"><p>The rain hasn’t stopped. Your story is right where you left it.</p><button class="primary-button" data-action="resume">Continue your journey ${icon('arrow')}</button><button class="secondary-button" data-action="save">Save the story</button><button class="text-button" data-action="settings">Settings and controls</button><button class="text-button" data-action="menu">Save and return to main menu</button></div>`,
      confirm: () => '<div class="pause-menu"><p>Starting a new journey will replace your current save.</p><button class="primary-button" data-action="new">Begin a new story</button><button class="secondary-button" data-action="resume">Go back</button></div>',
    };
    root.innerHTML = render[this.panel]?.() ?? '';
    root.querySelectorAll('[data-item]').forEach(b => b.addEventListener('click', () => { this.selectedItem = b.dataset.item; this.renderPanel(); }));
    root.querySelectorAll('[data-use]').forEach(b => b.addEventListener('click', () => { this.game.inventory.use(b.dataset.use); this.renderPanel(); }));
    root.querySelectorAll('[data-entry]').forEach(b => b.addEventListener('click', () => { this.selectedEntry = b.dataset.entry; this.renderPanel(); }));
    root.querySelector('#codex-category')?.addEventListener('change', ev => { this.category = ev.target.value; this.renderPanel(); document.querySelector('#codex-category').focus(); });
    root.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => {
      const action = b.dataset.action;
      if (action === 'resume') this.game.closePanel();
      if (action === 'save') this.game.saveGame();
      if (action === 'settings') this.openPanel('settings');
      if (action === 'menu') { this.game.saveGame(); this.game.closePanel(); this.game.toMenu(); }
      if (action === 'new') { this.game.closePanel(); this.game.newGame(); }
    }));
    for (const key of ['quality', 'volume', 'muted', 'sensitivity']) root.querySelector(`#${key}`)?.addEventListener('input', ev => {
      this.game.settings[key] = key === 'muted' ? ev.target.checked : ['volume', 'sensitivity'].includes(key) ? Number(ev.target.value) : ev.target.value;
      this.game.applySettings(); this.updateSound();
    });
  }
  closePanel() { this.panel = null; this.modal.hidden = true; if (this.lastFocus?.isConnected) this.lastFocus.focus({ preventScroll: true }); }
  trapFocus(event) {
    if (event.key !== 'Tab') return;
    const scope = this.panel ? this.modal : this.game.mode === 'dialogue' ? document.querySelector('#dialogue') : null;
    if (!scope) return;
    const list = [...scope.querySelectorAll('button:not(:disabled), select, input, [tabindex="0"]')]; const first = list[0], last = list.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  toast(title, text, symbol = 'seal') {
    const root = document.querySelector('#toasts'), node = document.createElement('div'); node.className = 'toast'; node.innerHTML = `${icon(symbol)}<div><span>${e(title)}</span><p>${e(text)}</p></div>`;
    root.append(node); while (root.children.length > 3) root.firstElementChild.remove(); setTimeout(() => node.remove(), 4500);
  }
  debug(state, fps, drawCalls) {
    const el = document.querySelector('#debug'); if (el.hidden) return;
    el.textContent = `FPS: ${fps} | Draws: ${drawCalls}\nPosition: ${Object.values(state.position).map(n => n.toFixed(1)).join(', ')}\nEvent: ${state.currentEvent ?? 'exploration'}\nQuest: ${state.objective}\nFlags: ${state.flags.join(', ')}\nReputation: ${JSON.stringify(state.reputation)}\nNPCs: ${JSON.stringify(state.npcs, null, 2)}`;
  }
}
