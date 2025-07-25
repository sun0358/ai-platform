import axios from 'axios'

const request = axios.create({
    baseURL: '/api/v1',
    timeout: 60000 // 图像处理可能需要较长时间
})

// 请求拦截器
request.interceptors.request.use(
    config => {
        // 可以在这里添加token等
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    response => {
        return response.data
    },
    error => {
        console.error('请求错误:', error)
        return Promise.reject(error)
    }
)

export interface ImageUploadData {
    actual_image: string
    forecast_12h: string
    forecast_24h: string
    forecast_36h: string
    forecast_48h: string
}

export interface SimilarityScore {
    forecast_type: string
    ssim_score: number
    histogram_score: number
    feature_score: number
    total_score: number
}

export interface ComparisonResult {
    task_id: string
    best_forecast: string
    scores: SimilarityScore[]
    analysis_time: number
}

export interface ComparisonResponse {
    code: number
    message: string
    data: ComparisonResult
}

// API方法
export const rainApi = {
    // 对比雨图
    compareImages(data: ImageUploadData, model: string = 'rain_specific'): Promise<ComparisonResponse> {
        return request.post('/rain/compare', data, {
            params: { model }
        })
    },
    // 获取可用模型
    getModels() {
        return request.get('/rain/models')
    },
    // 通过文件上传对比
    compareFiles(formData: FormData): Promise<ComparisonResponse> {
        return request.post('/rain/compare-files', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    // 获取历史记录
    getHistory(limit: number = 10) {
        return request.get('/rain/history', { params: { limit } })
    },

    // 获取详情
    getDetail(taskId: string) {
        return request.get(`/rain/detail/${taskId}`)
    }
}