import { afterAll, beforeAll, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { serveAi } from '../../api/ai';
let server: Server;
let url: string;
beforeAll(async () => {
  server = createServer((req, res) => { void serveAi(req, res, {}); });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing HTTP test address');
  url = `http://127.0.0.1:${address.port}/api/ai`;
});
afterAll(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });
it('serves bounded JSON and consistent errors through the actual Node entry point', async () => {
  const get = await fetch(url);
  expect(get.status).toBe(405); expect(get.headers.get('Allow')).toBe('POST');
  const invalid = await fetch(url, { method: 'POST', body: '{' });
  expect(invalid.status).toBe(400); expect(await invalid.json()).toEqual({ error: 'invalid_request' });
  const oversized = await fetch(url, { method: 'POST', body: 'x'.repeat(9000) });
  expect(oversized.status).toBe(413); expect(await oversized.json()).toEqual({ error: 'payload_too_large' });
  const unavailable = await fetch(url, { method: 'POST', body: JSON.stringify({ question: 'Help?', language: 'en', context: { recipe: '', currentTask: '', selectedRecipes: [] } }) });
  expect(unavailable.status).toBe(503); expect(unavailable.headers.get('Cache-Control')).toBe('no-store');
  expect(await unavailable.json()).toEqual({ error: 'ai_unavailable' });
});
