/**
 * 客户端入口 - 使用 RPC 方式调用 API
 */
import { getServerTime, greet } from './api.js'

// 显示 Toast 消息
function showToast(msg: string) {
  const toast = document.getElementById('toast')
  if (toast) {
    toast.textContent = msg
    toast.style.display = 'block'
    setTimeout(() => (toast.style.display = 'none'), 2000)
  }
}

// 绑定按钮事件
document.getElementById('getTimeBtn')?.addEventListener('click', async () => {
  try {
    const data = await getServerTime()
    showToast(`${data.message} - ${data.time}`)
  } catch (error) {
    showToast(`错误: ${error instanceof Error ? error.message : '未知错误'}`)
  }
})

document.getElementById('greetBtn')?.addEventListener('click', async () => {
  try {
    const nameInput = document.getElementById('nameInput') as HTMLInputElement
    const name = nameInput?.value || 'World'
    const data = await greet({ name })
    showToast(data.message)
  } catch (error) {
    showToast(`错误: ${error instanceof Error ? error.message : '未知错误'}`)
  }
})
