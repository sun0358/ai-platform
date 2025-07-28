/**
 * 前端YOLO训练API调用
 * 文件路径: frontend/src/modules/ml-training/api/index.ts
 */

import { request } from '@/utils/request'

// YOLO训练配置接口
interface YOLOTrainingConfig {
    model_type: string
    dataset_name: string
    epochs: number
    batch_size: number
    img_size: number
    device: string
    project_name: string
    task_name: string
}

// 数据集信息接口
interface DatasetInfo {
    dataset_id: string
    name: string
    classes: string[]
    num_classes: number
    total_images: number
    status: string
    created_at?: string
}

// 训练任务信息接口
interface TrainingTaskInfo {
    task_id: string
    task_name: string
    status: string
    created_at?: string
    completed_at?: string
}

// 训练状态接口
interface TrainingStatusResponse {
    task_id: string
    remote_task_id: string
    status: string
    progress: number
    current_epoch: number
    total_epochs: number
    message: string
    created_at: string
    updated_at: string
}

// 模型信息接口
interface ModelInfo {
    model_id: string
    name: string
    type: string
    created_at?: string
}

// 预测结果接口
interface PredictionResult {
    success: boolean
    predictions: Array<{
        class_id?: number
        confidence: number
        bbox: number[]
    }>
    total_objects: number
    model_id: string
}

// 统计信息接口
interface StatisticsResponse {
    success: boolean
    datasets: { total: number }
    training_tasks: {
        total: number
        completed: number
        success_rate: number
    }
    models: { total: number }
    predictions: { total: number }
}

// YOLO训练API类
class YOLOTrainingAPI {
    private baseURL = '/ml-training'

    /**
     * 检查Ubuntu YOLO服务健康状态
     */
    async checkHealth(): Promise<any> {
        return request.get(`${this.baseURL}/yolo/health`)
    }

