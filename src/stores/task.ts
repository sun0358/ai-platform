// frontend/src/stores/task.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { request } from '@/utils/request'

export const useTaskStore = defineStore('task', () => {
    const tasks = ref<any[]>([])
    const loading = ref(false)

    const fetchTasks = async (params: any) => {
        loading.value = true
        try {
            const response = await request.get('/ai-analysis/tasks', { params })
            tasks.value = response.data || []
            return {
                data: response.data || [],
                total: response.total || 0
            }
        } finally {
            loading.value = false
        }
    }

    const cancelTask = async (taskId: string) => {
        await request.post(`/ai-analysis/task/${taskId}/cancel`)
    }

    const retryTask = async (taskId: string) => {
        await request.post(`/ai-analysis/task/${taskId}/retry`)
    }

    return {
        tasks,
        loading,
        fetchTasks,
        cancelTask,
        retryTask
    }
})