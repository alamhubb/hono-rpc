import { defineConfig } from 'vite';
import devServer from '@hono/vite-dev-server';
import build from '@hono/vite-build/cloudflare-pages';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'hono-decorator': path.resolve(__dirname, '../hono-decorator/src'),
    },
  },
  plugins: [
    devServer({
      entry: 'server/server.ts',
    }),
    build({
      entry: 'server/server.ts',
    }),
  ],
});

