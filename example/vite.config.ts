import { defineConfig } from 'vite';
import devServer, { defaultOptions } from '@hono/vite-dev-server';
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
            entry: 'src/server/index.ts', // Hono 应用入口
            // 使用默认排除规则，并添加根路径
            exclude: [
                /^\/$/, // 让 Vite 处理根路径（重要！）
                ...defaultOptions.exclude,
                /^\/.*\.svg(\?.*)?$/, // SVG 文件（包括带查询参数的）
            ],
        }),
    ],
});
