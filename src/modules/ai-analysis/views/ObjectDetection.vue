<template>
  <div class="object-detection-page">
    <PageHeader
      title="智能目标检测"
      subtitle="基于深度学习的实时目标识别与定位"
      icon="Aim"
    >
      <template #actions>
        <el-button type="primary" :icon="List" @click="showHistory = !showHistory">
          {{ showHistory ? '返回检测' : '历史记录' }}
        </el-button>
      </template>
    </PageHeader>

    <!-- 主要检测区域 -->
    <div v-show="!showHistory" class="detection-area">
      <AICard class="upload-section">
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
          <FileUpload
            v-model="uploadedImage"
            accept="image/*"
            :show-file-list="false"
            @change="handleImageUpload"
          >
            <template #trigger>
              <div class="upload-placeholder" v-if="!uploadedImage">
                <el-icon :size="60"><Upload /></el-icon>
                <p>拖拽图片到此处或点击上传</p>
                <p class="upload-hint">支持 JPG、PNG 格式，最大 10MB</p>
              </div>
            </template>
          </FileUpload>

          <div v-if="uploadedImage" class="image-preview">
            <canvas ref="detectionCanvas" class="detection-canvas"></canvas>
            <div class="image-controls">
              <ActionBar
                :actions="imageControls"
                @action="handleImageAction"
              />
            </div>
          </div>
        </div>

        <template #footer>
          <div class="detection-controls">
            <el-button
              type="primary"
              size="large"
              :loading="detecting"
              :disabled="!uploadedImage"
              @click="startDetection"
            >
              <el-icon><MagicStick /></el-icon>
              开始检测
            </el-button>
            <el-button
              v-if="detectionResults"
              type="success"
              size="large"
              @click="exportResults"
            >
              <el-icon><Download /></el-icon>
              导出结果
            </el-button>
          </div>
        </template>
      </AICard>

      <!-- 检测结果 -->
      <AICard v-if="detectionResults" class="results-section">
        <template #header>
          <h3>检测结果</h3>
          <el-tag type="success">检测完成</el-tag>
        </template>

        <div class="results-content">
          <div class="results-stats">
            <MetricCard
              v-for="stat in detectionStats"
              :key="stat.title"
              :title="stat.title"
              :value="stat.value"
              :icon="stat.icon"
              :color="stat.color"
            />
          </div>

          <div class="detected-objects">
            <h4>检测到的对象</h4>
            <DataTable
              :data="detectionResults.objects"
              :columns="objectColumns"
              @row-click="highlightObject"
            />
          </div>
        </div>
      </AICard>
    </div>

    <!-- 历史记录 -->
    <div v-show="showHistory" class="history-section">
      <AICard class="history-container">
        <template #header>
          <h3>检测历史</h3>
          <el-button text @click="clearHistory">清空历史</el-button>
        </template>

        <EmptyState
          v-if="detectionHistory.length === 0"
          icon="Clock"
          title="暂无历史记录"
          description="完成检测后会显示历史记录"
        />

        <div v-else class="history-grid">
          <div
            v-for="item in detectionHistory"
            :key="item.id"
            class="history-item"
            @click="loadHistoryItem(item)"
          >
            <div class="history-image">
              <img :src="item.thumbnail" :alt="item.title" />
              <div class="history-overlay">
                <span class="object-count">{{ item.objectCount }} 个对象</span>
              </div>
            </div>
            <div class="history-info">
              <h5>{{ item.title }}</h5>
              <p>{{ item.model }} - {{ formatTime(item.timestamp) }}</p>
            </div>
          </div>
        </div>
      </AICard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import {
  Aim,
  List,
  Upload,
  MagicStick,
  Download,
  Clock
} from '@element-plus/icons-vue'
import PageHeader from '@/modules/common/components/PageHeader.vue'
import AICard from '@/modules/common/components/AICard.vue'
import FileUpload from '@/modules/common/components/FileUpload.vue'
import ActionBar from '@/modules/common/components/ActionBar.vue'
import MetricCard from '@/modules/common/components/MetricCard.vue'
import DataTable from '@/modules/common/components/DataTable.vue'
import EmptyState from '@/modules/common/components/EmptyState.vue'

// 响应式数据
const showHistory = ref(false)
const selectedModel = ref('yolo-v8')
const uploadedImage = ref('')
const detecting = ref(false)
const detectionResults = ref<any>(null)
const detectionHistory = ref<any[]>([])
const detectionCanvas = ref<HTMLCanvasElement>()

// 检测模型
const detectionModels = [
  {
    id: 'yolo-v8',
    name: 'YOLO v8',
    description: '高精度通用目标检测'
  },
  {
    id: 'faster-rcnn',
    name: 'Faster R-CNN',
    description: '精确的两阶段检测'
  },
  {
    id: 'ssd',
    name: 'SSD MobileNet',
    description: '轻量级实时检测'
  }
]