    /**
     * 上传训练数据集
     */
    async uploadDataset(
        dataset_name: string,
        classes: string[],
        files: File[]
    ): Promise<any> {
        const formData = new FormData()
        formData.append('dataset_name', dataset_name)
        formData.append('classes', JSON.stringify(classes))

        files.forEach((file) => {
            formData.append('files', file)
        })

        return request.post(`${this.baseURL}/yolo/upload-dataset`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }

    /**
     * 开始训练任务
     */
    async startTraining(config: YOLOTrainingConfig): Promise<any> {
        return request.post(`${this.baseURL}/yolo/start-training`, config)
    }

    /**
     * 获取训练任务状态
     */
    async getTrainingStatus(taskId: string): Promise<TrainingStatusResponse> {
        return request.get(`${this.baseURL}/yolo/training-status/${taskId}`)
    }

    /**
     * 获取数据集列表
     */
    async getDatasets(): Promise<{ success: boolean, datasets: DatasetInfo[], total: number }> {
        return request.get(`${this.baseURL}/datasets`)
    }

    /**
     * 获取训练任务列表
     */
    async getTrainingTasks(): Promise<{ success: boolean, tasks: TrainingTaskInfo[], total: number }> {
        return request.get(`${this.baseURL}/training-tasks`)
    }

    /**
     * 获取本地模型列表
     */
    async getModels(): Promise<{ success: boolean, models: ModelInfo[], total: number }> {
        return request.get(`${this.baseURL}/models`)
    }

    /**
     * 获取Ubuntu服务器训练任务
     */
    async getYoloTrainingTasks(): Promise<{ success: boolean, tasks: TrainingTaskInfo[], total: number }> {
        return request.get(`${this.baseURL}/yolo/training-tasks`)
    }

    /**
     * 获取Ubuntu服务器模型列表
     */
    async getYoloModels(): Promise<{ success: boolean, models: ModelInfo[], total: number }> {
        return request.get(`${this.baseURL}/yolo/models`)
    }

    /**
     * 使用模型进行预测
     */
    async predict(modelId: string, imageFile: File): Promise<PredictionResult> {
        const formData = new FormData()
        formData.append('model_id', modelId)
        formData.append('file', imageFile)

        return request.post(`${this.baseURL}/yolo/predict`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }

    /**
     * 获取统计信息
     */
    async getStatistics(): Promise<StatisticsResponse> {
        return request.get(`${this.baseURL}/statistics`)
    }

    /**
     * 获取GPU状态
     */
    async getGpuStatus(): Promise<any> {
        return request.get(`${this.baseURL}/system/gpu-status`)
    }
}

// 导出API实例
export const yoloTrainingApi = new YOLOTrainingAPI()

// 导出类型定义
export type {
    YOLOTrainingConfig,
    DatasetInfo,
    TrainingTaskInfo,
    TrainingStatusResponse,
    ModelInfo,
    PredictionResult,
    StatisticsResponse
}

// 工具函数
export const YOLOUtils = {
    /**
     * 格式化文件大小
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    /**
     * 格式化训练时间
     */
    formatTrainingTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}小时${minutes}分钟${secs}秒`
        } else if (minutes > 0) {
            return `${minutes}分钟${secs}秒`
        } else {
            return `${secs}秒`
        }
    },

    /**
     * 获取模型类型描述
     */
    getModelTypeDescription(modelType: string): string {
        const descriptions = {
            'yolov8n': 'YOLOv8 Nano - 最快，最小',
            'yolov8s': 'YOLOv8 Small - 速度与精度平衡',
            'yolov8m': 'YOLOv8 Medium - 中等大小',
            'yolov8l': 'YOLOv8 Large - 较大，更精确',
            'yolov8x': 'YOLOv8 XLarge - 最大，最精确'
        }
        return descriptions[modelType] || modelType
    },

    /**
     * 获取训练状态颜色
     */
    getStatusColor(status: string): string {
        const colors = {
            'pending': '#909399',
            'running': '#E6A23C',
            'completed': '#67C23A',
            'failed': '#F56C6C',
            'cancelled': '#909399'
        }
        return colors[status] || '#909399'
    },

    /**
     * 获取训练状态标签类型
     */
    getStatusType(status: string): string {
        const types = {
            'pending': 'info',
            'running': 'warning',
            'completed': 'success',
            'failed': 'danger',
            'cancelled': 'info'
        }
        return types[status] || 'info'
    },

    /**
     * 获取训练状态文本
     */
    getStatusText(status: string): string {
        const texts = {
            'pending': '等待中',
            'running': '训练中',
            'completed': '已完成',
            'failed': '失败',
            'cancelled': '已取消'
        }
        return texts[status] || status
    },

    /**
     * 验证数据集名称格式
     */
    validateDatasetName(name: string): boolean {
        const regex = /^[a-zA-Z0-9_-]+$/
        return regex.test(name) && name.length >= 3 && name.length <= 50
    },

    /**
     * 验证类别名称
     */
    validateClassName(className: string): boolean {
        const regex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/
        return regex.test(className) && className.length >= 1 && className.length <= 20
    },

    /**
     * 获取推荐的训练参数
     */
    getRecommendedParams(datasetSize: number, targetDevice: 'gpu' | 'jetson' | 'cpu') {
        let batchSize = 16
        let epochs = 100
        let imgSize = 640
        let modelType = 'yolov8n'

        // 根据数据集大小调整
        if (datasetSize < 100) {
            epochs = 50
            batchSize = 8
        } else if (datasetSize > 1000) {
            epochs = 150
            batchSize = 32
        }

        // 根据目标设备调整
        if (targetDevice === 'jetson') {
            modelType = 'yolov8n'
            batchSize = Math.min(batchSize, 8)
            imgSize = 416
        } else if (targetDevice === 'cpu') {
            modelType = 'yolov8n'
            batchSize = Math.min(batchSize, 4)
            imgSize = 320
        }

        return {
            model_type: modelType,
            epochs,
            batch_size: batchSize,
            img_size: imgSize
        }
    }
}