import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { api } from './api.js'

const app = new Hono()

// 挂载 RPC API
app.route('/', api)

// 首页 - 带 RPC 调用按钮
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hono RPC Demo</title>
</head>
<body>
  <h1>🚀 Hono RPC</h1>
  <p>一次定义，服务端/客户端双用</p>
  
  <button onclick="callGetTime()">获取服务器时间</button>
  <br><br>
  <input type="text" id="nameInput" placeholder="输入你的名字" value="World">
  <button onclick="callGreet()">调用问候接口</button>

  <div id="toast" style="display:none; position:fixed; top:20px; right:20px; background:#333; color:#fff; padding:12px 20px; border-radius:6px;"></div>

  <script>
    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.style.display = 'block';
      setTimeout(() => toast.style.display = 'none', 3000);
    }

    async function callGetTime() {
      const res = await fetch('/api/time');
      const data = await res.json();
      showToast(data.message + ' - ' + data.time);
    }

    async function callGreet() {
      const name = document.getElementById('nameInput').value || 'World';
      const res = await fetch('/api/greet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      showToast(data.message);
    }
  </script>
</body>
</html>
  `)
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
