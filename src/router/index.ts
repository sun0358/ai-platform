// frontend/src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 1. 导入你所有的路由模块
import authRoutes from './modules/auth'
import aiAnalysisRoutes from './modules/ai-analysis'
import dataProcessingRoutes from './modules/data-processing'
import dashboardRoutes from './modules/dashboard' // <--- 确保导入了 dashboard 路由
import mlTraining    from "@/router/modules/ml-training.ts";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        // 2. 添加根路径重定向和缺失的登录路由
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('@/modules/auth/views/Login.vue'), // <--- 补全 /login 路由
            meta: { requiresAuth: false, title: '登录' }
        },

        // 3. 将所有导入的路由模块展开，合并到主路由列表中
        ...authRoutes,
        ...aiAnalysisRoutes,
        ...dataProcessingRoutes,
        ...dashboardRoutes,
        ...mlTraining
    ]
})

// (可选) 添加路由守卫，如果未登录，访问需要权限的页面则跳转到登录页
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isLoggedIn

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login')
    } else {
        next()
    }
})


export default router