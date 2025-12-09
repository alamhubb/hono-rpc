import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
    <div class="card">
      <h2>API Response:</h2>
      <p id="api-response">Loading...</p>
    </div>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

// 从 /api/hello 获取数据并显示
fetch('/api/hello')
  .then(response => response.text())
  .then(data => {
    document.querySelector<HTMLParagraphElement>('#api-response')!.textContent = data
  })
  .catch(error => {
    document.querySelector<HTMLParagraphElement>('#api-response')!.textContent = `Error: ${error.message}`
  })
