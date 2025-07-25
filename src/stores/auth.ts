import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/modules/auth/api'
import router from '@/router'

interface UserInfo {
    username: string
    email: string
    full_name: string
}

export const useAuthStore = defineStore('auth', () => {
    // 状态
    const token = ref<string>(localStorage.getItem('token') || '')
    const userInfo = ref<UserInfo | null>(null)

    // 计算属性
    const isLoggedIn = computed(() => !!token.value)
    const username = computed(() => userInfo.value?.username || '')

    // 方法
    const login = async (username: string, password: string) => {
        try {
            const response = await authApi.login({ username, password })

            token.value = response.access_token
            userInfo.value = {
                username: response.username,
                email: response.email,
                full_name: response.full_name
            }

            // 保存到本地存储
            localStorage.setItem('token', token.value)
            localStorage.setItem('userInfo', JSON.stringify(userInfo.value))

            return true
        } catch (error) {
            console.error('Login failed:', error)
            return false
        }
    }

    const logout = () => {
        token.value = ''
        userInfo.value = null

        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')

        router.push('/login')
    }

    const loadUserInfo = () => {
        const storedUserInfo = localStorage.getItem('userInfo')
        if (storedUserInfo) {
            userInfo.value = JSON.parse(storedUserInfo)
        }
    }

    // 初始化时加载用户信息
    if (token.value) {
        loadUserInfo()
    }

    return {
        token,
        userInfo,
        isLoggedIn,
        username,
        login,
        logout,
        loadUserInfo
    }
})