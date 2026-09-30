import { expect, it } from 'vitest';
import { ru } from '../../src/i18n/ru';
import { kk } from '../../src/i18n/kk';
import { en } from '../../src/i18n/en';
import { recipes } from '../../src/data/recipes';
it('has complete UI and recipe translations for all three languages', () => {
  expect(Object.keys(kk).sort()).toEqual(Object.keys(ru).sort());
  expect(Object.keys(en).sort()).toEqual(Object.keys(ru).sort());
  for (const dictionary of [ru, kk, en]) expect(Object.values(dictionary).every(v => !!v.trim())).toBe(true);
  for (const recipe of recipes) for (const localized of [recipe.name, recipe.description, ...recipe.tasks.map(t => t.name)]) for (const language of ['ru', 'kk', 'en'] as const) expect(localized[language].trim()).not.toBe('');
});
