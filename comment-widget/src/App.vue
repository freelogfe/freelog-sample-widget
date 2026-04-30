<script setup lang="ts">
import { ref } from 'vue'
import CommentWidget from './components/CommentWidget.vue'

const theme = ref<'light' | 'dark'>('light')
const mode = ref<'drawer' | 'vertical'>('vertical')
const isLoggedIn = ref(true) // 设置为 true 查看已登录状态，false 查看未登录状态

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

const toggleMode = () => {
  mode.value = mode.value === 'drawer' ? 'vertical' : 'drawer'
}

const toggleLogin = () => {
  isLoggedIn.value = !isLoggedIn.value
}
</script>

<template>
  <div id="app" :class="`theme-${theme}`">
    <div class="controls">
      <button @click="toggleTheme">
        切换主题: {{ theme === 'light' ? '☀️ 亮色' : '🌙 暗色' }}
      </button>
      <button @click="toggleMode">
        切换模式: {{ mode === 'drawer' ? '抽屉模式' : '垂直模式' }}
      </button>
      <button @click="toggleLogin">
        {{ isLoggedIn ? '👤 已登录' : '👤 未登录' }}
      </button>
    </div>

    <CommentWidget 
      :theme="theme" 
      :mode="mode"
      :isLoggedIn="isLoggedIn"
    />
  </div>
</template>

<style>
#app {
  min-height: 100vh;
  transition: background-color 0.3s, color 0.3s;
}

#app.theme-light {
  background-color: #f5f5f5;
  color: #222222;
}

#app.theme-dark {
  background-color: #444444;
  color: #ffffff;
}

.controls {
  position: fixed;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
  z-index: 9999;
}

.controls button {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.theme-dark .controls button {
  background: rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.controls button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
