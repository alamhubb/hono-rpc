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
  esbuild: {
    target: 'es2022',
  },
  plugins: [
    devServer({
      entry: 'server/server.ts',
      exclude: [
        /^\/$/, // 让 Vite 处理根路径
        /^\/src\/.+/,
        /^\/node_modules\/.+/,
        /^\/public\/.+/,
        /^\/.*\.svg(\?.*)?$/,  // SVG 文件（包括带查询参数的）
        /^\/favicon\.ico$/,
        /^\/.*\.ts(\?.*)?$/,
        /^\/.*\.tsx(\?.*)?$/,
        /^\/.*\.css(\?.*)?$/,
        /^\/.*\.html(\?.*)?$/,
        /^\/@.+/, // Vite 内部路径
      ],
    }),
    build({
      entry: 'server/server.ts',
    }),
  ],
});

