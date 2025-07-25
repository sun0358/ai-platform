// frontend/src/router/modules/data-processing.ts

import type { RouteRecordRaw } from 'vue-router'

const dataProcessingRoutes: RouteRecordRaw[] = [
    {
        path: '/data-processing',
        component: () => import('@/modules/common/layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: '/data-processing/excel-analysis'
            },
            {
                path: 'excel-analysis',
                name: 'ExcelAnalysis',
                component: () => import('@/modules/data-processing/views/ExcelAnalysis.vue'),
                meta: { title: 'Excel数据分析' }
            },
            {
                path: 'data-clustering',
                name: 'DataClustering',
                component: () => import('@/modules/data-processing/views/DataClustering.vue'),
                meta: { title: '数据聚类' }
            },
            {
                path: 'data-cleaning',
                name: 'DataCleaning',
                component: () => import('@/modules/data-processing/views/DataCleaning.vue'),
                meta: { title: '数据清洗' }
            }
        ]
    }
]

export default dataProcessingRoutes