<template>
  <div class="object-detection-page ai-gradient-bg">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Aim /></el-icon>
          智能目标检测
        </h1>
        <p class="page-subtitle">基于深度学习的实时目标识别与定位</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="List" @click="showHistory = !showHistory">
          {{ showHistory ? '返回检测' : '历史记录' }}
        </el-button>
      </div>
    </div>

    <!-- 主要检测区域 -->
    <div v-show="!showHistory" class="detection-area">
      <AICard variant="glass" class="upload-section">
        <template #header>
          <div class="section-header">
            <h3>上传图像进行检测</h3>
            <el-select v-model="selectedModel" placeholder="选择检测模型" size="large">
              <el-option
                  v-for="model in detectionModels"
                  :key="model.id"
                  :label="model.name"
                  :value="model.id"
              >
                <div class="model-option">
                  <span class="model-name">{{ model.name }}</span>
                  <span class="model-desc">{{ model.description }}</span>
                </div>
              </el-option>
            </el-select>
          </div>
        </template>

        <div class="upload-container">
          <div class="image-upload-area"
               :class="{ 'has-image': uploadedImage }"
               @click="selectImage"
               @dragover.prevent
               @drop.prevent="handleDrop">
            <div v-if="!uploadedImage" class="upload-placeholder">
              <el-icon :size="60"><Upload /></el-icon>
              <p>拖拽图片到此处或点击上传</p>
              <p class="upload-hint">支持 JPG、PNG 格式，最大 10MB</p>
            </div>
            <div v-else class="image-preview">
              <img :src="uploadedImage" alt="待检测图像" />
              <canvas ref="detectionCanvas" class="detection-overlay"></canvas>
              <el-button
                  class="remove-btn"
                  type="danger"
                  :icon="Delete"
                  circle
                  @click.stop="removeImage"
              />
            </div>
          </div>

          <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleFileSelect"
          />
        </div>

        <div class="detection-controls">
          <div class="control-item">
            <label>置信度阈值</label>
            <el-slider
                v-model="confidenceThreshold"
                :min="0"
                :max="100"
                :step="5"
                :format-tooltip="(val) => `${val}%`"
            />
          </div>
          <div class="control-item">
            <label>检测类别</label>
            <el-select v-model="selectedCategories" multiple placeholder="全部类别">
              <el-option
                  v-for="category in categories"
                  :key="category"
                  :label="category"
                  :value="category"
              />
            </el-select>
          </div>
        </div>

        <template #footer>
          <el-button
              type="primary"
              size="large"
              :loading="detecting"
              :disabled="!uploadedImage || !selectedModel"
              @click="startDetection"
          >
            <el-icon><MagicStick /></el-icon>
            开始检测
          </el-button>
        </template>
      </AICard>

      <!-- 检测结果 -->
      <transition name="fade-slide">
        <AICard v-if="detectionResults" variant="gradient" class="results-section">
          <template #header>
            <h3>检测结果</h3>
            <el-tag type="success">检测完成</el-tag>
          </template>

          <div class="results-overview">
            <MetricCard
                label="检测到的目标"
                :value="detectionResults.objects.length"
                icon="Aim"
                type="primary"
            />
            <MetricCard
                label="平均置信度"
                :value="averageConfidence"
                icon="DataAnalysis"
                type="success"
                suffix="%"
                :decimals="1"
            />
            <MetricCard
                label="处理时间"
                :value="detectionResults.processingTime"
                icon="Timer"
                type="info"
                suffix="ms"
            />
            <MetricCard
                label="类别数量"
                :value="uniqueCategories"
                icon="Grid"
                type="warning"
            />
          </div>

          <div class="detection-details">
            <h4>检测到的目标列表</h4>
            <el-table :data="detectionResults.objects" style="width: 100%">
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column prop="category" label="类别">
                <template #default="{ row }">
                  <el-tag :type="getCategoryType(row.category)">
                    {{ row.category }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="confidence" label="置信度">
                <template #default="{ row }">
                  <el-progress
                      :percentage="row.confidence"
                      :color="getConfidenceColor(row.confidence)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="位置">
                <template #default="{ row }">
                  <span class="location-info">
                    {{ `(${row.bbox.x}, ${row.bbox.y}) - ${row.bbox.width}×${row.bbox.height}` }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button size="small" @click="highlightObject(row)">
                    定位
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <template #footer>
            <el-button type="primary" @click="exportResults">
              <el-icon><Download /></el-icon>
              导出结果
            </el-button>
            <el-button @click="saveToHistory">
              <el-icon><FolderAdd /></el-icon>
              保存到历史
            </el-button>
          </template>
        </AICard>
      </transition>
    </div>

    <!-- 历史记录 -->
    <div v-show="showHistory" class="history-section">
      <AICard variant="glass">
        <template #header>
          <h3>检测历史记录</h3>
        </template>

        <div class="history-grid">
          <div
              v-for="item in historyItems"
              :key="item.id"
              class="history-item"
              @click="loadHistoryItem(item)"
          >
            <div class="history-thumbnail">
              <img :src="item.thumbnail" :alt="item.name" />
              <div class="object-count">
                <el-icon><Aim /></el-icon>
                <span>{{ item.objectCount }}</span>
              </div>
            </div>
            <div class="history-info">
              <h4>{{ item.name }}</h4>
              <p>{{ item.model }}</p>
              <span class="history-time">{{ formatTime(item.createdAt) }}</span>
            </div>
          </div>
        </div>

        <el-empty v-if="historyItems.length === 0" description="暂无历史记录" />
      </AICard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Aim, List, Upload, Delete, MagicStick, Download,
  FolderAdd, Timer, DataAnalysis, Grid
} from '@element-plus/icons-vue'
import AICard from '@/modules/common/components/AICard.vue'
import MetricCard from '@/modules/common/components/MetricCard.vue'

// 响应式数据
const showHistory = ref(false)
const uploadedImage = ref('')
const fileInput = ref<HTMLInputElement>()
const detectionCanvas = ref<HTMLCanvasElement>()
const detecting = ref(false)
const selectedModel = ref('yolov5')
const confidenceThreshold = ref(50)
const selectedCategories = ref<string[]>([])
const detectionResults = ref<any>(null)

// 模拟数据
const detectionModels = [
  { id: 'yolov5', name: 'YOLOv5', description: '快速准确的实时检测' },
  { id: 'yolov8', name: 'YOLOv8', description: '最新版本，性能更优' },
  { id: 'rcnn', name: 'Faster R-CNN', description: '高精度检测' },
  { id: 'ssd', name: 'SSD MobileNet', description: '轻量级移动端模型' }
]

const categories = [
  'person', 'car', 'bicycle', 'motorcycle', 'bus', 'truck',
  'cat', 'dog', 'horse', 'bird', 'bottle', 'chair'
]

const historyItems = ref([
  {
    id: 1,
    name: '街道场景检测',
    thumbnail: '/placeholder.jpg',
    model: 'YOLOv5',
    objectCount: 15,
    createdAt: new Date()
  }
])

// 计算属性
const averageConfidence = computed(() => {
  if (!detectionResults.value?.objects?.length) return 0
  const sum = detectionResults.value.objects.reduce((acc: number, obj: any) => acc + obj.confidence, 0)
  return sum / detectionResults.value.objects.length
})

const uniqueCategories = computed(() => {
  if (!detectionResults.value?.objects) return 0
  return new Set(detectionResults.value.objects.map((obj: any) => obj.category)).size
})

// 方法
const selectImage = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

const processFile = (file: File) => {
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过10MB')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target?.result as string
    detectionResults.value = null
  }
  reader.readAsDataURL(file)
}

