<template>
  <div class="image-recognition-page">
    <PageHeader
      title="智能图像识别"
      subtitle="多模态AI图像理解与分类"
      icon="PictureFilled"
    >
      <template #actions>
        <StatsGroup :stats="headerStats" />
      </template>
    </PageHeader>

    <!-- 识别模式选择 -->
    <div class="mode-selector">
      <div
          v-for="mode in recognitionModes"
          :key="mode.id"
          class="mode-card"
          :class="{ active: selectedMode === mode.id }"
          @click="selectedMode = mode.id"
      >
        <div class="mode-icon" :style="{ background: mode.gradient }">
          <el-icon :size="32"><component :is="mode.icon" /></el-icon>
        </div>
        <h3>{{ mode.title }}</h3>
        <p>{{ mode.description }}</p>
      </div>
    </div>

    <!-- 主要识别区域 -->
    <div class="recognition-area">
      <el-row :gutter="24">
        <el-col :span="14">
          <AICard class="upload-card">
            <template #header>
              <h3>图像输入</h3>
            </template>

            <FileUpload
              v-model="currentImage"
              accept="image/*"
              :show-file-list="false"
              @change="handleImageChange"
            >
              <template #trigger>
                <div class="drop-zone">
                  <div class="drop-content">
                    <el-icon :size="80"><UploadFilled /></el-icon>
                    <h4>拖拽图片到此处</h4>
                    <p>或点击选择文件</p>
                    <div class="supported-formats">
                      <el-tag v-for="format in ['JPG', 'PNG', 'GIF', 'BMP']" :key="format">
                        {{ format }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </template>
            </FileUpload>

            <!-- 图片预览 -->
            <div v-if="currentImage" class="image-display">
              <img :src="currentImage" alt="待识别图像" />
              <ActionBar
                :actions="imageActions"
                @action="handleImageAction"
              />
            </div>

            <!-- URL输入 -->
            <div class="url-input">
              <el-input
                  v-model="imageUrl"
                  placeholder="或输入图片URL"
                  size="large"
              >
                <template #append>
                  <el-button @click="loadFromUrl">加载</el-button>
                </template>
              </el-input>
            </div>

            <template #footer>
              <el-button
                  type="primary"
                  size="large"
                  :loading="recognizing"
                  :disabled="!currentImage"
                  @click="startRecognition"
              >
                <el-icon><MagicStick /></el-icon>
                开始识别
              </el-button>
            </template>
          </AICard>
        </el-col>

        <el-col :span="10">
          <!-- 实时识别结果 -->
          <AICard class="results-card">
            <template #header>
              <h3>识别结果</h3>
              <el-tag v-if="recognitionComplete" type="success">
                完成
              </el-tag>
            </template>

            <EmptyState
              v-if="!recognitionResults"
              icon="InfoFilled"
              title="等待图像识别..."
              description="上传图片并开始识别查看结果"
            />

            <div v-else class="recognition-results">
              <!-- 主要识别结果 -->
              <div class="primary-result">
                <div class="result-header">
                  <h4>主要识别</h4>
                  <div class="confidence-badge">
                    <AnimatedNumber :value="recognitionResults.primary.confidence" :decimals="1" />%
                  </div>
                </div>
                <div class="result-content">
                  <el-tag size="large" type="primary">
                    {{ recognitionResults.primary.label }}
                  </el-tag>
                  <p class="result-description">
                    {{ recognitionResults.primary.description }}
                  </p>
                </div>
              </div>

              <!-- 其他可能的结果 -->
              <div class="alternative-results">
                <h4>其他可能</h4>
                <div class="alternatives-list">
                  <div
                      v-for="(alt, index) in recognitionResults.alternatives"
                      :key="index"
                      class="alternative-item"
                  >
                    <span class="alt-label">{{ alt.label }}</span>
                    <el-progress
                        :percentage="alt.confidence"
                        :color="getConfidenceColor(alt.confidence)"
                    />
                  </div>
                </div>
              </div>

              <!-- 图像属性 -->
              <div class="image-attributes">
                <h4>图像属性</h4>
                <div class="attributes-grid">
                  <div
                      v-for="attr in recognitionResults.attributes"
                      :key="attr.name"
                      class="attribute-item"
                  >
                    <el-icon><component :is="attr.icon" /></el-icon>
                    <span class="attr-name">{{ attr.name }}</span>
                    <span class="attr-value">{{ attr.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </AICard>

          <!-- 识别历史 -->
          <AICard class="history-card">
            <template #header>
              <h4>最近识别</h4>
              <el-button text size="small" @click="clearHistory">清空</el-button>
            </template>

            <EmptyState
              v-if="recentHistory.length === 0"
              icon="Clock"
              title="暂无历史记录"
              description="完成识别后会显示历史记录"
            />

            <div v-else class="history-list">
              <div
                  v-for="item in recentHistory"
                  :key="item.id"
                  class="history-item"
                  @click="loadHistoryItem(item)"
              >
                <div class="history-image">
                  <img :src="item.thumbnail" :alt="item.label" />
                </div>
                <div class="history-info">
                  <h5>{{ item.label }}</h5>
                  <p>{{ item.confidence }}% 置信度</p>
                  <span class="history-time">{{ formatTime(item.timestamp) }}</span>
                </div>
              </div>
            </div>
          </AICard>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  PictureFilled,
  UploadFilled,
  MagicStick,
  InfoFilled,
  ZoomIn,
  ZoomOut,
  RefreshRight,
  Delete,
  Clock
} from '@element-plus/icons-vue'
import PageHeader from '@/modules/common/components/PageHeader.vue'
import StatsGroup from '@/modules/common/components/StatsGroup.vue'
import AICard from '@/modules/common/components/AICard.vue'
import FileUpload from '@/modules/common/components/FileUpload.vue'
import ActionBar from '@/modules/common/components/ActionBar.vue'
import EmptyState from '@/modules/common/components/EmptyState.vue'
import AnimatedNumber from '@/modules/common/components/AnimatedNumber.vue'

// 响应式数据
const selectedMode = ref('general')
const currentImage = ref('')
const imageUrl = ref('')
const recognizing = ref(false)
const recognitionComplete = ref(false)
const recognitionResults = ref<any>(null)
const recentHistory = ref<any[]>([])

// 统计数据
const headerStats = computed(() => [
  { label: '识别类别', value: '1000+', icon: 'Collection' },
  { label: '准确率', value: '99.5%', icon: 'TrendCharts' }
])

// 图片操作按钮
const imageActions = computed(() => [
  { label: '放大', icon: 'ZoomIn', action: 'zoomIn' },
  { label: '缩小', icon: 'ZoomOut', action: 'zoomOut' },
  { label: '重置', icon: 'RefreshRight', action: 'resetZoom' },
  { label: '清除', icon: 'Delete', action: 'clearImage', type: 'danger' }
])

// 识别模式
const recognitionModes = [
  {
    id: 'general',
    title: '通用识别',
    description: '识别日常物体、场景和概念',
    icon: 'Picture',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 'ocr',
    title: '文字识别',
    description: '提取图片中的文字内容',
    icon: 'Document',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 'face',
    title: '人脸识别',
    description: '检测和识别人脸特征',
    icon: 'User',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 'art',
    title: '艺术风格',
    description: '分析艺术作品风格和流派',
    icon: 'Brush',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  }
]

// 方法
const handleImageChange = (file: any) => {
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      currentImage.value = e.target?.result as string
      recognitionResults.value = null
      recognitionComplete.value = false
    }
    reader.readAsDataURL(file)
  }
}

