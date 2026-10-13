import { EventBus } from './EventBus.js';
import { SaveManager } from './SaveManager.js';
import { SceneManager } from './SceneManager.js';
import { AudioManager } from './AudioManager.js';
import { World } from '../world/World.js';
import { Player } from '../player/Player.js';
import { PlayerController } from '../player/PlayerController.js';
import { createInitialState } from '../player/PlayerStats.js';
import { NPCManager } from '../characters/NPCManager.js';
import { ConsequenceManager } from '../story/ConsequenceManager.js';
import { StoryManager } from '../story/StoryManager.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { UI } from '../ui/UI.js';
import { buildEpilogue } from '../data/storyEvents.js';
import { groundHeight } from '../world/primitives.js';

export class Game {
  constructor() {
    this.bus = new EventBus(); this.save = new SaveManager(); this.settings = this.save.settings(); this.state = createInitialState();
    this.mode = 'menu'; this.time = 0; this.lastFrame = 0; this.lastSave = 0; this.fpsFrames = 0; this.fpsTime = 0; this.fps = 60;
    this.audio = new AudioManager(this.settings);
    this.sceneManager = new SceneManager(document.querySelector('#world'), this.settings);
    this.world = new World(this.sceneManager.scene);
    this.player = new Player(this.sceneManager.scene, this.state);
    this.controller = new PlayerController(this.state, this.sceneManager.camera, document.querySelector('#world'), this.world, this.settings);
    this.npcs = new NPCManager(this.sceneManager.scene); this.bindState(this.state);
    this.ui = new UI(this); this.setupEvents(); this.applySettings();
    this.sceneManager.menuCamera(0); this.sceneManager.render(); this.ui.loaded();
    this.sceneManager.renderer.setAnimationLoop(timestamp => this.tick(timestamp));
    if (import.meta.env.DEV) window.__TIEX__ = this;
  }
  bindState(state) {
    this.state = state; this.player.state = state; this.controller.state = state;
    this.consequences = new ConsequenceManager(state, this.bus); this.story = new StoryManager(state, this.bus, this.consequences);
    this.inventory = new InventorySystem(state, this.bus); this.interactions = new InteractionSystem(state, this.bus, this.story);
  }
  setupEvents() {
    this.bus.on('story:open', event => { this.setMode('dialogue'); this.ui.dialogue.show(event); this.ui.hudElement.hidden = true; });
    this.bus.on('story:close', () => { this.ui.dialogue.hide(); this.setMode('playing'); this.ui.showGame(); });
    this.bus.on('story:ending', () => this.startEnding());
    this.bus.on('save:request', () => this.saveGame());
    this.bus.on('audio:scream', () => this.audio.scream());
    window.addEventListener('keydown', event => this.handleKey(event));
    let wasPointerLocked = false;
    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === this.controller.canvas;
      if (wasPointerLocked && !locked && this.mode === 'playing') this.openPanel('pause');
      wasPointerLocked = locked;
    });
    window.addEventListener('blur', () => { if (['playing', 'dialogue'].includes(this.mode) && !this.ui.panel) this.openPanel('pause'); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && ['playing', 'dialogue'].includes(this.mode)) { this.saveGame(); this.openPanel('pause'); } });
    window.addEventListener('pagehide', () => { if (this.mode !== 'menu' && this.mode !== 'opening') this.saveGame(); });
    document.addEventListener('renderer:lost', () => { this.setMode('paused'); this.ui.toast('DISPLAY PAUSED', 'The game will resume once the graphics connection is restored.'); this.saveGame(); });
  }
  setMode(mode) { this.mode = mode; this.controller.enabled = mode === 'playing'; if (mode !== 'playing') this.controller.release(); }
  newGame() {
    this.ui.closePanel(); this.bindState(createInitialState()); this.state.position.y = groundHeight(0, 46); this.controller.resetCamera();
    this.ui.hud.interaction(null); this.ui.hud.root.querySelector('#tutorial').hidden = false;
    this.openingTime = 0; this.openingStage = 0; this.setMode('opening'); this.ui.showCinematic(0);
    this.audio.start().then(() => this.audio.horn()).catch(() => {});
  }
  finishOpening() { if (this.mode !== 'opening') return; this.setMode('playing'); this.ui.showGame(); this.controller.resetCamera(); this.saveGame(); }
  continueGame() {
    const state = this.save.load(); if (!state) { this.ui.toast('COULD NOT OPEN SAVE', 'You can start a new story.'); return; }
    this.bindState(state); this.controller.resetCamera(); this.ui.hud.interaction(null); this.ui.hud.root.querySelector('#tutorial').hidden = state.playTime > 32;
    this.audio.start().catch(() => {});
    if (state.completed) { this.setMode('epilogue'); this.ui.menu.hidden = true; this.ui.showEnding(buildEpilogue(state), true); return; }
    this.setMode('playing'); this.ui.showGame();
    if (state.currentEvent && !this.story.start(state.currentEvent)) this.state.currentEvent = null;
  }
  saveGame() {
    if (this.mode === 'menu' || this.mode === 'opening' || this.mode === 'paused' && this.panelReturnMode === 'menu') return false;
    const result = this.save.save(this.state);
    this.bus.emit(result ? 'save:success' : 'toast', result ? undefined : { title: 'COULD NOT SAVE', text: this.save.error }); return result;
  }
  toMenu() { this.setMode('menu'); this.ui.closePanel(); this.ui.showMenu(); }
  openPanel(type) {
    if (['opening', 'ending', 'epilogue'].includes(this.mode)) return;
    if (!this.ui.panel) { this.panelReturnMode = this.mode; this.setMode('paused'); }
    this.ui.openPanel(type);
  }
  closePanel() {
    if (!this.ui.panel) return;
    this.ui.closePanel(); this.setMode(this.panelReturnMode ?? 'menu');
    if (this.mode === 'dialogue') document.querySelector('#dialogue button:not(:disabled)')?.focus();
  }
  startEnding() {
    this.state.completed = true; this.state.currentEvent = null; this.setMode('ending'); this.endingTime = 0;
    this.ui.showEnding([], false); this.audio.horn(); this.saveGame();
  }
  applySettings() {
    this.sceneManager.applyQuality(this.settings.quality); this.world.weather.setQuality(this.settings.quality);
    this.world.environment.grass.count = this.settings.quality === 'low' ? 3500 : this.settings.quality === 'high' ? 11000 : 7000;
    this.audio.applySettings(); this.save.saveSettings(this.settings);
  }
  handleKey(event) {
    if (event.target.matches('input, select, textarea') && event.code !== 'Escape') return;
    if (event.repeat) return;
    if (event.code === 'Escape') { event.preventDefault(); if (this.ui.panel) this.closePanel(); else if (['playing', 'dialogue'].includes(this.mode)) this.openPanel('pause'); return; }
    if (event.code === 'F2' && import.meta.env.DEV) { event.preventDefault(); const d = document.querySelector('#debug'); d.hidden = !d.hidden; return; }
    if (this.mode === 'opening' && event.code === 'Space') { event.preventDefault(); this.finishOpening(); return; }
    if (this.ui.panel) { const type = { KeyI: 'inventory', KeyJ: 'journal', KeyC: 'codex', KeyM: 'map' }[event.code]; if (type) { event.preventDefault(); type === this.ui.panel ? this.closePanel() : this.ui.openPanel(type); } return; }
    if (this.mode === 'dialogue' && /^Digit[1-9]$/.test(event.code)) { event.preventDefault(); this.ui.dialogue.chooseNumber(Number(event.code.slice(-1))); return; }
    if (this.mode !== 'playing') return;
    if (event.code === 'KeyE') this.interactions.interact();
    const type = { KeyI: 'inventory', KeyJ: 'journal', KeyC: 'codex', KeyM: 'map' }[event.code]; if (type) { event.preventDefault(); this.openPanel(type); }
  }
  tick(timestamp) {
    const dt = Math.min((timestamp - (this.lastFrame || timestamp)) / 1000, .05); this.lastFrame = timestamp; this.time += dt;
    const camera = this.sceneManager.camera;
    this.player.root.visible = !['menu', 'ending', 'epilogue'].includes(this.mode) && !(this.mode === 'paused' && this.panelReturnMode === 'menu');
    if (this.mode === 'menu' || this.mode === 'paused' && this.panelReturnMode === 'menu') this.sceneManager.menuCamera(this.time);
    if (this.mode === 'opening') {
      this.openingTime += dt; const stage = Math.min(2, Math.floor(this.openingTime / 4));
      if (stage !== this.openingStage) { this.openingStage = stage; this.ui.showCinematic(stage); }
      this.controller.follow(dt); if (this.openingTime > 12) this.finishOpening();
    }
    if (this.mode === 'playing') {
      this.state.playTime += dt; this.controller.update(dt); this.consequences.update(); this.story.update();
      if (this.mode === 'playing') this.interactions.update();
      this.ui.hud.update(this.state, camera, this.controller.yaw, this.time);
      if (this.time - this.lastSave > 25) { this.saveGame(); this.lastSave = this.time; }
    }
    if (this.mode === 'dialogue') { this.state.playTime += dt; this.controller.dialogue(dt, this.npcs.models[this.story.active?.speaker]?.group.position); }
    if (this.mode === 'ending') { this.endingTime += dt; this.sceneManager.endingCamera(dt); if (this.endingTime > 9) { this.setMode('epilogue'); this.ui.showEnding(buildEpilogue(this.state), true); } }
    this.player.update(dt, this.time, this.mode === 'playing' && this.controller.moving, this.controller.running);
    this.npcs.update(this.time, this.state); this.world.update(dt, this.time, this.state, camera); this.audio.update(dt, camera);
    this.sceneManager.render(); this.fpsFrames++; this.fpsTime += dt;
    if (this.fpsTime > .5) { this.fps = Math.round(this.fpsFrames / this.fpsTime); this.fpsFrames = 0; this.fpsTime = 0; if (import.meta.env.DEV) this.ui.debug(this.state, this.fps, this.sceneManager.renderer.info.render.calls); }
  }
}
