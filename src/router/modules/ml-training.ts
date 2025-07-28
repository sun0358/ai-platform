// frontend/src/router/modules/ml-training.ts

import type { RouteRecordRaw } from 'vue-router'

const mlTrainingRoutes: RouteRecordRaw[] = [
    {
        path: '/ml-training',
        component: () => import('@/modules/common/layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: '/ml-training/create'
            },
            {
                path: 'yolo',
                name: 'YOLOTraining',
                component: () => import('@/modules/ml-training/views/YOLOTraining.vue'),
                meta: {
                    title: 'YOLO训练',
                    icon: 'view'
                }
            },
            {
                path: 'create',
                name: 'MLTrainingCreate',
                component: () => import('@/modules/ml-training/views/CreateTraining.vue'),
                meta: { title: '创建训练任务' }
            },
            {
                path: 'tasks',
                name: 'MLTrainingTasks',
                component: () => import('@/modules/ml-training/views/TrainingTasks.vue'),
                meta: { title: '训练任务管理' }
            },
            {
                path: 'models',
                name: 'MLModels',
                component: () => import('@/modules/ml-training/views/ModelRepository.vue'),
                meta: { title: '模型仓库' }
            }
        ]
    }
]

export default mlTrainingRoutes