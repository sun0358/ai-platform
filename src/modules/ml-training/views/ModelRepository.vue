<template>
  <div class="model-repository-page ai-gradient-bg">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Box /></el-icon>
          模型仓库
        </h1>
        <p class="page-subtitle">管理和部署训练完成的机器学习模型</p>
      </div>
      <div class="header-actions">
        <el-button @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon>
          上传模型
        </el-button>
        <el-button type="primary" @click="router.push('/ml-training/create')">
          <el-icon><Plus /></el-icon>
          训练新模型
        </el-button>
      </div>
    </div>

    <!-- 仓库统计 -->
    <div class="repository-stats">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <el-icon :size="32"><Files /></el-icon>
        </div>
        <div class="stat-info">
          <h3>{{ repoStats.totalModels }}</h3>
          <p>模型总数</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <el-icon :size="32"><Connection /></el-icon>
        </div>
        <div class="stat-info">
          <h3>{{ repoStats.deployedModels }}</h3>
          <p>已部署</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
          <el-icon :size="32"><Download /></el-icon>
        </div>
        <div class="stat-info">
          <h3>{{ repoStats.totalDownloads }}</h3>
          <p>下载次数</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">
          <el-icon :size="32"><Coin /></el-icon>
        </div>
        <div class="stat-info">
          <h3>{{ formatStorageSize(repoStats.totalStorage) }}</h3>
          <p>存储占用</p>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="model-filters">
      <AICard variant="glass">
        <div class="filter-content">
          <div class="search-box">
            <el-input
                v-model="searchQuery"
                placeholder="搜索模型名称、标签或描述..."
                size="large"
                clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <div class="filter-tags">
            <span class="filter-label">快速筛选：</span>
            <el-check-tag
                v-for="tag in filterTags"
                :key="tag.value"
                :checked="selectedTags.includes(tag.value)"
                @change="toggleTag(tag.value)"
            >
              {{ tag.label }}
            </el-check-tag>
          </div>

          <div class="view-controls">
            <el-segmented v-model="viewMode" :options="viewOptions" />
            <el-select v-model="sortBy" placeholder="排序" style="width: 150px">
              <el-option label="最新上传" value="latest" />
              <el-option label="下载最多" value="downloads" />
              <el-option label="评分最高" value="rating" />
              <el-option label="文件大小" value="size" />
            </el-select>
          </div>
        </div>
      </AICard>
    </div>

    <!-- 模型列表 -->
    <div class="model-list" :class="`view-${viewMode}`">
      <div
          v-for="model in filteredModels"
          :key="model.id"
          class="model-item"
      >
        <AICard variant="glass" :interactive="true" @click="viewModelDetail(model)">
          <div class="model-content">
            <!-- 模型图标 -->
            <div class="model-icon" :style="{ background: model.color }">
              <el-icon :size="40"><component :is="model.icon" /></el-icon>
            </div>

            <!-- 模型信息 -->
            <div class="model-info">
              <div class="model-header">
                <h3>{{ model.name }}</h3>
                <div class="model-badges">
                  <el-tag v-if="model.isDeployed" type="success" size="small">
                    已部署
                  </el-tag>
                  <el-tag v-if="model.isPublic" size="small">
                    公开
                  </el-tag>
                  <el-tag v-if="model.isNew" type="danger" size="small">
                    NEW
                  </el-tag>
                </div>
              </div>

              <p class="model-description">{{ model.description }}</p>

              <div class="model-meta">
                <span class="meta-item">
                  <el-icon><User /></el-icon>
                  {{ model.author }}
                </span>
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(model.uploadedAt) }}
                </span>
                <span class="meta-item">
                  <el-icon><View /></el-icon>
                  {{ model.views }}
                </span>
              </div>

              <div class="model-tags">
                <el-tag
                    v-for="tag in model.tags"
                    :key="tag"
                    size="small"
                    type="info"
                >
                  {{ tag }}
                </el-tag>
              </div>

              <div class="model-metrics">
                <div class="metric">
                  <span class="metric-label">准确率</span>
                  <span class="metric-value">{{ model.accuracy }}%</span>
                </div>
                <div class="metric">
                  <span class="metric-label">版本</span>
                  <span class="metric-value">v{{ model.version }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">大小</span>
                  <span class="metric-value">{{ formatFileSize(model.size) }}</span>
                </div>
              </div>

              <div class="model-rating">
                <el-rate
                    v-model="model.rating"
                    disabled
                    show-score
                    text-color="#ff9900"
                />
                <span class="rating-count">({{ model.ratingCount }})</span>
              </div>
            </div>

            <!-- 模型操作 -->
            <div class="model-actions">
              <el-button
                  v-if="model.isDeployed"
                  type="primary"
                  @click.stop="openAPI(model)"
              >
                <el-icon><Link /></el-icon>
                API调用
              </el-button>
              <el-button
                  v-else
                  type="primary"
                  @click.stop="deployModel(model)"
              >
                <el-icon><Upload /></el-icon>
                部署
              </el-button>

              <el-dropdown trigger="click" @click.stop>
                <el-button>
                  更多
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="downloadModel(model)">
                      <el-icon><Download /></el-icon>
                      下载模型
                    </el-dropdown-item>
                    <el-dropdown-item @click="viewLogs(model)">
                      <el-icon><Document /></el-icon>
                      训练日志
                    </el-dropdown-item>
                    <el-dropdown-item @click="compareModels(model)">
                      <el-icon><Operation /></el-icon>
                      对比分析
                    </el-dropdown-item>
                    <el-dropdown-item @click="shareModel(model)">
                      <el-icon><Share /></el-icon>
                      分享
                    </el-dropdown-item>
                    <el-dropdown-item
                        v-if="model.author === currentUser"
                        divided
                        @click="editModel(model)"
                    >
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item
                        v-if="model.author === currentUser"
                        @click="deleteModel(model)"
                    >
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 部署状态 -->
          <div v-if="model.isDeployed" class="deployment-status">
            <div class="status-header">
              <h4>部署状态</h4>
              <el-tag type="success" size="small">运行中</el-tag>
            </div>
            <div class="status-metrics">
              <div class="status-item">
                <span class="label">调用次数</span>
                <span class="value">{{ model.apiCalls || 0 }}</span>
              </div>
              <div class="status-item">
                <span class="label">平均延迟</span>
                <span class="value">{{ model.avgLatency || 0 }}ms</span>
              </div>
              <div class="status-item">
                <span class="label">成功率</span>
                <span class="value">{{ model.successRate || 100 }}%</span>
              </div>
            </div>
          </div>
        </AICard>
      </div>

      <el-empty v-if="filteredModels.length === 0" description="没有找到匹配的模型" />
    </div>

    <!-- 上传模型对话框 -->
    <el-dialog
        v-model="showUploadDialog"
        title="上传模型"
        width="600px"
    >
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="模型名称" required>
          <el-input v-model="uploadForm.name" placeholder="输入模型名称" />
        </el-form-item>

        <el-form-item label="模型描述" required>
          <el-input
              v-model="uploadForm.description"
              type="textarea"
              :rows="3"
              placeholder="简要描述模型的功能和特点"
          />
        </el-form-item>

        <el-form-item label="模型文件" required>
          <el-upload
              drag
              :auto-upload="false"
              accept=".h5,.pt,.pth,.pkl,.onnx"
              :on-change="handleModelFileChange"
          >
            <el-icon :size="40"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              拖拽模型文件到此处或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .h5, .pt, .pth, .pkl, .onnx 格式
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="模型类型">
          <el-select v-model="uploadForm.type" placeholder="选择模型类型">
            <el-option label="分类模型" value="classification" />
            <el-option label="回归模型" value="regression" />
            <el-option label="聚类模型" value="clustering" />
            <el-option label="深度学习" value="deeplearning" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-select
              v-model="uploadForm.tags"
              multiple
              filterable
              allow-create
              placeholder="添加标签"
          >
            <el-option
                v-for="tag in availableTags"
                :key="tag"
                :label="tag"
                :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="公开模型">
          <el-switch v-model="uploadForm.isPublic" />
          <span class="form-tip">公开后其他用户可以查看和使用</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="confirmUpload">
          确定上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 模型详情对话框 -->
    <el-dialog
        v-model="showDetailDialog"
        :title="selectedModel?.name"
        width="900px"
    >
      <div v-if="selectedModel" class="model-detail-dialog">
        <el-tabs v-model="detailTab">
          <el-tab-pane label="概览" name="overview">
            <div class="overview-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="模型ID">
                  {{ selectedModel.id }}
                </el-descriptions-item>
                <el-descriptions-item label="版本">
                  v{{ selectedModel.version }}
                </el-descriptions-item>
                <el-descriptions-item label="作者">
                  {{ selectedModel.author }}
                </el-descriptions-item>
                <el-descriptions-item label="上传时间">
                  {{ formatDateTime(selectedModel.uploadedAt) }}
                </el-descriptions-item>
                <el-descriptions-item label="文件大小">
                  {{ formatFileSize(selectedModel.size) }}
                </el-descriptions-item>
                <el-descriptions-item label="下载次数">
                  {{ selectedModel.downloads }}
                </el-descriptions-item>
                <el-descriptions-item label="框架">
                  {{ selectedModel.framework }}
                </el-descriptions-item>
                <el-descriptions-item label="许可证">
                  {{ selectedModel.license || 'MIT' }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-tab-pane>

          <el-tab-pane label="性能指标" name="metrics">
            <div class="metrics-content">
              <el-row :gutter="20">
                <el-col :span="12">
                  <DataVisualization
                      type="radar"
                      :data="getModelMetricsData()"
                      :height="300"
                  />
                </el-col>
                <el-col :span="12">
                  <div class="metrics-list">
                    <div class="metric-item">
                      <span class="label">准确率</span>
                      <el-progress :percentage="selectedModel.accuracy" />
                    </div>
                    <div class="metric-item">
                      <span class="label">精确率</span>
                      <el-progress :percentage="selectedModel.precision || 92" />
                    </div>
                    <div class="metric-item">
                      <span class="label">召回率</span>
                      <el-progress :percentage="selectedModel.recall || 88" />
                    </div>
                    <div class="metric-item">
                      <span class="label">F1分数</span>
                      <el-progress :percentage="selectedModel.f1Score || 90" />
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <el-tab-pane label="使用文档" name="docs">
            <div class="docs-content">
              <h4>快速开始</h4>
              <el-alert type="info" :closable="false">
                使用以下代码加载和使用模型
              </el-alert>
              <pre class="code-block">
import model_loader

# 加载模型
model = model_loader.load('{{ selectedModel.id }}')

# 进行预测
predictions = model.predict(input_data)
              </pre>

              <h4>API调用示例</h4>
              <pre class="code-block">
curl -X POST https://api.example.com/v1/models/{{ selectedModel.id }}/predict \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"data": [1, 2, 3, 4]}'
              </pre>
            </div>
          </el-tab-pane>

          <el-tab-pane label="版本历史" name="versions">
            <el-timeline>
              <el-timeline-item
                  v-for="version in modelVersions"
                  :key="version.version"
                  :timestamp="formatDateTime(version.date)"
              >
                <h4>v{{ version.version }}</h4>
                <p>{{ version.changes }}</p>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Box, Upload, Plus, Files, Connection, Download as DownloadIcon,
  Coin, Search, User, Clock, View, Link, ArrowDown,
  Document, Operation, Share, Edit, Delete, UploadFilled
} from '@element-plus/icons-vue'
import AICard from '@/modules/common/components/AICard.vue'
import DataVisualization from '@/modules/common/components/DataVisualization.vue'
import PageHeader from '@/modules/common/components/PageHeader.vue'
import StatsGroup from '@/modules/common/components/StatsGroup.vue'

const router = useRouter()

// 响应式数据
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const viewMode = ref('grid')
const sortBy = ref('latest')
const showUploadDialog = ref(false)
const showDetailDialog = ref(false)
const selectedModel = ref<any>(null)
const detailTab = ref('overview')
const uploading = ref(false)
const currentUser = ref('张三')

const uploadForm = ref({
  name: '',
  description: '',
  type: 'classification',
  tags: [],
  isPublic: false
})

const repoStats = ref({
  totalModels: 42,
  deployedModels: 15,
  totalDownloads: 1285,
  totalStorage: 5368709120 // 5GB
})

const viewOptions = [
  { label: '网格', value: 'grid' },
  { label: '列表', value: 'list' }
]

const filterTags = [
  { label: '已部署', value: 'deployed' },
  { label: '公开', value: 'public' },
  { label: '私有', value: 'private' },
  { label: '最新', value: 'new' }
]

const availableTags = [
  '图像分类', '文本分析', '时序预测', '异常检测',
  '推荐系统', '自然语言处理', '计算机视觉', '强化学习'
]

const models = ref([
  {
    id: 'model_001',
    name: '客户流失预测模型',
    description: '基于XGBoost的客户流失预测模型，准确率达到95%以上',
    icon: 'TrendCharts',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    author: '张三',
    uploadedAt: new Date(Date.now() - 86400000),
    views: 156,
    downloads: 45,
    tags: ['分类', 'XGBoost', '客户分析'],
    accuracy: 95.8,
    version: '2.1.0',
    size: 52428800, // 50MB
    rating: 4.5,
    ratingCount: 23,
    isDeployed: true,
    isPublic: true,
    isNew: false,
    framework: 'XGBoost',
    apiCalls: 1250,
    avgLatency: 45,
    successRate: 99.8
  },
  {
    id: 'model_002',
    name: '商品推荐系统',
    description: '基于深度学习的个性化商品推荐模型，支持实时推荐',
    icon: 'Grid',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    author: '李四',
    uploadedAt: new Date(Date.now() - 172800000),
    views: 89,
    downloads: 12,
    tags: ['推荐系统', '深度学习', 'TensorFlow'],
    accuracy: 92.3,
    version: '1.0.0',
    size: 157286400, // 150MB
    rating: 4.0,
    ratingCount: 15,
    isDeployed: false,
    isPublic: true,
    isNew: true,
    framework: 'TensorFlow'
  },
  {
    id: 'model_003',
    name: '图像分类模型',
    description: 'ResNet50预训练模型，支持1000类图像分类',
    icon: 'Picture',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    author: '王五',
    uploadedAt: new Date(Date.now() - 604800000),
    views: 234,
    downloads: 78,
    tags: ['计算机视觉', 'ResNet', '图像分类'],
    accuracy: 94.2,
    version: '3.0.0',
    size: 104857600, // 100MB
    rating: 4.8,
    ratingCount: 45,
    isDeployed: true,
    isPublic: false,
    isNew: false,
    framework: 'PyTorch',
    apiCalls: 5680,
    avgLatency: 120,
    successRate: 98.5
  }
])

const modelVersions = ref([
  {
    version: '2.1.0',
    date: new Date(Date.now() - 86400000),
    changes: '优化模型性能，提升预测准确率'
  },
  {
    version: '2.0.0',
    date: new Date(Date.now() - 604800000),
    changes: '重构模型架构，支持更多特征'
  },
  {
    version: '1.0.0',
    date: new Date(Date.now() - 2592000000),
    changes: '初始版本发布'
  }
])

// 计算属性
const filteredModels = computed(() => {
  let result = models.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(model =>
        model.name.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query) ||
        model.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // 标签过滤
  if (selectedTags.value.length > 0) {
    result = result.filter(model => {
      if (selectedTags.value.includes('deployed') && !model.isDeployed) return false
      if (selectedTags.value.includes('public') && !model.isPublic) return false
      if (selectedTags.value.includes('private') && model.isPublic) return false
      if (selectedTags.value.includes('new') && !model.isNew) return false
      return true
    })
  }

  // 排序
  switch (sortBy.value) {
    case 'downloads':
      result.sort((a, b) => b.downloads - a.downloads)
      break
    case 'rating':
      result.sort((a, b) => b.rating - a.rating)
      break
    case 'size':
      result.sort((a, b) => b.size - a.size)
      break
    default:
      result.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
  }

  return result
})

// 方法
const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 86400000) return '今天'
  if (diff < 172800000) return '昨天'
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return date.toLocaleDateString()
}

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

