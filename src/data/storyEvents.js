const choice = (id, text, effects = {}, nextEvent = null, extra = {}) => ({ id, text, effects, nextEvent, ...extra });
const onward = { objective: 'Reach Velmora by the North Road', objectiveTarget: 'camp' };
export const storyEvents = {
  forest_scream: {
    eyebrow: 'A VOICE IN THE FOREST', title: 'The silence breaks.',
    text: 'A scream rose from deep within the forest.\nFor a moment, even the rain seems to fall silent. East of the road, a lantern flickers between the trees. Then another voice; weaker this time.',
    choices: [
      choice('investigate', 'Go toward the scream.', { flags: ['heard_scream', 'investigated_forest_scream'], reputation: { folk: 5 }, objective: 'Reach the wounded figure among the trees', objectiveTarget: 'kael' }),
      choice('ignore', 'Keep to the road.', { flags: ['heard_scream', 'ignored_forest_scream'], ...onward }),
      choice('prepare', 'Draw your sword and wait.', { flags: ['heard_scream', 'prepared_for_ambush'], stats: { awareness: 1 } }, 'ambush'),
    ],
  },
  ambush: {
    speaker: 'deserter', text: '“Lower your sword. If I wanted you dead, I wouldn’t be the one screaming.”\nA soldier in a torn uniform steps out of the brush, hands raised, eyes fixed not on your weapon but on the forest left behind.',
    choices: [
      choice('listen', 'What happened back there?', { flags: ['met_deserter'], codex: ['guard'] }, 'deserter_truth'),
      choice('threaten', 'Empty your pockets and go.', { flags: ['threatened_deserter'], stats: { gold: 6, infamy: 2 }, reputation: { army: -10 }, ...onward }),
      choice('leave', 'Enough blood has been spilled tonight. Go.', { flags: ['spared_deserter'], stats: { mercy: 1 }, ...onward }),
    ],
  },
  deserter_truth: {
    speaker: 'deserter', text: '“Kael. His name is Kael Varen. Our own soldiers attacked him. If I tell anyone, they’ll silence me too.”\nThe soldier points to the lantern in the east. “I’m no hero. But you, maybe… You still have a choice.”',
    choices: [choice('find', 'I’ll find Kael.', { flags: ['investigated_forest_scream', 'spared_deserter'], objective: 'Reach the wounded figure among the trees', objectiveTarget: 'kael' }), choice('go', 'I won’t tell anyone.', { flags: ['spared_deserter'], ...onward })],
  },
  wounded_knight: {
    speaker: 'kael', enter: { codex: ['kael', 'guard'] },
    text: '“Please… don’t leave me here.”\nThe young man’s fingers press against his broken armor. The rain carries his blood between the stones. A silver raven marks his chest. In one hand he clutches a sealed letter.',
    choices: [
      choice('help', 'Kneel and bind his wound.', { removeItems: ['bandage'] }, 'kael_saved', { requirements: { items: ['bandage'] }, hint: 'Clean bandage' }),
      choice('herbs', 'Stop the bleeding with silverleaf.', { removeItems: ['herbs'] }, 'kael_saved', { requirements: { items: ['herbs'] }, hint: 'Silverleaf' }),
      choice('ask', 'Who attacked you?', {}, 'kael_truth'),
      choice('rob', 'Take his letter and his purse.', { flags: ['robbed_kael', 'kael_resolved', 'has_varen_letter'], items: ['letter'], stats: { gold: 9, infamy: 3 }, reputation: { army: -20 }, npcs: { kael: { relationship: -30, memory: ['robbed'] } }, quests: { kael: 'active' }, ...onward }, 'kael_robbed'),
      choice('kill', 'End his suffering.', {}, 'kael_mercy'),
      choice('leave', '“I’m sorry.” Stand and walk away.', { flags: ['abandoned_kael', 'kael_resolved'], ...onward }),
    ],
  },
  kael_truth: {
    speaker: 'kael', enter: { flags: ['learned_about_eastern_gate'], codex: ['eastern_gate'] },
    text: '“The watch at the eastern gate… was replaced. The order didn’t come from the commander. I was taking this letter to my uncle. Edric. At the north gate.”\nHe pauses to catch his breath. “The ones who attacked me wore our colors. The city will fall from within before it falls from without.”',
    choices: [choice('return', '“Let’s see to that wound first.”', {}, 'wounded_knight')],
  },
  kael_saved: {
    speaker: 'kael',
    enter: { flags: ['saved_kael', 'kael_resolved', 'has_varen_letter'], items: ['letter'], stats: { honor: 5, mercy: 3 }, reputation: { army: 15, folk: 10 }, npcs: { kael: { relationship: 35, memory: ['saved'] } }, quests: { kael: 'active' }, delayed: [{ id: 'kael_reaches_patrol', seconds: 25, effects: { flags: ['kael_at_patrol'], npcs: { kael: { location: 'road' } } } }] },
    text: 'You tie the bandage tight. Slowly, Kael’s breathing steadies.\n“I don’t even know your name… but I won’t forget.”\nHe hands you the letter. “Give this to Edric. I’ll try to reach the patrol. If you pass the old tower, look for our banner. We lost people there.”',
    choices: [choice('promise', '“See you at the gate, Kael.”', { quests: { banner: 'active' }, ...onward })],
  },
  kael_robbed: { speaker: 'kael', text: 'His fingers won’t let go of the letter. Then his strength gives out.\n“Take the money… but don’t burn the letter. It’s about more than my life.”\nYou turn away so you don’t have to see his face.', choices: [choice('leave', 'Return to the road.', onward)] },
  kael_mercy: {
    speaker: 'kael', text: 'Kael looks at your blade. He understands what you are about to do.\n“No. Not yet. I want to live.”\nYour hand waits on the hilt. The only sound in the forest is the rain.',
    choices: [
      choice('confirm', 'Use the blade.', { flags: ['killed_kael', 'kael_resolved', 'has_varen_letter'], items: ['letter'], stats: { infamy: 5, fear: 2 }, reputation: { army: -35 }, npcs: { kael: { alive: false, memory: ['killed'] } }, quests: { kael: 'active' }, ...onward }),
      choice('cancel', 'Sheathe the blade.', {}, 'wounded_knight'),
    ],
  },
  camp: {
    speaker: 'mira', enter: { codex: ['camp'], flags: ['visited_camp'] },
    text: '“Come closer to the fire. You’re freezing.”\nThe woman tosses a branch onto the dying embers. Coughing drifts from the tents behind her.\n“Did you come from the north? Have you seen a little girl? She has a yellow ribbon in her hair. Her name is Lysa.”',
    choices: [
      choice('promise', 'I haven’t. But I can look for her in the city.', { flags: ['promised_mira'], items: ['token'], quests: { mira: 'active' }, npcs: { mira: { relationship: 15, memory: ['promise'] } } }, 'mira_promise', { hideIf: { flags: ['promised_mira'] } }),
      choice('food', 'Buy some food. Use this coin.', { stats: { gold: -5, mercy: 2 }, reputation: { folk: 15 }, flags: ['helped_refugees'] }, 'camp_thanks', { requirements: { stats: { gold: 5 } }, hint: '5 gold', hideIf: { flags: ['helped_refugees'] } }),
      choice('rumor', 'What lies further down the road?', {}, 'camp_rumor'),
      choice('sell', 'I found an army banner. Will you trade for it?', { removeItems: ['banner'], stats: { gold: 15 }, flags: ['sold_banner'], quests: { banner: 'completed' }, reputation: { merchants: 10 } }, 'banner_sold', { requirements: { items: ['banner'] }, hint: 'Lost banner' }),
      choice('leave', '“Keep your fire burning.” Continue on.', { objective: 'Explore the old tower or return to the North Road', objectiveTarget: 'tower' }),
    ],
  },
  mira_promise: { speaker: 'mira', text: 'She unties a small wooden sun from her neck and places it in your palm.\n“Show her this. She’ll trust you. They said the first group would be taken to the temple.”\nShe falls silent for a moment. “I’m not asking you to swear. I no longer believe in oaths, only in people who come back.”', choices: [choice('back', 'Carefully put the charm away.', {}, 'camp')] },
  camp_thanks: { speaker: 'mira', text: 'Mira doesn’t count the coins. She takes them straight to the old man in the tent.\n“The children will have soup tonight too.”\nSomeone across the fire makes room for you. For a few minutes, the war feels very far away.', choices: [choice('rest', 'Rest by the fire for a while.', { stats: { health: 15 } }, 'camp')] },
  camp_rumor: { speaker: 'mira', enter: { quests: { banner: 'active' }, codex: ['ravens'] }, text: '“The old tower to the east. A guard said the banner is still there. But there are other things beneath those stones.”\n“The farm to the west is empty. There may still be healing herbs in its garden. And at the end of the road, a patrol… I can no longer tell who they work for.”', choices: [choice('back', '“I’ll keep that in mind.”', {}, 'camp')] },
  banner_sold: { speaker: 'mira', text: '“We need cloth to cover the children. Soldiers’ memories won’t keep them warm.”\nThe silver raven parts in two beneath the scissors.', choices: [choice('back', 'Take the coins.', {}, 'camp')] },
  tower: {
    eyebrow: 'THE OLD WATCHTOWER', title: 'The memory of stone.',
    enter: { codex: ['tower', 'journal'], items: ['journal'], quests: { tower: 'active' }, flags: ['visited_tower'] },
    text: 'Beneath the ruined stairs lies a chest bearing three symbols: a raven, a crown and a flame.\nIn the journal beside it, a single line is marked:\n“First the raven carries the news. Then the crown passes judgment. Last, the fire takes what remains.”',
    choices: [
      choice('puzzle', 'Examine the chest’s lock.', {}, 'puzzle_1', { hideIf: { flags: ['tower_opened'] } }),
      choice('banner', 'Pull the blue cloth from the rubble.', { items: ['banner'], flags: ['found_banner'], quests: { banner: 'active' } }, 'banner_found', { hideIf: { flags: ['found_banner'] } }),
      choice('leave', 'Leave the tower behind.', { objective: 'Reach the patrol on the North Road', objectiveTarget: 'road' }),
    ],
  },
  puzzle_1: { eyebrow: 'THREE SIGNS • I', title: 'First comes the news.', text: 'The symbols on the lockstone are cold beneath your fingers. You turn the first ring.', choices: [choice('raven', 'Raven.', {}, 'puzzle_2'), choice('crown', 'Crown.', {}, 'puzzle_wrong'), choice('fire', 'Flame.', {}, 'puzzle_wrong'), choice('back', 'Read the journal again.', {}, 'tower')] },
  puzzle_2: { eyebrow: 'THREE SIGNS • II', title: 'Then judgment is passed.', text: 'The first ring clicks into place. A sound echoes from within the stone. What should the second sign be?', choices: [choice('fire', 'Flame.', {}, 'puzzle_wrong'), choice('crown', 'Crown.', {}, 'puzzle_3'), choice('raven', 'Raven.', {}, 'puzzle_wrong')] },
  puzzle_3: { eyebrow: 'THREE SIGNS • III', title: 'What remains?', text: 'The last ring. Cold air rises through the gap in the chest.', choices: [choice('crown', 'Crown.', {}, 'puzzle_wrong'), choice('raven', 'Raven.', {}, 'puzzle_wrong'), choice('fire', 'Flame.', {}, 'tower_open')] },
  puzzle_wrong: { eyebrow: 'LOCK RESET', title: 'The stone falls silent.', text: 'The rings slide back into place with a dry click. The journal’s words return to you: the news, the judgment, what remains.', choices: [choice('retry', 'Try again.', {}, 'puzzle_1'), choice('leave', 'Leave it for now.', {}, 'tower')] },
  tower_open: { eyebrow: 'ARTIFACT FOUND', title: 'The Seal of Ashes.', enter: { items: ['seal'], flags: ['tower_opened'], codex: ['seal', 'ashen'], quests: { tower: 'completed' } }, text: 'Slowly, the lid opens. There is no gold inside. Only a black stone and a cloth turned to ash.\nWhen you take the stone in your palm, you think you hear a bell in the distance. But there are no bells in the forest.', choices: [choice('take', 'Take the seal with you.', {}, 'tower')] },
  banner_found: { eyebrow: 'THE LOST BANNER', title: 'Until the last gate closes.', text: 'You pull the cloth free of the rubble. The raven upon it gleams even beneath the mud.\nThree names are stitched below it. The last one is unfinished.', choices: [choice('take', 'Fold the banner and put it in your bag.', {}, 'tower')] },
  farm: { eyebrow: 'THE ABANDONED FARM', title: 'The table is still set.', enter: { flags: ['visited_farm'] }, text: 'Two plates, dried bread and an overturned chair. The owners left without even gathering their things.\nIn the garden, silver leaves glisten in the rain. On the inside of the door, a child has drawn a sun.', choices: [choice('herbs', 'Gather the healing leaves.', { items: ['herbs'], flags: ['collected_herbs'] }, 'farm_collected', { hideIf: { flags: ['collected_herbs'] } }), choice('leave', 'Close the door and return to the road.', { objective: 'Reach the patrol on the North Road', objectiveTarget: 'road' })] },
  farm_collected: { eyebrow: 'SILVERLEAF', title: 'The earth keeps giving.', text: 'You gather the leaves carefully. When you crush one, a sharp, clean scent clings to your fingers.\nYou can use it from your inventory or save it for someone who is wounded.', choices: [choice('leave', 'Return to the road.', { objective: 'Reach the patrol on the North Road', objectiveTarget: 'road' })] },
  road: {
    speaker: 'deserter', enter: { flags: ['reached_patrol'] },
    text: '“Halt. The gates are closed to strangers.”\nThe soldier looks exhausted. No sword is drawn, but the road stays blocked. Beyond, the lights of Velmora flicker in the mist.',
    variants: [{ conditions: { flags: ['kael_at_patrol'] }, text: '“You must be the one. Kael told us about you.”\nThe soldier lowers the weapon. By the fire you see a familiar face. Kael nods in greeting.\n“My leg’s still attached. Thanks to you. Edric is waiting at the gate.”' }, { conditions: { flags: ['spared_deserter'] }, text: '“The traveler from the forest…”\nThe soldier recognizes you and lets go of the sword hilt.\n“You could have struck when I turned my back. You didn’t. I’ll let you pass.”' }],
    choices: [
      choice('kael', '“It’s good to see you on your feet, Kael.”', { flags: ['kael_reunited'], reputation: { army: 10 } }, 'road_pass', { requirements: { flags: ['kael_at_patrol'] }, hint: 'Kael is alive' }),
      choice('letter', 'Show the Varen seal.', {}, 'road_pass', { requirements: { items: ['letter'] }, hint: 'Bloodstained letter' }),
      choice('honor', '“There are unarmed people out here. Open the road.”', { reputation: { army: 5 } }, 'road_pass', { requirements: { stats: { honor: 5 } }, hint: 'Honor 5' }),
      choice('pay', 'Pay five gold to pass.', { stats: { gold: -5 } }, 'road_pass', { requirements: { stats: { gold: 5 } }, hint: '5 gold' }),
      choice('wait', 'Lay down your weapon and submit to a search.', { stats: { stamina: -15 } }, 'road_pass'),
    ],
  },
  road_pass: { speaker: 'deserter', enter: { flags: ['passed_patrol'] }, text: 'The soldier steps aside.\n“Find Edric at the gate. I can’t say what the others will tell you.”\nIn the distance, a war horn sounds. The soldier turns toward it. “Go. Quickly.”', choices: [choice('go', 'Walk toward Velmora.', { objective: 'Find Edric at the Velmora Gate', objectiveTarget: 'gate' })] },
  ashen: {
    speaker: 'ashen', enter: { codex: ['ashen'], flags: ['met_ashen'] }, text: 'The figure in the grey cloak stares into the fire and does not turn as you approach.\n“People fall silent before the stones fall. Did you hear how quiet they were tonight?”',
    choices: [choice('seal', 'Show the black seal.', { reputation: { ashen: 25 }, flags: ['ashen_recognized'] }, 'ashen_secret', { requirements: { items: ['seal'] }, hint: 'Seal of Ashes' }), choice('ask', 'Who are you?', {}, 'ashen_words'), choice('leave', 'Slip away quietly.', {})],
  },
  ashen_words: { speaker: 'ashen', text: '“One who remembers the forgotten. Tonight, you will remember someone too.”\nThe fire crackles. “You cannot save Velmora, traveler. But Velmora is not made of stone alone.”', choices: [choice('leave', 'Keep these words in mind.', { flags: ['heard_ashen_warning'] })] },
  ashen_secret: { speaker: 'ashen', text: 'For the first time, the wanderer turns to face you.\n“Whoever carries this will not be lost in the eastern tunnels. Follow the sound of water. Touch the raven’s eyes above the door.”\n“When the time comes, choose carefully whom you take with you. The tunnel will not hold everyone.”', choices: [choice('leave', '“I’ll remember.”', { flags: ['knows_eastern_tunnels'], codex: ['eastern_gate'] })] },
  gate: {
    speaker: 'edric', enter: { codex: ['edric'], flags: ['met_edric'] },
    text: '“The gates close before dawn. If you want in, go in now.”\nThe commander’s tired eyes look you over. “You came by the North Road. What did you see out there?”',
    variants: [{ conditions: { flags: ['kael_reunited'] }, text: '“So you’re the one who kept Kael alive.”\nEdric pulls off his glove and offers his hand. “House Varen owes you. But I fear we have no time to repay debts tonight.”' }, { conditions: { flags: ['robbed_kael'] }, text: 'Edric’s gaze catches on the purse at your belt.\n“That purse belonged to my nephew. I want you to tell me where you came across him.”' }],
    choices: [
      choice('letter', '“Kael asked me to bring you this.”', { flags: ['delivered_letter'], removeItems: ['letter'], quests: { kael: 'completed' }, reputation: { army: 10 }, npcs: { edric: { memory: ['letter_delivered'] } } }, 'edric_letter', { requirements: { items: ['letter'] }, hint: 'Bloodstained letter' }),
      choice('banner', 'Return the Third Guard’s banner.', { flags: ['returned_banner'], removeItems: ['banner'], quests: { banner: 'completed' }, reputation: { army: 25 }, stats: { honor: 5 } }, 'edric_banner', { requirements: { items: ['banner'] }, hint: 'Lost banner' }),
      choice('mira', 'Show Mira’s charm. “Is Lysa here?”', { flags: ['found_lysa'], quests: { mira: 'completed' }, reputation: { folk: 10 } }, 'edric_lysa', { requirements: { items: ['token'] }, hint: 'Mira’s charm', hideIf: { flags: ['found_lysa'] } }),
      choice('trusted', 'Ask about the guards’ secret passage.', { flags: ['knows_eastern_tunnels'] }, 'edric_tunnel', { requirements: { reputation: { army: 50 } }, hint: 'Army: Respected', hideIf: { flags: ['knows_eastern_tunnels'] } }),
      choice('enter', 'Pass through the gates.', { flags: ['entered_velmora'], quests: { road: 'completed' } }, '$ending'),
      choice('back', '“There are still things I need to do out there.”', { objective: 'Return to Edric when you are ready', objectiveTarget: 'gate' }),
    ],
  },
  edric_letter: { speaker: 'edric', enter: { codex: ['eastern_gate'], flags: ['learned_about_eastern_gate'] }, text: 'Edric breaks the seal. His jaw tightens as he reads.\n“Tell no one about this. Don’t trust the palace either. We may be able to buy some time to get the people inside to safety.”\nHe tucks the letter inside his armor. “Sometimes winning means one more person sees the morning.”', choices: [choice('back', 'Nod.', {}, 'gate')] },
  edric_banner: { speaker: 'edric', text: 'The commander takes the banner in both hands. He notices the unfinished name along its edge.\n“I knew the child who stitched this.”\nHe hands the banner to the soldier beside him. “Hang it above the gate. Let them see we’re still here.”', choices: [choice('back', 'Stay silent for a while.', {}, 'gate')] },
  edric_lysa: { speaker: 'edric', text: '“The girl with the yellow ribbon? She’s at the temple. Safe.”\nHe looks at the charm. “I’ll send someone to bring her mother. Tonight, at least, we can bring one family back together.”', choices: [choice('back', 'Put the charm away again.', {}, 'gate')] },
  edric_tunnel: { speaker: 'edric', text: 'He lowers his voice.\n“There is an old passage beneath the eastern cistern. If the gates don’t hold, follow the water. You’ll see the raven’s mark.”\n“I hope you’ll only share this with someone who deserves it.”', choices: [choice('back', '“Understood.”', {}, 'gate')] },
};

