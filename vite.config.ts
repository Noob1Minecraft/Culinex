import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { serveAi } from './api/ai';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'AI_');
  return { plugins: [react(), tailwindcss(), {
    name: 'culinex-ai',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/api/ai') { next(); return; }
        void serveAi(req, res, { ...env, ...process.env });
      });
    },
  }] };
});
