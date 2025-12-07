import './style.css'
import { signal } from 'alien-signals'
import { div, button, render } from './solid-runtime.js'

// 创建响应式状态
const count = signal(0)

// 使用 SolidJS 风格的运行时语法构建 UI
const app = div({
  children: [
    div({
      class: 'card',
      children: [
        button({
          type: 'button',
          // 响应式文本
          children: [() => `count is ${count()}`],
          // 点击事件
          onclick: () => count(count() + 1)
        })
      ]
    })
  ]
})

// 渲染到 DOM
render(app, document.querySelector('#app'))
