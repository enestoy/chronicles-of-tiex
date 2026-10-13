# Chronicles of Tiex: The Fall of Velmora

A browser-based **3D narrative and exploration RPG** set in the Tiex World universe. English interface and dialogue. Built with Vite, JavaScript ES modules, Three.js and WebGL 2.

**The fall of Velmora does not change. The lives the player leaves behind do.**

## Running

Requires Node.js 22.12+ or 24 LTS, and an up-to-date desktop browser with WebGL 2 support and hardware acceleration enabled.

```sh
npm install
npm run dev
```

Local address: **<http://127.0.0.1:5174>**. If the port is in use, pick another one: `npm run dev -- --port 5175`.

```sh
npm run build       # Static output: dist/
npm run preview     # Preview the production build locally
npm test            # Story, choice, save and inventory tests
npm run test:e2e    # Playwright browser tests with Google Chrome
```

`dist/` can be served from any static web server. At runtime no server API, account, remote model or CDN connection is needed. Fonts are served locally. Browser tests use the locally installed Google Chrome; the test setup lives in `playwright.config.js`.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Left Shift | Run; falls back to walking when stamina runs out |
| Mouse | Click the play area to take camera control; dragging also works |
| E | Interact with a nearby person or object |
| 1–6 / click | Choose a dialogue option |
| I | Inventory |
| J | Quests and decision history |
| C | Codex |
| M | Map showing your position and objective |
| ESC | Pause / close panel / release mouse lock |
| Space | Skip the opening cinematic |
| F2 | Debug overlay in development mode |

The game is designed for keyboard and mouse. Menus adapt to small screens; touch movement controls are outside the scope of this version.

## Playable chapter

1. Main menu and a three-stage opening cinematic.
2. Third-person exploration of the misty, rain-soaked Velmora Forest.
3. The scream: investigate, keep going, or draw your sword and wait.
4. **Kael Varen:** bind his wound, question him, rob him, kill him or leave him behind. Without a bandage, herbs from the farm offer another way to treat him.
5. **Refugee camp:** agree to look for Mira’s daughter, help the camp, hear rumors. You can sell the banner you found here.
6. **Watchtower:** the lost banner, the watcher’s journal and a three-step symbol puzzle.
7. **Abandoned farm:** environmental storytelling and a healing herb.
8. **North Road:** a patrol that remembers your earlier choices. Pass through with reputation, an item, honor or a price; the story can continue even with no items at all.
9. **Ashen wanderer:** a found artifact unlocks knowledge of the eastern tunnels.
10. **Velmora Gate:** deliver the letter or banner to Edric, ask about Mira’s daughter, or go back for unfinished business.
11. A rising camera, a war horn and a personal end-of-chapter epilogue shaped by your choices. **TO BE CONTINUED.**

The chapter targets roughly 10–15 minutes with reading and side exploration; skipping dialogue on the main route is shorter. This is a vertical slice of the first act. The city interior, the siege and ACTS II–V are not yet playable, and the epilogue does not present their outcome as if it had been played.

## Systems and files

```text
src/
  core/         Game loop, scene, events, audio and saving
  world/        Terrain, vegetation, structures, lighting, weather and textures
  player/       Character, camera, movement, animation and state
  characters/   NPC visuals and their in-world state
  story/        Data-driven events, choice conditions and consequences
  systems/      Proximity interaction and inventory
  data/         Story, items, characters, quests, places, codex
  ui/           HUD, dialogue and journal panels
```

- **StoryManager** reads events from `data/storyEvents.js`. Dialogue branches, hidden/locked options and NPC memory are kept separate from the main game loop.
- **ConsequenceManager** handles flags, stats, inventory, quests, codex and NPC state. First-entry rewards are idempotent. Delayed events run on savable game time and conditions; they do not advance while paused.
- Kael reaches the patrol **25 game seconds** after being saved. The same NPC’s position and dialogue change in the next encounter. The delay survives saving and reloading.
- Reputation with six factions is clamped to −100…100. The Relations screen shows each value as a label. Mercy, fear and infamy are not shown in the regular HUD.
- The codex unlocks across eight categories through exploration. Consumables can be used from the inventory; the letter, banner, charm and seal unlock dialogue options.
- Rain particles reuse a fixed typed-array pool. Trees, grass and rocks use `InstancedMesh`; structures are merged by material; only a limited number of point lights are used for nearby torches.
- Three graphics levels change pixel ratio, shadows, and rain and grass density. 60 FPS is the target; it depends on the device and resolution.
- Sounds are synthesized locally with Web Audio. Music, ambience, effects and voice categories are separate. `AudioManager.createPositionalSource()` is ready for attaching recorded positional audio later. There is no recorded voice acting.

### Adding story

```js
new_event: {
  speaker: 'edric',
  text: 'A new conversation.',
  choices: [{
    id: 'show_seal',
    text: 'Show the seal.',
    requirements: { items: ['seal'], reputation: { army: 50 } },
    hint: 'Seal · Army: Respected',
    effects: { flags: ['seal_seen'], reputation: { army: 5 } },
    nextEvent: 'gate',
  }],
}
```

Adding data to an existing dialogue chain requires no engine changes. A new world encounter needs a location/interaction defined in `locations.js` and `InteractionSystem.js`.

### Models

Characters and architecture are procedural placeholders. Vegetation and ground textures are generated at runtime with Canvas. No third-party 3D models are downloaded.

`Player.loadModel('/models/traveler.glb')` loads GLTFLoader on demand. The `Idle`, `Walk`, `Run`, `Interact`, `Attack`, `Hurt` and `Death` animation states are supported. This chapter has no combat system; the attack, hurt and death states are reserved names.

### Saving

Local storage key: `tiex.velmora.save.v1`. There is one save slot. The game autosaves after choices, periodically while exploring, when returning to the menu and at the end of the chapter. The pause menu offers a manual save.

Format: `{ version: 1, savedAt, state }`. Position, stats, inventory, flags, quests, NPC memory/state, reputation, codex, act, active dialogue, decision history and pending consequences are stored. Corrupt or unsupported saves are rejected safely. A new game overwrites the existing save, and the interface warns about this beforehand. Saves do not sync across devices.

### Development

`F2` shows FPS, draw calls, position, event, quest, flags, reputation and NPC state. In development the scene and state can be inspected through `window.__TIEX__`. This hook and the F2 code are stripped from production builds.

```js
// Vite development mode only, in the browser console:
window.__TIEX__.consequences.apply({ flags: ['test_flag'] });
window.__TIEX__.world.weather.setMode('storm'); // clear | fog | rain | storm
```

## Assets

Visuals, the crest and synthesized sounds were created for this project. The Cormorant Garamond and Manrope fonts are served locally from Fontsource packages; their SIL Open Font License files are included in the packages. Three.js is MIT licensed.
