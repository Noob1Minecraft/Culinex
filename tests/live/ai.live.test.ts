import { expect, it } from 'vitest';
import { loadEnv } from 'vite';
import { handleAi } from '../../api/ai';
const env = { ...loadEnv('development', process.cwd(), 'AI_'), ...process.env };
const key = env.AI_API_KEY || env.OPENAI_API_KEY;
// Explicit opt-in command only. No secrets, provider payloads, or responses logged.
it.skipIf(!key || key === 'your_api_key_here').each(['ru', 'kk', 'en'])('live cooking response in %s', async language => {
  const result = await handleAi('POST', { language, question: 'How can I thin a thick tomato sauce?',
    context: { recipe: 'Tomato pasta', currentTask: 'Mix pasta with tomato sauce', selectedRecipes: ['Pasta', 'Salad'] } }, env);
  expect(result.status, 'Provider must return success').toBe(200);
  const answer = 'answer' in result.body ? result.body.answer : '';
  expect(typeof answer === 'string' && answer.trim().length > 0, 'Response must be nonempty').toBe(true);
  expect(language === 'en' ? /[A-Za-z]/.test(answer ?? '') : /[А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(answer ?? ''), 'Expected language script').toBe(true);
}, 30_000);
