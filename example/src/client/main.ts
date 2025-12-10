import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'

// 🎉 RPC 调用：直接导入控制器，调用静态方法
// 客户端会自动将方法调用转换为 HTTP 请求
import { UserController, type User } from '../shared/controllers/index.ts'

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
    <div class="card">
      <h2>RPC Demo - Users API</h2>
      <div id="users-list">Loading users...</div>
      <button id="add-user" type="button">Add New User</button>
      <div id="new-user-result"></div>
    </div>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

// 🎉 RPC 调用示例
async function loadUsers() {
  try {
    // 直接调用 UserController.getAll()，自动转换为 GET /api/users
    const users = await UserController.getAll() as User[]
    
    const usersHtml = users.map(u => 
      `<div>👤 ${u.name} (${u.email})</div>`
    ).join('')
    
    document.querySelector<HTMLDivElement>('#users-list')!.innerHTML = 
      usersHtml || '<div>No users found</div>'
  } catch (error: any) {
    document.querySelector<HTMLDivElement>('#users-list')!.innerHTML = 
      `<div style="color: red">Error: ${error.message}</div>`
  }
}

// 添加新用户
document.querySelector<HTMLButtonElement>('#add-user')!.addEventListener('click', async () => {
  try {
    const randomNum = Math.floor(Math.random() * 1000)
    
    // 直接调用 UserController.create()，自动转换为 POST /api/users
    const newUser = await UserController.create({
      name: `User${randomNum}`,
      email: `user${randomNum}@example.com`
    }) as User
    
    document.querySelector<HTMLDivElement>('#new-user-result')!.innerHTML = 
      `<div style="color: green">✅ Created: ${newUser.name} (ID: ${newUser.id})</div>`
    
    // 刷新用户列表
    await loadUsers()
  } catch (error: any) {
    document.querySelector<HTMLDivElement>('#new-user-result')!.innerHTML = 
      `<div style="color: red">❌ Error: ${error.message}</div>`
  }
})

// 初始加载
loadUsers()

