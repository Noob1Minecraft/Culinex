import { afterAll, beforeAll, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import type { AddressInfo } from 'node:net';
import { createRenderServer } from '../../server/render';

let directory: string;
let base: string;
let server: ReturnType<typeof createRenderServer>;
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'culinex-render-'));
  const dist = join(directory, 'dist');
  await mkdir(join(dist, 'assets'), { recursive: true });
  await writeFile(join(dist, 'index.html'), '<h1>Culinex</h1>');
  await writeFile(join(dist, 'assets', 'app-test.js'), 'window.culinex = true;');
  await writeFile(join(dist, '.env.local'), 'private-test-fixture');
  await writeFile(join(directory, 'private.txt'), 'private-test-fixture');
  server = createRenderServer(dist, {});
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
});
afterAll(async () => {
  await new Promise<void>(done => server.close(() => done()));
  if (dirname(resolve(directory)) !== resolve(tmpdir())) throw new Error('Unexpected fixture path');
  await rm(directory, { recursive: true, force: true });
});

it('serves the frontend and hashed assets with correct types and caching', async () => {
  const home = await fetch(base);
  expect(home.status).toBe(200);
  expect(home.headers.get('content-type')).toContain('text/html');
  expect(home.headers.get('cache-control')).toBe('no-cache');
  expect(await home.text()).toContain('Culinex');
  const asset = await fetch(base + '/assets/app-test.js');
  expect(asset.headers.get('content-type')).toContain('text/javascript');
  expect(asset.headers.get('cache-control')).toContain('immutable');
  const head = await fetch(base, { method: 'HEAD' });
  expect(head.status).toBe(200);
  expect(await head.text()).toBe('');
});
it('does not serve secrets, paths outside dist, or unknown API routes', async () => {
  for (const path of ['/.env.local', '/..%2Fprivate.txt', '/%2e%2e%5cprivate.txt', '/api/unknown', '/missing.js']) {
    const response = await fetch(base + path);
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('private-test-fixture');
  }
  expect((await fetch(base + '/%E0%A4%A')).status).toBe(400);
});
it('provides health checks and rejects unsupported static methods', async () => {
  expect(await (await fetch(base + '/healthz')).text()).toBe('ok');
  const response = await fetch(base, { method: 'POST' });
  expect(response.status).toBe(405);
  expect(response.headers.get('allow')).toBe('GET, HEAD');
});
it('reuses the AI contract and keeps the frontend available after AI failure', async () => {
  expect((await fetch(base + '/api/ai')).status).toBe(405);
  const invalid = await fetch(base + '/api/ai', { method: 'POST', body: '{' });
  expect(invalid.status).toBe(400);
  const response = await fetch(base + '/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'How do I thin sauce?', language: 'en', context: { recipe: 'Pasta', currentTask: 'Mix sauce', selectedRecipes: ['Pasta'] } }) });
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: 'ai_unavailable' });
  expect((await fetch(base)).status).toBe(200);
});
