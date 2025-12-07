import './style.css'
import { div, button, render } from './solid-runtime.js'
import { createApp } from './app.js'

// 创建应用（传入客户端版本的组件）
const app = createApp({ div, button })

// 渲染到 DOM（客户端模式）
render(app, document.querySelector('#app'))
