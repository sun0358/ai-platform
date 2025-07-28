<!--
前端YOLO训练管理页面
文件路径: frontend/src/modules/ml-training/views/YOLOTraining.vue
-->

<template>
  <div class="yolo-training-container ai-gradient-bg">
    <!-- 页面头部 -->
    <PageHeader
        title="YOLO模型训练"
        subtitle="上传数据集，配置训练参数，训练YOLO目标检测模型"
        icon="Monitor"
    >
      <template #actions>
        <el-button
            type="primary"
            class="ai-button-primary"
            @click="refreshData"
            :loading="refreshing"
        >
          <el-icon><RefreshRight /></el-icon>
          刷新数据
        </el-button>
      </template>
    </PageHeader>

    <el-row :gutter="24">
      <!-- 左侧：训练配置和数据集管理 -->
      <el-col :span="16">
        <!-- 系统状态 -->
        <div class="animate-fade-slide" style="animation-delay: 0.1s;">
          <StatsGroup
              :stats="systemStats"
              :icon-size="28"
              style="margin-bottom: 24px;"
          />
        </div>

        <!-- 数据集管理 -->
        <AICard
            title="数据集管理"
            icon="FolderOpened"
            class="animate-fade-slide"
            style="animation-delay: 0.2s; margin-bottom: 24px;"
        >
          <template #actions>
            <el-button
                type="primary"
                class="ai-button-gradient"
                @click="showUploadDialog = true"
            >
              <el-icon><Upload /></el-icon>
              上传数据集
            </el-button>
          </template>

          <div class="datasets-list">
            <EmptyState
                v-if="datasets.length === 0"
                icon="FolderRemove"
                title="暂无数据集"
                description="请上传您的第一个训练数据集"
                :min-height="200"
            >
              <template #action>
                <el-button
                    type="primary"
                    class="ai-button-gradient"
                    @click="showUploadDialog = true"
                >
                  上传第一个数据集
                </el-button>
              </template>
            </EmptyState>

            <div v-else class="dataset-grid">
              <div
                  v-for="dataset in datasets"
                  :key="dataset.dataset_id"
                  class="dataset-card glass-card"
                  :class="{ 'dataset-card--selected': selectedDataset?.dataset_id === dataset.dataset_id }"
                  @click="selectDataset(dataset)"
              >
                <div class="dataset-header">
                  <h4 class="dataset-name">{{ dataset.name }}</h4>
                  <el-tag
                      :type="getDatasetStatusType(dataset.status)"
                      size="small"
                      effect="dark"
                  >
                    {{ getDatasetStatusText(dataset.status) }}
                  </el-tag>
                </div>

                <div class="dataset-stats">
                  <div class="stat-item">
                    <el-icon><Picture /></el-icon>
                    <span>{{ dataset.total_images }} 图片</span>
                  </div>
                  <div class="stat-item">
                    <el-icon><Collection /></el-icon>
                    <span>{{ dataset.num_classes }} 类别</span>
                  </div>
                </div>

                <div class="dataset-classes">
                  <el-tag
                      v-for="cls in dataset.classes.slice(0, 3)"
                      :key="cls"
                      size="small"
                      type="info"
                      effect="plain"
                  >
                    {{ cls }}
                  </el-tag>
                  <span v-if="dataset.classes.length > 3" class="more-classes">
                    +{{ dataset.classes.length - 3 }}
                  </span>
                </div>

                <div class="dataset-actions">
                  <el-button
                      size="small"
                      type="primary"
                      text
                      @click.stop="viewDatasetDetails(dataset)"
                  >
                    查看详情
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </AICard>

        <!-- 训练配置 -->
        <AICard
            title="训练配置"
            icon="Setting"
            class="animate-fade-slide"
            style="animation-delay: 0.3s;"
        >
          <template #actions>
            <el-button
                type="primary"
                class="ai-button-gradient"
                :loading="isTraining"
                @click="startTraining"
                :disabled="!canStartTraining"
            >
              <el-icon v-if="!isTraining"><VideoPlay /></el-icon>
              {{ isTraining ? '训练中...' : '开始训练' }}
            </el-button>
          </template>

          <el-form
              :model="trainingConfig"
              label-width="120px"
              :rules="formRules"
              ref="configForm"
              class="ai-form"
          >
            <!-- 数据集选择 -->
            <el-form-item label="选择数据集" prop="dataset_name">
              <el-select
                  v-model="trainingConfig.dataset_name"
                  placeholder="请选择数据集"
                  style="width: 100%;"
                  @change="onDatasetChange"
              >
                <el-option
                    v-for="dataset in datasets"
                    :key="dataset.dataset_id"
                    :label="dataset.name"
                    :value="dataset.name"
                >
                  <div class="option-content">
                    <span>{{ dataset.name }}</span>
                    <span class="option-meta">
                      {{ dataset.num_classes }}类 | {{ dataset.total_images }}图
                    </span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <!-- 项目名称 -->
            <el-form-item label="项目名称" prop="project_name">
              <el-input
                  v-model="trainingConfig.project_name"
                  placeholder="输入项目名称"
                  style="width: 100%;"
              />
            </el-form-item>

            <!-- 模型类型 -->
            <el-form-item label="模型类型" prop="model_type">
              <el-select v-model="trainingConfig.model_type" style="width: 100%;">
                <el-option
                    v-for="model in modelOptions"
                    :key="model.value"
                    :label="model.label"
                    :value="model.value"
                >
                  <div class="model-option">
                    <span class="model-name">{{ model.label }}</span>
                    <span class="model-desc">{{ model.description }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <!-- 训练参数 -->
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="训练轮数" prop="epochs">
                  <el-input-number
                      v-model="trainingConfig.epochs"
                      :min="1"
                      :max="1000"
                      controls-position="right"
                      style="width: 100%;"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="批次大小" prop="batch_size">
                  <el-input-number
                      v-model="trainingConfig.batch_size"
                      :min="1"
                      :max="64"
                      controls-position="right"
                      style="width: 100%;"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="图像尺寸" prop="img_size">
                  <el-select v-model="trainingConfig.img_size" style="width: 100%;">
                    <el-option label="320px (快速)" :value="320" />
                    <el-option label="640px (推荐)" :value="640" />
                    <el-option label="800px (高质量)" :value="800" />
                    <el-option label="1024px (最高质量)" :value="1024" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="GPU设备" prop="device">
                  <el-select v-model="trainingConfig.device" style="width: 100%;">
                    <el-option label="GPU 0" value="0" />
                    <el-option label="CPU" value="cpu" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </AICard>
      </el-col>

      <!-- 右侧：训练任务和模型管理 -->
      <el-col :span="8">
        <!-- 训练任务 -->
        <AICard
            title="训练任务"
            icon="List"
            variant="gradient"
            class="animate-fade-slide"
            style="animation-delay: 0.4s; margin-bottom: 24px;"
        >
          <template #actions>
            <el-badge :value="runningTasksCount" type="warning" :hidden="runningTasksCount === 0">
              <el-button text @click="refreshTasks">
                <el-icon><RefreshRight /></el-icon>
              </el-button>
            </el-badge>
          </template>

          <div class="tasks-container">
            <EmptyState
                v-if="trainingTasks.length === 0"
                icon="DocumentRemove"
                description="暂无训练任务"
                :min-height="150"
            />

            <div v-else class="task-list">
              <div
                  v-for="task in trainingTasks.slice(0, 5)"
                  :key="task.task_id"
                  class="task-item glass-item"
                  :class="{ 'task-item--active': task.status === 'running' }"
              >
                <div class="task-main">
                  <h4 class="task-name">{{ task.task_name || '未命名项目' }}</h4>
                  <div class="task-time">{{ formatTime(task.created_at) }}</div>
                </div>

                <div class="task-side">
                  <el-tag
                      :type="YOLOUtils.getStatusType(task.status)"
                      size="small"
                      effect="dark"
                  >
                    {{ YOLOUtils.getStatusText(task.status) }}
                  </el-tag>

                  <div class="task-actions">
                    <el-button size="small" text @click="viewTaskDetails(task)">
                      详情
                    </el-button>
                    <el-button
                        v-if="task.status === 'running'"
                        size="small"
                        type="danger"
                        text
                        @click="cancelTask(task)"
                    >
                      取消
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AICard>

        <!-- 可用模型 -->
        <AICard
            title="可用模型"
            icon="Box"
            variant="neon"
            class="animate-fade-slide"
            style="animation-delay: 0.5s;"
        >
          <template #actions>
            <el-button text @click="refreshModels">
              <el-icon><RefreshRight /></el-icon>
            </el-button>
          </template>

          <div class="models-container">
            <EmptyState
                v-if="availableModels.length === 0"
                icon="Coin"
                description="暂无可用模型"
                :min-height="150"
            />

            <div v-else class="model-list">
              <div
                  v-for="model in availableModels.slice(0, 5)"
                  :key="model.model_id"
                  class="model-item glass-item"
              >
                <div class="model-main">
                  <h4 class="model-name">{{ model.name }}</h4>
                  <div class="model-info">
                    <el-tag size="small" effect="plain">{{ model.type }}</el-tag>
                    <span class="model-time">{{ formatTime(model.created_at) }}</span>
                  </div>
                </div>

                <div class="model-actions">
                  <el-button
                      size="small"
                      type="primary"
                      text
                      @click="predictWithModel(model)"
                  >
                    预测
                  </el-button>
                  <el-button
                      size="small"
                      text
                      @click="downloadModel(model)"
                  >
                    下载
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </AICard>
      </el-col>
    </el-row>

    <!-- 数据集上传对话框 -->
    <el-dialog
        v-model="showUploadDialog"
        title="上传训练数据集"
        width="600px"
        class="ai-dialog"
    >
      <el-form
          :model="uploadForm"
          label-width="100px"
          :rules="uploadRules"
          ref="uploadFormRef"
          class="ai-form"
      >
        <el-form-item label="数据集名称" prop="name">
          <el-input v-model="uploadForm.name" placeholder="请输入数据集名称" />
        </el-form-item>

        <el-form-item label="目标类别" prop="classes">
          <div class="classes-input">
            <el-tag
                v-for="(cls, index) in uploadForm.classes"
                :key="index"
                closable
                @close="removeClass(index)"
                type="info"
                effect="dark"
                style="margin-right: 8px; margin-bottom: 8px;"
            >
              {{ cls }}
            </el-tag>
            <el-input
                v-if="inputVisible"
                ref="classInput"
                v-model="inputValue"
                size="small"
                style="width: 120px;"
                @keyup.enter="handleInputConfirm"
                @blur="handleInputConfirm"
            />
            <el-button
                v-else
                size="small"
                class="button-new-tag"
                @click="showInput"
            >
              + 添加类别
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="数据文件" prop="files">
          <el-upload
              ref="datasetUpload"
              :auto-upload="false"
              :file-list="fileList"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              multiple
              accept=".jpg,.jpeg,.png,.txt"
              drag
              class="ai-upload"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持上传图片文件(.jpg, .png)和标注文件(.txt)
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showUploadDialog = false">取消</el-button>
          <el-button
              type="primary"
              class="ai-button-gradient"
              @click="uploadDataset"
              :loading="uploading"
          >
            {{ uploading ? '上传中...' : '开始上传' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 模型预测对话框 -->
    <el-dialog
        v-model="predictDialogVisible"
        title="模型预测测试"
        width="600px"
        class="ai-dialog"
    >
      <div class="predict-section">
        <AICard variant="glass" :show-corner="false">
          <div class="predict-model-info">
            <el-icon><Cpu /></el-icon>
            <span>使用模型: {{ currentModel?.name }}</span>
          </div>
        </AICard>

        <div class="predict-upload">
          <el-upload
              ref="predictUpload"
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="handleImageChange"
              class="ai-upload-inline"
          >
            <el-button type="primary" class="ai-button-gradient">
              <el-icon><Picture /></el-icon>
              选择图片
            </el-button>
          </el-upload>
        </div>

        <div v-if="predictImage" class="image-preview animate-fade-in">
          <img :src="predictImage" alt="预测图片" />
        </div>

        <div v-if="predictResult" class="predict-result animate-fade-slide">
          <AICard variant="glass" :show-corner="false">
            <h4>预测结果</h4>
            <div class="result-summary">
              <MetricCard
                  label="检测对象"
                  :value="predictResult.total_objects"
                  icon="View"
                  type="primary"
                  style="margin-bottom: 16px;"
              />
            </div>

            <div class="predictions-grid">
              <div
                  v-for="(pred, index) in predictResult.predictions"
                  :key="index"
                  class="prediction-card"
              >
                <div class="pred-class">类别 {{ pred.class_id }}</div>
                <div class="pred-confidence">
                  <span class="confidence-value">{{ (pred.confidence * 100).toFixed(1) }}%</span>
                  <span class="confidence-label">置信度</span>
                </div>
              </div>
            </div>
          </AICard>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="predictDialogVisible = false">关闭</el-button>
          <el-button
              type="primary"
              class="ai-button-gradient"
              @click="runPrediction"
              :loading="isPredicting"
              :disabled="!predictImageFile"
          >
            {{ isPredicting ? '预测中...' : '开始预测' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  RefreshRight, Monitor, Upload, List, Box, UploadFilled,
  FolderOpened, Setting, VideoPlay, Picture, Collection,
  FolderRemove, DocumentRemove, Coin, Cpu, View
} from '@element-plus/icons-vue'
import {
  yoloTrainingApi,
  YOLOUtils,
  type YOLOTrainingConfig,
  type DatasetInfo,
  type TrainingTaskInfo,
  type ModelInfo,
  type StatisticsResponse
} from '../api'

// 导入公共组件
import PageHeader from '@/modules/common/components/PageHeader.vue'
import AICard from '@/modules/common/components/AICard.vue'
import StatsGroup from '@/modules/common/components/StatsGroup.vue'
import EmptyState from '@/modules/common/components/EmptyState.vue'
import MetricCard from '@/modules/common/components/MetricCard.vue'

// 响应式数据
const refreshing = ref(false)
const statusLoading = ref(false)
const isTraining = ref(false)

// 系统状态
const systemStatus = ref({
  connected: false,
  gpu_available: false
})

// 统计信息
const statistics = ref<StatisticsResponse>({
  success: true,
  datasets: { total: 0 },
  training_tasks: { total: 0, completed: 0, success_rate: 0 },
  models: { total: 0 },
  predictions: { total: 0 }
})

// 数据集
const datasets = ref<DatasetInfo[]>([])
const selectedDataset = ref<DatasetInfo | null>(null)

// 训练配置
const trainingConfig = reactive<YOLOTrainingConfig>({
  model_type: 'yolov8n',
  dataset_name: '',
  epochs: 100,
  batch_size: 16,
  img_size: 640,
  device: '0',
  project_name: '',
  task_name: 'train'
})

// 训练任务
const trainingTasks = ref<TrainingTaskInfo[]>([])

// 模型
const availableModels = ref<ModelInfo[]>([])

// 上传对话框
const showUploadDialog = ref(false)
const uploading = ref(false)
const uploadForm = reactive({
  name: '',
  classes: [] as string[],
  files: [] as File[]
})
const fileList = ref([])

// 类别输入
const inputVisible = ref(false)
const inputValue = ref('')

// 预测对话框
const predictDialogVisible = ref(false)
const isPredicting = ref(false)
const currentModel = ref<ModelInfo | null>(null)
const predictImage = ref('')
const predictImageFile = ref<File | null>(null)
const predictResult = ref(null)

// 模型选项
const modelOptions = [
  { value: 'yolov8n', label: 'YOLOv8n', description: '最快速度，适合实时应用' },
  { value: 'yolov8s', label: 'YOLOv8s', description: '速度与精度平衡' },
  { value: 'yolov8m', label: 'YOLOv8m', description: '中等大小，较好精度' },
  { value: 'yolov8l', label: 'YOLOv8l', description: '较大模型，高精度' },
  { value: 'yolov8x', label: 'YOLOv8x', description: '最大模型，最高精度' }
]

// 表单验证规则
const formRules = {
  dataset_name: [
    { required: true, message: '请选择数据集', trigger: 'change' }
  ],
  project_name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' }
  ]
}

const uploadRules = {
  name: [
    { required: true, message: '请输入数据集名称', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (!YOLOUtils.validateDatasetName(value)) {
          callback(new Error('数据集名称只能包含字母、数字、下划线和连字符，长度3-50字符'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  classes: [
    {
      validator: (rule: any, value: string[], callback: Function) => {
        if (value.length === 0) {
          callback(new Error('请至少添加一个目标类别'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 计算属性
const systemStats = computed(() => {
  return [
    {
      label: '服务状态',
      value: systemStatus.value.connected ? '已连接' : '未连接',
      icon: 'Monitor',
      type: systemStatus.value.connected ? 'success' : 'danger',
      animated: false
    },
    {
      label: 'GPU状态',
      value: systemStatus.value.gpu_available ? '可用' : '不可用',
      icon: 'Cpu',
      type: systemStatus.value.gpu_available ? 'success' : 'warning',
      animated: false
    },
    {
      label: '训练任务',
      value: statistics.value.training_tasks.total,
      icon: 'List',
      type: 'primary'
    },
    {
      label: '可用模型',
      value: statistics.value.models.total,
      icon: 'Box',
      type: 'info'
    }
  ]
})

const canStartTraining = computed(() => {
  return trainingConfig.dataset_name &&
      trainingConfig.project_name &&
      !isTraining.value &&
      systemStatus.value.connected
})

const runningTasksCount = computed(() => {
  return trainingTasks.value.filter(task => task.status === 'running').length
})

// 方法
const refreshData = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      checkSystemStatus(),
      loadDatasets(),
      loadTrainingTasks(),
      loadModels(),
      loadStatistics()
    ])
  } finally {
    refreshing.value = false
  }
}

const checkSystemStatus = async () => {
  statusLoading.value = true
  try {
    const response = await yoloTrainingApi.checkHealth()
    systemStatus.value = {
      connected: true,
      gpu_available: response.service_info?.gpu_available || false
    }
  } catch (error) {
    systemStatus.value.connected = false
    console.error('检查系统状态失败:', error)
  } finally {
    statusLoading.value = false
  }
}

const loadDatasets = async () => {
  try {
    const response = await yoloTrainingApi.getDatasets()
    datasets.value = response.datasets || []
  } catch (error) {
    console.error('加载数据集失败:', error)
  }
}

const loadTrainingTasks = async () => {
  try {
    const response = await yoloTrainingApi.getTrainingTasks()
    trainingTasks.value = response.tasks || []
  } catch (error) {
    console.error('加载训练任务失败:', error)
  }
}

const loadModels = async () => {
  try {
    const response = await yoloTrainingApi.getModels()
    availableModels.value = response.models || []
  } catch (error) {
    console.error('加载模型失败:', error)
  }
}

const loadStatistics = async () => {
  try {
    const response = await yoloTrainingApi.getStatistics()
    statistics.value = response
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

const selectDataset = (dataset: DatasetInfo) => {
  selectedDataset.value = dataset
  trainingConfig.dataset_name = dataset.name
}

const onDatasetChange = (datasetName: string) => {
  const dataset = datasets.value.find(d => d.name === datasetName)
  selectedDataset.value = dataset || null
}

const startTraining = async () => {
  if (!canStartTraining.value) {
    ElMessage.warning('请检查训练配置和系统状态')
    return
  }

  try {
    isTraining.value = true
    const response = await yoloTrainingApi.startTraining(trainingConfig)

    ElMessage.success('训练任务已创建')

    // 刷新任务列表
    await loadTrainingTasks()
    await loadStatistics()

  } catch (error: any) {
    ElMessage.error('启动训练失败: ' + (error.message || '未知错误'))
  } finally {
    isTraining.value = false
  }
}

// 数据集上传相关方法
const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    (document.querySelector('.classes-input input') as HTMLInputElement)?.focus()
  })
}

const handleInputConfirm = () => {
  if (inputValue.value && !uploadForm.classes.includes(inputValue.value)) {
    if (YOLOUtils.validateClassName(inputValue.value)) {
      uploadForm.classes.push(inputValue.value)
    } else {
      ElMessage.error('类别名称格式不正确')
    }
  }
  inputVisible.value = false
  inputValue.value = ''
}

const removeClass = (index: number) => {
  uploadForm.classes.splice(index, 1)
}

const handleFileChange = (file: any, fileList: any) => {
  uploadForm.files = fileList.map((f: any) => f.raw).filter(Boolean)
}

const handleFileRemove = (file: any, fileList: any) => {
  uploadForm.files = fileList.map((f: any) => f.raw).filter(Boolean)
}

const uploadDataset = async () => {
  if (uploadForm.files.length === 0) {
    ElMessage.error('请选择要上传的文件')
    return
  }

  try {
    uploading.value = true
    await yoloTrainingApi.uploadDataset(
        uploadForm.name,
        uploadForm.classes,
        uploadForm.files
    )

    ElMessage.success('数据集上传成功')
    showUploadDialog.value = false

    // 重置表单
    uploadForm.name = ''
    uploadForm.classes = []
    uploadForm.files = []
    fileList.value = []

    // 刷新数据集列表
    await loadDatasets()
    await loadStatistics()

  } catch (error: any) {
    ElMessage.error('数据集上传失败: ' + (error.message || '未知错误'))
  } finally {
    uploading.value = false
  }
}

// 模型预测相关方法
const predictWithModel = (model: ModelInfo) => {
  currentModel.value = model
  predictDialogVisible.value = true
  predictResult.value = null
  predictImage.value = ''
  predictImageFile.value = null
}

const handleImageChange = (file: any) => {
  predictImageFile.value = file.raw

  const reader = new FileReader()
  reader.onload = (e) => {
    predictImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file.raw)
}

const runPrediction = async () => {
  if (!predictImageFile.value || !currentModel.value) return

  try {
    isPredicting.value = true
    const result = await yoloTrainingApi.predict(
        currentModel.value.model_id,
        predictImageFile.value
    )
    predictResult.value = result
    ElMessage.success('预测完成')
  } catch (error: any) {
    ElMessage.error('预测失败: ' + (error.message || '未知错误'))
  } finally {
    isPredicting.value = false
  }
}

// 工具方法
const formatTime = (timeStr: string | undefined) => {
  if (!timeStr) return '未知时间'
  return new Date(timeStr).toLocaleString('zh-CN')
}

const getDatasetStatusType = (status: string) => {
  const statusMap = {
    'ready': 'success',
    'uploading': 'warning',
    'processing': 'warning',
    'error': 'danger'
  }
  return statusMap[status] || 'info'
}

const getDatasetStatusText = (status: string) => {
  const statusMap = {
    'ready': '就绪',
    'uploading': '上传中',
    'processing': '处理中',
    'error': '错误'
  }
  return statusMap[status] || status
}

const viewDatasetDetails = (dataset: DatasetInfo) => {
  ElMessageBox.alert(
      `<div class="detail-content">
        <p><strong>数据集ID:</strong> ${dataset.dataset_id}</p>
        <p><strong>名称:</strong> ${dataset.name}</p>
        <p><strong>类别数:</strong> ${dataset.num_classes}</p>
        <p><strong>图片数:</strong> ${dataset.total_images}</p>
        <p><strong>状态:</strong> ${getDatasetStatusText(dataset.status)}</p>
        <p><strong>类别列表:</strong> ${dataset.classes.join(', ')}</p>
      </div>`,
      '数据集详情',
      {
        dangerouslyUseHTMLString: true,
        customClass: 'ai-message-box'
      }
  )
}

const viewTaskDetails = (task: TrainingTaskInfo) => {
  ElMessageBox.alert(
      `<div class="detail-content">
        <p><strong>任务ID:</strong> ${task.task_id}</p>
        <p><strong>任务名称:</strong> ${task.task_name}</p>
        <p><strong>状态:</strong> ${YOLOUtils.getStatusText(task.status)}</p>
        <p><strong>创建时间:</strong> ${formatTime(task.created_at)}</p>
        <p><strong>完成时间:</strong> ${formatTime(task.completed_at) || '未完成'}</p>
      </div>`,
      '任务详情',
      {
        dangerouslyUseHTMLString: true,
        customClass: 'ai-message-box'
      }
  )
}

const cancelTask = async (task: TrainingTaskInfo) => {
  try {
    await ElMessageBox.confirm('确定要取消这个训练任务吗？', '确认取消', {
      type: 'warning',
      customClass: 'ai-message-box'
    })

    ElMessage.info('任务取消功能开发中...')
  } catch (error) {
    // 用户取消操作
  }
}

const downloadModel = (model: ModelInfo) => {
  ElMessage.info('模型下载功能开发中...')
}

const refreshTasks = () => {
  loadTrainingTasks()
}

const refreshModels = () => {
  loadModels()
}

// 组件挂载时初始化数据
onMounted(() => {
  refreshData()
})
</script>

<style scoped lang="scss">
@use '@/styles/mixins' as mixins;
@use '@/styles/animations.scss';

.yolo-training-container {
  padding: 24px;
  min-height: 100vh;
}

// 玻璃态卡片样式
.glass-card {
  @include mixins.glass-card;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--ai-primary);
    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.2);
  }

  &--selected {
    border-color: var(--ai-primary);
    background: rgba(99, 102, 241, 0.1);
  }
}

.glass-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(4px);
  }
}

// 数据集卡片
.dataset-grid {
  display: grid;
  gap: 16px;
}

.dataset-card {
  .dataset-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    .dataset-name {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--ai-text-primary);
    }
  }

  .dataset-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: var(--ai-text-secondary);

      .el-icon {
        color: var(--ai-primary);
      }
    }
  }

  .dataset-classes {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;

    .more-classes {
      font-size: 12px;
      color: var(--ai-text-muted);
      line-height: 22px;
    }
  }

  .dataset-actions {
    display: flex;
    justify-content: flex-end;
  }
}

// 任务列表
.task-list, .model-list {
  max-height: 400px;
  overflow-y: auto;
  @include mixins.scrollbar(6px, transparent, rgba(255, 255, 255, 0.2));
}

.task-item {
  &--active {
    border-color: var(--ai-accent);
    background: rgba(20, 184, 166, 0.1);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--ai-accent);
      border-radius: 0 3px 3px 0;
    }
  }

  .task-main {
    flex: 1;

    .task-name {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 500;
      color: var(--ai-text-primary);
    }

    .task-time {
      font-size: 12px;
      color: var(--ai-text-muted);
    }
  }

  .task-side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .task-actions {
    display: flex;
    gap: 8px;
  }
}