const removeImage = () => {
  uploadedImage.value = ''
  detectionResults.value = null
}

const startDetection = async () => {
  detecting.value = true

  // 模拟检测过程
  setTimeout(() => {
    detectionResults.value = {
      objects: [
        { id: 1, category: 'person', confidence: 95, bbox: { x: 100, y: 100, width: 80, height: 160 } },
        { id: 2, category: 'car', confidence: 87, bbox: { x: 300, y: 200, width: 120, height: 80 } },
        { id: 3, category: 'bicycle', confidence: 72, bbox: { x: 450, y: 150, width: 60, height: 40 } }
      ],
      processingTime: 156
    }
    drawDetections()
    detecting.value = false
    ElMessage.success('检测完成！')
  }, 2000)
}

const drawDetections = () => {
  // 绘制检测框的逻辑
}

const highlightObject = (object: any) => {
  ElMessage.info(`定位到目标: ${object.category} (ID: ${object.id})`)
}

const getCategoryType = (category: string) => {
  const types: Record<string, string> = {
    person: 'primary',
    car: 'success',
    bicycle: 'warning',
    default: 'info'
  }
  return types[category] || types.default
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return '#10b981'
  if (confidence >= 60) return '#f59e0b'
  return '#ef4444'
}

const exportResults = () => {
  ElMessage.success('检测结果已导出')
}

