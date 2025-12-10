import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'

// 🎉 Class RPC：装饰器风格（Spring Boot 风格）
import { UserController, type User } from '../server/controllers/UserController.ts'

// 🎉 函数式 RPC：hono-rpc 风格
import { getFunUsers, createFunUser, type UserFun } from '../server/controllers/userControllerFun.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript + RPC</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
    
    <!-- Class RPC Demo -->
    <div class="card">
      <h2>🎨 Class RPC (装饰器风格)</h2>
      <p><code>UserController.getAll()</code> → GET /api/users</p>
      <div id="class-users-list">Loading...</div>
      <button id="class-add-user" type="button">Add User (Class RPC)</button>
      <div id="class-result"></div>
    </div>
    
    <!-- 函数式 RPC Demo -->
    <div class="card">
      <h2>🚀 函数式 RPC (hono-rpc)</h2>
      <p><code>getFunUsers()</code> → GET /api/fun/users</p>
      <div id="fun-users-list">Loading...</div>
      <button id="fun-add-user" type="button">Add User (函数式 RPC)</button>
      <div id="fun-result"></div>
    </div>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

// ========== Class RPC 示例 ==========
async function loadClassUsers() {
  try {
    const users = await UserController.getAll() as User[]
    const html = users.map(u => `<div>👤 ${u.name} (${u.email})</div>`).join('')
    document.querySelector<HTMLDivElement>('#class-users-list')!.innerHTML = html || '<div>No users</div>'
  } catch (error: any) {
    document.querySelector<HTMLDivElement>('#class-users-list')!.innerHTML = 
      `<div style="color: red">Error: ${error.message}</div>`
  }
}

document.querySelector<HTMLButtonElement>('#class-add-user')!.addEventListener('click', async () => {
  try {
    const num = Math.floor(Math.random() * 1000)
    const newUser = await UserController.create({ name: `ClassUser${num}`, email: `class${num}@test.com` }) as User
    document.querySelector<HTMLDivElement>('#class-result')!.innerHTML = 
      `<div style="color: green">✅ Created: ${newUser.name} (ID: ${newUser.id})</div>`
    await loadClassUsers()
  } catch (error: any) {
    document.querySelector<HTMLDivElement>('#class-result')!.innerHTML = 
      `<div style="color: red">❌ Error: ${error.message}</div>`
  }
})

// ========== 函数式 RPC 示例 ==========
async function loadFunUsers() {
  try {
    const users = await getFunUsers() as UserFun[]
    const html = users.map(u => `<div>🚀 ${u.name} (${u.email})</div>`).join('')
    document.querySelector<HTMLDivElement>('#fun-users-list')!.innerHTML = html || '<div>No users</div>'
  } catch (error: any) {
    document.querySelector<HTMLDivElement>('#fun-users-list')!.innerHTML = 
      `<div style="color: red">Error: ${error.message}</div>`
  }
}

document.querySelector<HTMLButtonElement>('#fun-add-user')!.addEventListener('click', async () => {
  try {
    const num = Math.floor(Math.random() * 1000)
    const newUser = await createFunUser({ name: `FunUser${num}`, email: `fun${num}@test.com` }) as UserFun
    document.querySelector<HTMLDivElement>('#fun-result')!.innerHTML = 
      `<div style="color: green">✅ Created: ${newUser.name} (ID: ${newUser.id})</div>`
    await loadFunUsers()
  } catch (error: any) {
    document.querySelector<HTMLDivElement>('#fun-result')!.innerHTML = 
      `<div style="color: red">❌ Error: ${error.message}</div>`
  }
})

// 初始加载
loadClassUsers()
loadFunUsers()

