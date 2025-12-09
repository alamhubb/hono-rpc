import { defineConfig } from 'vite';
import devServer, { defaultOptions } from '@hono/vite-dev-server';

export default defineConfig({
    plugins: [
        devServer({
            entry: 'server/server.ts', // Hono 应用入口
            // 使用默认排除规则，让 Vite 处理静态资源
            exclude: [...defaultOptions.exclude],
        }),
    ],
});