// 图像控制按钮
const imageControls = computed(() => [
  { label: '重新上传', icon: 'Upload', action: 'reupload' },
  { label: '清除', icon: 'Delete', action: 'clear', type: 'danger' }
])

// 检测统计
const detectionStats = computed(() => {
  if (!detectionResults.value) return []

  return [
    {
      title: '检测对象',
      value: detectionResults.value.objects.length,
      icon: 'Aim',
      color: '#409eff'
    },
    {
      title: '平均置信度',
      value: `${detectionResults.value.avgConfidence}%`,
      icon: 'TrendCharts',
      color: '#67c23a'
    },
    {
      title: '处理时间',
      value: `${detectionResults.value.processTime}ms`,
      icon: 'Timer',
      color: '#e6a23c'
    }
  ]
})

// 对象表格列
const objectColumns = [
  { prop: 'class', label: '类别', width: 120 },
  { prop: 'confidence', label: '置信度', width: 100, formatter: (row: any) => `${row.confidence}%` },
  { prop: 'bbox', label: '位置', formatter: (row: any) => `(${row.bbox.x}, ${row.bbox.y})` }
]

// 方法
const handleImageUpload = (file: any) => {
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImage.value = e.target?.result as string
      detectionResults.value = null
      nextTick(() => {
        drawImageOnCanvas()
      })
    }
    reader.readAsDataURL(file)
  }
}

const handleImageAction = (action: string) => {
  switch (action) {
    case 'reupload':
      uploadedImage.value = ''
      detectionResults.value = null
      break
    case 'clear':
      uploadedImage.value = ''
      detectionResults.value = null
      break
  }
}

const drawImageOnCanvas = () => {
  if (!detectionCanvas.value || !uploadedImage.value) return

  const canvas = detectionCanvas.value
  const ctx = canvas.getContext('2d')
  const img = new Image()

  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    ctx?.drawImage(img, 0, 0)
  }

  img.src = uploadedImage.value
}

const startDetection = async () => {
  detecting.value = true

  // 模拟检测过程
  setTimeout(() => {
    const mockResults = {
      objects: [
        {
          class: '人',
          confidence: 95.2,
          bbox: { x: 120, y: 80, width: 200, height: 300 }
        },
        {
          class: '汽车',
          confidence: 89.7,
          bbox: { x: 350, y: 200, width: 180, height: 120 }
        },
        {
          class: '树',
          confidence: 76.3,
          bbox: { x: 50, y: 150, width: 100, height: 200 }
        }
      ],
      avgConfidence: 87.1,
      processTime: 342
    }

    detectionResults.value = mockResults
    drawDetectionResults(mockResults)

    // 添加到历史
    detectionHistory.value.unshift({
      id: Date.now(),
      thumbnail: uploadedImage.value,
      title: `检测结果 ${detectionHistory.value.length + 1}`,
      model: detectionModels.find(m => m.id === selectedModel.value)?.name,
      objectCount: mockResults.objects.length,
      timestamp: new Date()
    })

    detecting.value = false
    ElMessage.success('检测完成！')
  }, 2000)
}

const drawDetectionResults = (results: any) => {
  if (!detectionCanvas.value) return

  const canvas = detectionCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 绘制检测框
  ctx.strokeStyle = '#409eff'
  ctx.lineWidth = 3
  ctx.font = '16px Arial'
  ctx.fillStyle = '#409eff'

  results.objects.forEach((obj: any) => {
    const { x, y, width, height } = obj.bbox

    // 绘制边界框
    ctx.strokeRect(x, y, width, height)

    // 绘制标签
    const label = `${obj.class} ${obj.confidence}%`
    const textWidth = ctx.measureText(label).width
    ctx.fillRect(x, y - 25, textWidth + 10, 25)
    ctx.fillStyle = 'white'
    ctx.fillText(label, x + 5, y - 8)
    ctx.fillStyle = '#409eff'
  })
}

const highlightObject = (row: any) => {
  // 高亮选中的对象
  ElMessage.info(`选中对象: ${row.class}`)
}

const exportResults = () => {
  const data = {
    image: uploadedImage.value,
    results: detectionResults.value,
    model: selectedModel.value,
    timestamp: new Date()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `detection-results-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const clearHistory = () => {
  detectionHistory.value = []
  ElMessage.success('历史已清空')
}

const loadHistoryItem = (item: any) => {
  uploadedImage.value = item.thumbnail
  showHistory.value = false
  ElMessage.info(`加载历史项目: ${item.title}`)
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
  //max-width: 1400px;
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