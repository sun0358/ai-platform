// frontend/src/router/modules/dashboard.ts

import type { RouteRecordRaw } from 'vue-router'

const dashboardRoutes: RouteRecordRaw[] = [
    {
        path: '/dashboard',
        // 使用 MainLayout 作为该路由的布局组件
        component: () => import('@/modules/common/layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                // 当路径为 /dashboard 时，渲染 Dashboard.vue
                path: '',
                name: 'Dashboard',
                component: () => import('@/modules/common/views/Dashboard.vue'),
                meta: { title: '控制台' }
            }
        ]
    }
]

export default dashboardRoutes