const handleImageAction = (action: string) => {
  switch (action) {
    case 'zoomIn':
      ElMessage.info('放大图片')
      break
    case 'zoomOut':
      ElMessage.info('缩小图片')
      break
    case 'resetZoom':
      ElMessage.info('重置缩放')
      break
    case 'clearImage':
      clearImage()
      break
  }
}

const loadFromUrl = () => {
  if (imageUrl.value) {
    currentImage.value = imageUrl.value
    imageUrl.value = ''
    recognitionResults.value = null
    recognitionComplete.value = false
  }
}

const clearImage = () => {
  currentImage.value = ''
  recognitionResults.value = null
  recognitionComplete.value = false
}

const startRecognition = async () => {
  recognizing.value = true

  // 模拟识别过程
  setTimeout(() => {
    recognitionResults.value = {
      primary: {
        label: '金毛寻回犬',
        confidence: 95.8,
        description: '一种大型犬种，性格友善，常用作导盲犬和搜救犬。'
      },
      alternatives: [
        { label: '拉布拉多犬', confidence: 78.3 },
        { label: '柴犬', confidence: 45.2 },
        { label: '哈士奇', confidence: 23.1 }
      ],
      attributes: [
        { name: '颜色', value: '金色', icon: 'Brush' },
        { name: '场景', value: '户外', icon: 'Picture' },
        { name: '情绪', value: '友好', icon: 'Star' },
        { name: '品种', value: '纯种', icon: 'Trophy' }
      ]
    }

    // 添加到历史
    recentHistory.value.unshift({
      id: Date.now(),
      thumbnail: currentImage.value,
      label: recognitionResults.value.primary.label,
      confidence: recognitionResults.value.primary.confidence,
      timestamp: new Date()
    })

    recognizing.value = false
    recognitionComplete.value = true
    ElMessage.success('识别完成！')
  }, 2000)
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return '#10b981'
  if (confidence >= 60) return '#f59e0b'
  return '#ef4444'
}


const clearHistory = () => {
  recentHistory.value = []
  ElMessage.success('历史已清空')
}

