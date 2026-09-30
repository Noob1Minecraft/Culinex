import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleAi } from './api/ai';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'AI_');
  return { plugins: [react(), tailwindcss(), {
    name: 'culinex-ai',
    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of req) {
          size += Buffer.byteLength(chunk);
          if (size > 8192) { res.writeHead(413); res.end(); return; }
          chunks.push(Buffer.from(chunk));
        }
        const result = await handleAi(req.method ?? 'GET', Buffer.concat(chunks).toString(), { ...env, ...process.env });
        res.writeHead(result.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(result.body));
      });
    },
  }] };
});