// 模型列表
.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .model-main {
    flex: 1;

    .model-name {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 500;
      color: var(--ai-text-primary);
    }

    .model-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .model-time {
        font-size: 12px;
        color: var(--ai-text-muted);
      }
    }
  }

  .model-actions {
    display: flex;
    gap: 8px;
  }
}

// 预测部分
.predict-section {
  .predict-model-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    color: var(--ai-primary);

    .el-icon {
      font-size: 20px;
    }
  }

  .predict-upload {
    margin: 20px 0;
    text-align: center;
  }

  .image-preview {
    text-align: center;
    margin: 20px 0;

    img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
  }

  .predict-result {
    h4 {
      margin: 0 0 16px 0;
      color: var(--ai-text-primary);
    }

    .result-summary {
      margin-bottom: 20px;
    }

    .predictions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;

      .prediction-card {
        @include mixins.glass-card;
        padding: 16px;
        text-align: center;

        .pred-class {
          font-size: 14px;
          color: var(--ai-text-secondary);
          margin-bottom: 8px;
        }

        .pred-confidence {
          .confidence-value {
            display: block;
            font-size: 24px;
            font-weight: 600;
            color: var(--ai-primary);
          }

          .confidence-label {
            display: block;
            font-size: 12px;
            color: var(--ai-text-muted);
          }
        }
      }
    }
  }
}

