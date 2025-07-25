import type { RouteRecordRaw } from 'vue-router'

const aiAnalysisRoutes: RouteRecordRaw[] = [
    {
        path: '/ai-analysis',
        component: () => import('@/modules/common/layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: '/ai-analysis/image-comparison'
            },
            {
                path: 'image-comparison',
                name: 'ImageComparison',
                component: () => import('@/modules/ai-analysis/views/ImageComparison.vue'),
                meta: { title: '图像对比' }
            },
            {
                path: 'object-detection',
                name: 'ObjectDetection',
                component: () => import('@/modules/ai-analysis/views/ObjectDetection.vue'),
                meta: { title: '目标检测' }
            },
            {
                path: 'image-recognition',
                name: 'ImageRecognition',
                component: () => import('@/modules/ai-analysis/views/ImageRecognition.vue'),
                meta: { title: '图像识别' }
            }
        ]
    }
]

export default aiAnalysisRoutes