const formatStorageSize = (bytes: number) => {
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

const viewModelDetail = (model: any) => {
  selectedModel.value = model
  showDetailDialog.value = true
}

const deployModel = async (model: any) => {
  try {
    await ElMessageBox.confirm(
        '部署模型将占用计算资源，确定继续吗？',
        '部署确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )
    model.isDeployed = true
    ElMessage.success('模型部署成功')
  } catch {
    // 用户取消
  }
}

const openAPI = (model: any) => {
  ElMessage.info(`查看API文档: ${model.name}`)
}

const downloadModel = (model: any) => {
  ElMessage.success(`开始下载: ${model.name}`)
}

const viewLogs = (model: any) => {
  ElMessage.info('查看训练日志')
}

const compareModels = (model: any) => {
  ElMessage.info('选择要对比的模型')
}

const shareModel = (model: any) => {
  ElMessage.success('分享链接已复制')
}

const editModel = (model: any) => {
  ElMessage.info('编辑模型信息')
}

const deleteModel = async (model: any) => {
  try {
    await ElMessageBox.confirm(
        '删除模型后无法恢复，确定继续吗？',
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )
    const index = models.value.indexOf(model)
    if (index > -1) {
      models.value.splice(index, 1)
    }
    ElMessage.success('模型已删除')
  } catch {
    // 用户取消
  }
}

const handleModelFileChange = (file: any) => {
  ElMessage.success(`已选择文件: ${file.name}`)
}

const confirmUpload = async () => {
  if (!uploadForm.value.name || !uploadForm.value.description) {
    ElMessage.warning('请填写必要信息')
    return
  }

  uploading.value = true

  // 模拟上传
  setTimeout(() => {
    uploading.value = false
    showUploadDialog.value = false
    ElMessage.success('模型上传成功')

    // 重置表单
    uploadForm.value = {
      name: '',
      description: '',
      type: 'classification',
      tags: [],
      isPublic: false
    }
  }, 2000)
}

const getModelMetricsData = () => {
  return {
    indicator: [
      { name: '准确率', max: 100 },
      { name: '精确率', max: 100 },
      { name: '召回率', max: 100 },
      { name: 'F1分数', max: 100 },
      { name: '速度', max: 100 }
    ],
    series: [{
      name: '性能指标',
      data: [
        selectedModel.value?.accuracy || 0,
        selectedModel.value?.precision || 92,
        selectedModel.value?.recall || 88,
        selectedModel.value?.f1Score || 90,
        85
      ]
    }]
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/ai-theme.scss';

.model-repository-page {
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

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.repository-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;

  .stat-card {
    background: var(--ai-card-bg);
    border: 1px solid var(--ai-border);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .stat-info {
      h3 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: var(--ai-text-primary);
      }

      p {
        margin: 4px 0 0 0;
        color: var(--ai-text-secondary);
      }
    }
  }
}

.model-filters {
  margin-bottom: 32px;

  .filter-content {
    padding: 20px;

    .search-box {
      margin-bottom: 20px;
    }

    .filter-tags {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;

      .filter-label {
        color: var(--ai-text-secondary);
      }

      .el-check-tag {
        background: var(--ai-bg-tertiary);
        border-color: var(--ai-border);
        color: var(--ai-text-secondary);

        &.is-checked {
          background: var(--ai-primary);
          border-color: var(--ai-primary);
          color: white;
        }
      }
    }

    .view-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}

.model-list {
  &.view-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 24px;
  }

  &.view-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .model-item {
      .model-content {
        flex-direction: row;
        gap: 24px;
      }
    }
  }

  .model-item {
    .model-content {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .model-icon {
        width: 80px;
        height: 80px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
      }

      .model-info {
        flex: 1;

        .model-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 8px;

          h3 {
            margin: 0;
            font-size: 20px;
            color: var(--ai-text-primary);
          }

          .model-badges {
            display: flex;
            gap: 8px;
          }
        }

        .model-description {
          margin: 0 0 12px 0;
          color: var(--ai-text-secondary);
          line-height: 1.5;
        }

        .model-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            color: var(--ai-text-muted);
          }
        }

        .model-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .model-metrics {
          display: flex;
          gap: 24px;
          margin-bottom: 12px;

          .metric {
            .metric-label {
              font-size: 13px;
              color: var(--ai-text-muted);
              margin-right: 4px;
            }

            .metric-value {
              font-weight: 600;
              color: var(--ai-text-primary);
            }
          }
        }

        .model-rating {
          display: flex;
          align-items: center;
          gap: 8px;

          .rating-count {
            font-size: 14px;
            color: var(--ai-text-muted);
          }
        }
      }

      .model-actions {
        display: flex;
        gap: 12px;
        padding-top: 16px;
        border-top: 1px solid var(--ai-border);
      }
    }

    .deployment-status {
      margin-top: 20px;
      padding: 16px;
      background: var(--ai-bg-tertiary);
      border-radius: 12px;

      .status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        h4 {
          margin: 0;
          font-size: 16px;
          color: var(--ai-text-primary);
        }
      }

      .status-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;

        .status-item {
          text-align: center;

          .label {
            display: block;
            font-size: 13px;
            color: var(--ai-text-muted);
            margin-bottom: 4px;
          }

          .value {
            font-size: 18px;
            font-weight: 600;
            color: var(--ai-text-primary);
          }
        }
      }
    }
  }
}