const loadHistoryItem = (item: any) => {
  currentImage.value = item.thumbnail
  ElMessage.info(`加载历史图片: ${item.label}`)
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style lang="scss" scoped>
@use '@/styles/ai-theme.scss';

.image-recognition-page {
  min-height: 100vh;
  padding: 20px;
  background-color: var(--ai-bg-primary);
}

.mode-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;

  .mode-card {
    background: var(--ai-card-bg);
    border: 2px solid var(--ai-border);
    border-radius: 16px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;

    &:hover {
      transform: translateY(-4px);
      border-color: var(--ai-primary);
    }

    &.active {
      border-color: var(--ai-primary);
      background: rgba(99, 102, 241, 0.1);
    }

    .mode-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin: 0 auto 16px;
    }

    h3 {
      margin: 0 0 8px 0;
      color: var(--ai-text-primary);
    }

    p {
      margin: 0;
      font-size: 14px;
      color: var(--ai-text-secondary);
    }
  }
}

.recognition-area {
  margin-bottom: 32px;

  .upload-card {
    height: 100%;

    .image-input-area {
      margin-bottom: 16px;

      .drop-zone {
        min-height: 400px;
        background: var(--ai-bg-tertiary);
        border: 2px dashed var(--ai-border);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--ai-primary);
          background: var(--ai-card-bg-hover);
        }

        .drop-content {
          text-align: center;

          .el-icon {
            color: var(--ai-primary);
            margin-bottom: 16px;
          }

          h4 {
            margin: 0 0 8px 0;
            color: var(--ai-text-primary);
          }

          p {
            margin: 0 0 16px 0;
            color: var(--ai-text-secondary);
          }

          .supported-formats {
            display: flex;
            gap: 8px;
            justify-content: center;
          }
        }
      }

      .image-display {
        position: relative;
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--ai-bg-tertiary);
        border-radius: 12px;
        overflow: hidden;

        img {
          max-width: 100%;
          max-height: 500px;
          object-fit: contain;
        }

        .image-actions {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
        }
      }
    }

    .url-input {
      margin-top: 16px;
    }
  }

  .results-card {
    height: 100%;
    min-height: 600px;

    .empty-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      color: var(--ai-text-muted);

      .el-icon {
        margin-bottom: 16px;
      }
    }

    .recognition-results {
      .primary-result {
        background: rgba(99, 102, 241, 0.1);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          h4 {
            margin: 0;
            color: var(--ai-text-primary);
          }

          .confidence-badge {
            background: var(--ai-primary);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 600;
          }
        }

        .result-description {
          margin: 12px 0 0 0;
          color: var(--ai-text-secondary);
          line-height: 1.6;
        }
      }

      .alternative-results {
        margin-bottom: 24px;

        h4 {
          margin: 0 0 12px 0;
          color: var(--ai-text-primary);
        }

        .alternatives-list {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .alternative-item {
            display: flex;
            align-items: center;
            gap: 12px;

            .alt-label {
              flex: 1;
              color: var(--ai-text-secondary);
            }

            .el-progress {
              flex: 2;
            }
          }
        }
      }

      .image-attributes {
        h4 {
          margin: 0 0 12px 0;
          color: var(--ai-text-primary);
        }

        .attributes-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;

          .attribute-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            background: var(--ai-card-bg);
            border-radius: 8px;

            .el-icon {
              color: var(--ai-primary);
            }

            .attr-name {
              color: var(--ai-text-muted);
              font-size: 14px;
            }

            .attr-value {
              margin-left: auto;
              color: var(--ai-text-primary);
              font-weight: 500;
            }
          }
        }
      }
    }
  }

  .history-card {
    margin-top: 24px;

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;

      .history-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        background: var(--ai-card-bg);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: var(--ai-card-bg-hover);
        }

        .history-image {
          width: 48px;
          height: 48px;
          border-radius: 4px;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .history-info {
          flex: 1;

          h5 {
            margin: 0;
            color: var(--ai-text-primary);
            font-weight: 500;
          }

          p {
            margin: 4px 0;
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
}

.advanced-features {
  max-width: 1200px;
  margin: 0 auto;

  .batch-upload {
    text-align: center;

    :deep(.el-upload-dragger) {
      background: var(--ai-bg-tertiary);
      border-color: var(--ai-border);

      &:hover {
        border-color: var(--ai-primary);
      }
    }

    .el-button {
      margin-top: 16px;
    }
  }

  .similar-search,
  .api-integration {
    text-align: center;
    padding: 32px;

    p {
      margin: 0 0 16px 0;
      color: var(--ai-text-secondary);
    }
  }
}

// 深色主题下的标签页
:deep(.el-tabs) {
  --el-tabs-header-height: 48px;

  .el-tabs__nav-wrap {
    &::after {
      background-color: var(--ai-border);
    }
  }

  .el-tabs__item {
    color: var(--ai-text-secondary);

    &:hover {
      color: var(--ai-text-primary);
    }

    &.is-active {
      color: var(--ai-primary);
    }
  }

  .el-tabs__active-bar {
    background-color: var(--ai-primary);
  }
}
</style>