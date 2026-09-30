import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { serveAi } from '../api/ai.js';
import type { AiEnvironment } from './ai/service.js';
import { DEFAULT_AI_MODEL, getCookingAnswer } from './ai/provider.js';

const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

/** Render adapter: serves only the built frontend and reuses the Vercel AI handler. */
export function createRenderServer(distDirectory = resolve('dist'), env: AiEnvironment = process.env) {
  const root = resolve(distDirectory);
  const send = (res: ServerResponse, status: number, message: string) => {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(message);
  };
  async function handle(req: IncomingMessage, res: ServerResponse) {
    let pathname: string;
    try { pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname); }
    catch { send(res, 400, 'Invalid request'); return; }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (pathname === '/api/ai') { await serveAi(req, res, env); return; }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD'); send(res, 405, 'Method not allowed'); return;
    }
    if (pathname === '/healthz') { send(res, 200, 'ok'); return; }
    if (pathname.startsWith('/api/') || pathname.includes('\\') ||
        pathname.split('/').some(part => part.startsWith('.'))) {
      send(res, 404, 'Not found'); return;
    }
    const candidate = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    try {
      const [file, realRoot] = await Promise.all([realpath(candidate), realpath(root)]);
      const pathWithinRoot = relative(realRoot, file);
      if (pathWithinRoot.startsWith('..') || isAbsolute(pathWithinRoot)) { send(res, 404, 'Not found'); return; }
      const info = await stat(file);
      if (!info.isFile()) { send(res, 404, 'Not found'); return; }
      res.writeHead(200, {
        'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
        'Content-Length': info.size,
        'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      });
      if (req.method === 'HEAD') { res.end(); return; }
      await pipeline(createReadStream(file), res);
    } catch {
      if (!res.headersSent) send(res, 404, 'Not found');
      else res.destroy();
    }
  }
  return createServer((req, res) => {
    void handle(req, res).catch(() => {
      if (!res.headersSent) send(res, 500, 'Internal server error');
      else res.destroy();
    });
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT || 10000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  const server = createRenderServer();
  server.listen(port, '0.0.0.0', () => console.log('Culinex HTTP server ready'));
  if (process.env.RENDER) {
    const key = process.env.AI_API_KEY?.trim();
    const model = process.env.AI_MODEL?.trim() || DEFAULT_AI_MODEL;
    console.log(JSON.stringify({ probe: 'render-ai', keyPresent: !!key, groqKeyFormat: key?.startsWith('gsk_') === true, defaultModel: model === DEFAULT_AI_MODEL }));
    if (key) void getCookingAnswer({ question: 'How can I thin tomato sauce?', language: 'en',
      context: { recipe: 'Pasta', currentTask: 'Mix sauce', selectedRecipes: ['Pasta'] } }, key, model, async (url, options) => {
      const response = await fetch(url, options);
      let category = 'none';
      if (!response.ok) {
        const payload = await response.clone().json().catch(() => null);
        const code = payload?.error?.code;
        category = ['invalid_api_key', 'model_not_found', 'rate_limit_exceeded', 'insufficient_quota', 'permission_denied'].includes(code) ? code : 'provider_error';
      }
      console.log(JSON.stringify({ probe: 'render-ai', providerStatus: response.status, category }));
      return response;
    }).then(() => console.log('Render AI probe succeeded')).catch(error => {
      console.log(JSON.stringify({ probe: 'render-ai', failed: true, networkCode: ['ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'SELF_SIGNED_CERT_IN_CHAIN'].includes(error?.cause?.code) ? error.cause.code : 'unavailable' }));
    });
  }
  const stop = () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 25_000).unref(); };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
}
