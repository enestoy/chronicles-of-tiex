import { test, expect } from '@playwright/test';

async function start(page) {
  await page.goto('/'); await expect(page.locator('#loading')).toBeHidden();
  await page.locator('#new-game').click(); await expect(page.locator('#cinematic')).toBeVisible();
  await page.locator('#skip-cinematic').click(); await expect(page.locator('#hud')).toBeVisible();
}
async function choose(page, id) { await page.locator(`[data-choice="${id}"]`).click(); }
async function go(page, x, z, interact = true) {
  await page.evaluate(({ x, z }) => { const g = window.__TIEX__; g.state.position = { x, y: 0, z }; g.controller.resetCamera(); }, { x, z });
  if (interact) { await expect(page.locator('#interaction-prompt')).toBeVisible(); await page.keyboard.press('KeyE'); await expect(page.locator('#dialogue')).toBeVisible(); }
}

test('real movement triggers the scream; keyboard choices and modal controls work', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await start(page);
  await page.keyboard.down('KeyW');
  await expect(page.locator('#dialogue')).toBeVisible({ timeout: 14000 });
  await page.keyboard.up('KeyW');
  await expect(page.locator('#dialogue')).toContainText('The silence breaks');
  await page.keyboard.press('Digit1'); await expect(page.locator('#dialogue')).toBeHidden();
  expect(await page.evaluate(() => window.__TIEX__.state.flags)).toContain('investigated_forest_scream');
  await page.keyboard.press('KeyI'); await expect(page.locator('#panel-title')).toHaveText('What you carry.');
  await page.locator('[data-item="bandage"]').click(); await page.locator('[data-use="bandage"]').click();
  await expect(page.locator('.toast')).toContainText('Your health is already full');
  await page.keyboard.press('KeyJ'); await expect(page.locator('#panel-title')).toHaveText('A traveler’s journal.');
  await page.keyboard.press('KeyM'); await expect(page.locator('.map-art svg')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('#modal-backdrop')).toBeHidden();
  await page.keyboard.press('Escape'); await expect(page.locator('.pause-menu')).toBeVisible();
  await page.locator('[data-action="save"]').click(); await page.locator('[data-action="resume"]').click();
  const savedPosition = await page.evaluate(() => window.__TIEX__.state.position.z);
  await page.reload(); await expect(page.locator('#continue-game')).toBeEnabled(); await page.locator('#continue-game').click();
  expect(await page.evaluate(() => window.__TIEX__.state.position.z)).toBeCloseTo(savedPosition, 1);
  expect(errors).toEqual([]);
});

test('complete rescue route, tower puzzle, reputation locks and personal epilogue', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await start(page); await go(page, 0, 18, false); await choose(page, 'investigate');
  await go(page, 15, 10); await choose(page, 'ask'); await choose(page, 'return'); await choose(page, 'help');
  await expect(page.locator('#dialogue')).toContainText('I won’t forget'); await choose(page, 'promise');
  expect(await page.evaluate(() => window.__TIEX__.state.inventory)).not.toContain('bandage');
  await go(page, -22, -25); await choose(page, 'promise'); await choose(page, 'back'); await choose(page, 'food'); await choose(page, 'rest'); await choose(page, 'leave');
  await go(page, 23, -64); await choose(page, 'banner'); await choose(page, 'take'); await choose(page, 'puzzle');
  await choose(page, 'crown'); await expect(page.locator('#dialogue')).toContainText('The stone falls silent'); await choose(page, 'retry');
  await choose(page, 'raven'); await choose(page, 'crown'); await choose(page, 'fire'); await choose(page, 'take'); await choose(page, 'leave');
  await go(page, -20, -98); await choose(page, 'herbs'); await choose(page, 'leave');
  await page.evaluate(() => { window.__TIEX__.state.playTime += 30; });
  await go(page, 1, -126, false); await expect(page.locator('#dialogue')).toContainText('Kael told us about you'); await choose(page, 'kael'); await choose(page, 'go');
  await go(page, 16, -152); await choose(page, 'seal'); await choose(page, 'leave');
  await go(page, 0, -211); await choose(page, 'letter'); await choose(page, 'back'); await choose(page, 'banner'); await choose(page, 'back'); await choose(page, 'mira'); await choose(page, 'back');
  await choose(page, 'enter'); await expect(page.locator('.ending-title')).toBeVisible();
  await expect(page.locator('.epilogue')).toBeVisible({ timeout: 14000 });
  await expect(page.locator('.epilogue')).toContainText('Velmora would fall three days later');
  await expect(page.locator('.epilogue')).toContainText('Kael Varen would see another morning');
  await expect(page.locator('.epilogue')).toContainText('This time, it was her mother');
  await expect(page.locator('.epilogue')).toContainText('The silver raven flew once more');
  await page.locator('#ending-menu').click(); await page.locator('#continue-game').click(); await expect(page.locator('.epilogue')).toBeVisible();
  expect(errors).toEqual([]);
});

test('ignore route can reach the ending without money, items or reputation', async ({ page }) => {
  await start(page); await go(page, 0, 18, false); await choose(page, 'ignore');
  await page.evaluate(() => { window.__TIEX__.state.stats.gold = 0; });
  await go(page, 0, -126, false);
  await expect(page.locator('[data-choice="pay"]')).toBeDisabled(); await expect(page.locator('[data-choice="letter"]')).toBeDisabled();
  await choose(page, 'wait'); await choose(page, 'go'); await go(page, 0, -211); await choose(page, 'enter');
  await expect(page.locator('.epilogue')).toBeVisible({ timeout: 14000 });
  await expect(page.locator('.epilogue')).toContainText('You never learned whose it was');
});

test('mobile layout fits; settings persist and codex empty categories are explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/'); await expect(page.locator('#loading')).toBeHidden();
  await page.locator('[data-panel="settings"]').click(); await page.locator('#quality').selectOption('low'); await page.locator('#muted').check(); await page.locator('#close-panel').click();
  await page.locator('.lore-link').click(); await page.locator('#codex-category').selectOption('Artifacts');
  await expect(page.locator('.empty-state')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.locator('#close-panel').click(); await page.reload(); await page.locator('[data-panel="settings"]').click();
  await expect(page.locator('#quality')).toHaveValue('low'); await expect(page.locator('#muted')).toBeChecked();
});

test('mouse camera, stamina and Escape work with browser pointer lock', async ({ page }) => {
  await start(page);
  await page.locator('#world').click({ position: { x: 900, y: 400 } });
  await expect.poll(() => page.evaluate(() => Boolean(document.pointerLockElement))).toBe(true);
  await page.mouse.move(1030, 440);
  await expect.poll(() => page.evaluate(() => Math.abs(window.__TIEX__.controller.yaw))).toBeGreaterThan(.01);
  await page.keyboard.down('ShiftLeft'); await page.keyboard.down('KeyW');
  await expect.poll(() => page.evaluate(() => window.__TIEX__.state.stats.stamina)).toBeLessThan(96);
  await page.keyboard.up('KeyW'); await page.keyboard.up('ShiftLeft');
  await page.keyboard.press('Escape'); await expect(page.locator('.pause-menu')).toBeVisible();
  await page.locator('[data-action="resume"]').click(); await expect(page.locator('#modal-backdrop')).toBeHidden();
  await page.locator('#world').click({ position: { x: 900, y: 400 } });
  await page.keyboard.press('KeyI'); await expect(page.locator('#panel-title')).toHaveText('What you carry.');
  await expect.poll(() => page.evaluate(() => Boolean(document.pointerLockElement))).toBe(false);
});
