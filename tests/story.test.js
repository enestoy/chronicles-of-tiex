import test from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus.js';
import { createInitialState, meetsConditions } from '../src/player/PlayerStats.js';
import { ConsequenceManager } from '../src/story/ConsequenceManager.js';
import { StoryManager } from '../src/story/StoryManager.js';
import { SaveManager, validateSave } from '../src/core/SaveManager.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';
import { storyEvents, buildEpilogue } from '../src/data/storyEvents.js';
import { InteractionSystem } from '../src/systems/InteractionSystem.js';

function setup(state = createInitialState()) {
  const bus = new EventBus(), consequences = new ConsequenceManager(state, bus), story = new StoryManager(state, bus, consequences);
  return { state, bus, consequences, story };
}

test('every story destination exists and every choice has a unique id', () => {
  for (const event of Object.values(storyEvents)) {
    assert.equal(new Set(event.choices.map(c => c.id)).size, event.choices.length);
    for (const choice of event.choices) if (choice.nextEvent && choice.nextEvent !== '$ending') assert.ok(storyEvents[choice.nextEvent]);
  }
});

test('saving Kael consumes the bandage, persists his memory and unlocks a delayed reunion', () => {
  const { state, story, consequences } = setup();
  story.start('forest_scream'); story.choose('investigate');
  story.start('wounded_knight'); story.choose('ask'); story.choose('return'); story.choose('help');
  assert.equal(state.currentEvent, 'kael_saved');
  assert.ok(state.flags.includes('saved_kael'));
  assert.ok(state.flags.includes('learned_about_eastern_gate'));
  assert.ok(!state.inventory.includes('bandage')); assert.ok(state.inventory.includes('letter'));
  assert.deepEqual(state.npcs.kael.memory, ['saved']);
  const honor = state.stats.honor;
  story.start('kael_saved'); assert.equal(state.stats.honor, honor, 're-entering cannot farm rewards');
  state.playTime = 24; consequences.update(); assert.ok(!state.flags.includes('kael_at_patrol'));
  state.playTime = 26; consequences.update(); assert.ok(state.flags.includes('kael_at_patrol'));
  assert.equal(state.npcs.kael.location, 'road'); assert.equal(state.delayedEvents.length, 0);
  consequences.update(); assert.equal(state.flags.filter(f => f === 'kael_at_patrol').length, 1);
});

test('unmet item, honor and faction requirements cannot be bypassed by choosing an id', () => {
  const { state, story } = setup(); state.inventory = ['sword'];
  story.start('wounded_knight'); story.choose('help'); assert.equal(state.currentEvent, 'wounded_knight');
  assert.ok(!state.flags.includes('saved_kael'));
  story.start('road'); story.choose('honor'); assert.equal(state.currentEvent, 'road');
  story.start('gate'); story.choose('trusted'); assert.equal(state.currentEvent, 'gate');
  assert.ok(!meetsConditions(state, { reputation: { army: 25 } }));
});

test('robbing, killing and leaving Kael yield distinct persistent outcomes', () => {
  for (const [choice, flag, alive] of [['rob', 'robbed_kael', true], ['kill', 'killed_kael', false], ['leave', 'abandoned_kael', true]]) {
    const { state, story } = setup(); story.start('wounded_knight'); story.choose(choice);
    if (choice === 'kill') story.choose('confirm');
    assert.ok(state.flags.includes(flag)); assert.equal(state.npcs.kael.alive, alive);
    assert.ok(!state.flags.includes('saved_kael'));
  }
});

test('the tower puzzle resets on an incorrect symbol and grants its reward only once', () => {
  const { state, story } = setup(); story.start('tower'); story.choose('puzzle'); story.choose('crown');
  assert.equal(state.currentEvent, 'puzzle_wrong'); assert.ok(!state.inventory.includes('seal'));
  story.choose('retry'); story.choose('raven'); story.choose('crown'); story.choose('fire');
  assert.ok(state.inventory.includes('seal')); assert.equal(state.quests.tower, 'completed');
  story.choose('take'); assert.equal(state.quests.tower, 'completed');
  assert.ok(!story.choices.available(story.active).some(c => c.id === 'puzzle'));
});

test('the banner can be returned or sold, and disappears from inventory in either case', () => {
  for (const route of ['return', 'sell']) {
    const { state, story } = setup(); state.inventory.push('banner');
    story.start(route === 'return' ? 'gate' : 'camp'); story.choose(route === 'return' ? 'banner' : 'sell');
    assert.ok(!state.inventory.includes('banner')); assert.equal(state.quests.banner, 'completed');
    assert.ok(state.flags.includes(route === 'return' ? 'returned_banner' : 'sold_banner'));
    assert.ok(buildEpilogue(state).some(line => line.includes(route === 'return' ? 'walls' : 'children')));
  }
});

test('every personal ending preserves the fall of Velmora', () => {
  for (const flags of [[], ['saved_kael'], ['killed_kael'], ['robbed_kael'], ['saved_kael', 'found_lysa', 'delivered_letter', 'knows_eastern_tunnels']]) {
    const state = createInitialState(); state.flags = flags;
    assert.match(buildEpilogue(state)[0], /Velmora would fall three days later/);
  }
});

test('versioned save round-trips dialogue, delayed events and the entire player state', () => {
  const data = new Map(), storage = { setItem: (k, v) => data.set(k, v), getItem: k => data.get(k) ?? null };
  const { state, story } = setup(); story.start('wounded_knight'); story.choose('help'); state.position.z = 6;
  const save = new SaveManager(storage); assert.equal(save.save(state), true); assert.deepEqual(save.load(), state);
  const resumed = setup(save.load()); resumed.state.playTime = 30; resumed.consequences.update();
  assert.ok(resumed.state.flags.includes('kael_at_patrol'));
});

test('invalid saves fail safely and denied storage does not crash gameplay', () => {
  assert.equal(validateSave({ version: 2, state: createInitialState() }), null);
  for (const patch of [{ position: { x: NaN, y: 0, z: 0 } }, { inventory: {} }, { stats: {} }, { npcs: {} }, { delayedEvents: [{ id: 'bad' }] }]) {
    assert.equal(validateSave({ version: 1, state: { ...createInitialState(), ...patch } }), null);
  }
  const save = new SaveManager({ setItem() { throw new Error('quota'); }, getItem() { throw new Error('blocked'); } });
  assert.equal(save.save(createInitialState()), false); assert.equal(save.load(), null);
});

test('consumables heal once and are preserved when health is full', () => {
  const { state, bus } = setup(); const inventory = new InventorySystem(state, bus);
  assert.equal(inventory.use('bandage'), false); assert.ok(state.inventory.includes('bandage'));
  state.stats.health = 45; assert.equal(inventory.use('bandage'), true); assert.equal(state.stats.health, 75);
  assert.equal(inventory.use('bandage'), false); assert.equal(state.stats.health, 75);
});

test('interaction input rechecks stale and resolved targets before opening dialogue', () => {
  const { state, bus, story } = setup(), interactions = new InteractionSystem(state, bus, story);
  state.position = { x: 15, y: 0, z: 7 }; interactions.update(); assert.equal(interactions.nearest.id, 'kael');
  state.flags.push('kael_resolved'); assert.equal(interactions.interact(), false);
  state.position = { x: -22, y: 0, z: -29 }; interactions.interact(); assert.equal(state.currentEvent, 'camp');
});
