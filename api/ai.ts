import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAi, readBody, responseHeaders, type AiEnvironment } from '../server/ai/service.js';

export { handleAi } from '../server/ai/service.js';

// Leave room to return a controlled error after the 20-second provider timeout.
export const config = { maxDuration: 30 };

export async function serveAi(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
  env: AiEnvironment = process.env,
) {
  try {
    const body = req.method === 'POST' ? await readBody(req) : undefined;
    const result = await handleAi(req.method ?? 'GET', body, env);
    res.writeHead(result.status, responseHeaders(result.status));
    res.end(JSON.stringify(result.body));
  } catch (error) {
    const status = error instanceof Error && error.message === 'payload_too_large' ? 413 : 400;
    res.writeHead(status, responseHeaders(status));
    res.end(JSON.stringify({ error: status === 413 ? 'payload_too_large' : 'invalid_request' }));
  }
}

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  await serveAi(req, res);
}
