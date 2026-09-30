import type { IncomingMessage } from 'node:http';
import { DEFAULT_AI_MODEL, getCookingAnswer } from './provider.js';

export interface AiInput {
  question: string;
  language: 'ru' | 'kk' | 'en';
  context: { recipe: string; currentTask: string; selectedRecipes: string[] };
}
export interface AiEnvironment { AI_API_KEY?: string; OPENAI_API_KEY?: string; AI_MODEL?: string }
const MAX_BODY_BYTES = 8192;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const boundedText = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max;

function parseInput(value: unknown): AiInput | null {
  if (!record(value) || !boundedText(value.question, 1000) || !value.question.trim()) return null;
  if (value.language !== 'ru' && value.language !== 'kk' && value.language !== 'en') return null;
  const context = value.context;
  if (!record(context) || !boundedText(context.recipe, 200) || !boundedText(context.currentTask, 400) ||
      !Array.isArray(context.selectedRecipes) || context.selectedRecipes.length > 3 ||
      !context.selectedRecipes.every(item => boundedText(item, 200))) return null;
  // Only these fields leave the server. Ignore unrelated client properties.
  return { question: value.question.trim(), language: value.language, context: {
    recipe: context.recipe, currentTask: context.currentTask, selectedRecipes: context.selectedRecipes,
  } };
}

export async function readBody(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (req.body !== undefined) return req.body;
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += Buffer.byteLength(chunk);
    if (size > MAX_BODY_BYTES) throw new Error('payload_too_large');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function responseHeaders(status: number) {
  return { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', ...(status === 405 ? { Allow: 'POST' } : {}) };
}

export async function handleAi(method: string, body: unknown, env: AiEnvironment = process.env, providerFetch: typeof fetch = fetch) {
  const error = (status: number, code: string) => ({ status, body: { error: code } });
  if (method !== 'POST') return error(405, 'method_not_allowed');
  let input: AiInput | null;
  try {
    const serialized = typeof body === 'string' ? body : JSON.stringify(body);
    if (typeof serialized !== 'string') return error(400, 'invalid_request');
    if (Buffer.byteLength(serialized) > MAX_BODY_BYTES) return error(413, 'payload_too_large');
    input = parseInput(JSON.parse(serialized));
  } catch { return error(400, 'invalid_request'); }
  if (!input) return error(400, 'invalid_request');
  const key = (env.AI_API_KEY || env.OPENAI_API_KEY)?.trim();
  if (!key || key === 'your_api_key_here') return error(503, 'ai_unavailable');
  const configuredModel = env.AI_MODEL?.trim();
  const model = configuredModel && configuredModel !== 'optional_model_name' ? configuredModel : DEFAULT_AI_MODEL;
  try {
    const answer = await getCookingAnswer(input, key, model, providerFetch);
    return { status: 200, body: { answer } };
  } catch { return error(503, 'ai_unavailable'); }
}