export function buildEpilogue(state) {
  const has = flag => state.flags.includes(flag);
  const lines = ['Velmora would fall three days later. That night, no one yet knew how far the ashes would scatter.'];
  if (has('saved_kael')) lines.push('But Kael Varen would see another morning. And when the time came, he would remember the hand that reached for him in the forest.');
  else if (has('killed_kael')) lines.push('In the forest, a courier fell silent. The footsteps Edric was waiting for would never be heard again.');
  else if (has('robbed_kael')) lines.push('You carried a soldier’s purse. You never knew whether he lived. His last words, you could not forget.');
  else lines.push('The scream in the forest was left behind. You never learned whose it was.');
  if (has('found_lysa')) lines.push('At the temple, a girl with a yellow ribbon ran to the door. This time, it was her mother.');
  if (has('returned_banner')) lines.push('The silver raven flew once more above the walls. Those who stood beneath it felt they were not alone.');
  if (has('sold_banner')) lines.push('A banner no longer flew. That night, it kept three children warm.');
  if (has('delivered_letter')) lines.push('A letter reached the right hands. It would not save the city, but it might open some doors a little sooner.');
  if (has('knows_eastern_tunnels')) lines.push('And beneath the stone, a path known to only a few was waiting for you.');
  lines.push('History’s ending was already written. Your story was only beginning.');
  return lines;
}