.model-detail-dialog {
  .overview-content {
    padding: 20px 0;

    :deep(.el-descriptions__label) {
      color: var(--ai-text-secondary);
      background: var(--ai-bg-tertiary);
    }

    :deep(.el-descriptions__content) {
      color: var(--ai-text-primary);
    }
  }

  .metrics-content {
    padding: 20px 0;

    .metrics-list {
      .metric-item {
        margin-bottom: 20px;

        .label {
          display: block;
          margin-bottom: 8px;
          color: var(--ai-text-secondary);
        }
      }
    }
  }

  .docs-content {
    padding: 20px 0;

    h4 {
      margin: 24px 0 12px 0;
      color: var(--ai-text-primary);

      &:first-child {
        margin-top: 0;
      }
    }

    .code-block {
      background: var(--ai-bg-tertiary);
      border: 1px solid var(--ai-border);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 14px;
      color: var(--ai-text-secondary);
      margin: 12px 0;
    }
  }
}

// 上传表单提示
.form-tip {
  margin-left: 12px;
  font-size: 13px;
  color: var(--ai-text-muted);
}

// 主题适配
:deep(.el-segmented) {
  background: var(--ai-bg-tertiary);

  .el-segmented__item {
    color: var(--ai-text-secondary);

    &.is-selected {
      background: var(--ai-primary);
      color: white;
    }
  }
}

:deep(.el-dropdown-menu) {
  background: var(--ai-bg-secondary);
  border-color: var(--ai-border);

  .el-dropdown-menu__item {
    color: var(--ai-text-secondary);

    &:hover {
      background: var(--ai-card-bg-hover);
      color: var(--ai-text-primary);
    }
  }
}

:deep(.el-upload-dragger) {
  background: var(--ai-bg-tertiary);
  border-color: var(--ai-border);

  &:hover {
    border-color: var(--ai-primary);
  }
}

:deep(.el-tabs) {
  .el-tabs__nav-wrap::after {
    background-color: var(--ai-border);
  }

  .el-tabs__item {
    color: var(--ai-text-secondary);

    &.is-active {
      color: var(--ai-primary);
    }
  }

  .el-tabs__active-bar {
    background-color: var(--ai-primary);
  }
}

:deep(.el-timeline) {
  .el-timeline-item__wrapper {
    color: var(--ai-text-secondary);
  }

  .el-timeline-item__timestamp {
    color: var(--ai-text-muted);
  }
}
</style>