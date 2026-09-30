import { test, expect } from '@playwright/test';

test('production cooking flow with live RU, KK and EN assistance', async ({ page, request }, testInfo) => {
  expect((await request.get('/api/ai')).status()).toBe(405);
  expect((await request.post('/api/ai', { data: { question: '', language: 'en', context: {} } })).status()).toBe(400);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.name));
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Что будем готовить сегодня?');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('button', { name: 'Start cooking', exact: true }).click();
  for (let i = 0; i < 3; i++) await page.locator('.select-button').nth(i).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('When should everything be ready?').fill('19:30');
  await page.getByRole('button', { name: 'Create plan', exact: true }).click();
  await expect(page.locator('.timeline-row')).toHaveCount(13);
  await page.getByRole('button', { name: 'Start now', exact: true }).click();
  const timer = page.locator('.current-card [role="timer"]');
  const before = await timer.textContent();
  await expect.poll(() => timer.textContent()).not.toBe(before);

  for (const language of [
    { button: 'RU', code: 'ru', ask: 'Спросить Culinex AI', question: 'Как разбавить густой томатный соус?' },
    { button: 'KZ', code: 'kk', ask: 'Culinex AI-дан сұрау', question: 'Қою қызанақ тұздығын қалай сұйылтуға болады?' },
    { button: 'EN', code: 'en', ask: 'Ask Culinex AI', question: 'How can I thin a thick tomato sauce?' },
  ]) {
    await page.getByRole('button', { name: language.button, exact: true }).click();
    await expect(page.locator('.session-progress strong')).toHaveText('0 / 13');
    await page.locator('.ai-trigger').click();
    await page.locator('#question').fill(language.question);
    const responsePromise = page.waitForResponse('**/api/ai');
    await page.locator('.ai-dialog form button').click();
    const response = await responsePromise;
    expect(response.request().postDataJSON().language).toBe(language.code);
    expect.soft(response.status(), `Live AI ${language.code} must succeed`).toBe(200);
    if (response.ok()) {
      await expect(page.locator('.ai-answer')).not.toBeEmpty();
    } else {
      await expect(page.getByRole('alert')).toBeVisible();
    }
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }

  await page.getByRole('button', { name: 'EN', exact: true }).click();
  for (let i = 0; i < 13; i++) await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('h1')).toContainText('Dinner is ready');
  await expect(page.locator('.result-stats')).toContainText('13 / 13');
  await page.screenshot({ path: `artifacts/production-${testInfo.project.name}-result.png`, fullPage: true });
  expect(errors).toEqual([]);
});
