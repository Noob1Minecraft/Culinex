import { expect, it, vi } from 'vitest';
import { handleAi } from '../../api/ai';
const request = { question: 'What can replace cream?', language: 'en', context: { recipe: 'Pasta', currentTask: 'Make sauce', selectedRecipes: ['Pasta', 'Salad'] } };
it('handles missing credentials and malformed requests without provider calls', async () => {
  const provider = vi.fn();
  expect((await handleAi('POST', request, {}, provider)).status).toBe(503);
  expect((await handleAi('GET', request, {}, provider)).status).toBe(405);
  expect((await handleAi('POST', '{', {}, provider)).status).toBe(400);
  expect((await handleAi('POST', { ...request, language: 'xx' }, {}, provider)).status).toBe(400);
  expect((await handleAi('POST', 'a'.repeat(9000), {}, provider)).status).toBe(413);
  expect(provider).not.toHaveBeenCalled();
});
it.each(['ru', 'kk', 'en'])('passes context and requested %s language only on the server', async language => {
  const provider = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: 'A practical answer.' } }] })));
  const response = await handleAi('POST', { ...request, language }, { AI_API_KEY: 'unit-test-placeholder' }, provider);
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ answer: 'A practical answer.', language });
  const payload = JSON.parse(provider.mock.calls[0][1].body);
  expect(payload.messages[0].content).toContain({ ru: 'Russian', kk: 'Kazakh', en: 'English' }[language]);
  expect(payload.messages[1].content).toContain('Pasta');
  expect(JSON.stringify(response)).not.toContain('unit-test-placeholder');
});
it('sanitizes provider failures', async () => {
  const provider = vi.fn().mockRejectedValue(new Error('private provider details'));
  expect(await handleAi('POST', request, { AI_API_KEY: 'unit-test-placeholder' }, provider)).toEqual({ status: 503, body: { error: 'ai_unavailable' } });
});
