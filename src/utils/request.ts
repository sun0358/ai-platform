import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// 创建axios实例
const service: AxiosInstance = axios.create({
    baseURL: '/api/v1',
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器
service.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore()

        // 添加认证令牌
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`
        }

        return config
    },
    (error) => {
        console.error('Request error:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
    (response: AxiosResponse) => {
        const res = response.data

        // 如果是文件下载，直接返回
        if (response.config.responseType === 'blob') {
            return response
        }

        return res
    },
    (error) => {
        console.error('Response error:', error)

        const { response } = error

        if (response) {
            switch (response.status) {
                case 401:
                    // 未授权，清除token并跳转到登录页
                    const authStore = useAuthStore()
                    authStore.logout()
                    router.push('/login')
                    ElMessage.error('登录已过期，请重新登录')
                    break

                case 403:
                    ElMessage.error('没有权限访问')
                    break

                case 404:
                    ElMessage.error('请求的资源不存在')
                    break

                case 500:
                    ElMessage.error('服务器错误')
                    break

                default:
                    ElMessage.error(response.data?.detail || '请求失败')
            }
        } else {
            ElMessage.error('网络错误，请检查网络连接')
        }

        return Promise.reject(error)
    }
)

export default service
export { service as request }