// frontend/src/modules/ai-analysis/api/index.ts

import { request } from '@/utils/request'

export interface ImageComparisonRequest {
    task_name?: string
    model?: string
    actual_image: string
    forecast_12h: string
    forecast_24h: string
    forecast_36h: string
    forecast_48h: string
    priority?: number
}

export interface TaskResponse {
    task_id: string
    status: string
    message: string
}

export interface ModelInfo {
    name: string
    model_id: string
    description: string
    type: string
}

export const imageComparisonApi = {
    createTask(data: ImageComparisonRequest): Promise<TaskResponse> {
        return request.post('/ai-analysis/image-comparison/create', data)
    },

    getTaskStatus(taskId: string) {
        return request.get(`/ai-analysis/task/${taskId}`)
    },

    getTasks(params?: any) {
        return request.get('/ai-analysis/tasks', { params })
    },

    getModels(): Promise<ModelInfo[]> {
        return request.get('/ai-analysis/models')
    },
    getAnalysisDetails(taskId: string) {
        return request.get(`/ai-analysis/task/${taskId}/analysis-details`);
    }
}