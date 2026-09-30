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
  expect(response.body).toEqual({ answer: 'A practical answer.' });
  const payload = JSON.parse(provider.mock.calls[0][1].body);
  expect(payload.messages[0].content).toContain({ ru: 'Russian', kk: 'Kazakh', en: 'English' }[language]);
  expect(payload.messages[1].content).toContain('Pasta');
  expect(JSON.stringify(response)).not.toContain('unit-test-placeholder');
});
it.each(['', ' ', '\n\t'])('rejects empty questions before contacting the provider', async question => {
  const provider = vi.fn();
  expect((await handleAi('POST', { ...request, question }, { AI_API_KEY: 'unit-test-placeholder' }, provider)).status).toBe(400);
  expect(provider).not.toHaveBeenCalled();
});
it.each([null, {}, [], { choices: [] }, { choices: [null] }, { choices: [{ message: { content: 42 } }] }, { choices: [{ message: { content: '  ' } }] }])('handles an invalid provider response: %j', async body => {
  const provider = vi.fn().mockResolvedValue(new Response(JSON.stringify(body)));
  expect(await handleAi('POST', request, { AI_API_KEY: 'unit-test-placeholder' }, provider)).toEqual({ status: 503, body: { error: 'ai_unavailable' } });
});
it.each([401, 429, 500, 503])('sanitizes provider HTTP %i', async status => {
  const provider = vi.fn().mockResolvedValue(new Response('private details', { status }));
  expect(await handleAi('POST', request, { AI_API_KEY: 'unit-test-placeholder' }, provider)).toEqual({ status: 503, body: { error: 'ai_unavailable' } });
});
it('handles malformed JSON, provider timeouts and network rejection', async () => {
  for (const provider of [vi.fn().mockResolvedValue(new Response('not JSON')), vi.fn().mockRejectedValue(new DOMException('timeout', 'TimeoutError')), vi.fn().mockRejectedValue(new TypeError('network failure'))]) {
    expect((await handleAi('POST', request, { AI_API_KEY: 'unit-test-placeholder' }, provider)).status).toBe(503);
  }
});
it('strips unrelated client data and treats the example model as unset', async () => {
  const provider = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: 'Answer' } }] })));
  await handleAi('POST', { ...request, extra: 'unnecessary application data', context: { ...request.context, schedule: 'do not transmit' } }, { AI_API_KEY: 'unit-test-placeholder', AI_MODEL: 'optional_model_name' }, provider);
  const options = provider.mock.calls[0][1];
  const body = JSON.parse(options.body);
  expect(body.model).toBe('gpt-4.1-mini');
  expect(body.messages[0].content).toContain('unrelated to cooking');
  expect(body.messages[0].content).toContain('Do not generate, modify, reorder');
  expect(JSON.parse(body.messages[1].content)).toEqual(request);
  expect(options.signal).toBeInstanceOf(AbortSignal);
});
it('validates a pre-parsed Vercel request and caps its size', async () => {
  const provider = vi.fn();
  for (const body of [undefined, [], { ...request, context: [] }, { ...request, context: { ...request.context, selectedRecipes: [23] } }]) {
    expect((await handleAi('POST', body, {}, provider)).status).toBe(400);
  }
  expect((await handleAi('POST', { ...request, extra: 'a'.repeat(9000) }, {}, provider)).status).toBe(413);
  expect(provider).not.toHaveBeenCalled();
});
it('sanitizes provider failures', async () => {
  const provider = vi.fn().mockRejectedValue(new Error('private provider details'));
  expect(await handleAi('POST', request, { AI_API_KEY: 'unit-test-placeholder' }, provider)).toEqual({ status: 503, body: { error: 'ai_unavailable' } });
});
