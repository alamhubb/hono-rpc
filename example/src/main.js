import './style.css'
import { initResumable, setupScrollListener } from './solid-runtime.js'

// Resumable SSR: 不重新创建 DOM，只初始化事件系统
initResumable();

// 设置滚动监听（加载更多）
setupScrollListener();
