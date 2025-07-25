// src/composables/useTheme.ts
import { ref, watchEffect } from 'vue'

// 从 localStorage 读取主题设置
const isDark = ref(localStorage.getItem('theme') !== 'light')

// 应用主题
const applyTheme = () => {
    if (isDark.value) {
        document.documentElement.classList.remove('light')
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
    }
}

// 监听主题变化
watchEffect(() => {
    applyTheme()
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
})

export const useTheme = () => {
    const toggleTheme = () => {
        isDark.value = !isDark.value
    }

    return {
        isDark,
        toggleTheme
    }
}