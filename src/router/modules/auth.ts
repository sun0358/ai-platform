// frontend/src/router/modules/auth.ts

import type { RouteRecordRaw } from 'vue-router'

const authRoutes: RouteRecordRaw[] = [
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/modules/auth/views/Register.vue'),
        meta: { requiresAuth: false, title: '注册' }
    }
]

export default authRoutes