import { test, expect, type Page } from '@playwright/test';

async function enterCooking(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('button', { name: 'Start cooking', exact: true }).click();
  await page.locator('.select-button').nth(0).click();
  await page.locator('.select-button').nth(1).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Create plan', exact: true }).click();
  await page.getByRole('button', { name: 'Start now', exact: true }).click();
}

test('loading blocks duplicate submissions; all languages carry only cooking context', async ({ page }, testInfo) => {
  await enterCooking(page);
  const cases = [
    { code: 'en', button: 'EN', ask: 'Ask Culinex AI', placeholder: 'Ask about cooking...', submit: 'Ask', close: 'Close', loading: 'Preparing an answer…', answer: 'Add a little warm water and stir.' },
    { code: 'ru', button: 'RU', ask: 'Спросить Culinex AI', placeholder: 'Спросите о готовке...', submit: 'Спросить', close: 'Закрыть', loading: 'Готовим ответ…', answer: 'Добавьте немного тёплой воды и перемешайте.' },
    { code: 'kk', button: 'KZ', ask: 'Culinex AI-дан сұрау', placeholder: 'Пісіру туралы сұраңыз...', submit: 'Сұрау', close: 'Жабу', loading: 'Жауап дайындалуда…', answer: 'Аздап жылы су қосып, араластырыңыз.' },
  ];
  for (const item of cases) {
    let requests = 0;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/ai', async route => {
      requests++;
      const payload = route.request().postDataJSON();
      expect(payload.language).toBe(item.code);
      expect(Object.keys(payload).sort()).toEqual(['context', 'language', 'question']);
      expect(Object.keys(payload.context).sort()).toEqual(['currentTask', 'recipe', 'selectedRecipes']);
      expect(payload.context.selectedRecipes).toHaveLength(2);
      expect(payload.context.currentTask).not.toBe('');
      await gate;
      await route.fulfill({ json: { answer: item.answer } });
    });
    await page.getByRole('button', { name: item.button, exact: true }).click();
    await page.getByRole('button', { name: item.ask, exact: true }).click();
    await expect(page.locator('.ai-context')).toContainText(await page.locator('.current-card h2').innerText());
    await page.getByPlaceholder(item.placeholder).fill('How can I thin the sauce?');
    await page.getByRole('button', { name: item.submit, exact: true }).click();
    await expect(page.getByRole('button', { name: item.loading, exact: true })).toBeDisabled();
    await expect(page.getByPlaceholder(item.placeholder)).toBeDisabled();
    await page.locator('.ai-dialog form').dispatchEvent('submit');
    await page.locator('.ai-dialog form').dispatchEvent('submit');
    await expect.poll(() => requests).toBe(1);
    release();
    await expect(page.locator('.ai-answer')).toHaveText(item.answer);
    expect(requests).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (item.code === 'ru') await page.screenshot({ path: `artifacts/${testInfo.project.name}-ai.png`, fullPage: true });
    await page.getByRole('button', { name: item.close, exact: true }).click();
    await page.unroute('**/api/ai');
    await expect(page.locator('.session-progress strong')).toHaveText('0 / 9');
  }
});

test('network, rate limit, invalid JSON and empty answers never break cooking', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await enterCooking(page);
  for (const failure of ['network', 'rate', 'json', 'answer']) {
    await page.route('**/api/ai', async route => {
      if (failure === 'network') await route.abort('failed');
      else if (failure === 'rate') await route.fulfill({ status: 429, json: { error: 'limited' } });
      else if (failure === 'json') await route.fulfill({ status: 200, body: 'not JSON' });
      else await route.fulfill({ json: { answer: '' } });
    });
    await page.getByRole('button', { name: 'Ask Culinex AI', exact: true }).click();
    await page.getByPlaceholder('Ask about cooking...').fill('Help with the sauce?');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('temporarily unavailable');
    await expect(page.getByRole('button', { name: 'Ask', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.unroute('**/api/ai');
  }
  await expect(page.locator('.session-progress strong')).toHaveText('0 / 9');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('.session-progress strong')).toHaveText('1 / 9');
  const timer = page.locator('.current-card [role="timer"]');
  const initial = await timer.textContent();
  await expect.poll(() => timer.textContent()).not.toBe(initial);
  expect(errors).toEqual([]);
});