const saveToHistory = () => {
  ElMessage.success('已保存到历史记录')
}

const loadHistoryItem = (item: any) => {
  ElMessage.info(`加载历史记录: ${item.name}`)
  showHistory.value = false
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style lang="scss" scoped>
@use '@/styles/ai-theme.scss';

.object-detection-page {
  min-height: 100vh;
  padding: 20px;
  background-color: var(--ai-bg-primary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid var(--ai-border);

  .header-content {
    .page-title {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: var(--ai-text-primary);
      display: flex;
      align-items: center;
      gap: 12px;

      .el-icon {
        color: var(--ai-primary);
      }
    }

    .page-subtitle {
      margin: 8px 0 0 0;
      font-size: 16px;
      color: var(--ai-text-secondary);
    }
  }
}

.detection-area {
  max-width: 1400px;
  margin: 0 auto;

  .upload-section {
    margin-bottom: 32px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;

      h3 {
        margin: 0;
        color: var(--ai-text-primary);
      }

      .el-select {
        width: 300px;
      }
    }

    .model-option {
      display: flex;
      flex-direction: column;

      .model-name {
        font-weight: 500;
        color: var(--ai-text-primary);
      }

      .model-desc {
        font-size: 12px;
        color: var(--ai-text-muted);
      }
    }
  }

  .upload-container {
    margin: 24px 0;

    .image-upload-area {
      position: relative;
      min-height: 400px;
      background: var(--ai-card-bg);
      border: 2px dashed var(--ai-border);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      overflow: hidden;

      &:hover {
        border-color: var(--ai-primary);
        background: var(--ai-card-bg-hover);
      }

      &.has-image {
        border-style: solid;
        cursor: default;
      }

      .upload-placeholder {
        height: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--ai-text-secondary);

        .el-icon {
          color: var(--ai-primary);
          margin-bottom: 16px;
        }

        p {
          margin: 8px 0;
        }

        .upload-hint {
          font-size: 14px;
          color: var(--ai-text-muted);
        }
      }

      .image-preview {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;

        img {
          max-width: 100%;
          max-height: 600px;
          object-fit: contain;
        }

        .detection-overlay {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
        }

        .remove-btn {
          position: absolute;
          top: 16px;
          right: 16px;
        }
      }
    }
  }

  .detection-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin: 24px 0;

    .control-item {
      label {
        display: block;
        margin-bottom: 8px;
        color: var(--ai-text-secondary);
      }

      .el-slider {
        padding: 0 12px;
      }

      .el-select {
        width: 100%;
      }
    }
  }

  .results-section {
    animation: slideInUp 0.6s ease-out;

    .results-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .detection-details {
      h4 {
        margin: 0 0 16px 0;
        color: var(--ai-text-primary);
      }

      .location-info {
        font-family: monospace;
        font-size: 13px;
        color: var(--ai-text-muted);
      }
    }
  }
}

.history-section {
  max-width: 1400px;
  margin: 0 auto;

  .history-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;

    .history-item {
      background: var(--ai-card-bg);
      border: 1px solid var(--ai-border);
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        border-color: var(--ai-primary);
        box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
      }

      .history-thumbnail {
        position: relative;
        width: 100%;
        height: 150px;
        background: var(--ai-bg-tertiary);
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 12px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .object-count {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        }
      }

      .history-info {
        h4 {
          margin: 0 0 4px 0;
          color: var(--ai-text-primary);
        }

        p {
          margin: 0 0 8px 0;
          color: var(--ai-text-secondary);
          font-size: 14px;
        }

        .history-time {
          font-size: 12px;
          color: var(--ai-text-muted);
        }
      }
    }
  }
}

// 动画
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

// 主题适配
:deep(.el-select-dropdown),
:deep(.el-table) {
  background: var(--ai-bg-secondary);
  color: var(--ai-text-primary);
}

:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(255, 255, 255, 0.05);

  th {
    color: var(--ai-text-primary);
  }

  td {
    border-color: var(--ai-border);
  }
}
</style>