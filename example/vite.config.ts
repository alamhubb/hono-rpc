import { defineConfig } from 'vite';
import devServer, { defaultOptions } from '@hono/vite-dev-server';

export default defineConfig({
    esbuild: {
        target: 'es2024',
    },
    plugins: [
        devServer({
            entry: 'server/server.ts', // Hono 应用入口
            // 使用默认排除规则，并添加根路径
            exclude: [
                /^\/$/, // 让 Vite 处理根路径（重要！）
                ...defaultOptions.exclude,
                /^\/.*\.svg(\?.*)?$/, // SVG 文件（包括带查询参数的）
            ],
        }),
    ],
});