// 表单选项样式
.option-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .option-meta {
    font-size: 12px;
    color: var(--ai-text-muted);
  }
}

.model-option {
  display: flex;
  flex-direction: column;

  .model-name {
    font-weight: 500;
  }

  .model-desc {
    font-size: 12px;
    color: var(--ai-text-muted);
    margin-top: 2px;
  }
}

// 类别输入
.classes-input {
  min-height: 60px;
  padding: 8px 0;

  .button-new-tag {
    border-style: dashed;
  }
}

// 按钮样式
.ai-button-gradient {
  @include mixins.ai-button-gradient;
}

.ai-button-primary {
  background: var(--ai-primary);
  border-color: var(--ai-primary);

  &:hover {
    background: var(--ai-primary-light);
    border-color: var(--ai-primary-light);
  }
}

// 上传组件样式
.ai-upload {
  :deep(.el-upload-dragger) {
    @include mixins.upload-area;
    height: 180px;
  }
}

.ai-upload-inline {
  display: inline-block;
}

// 对话框样式
.ai-dialog {
  :deep(.el-dialog) {
    background: var(--ai-bg-secondary);
    border: 1px solid var(--ai-border);
    border-radius: 16px;

    .el-dialog__header {
      border-bottom: 1px solid var(--ai-border);
    }

    .el-dialog__title {
      color: var(--ai-text-primary);
      font-weight: 600;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 消息框样式
:global(.ai-message-box) {
  .el-message-box {
    background: var(--ai-bg-secondary);
    border: 1px solid var(--ai-border);

    .el-message-box__title {
      color: var(--ai-text-primary);
    }

    .detail-content {
      p {
        margin: 8px 0;
        color: var(--ai-text-secondary);

        strong {
          color: var(--ai-text-primary);
        }
      }
    }
  }
}

// 响应式布局
@media (max-width: 1200px) {
  .el-col-16 {
    width: 100%;
    margin-bottom: 24px;
  }

  .el-col-8 {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .yolo-training-container {
    padding: 16px;
  }

  .dataset-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px !important;
  }

  .predictions-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>