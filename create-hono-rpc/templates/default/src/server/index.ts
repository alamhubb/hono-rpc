import { serve } from '@hono/node-server';
import { rpc } from '../api/index.js';

const port = 3000;

serve({
  fetch: rpc.hono.fetch,
  port,
});

console.log(`🚀 Server running at http://localhost:${port}`);
