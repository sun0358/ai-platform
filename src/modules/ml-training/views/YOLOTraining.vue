<!--
前端YOLO训练管理页面
文件路径: frontend/src/modules/ml-training/views/YOLOTraining.vue
-->

<template>
  <div class="yolo-training-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>YOLO模型训练</h1>
        <p>上传数据集，配置训练参数，训练YOLO目标检测模型</p>
      </div>
      <div class="header-actions">
        <el-button @click="refreshData" :loading="refreshing">
          <el-icon><RefreshRight /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <el-row :gutter="24">
      <!-- 左侧：训练配置和数据集管理 -->
      <el-col :span="16">
        <!-- 系统状态 -->
        <el-card class="status-card" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>Ubuntu训练服务状态</span>
              <el-button text @click="checkSystemStatus" :loading="statusLoading">
                <el-icon><Monitor /></el-icon>
                检查状态
              </el-button>
            </div>
          </template>

          <div class="system-status">
            <div class="status-grid">
              <div class="status-item">
                <div class="status-label">服务状态</div>
                <el-tag :type="systemStatus.connected ? 'success' : 'danger'" size="large">
                  {{ systemStatus.connected ? '已连接' : '连接失败' }}
                </el-tag>
              </div>
              <div class="status-item" v-if="systemStatus.connected">
                <div class="status-label">GPU状态</div>
                <el-tag :type="systemStatus.gpu_available ? 'success' : 'warning'" size="large">
                  {{ systemStatus.gpu_available ? '可用' : '不可用' }}
                </el-tag>
              </div>
              <div class="status-item">
                <div class="status-label">训练任务</div>
                <span class="status-value">{{ statistics.training_tasks.total }}</span>
              </div>
              <div class="status-item">
                <div class="status-label">可用模型</div>
                <span class="status-value">{{ statistics.models.total }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 数据集管理 -->
        <el-card class="dataset-card" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>数据集管理</span>
              <el-button type="primary" @click="showUploadDialog = true">
                <el-icon><Upload /></el-icon>
                上传数据集
              </el-button>
            </div>
          </template>

          <div class="datasets-list">
            <div v-if="datasets.length === 0" class="empty-state">
              <el-empty description="暂无数据集">
                <el-button type="primary" @click="showUploadDialog = true">
                  上传第一个数据集
                </el-button>
              </el-empty>
            </div>
            <div v-else>
              <div
                  v-for="dataset in datasets"
                  :key="dataset.dataset_id"
                  class="dataset-item"
                  :class="{ 'selected': selectedDataset?.dataset_id === dataset.dataset_id }"
                  @click="selectDataset(dataset)"
              >
                <div class="dataset-info">
                  <div class="dataset-name">{{ dataset.name }}</div>
                  <div class="dataset-details">
                    <span>{{ dataset.num_classes }} 类别</span>
                    <span>{{ dataset.total_images }} 图片</span>
                    <el-tag :type="getDatasetStatusType(dataset.status)" size="small">
                      {{ getDatasetStatusText(dataset.status) }}
                    </el-tag>
                  </div>
                  <div class="dataset-classes">
                    <el-tag
                        v-for="cls in dataset.classes.slice(0, 3)"
                        :key="cls"
                        size="small"
                        style="margin-right: 4px;"
                    >
                      {{ cls }}
                    </el-tag>
                    <span v-if="dataset.classes.length > 3" class="more-classes">
                      +{{ dataset.classes.length - 3 }}
                    </span>
                  </div>
                </div>
                <div class="dataset-actions">
                  <el-button size="small" @click.stop="viewDatasetDetails(dataset)">
                    详情
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 训练配置 -->
        <el-card class="config-card">
          <template #header>
            <div class="card-header">
              <span>训练配置</span>
              <el-button
                  type="primary"
                  :loading="isTraining"
                  @click="startTraining"
                  :disabled="!canStartTraining"
              >
                {{ isTraining ? '训练中...' : '开始训练' }}
              </el-button>
            </div>
          </template>

          <el-form :model="trainingConfig" label-width="120px" :rules="formRules" ref="configForm">
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
                  <span>{{ dataset.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px;">
                    {{ dataset.num_classes }}类 | {{ dataset.total_images }}图
                  </span>
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
                <el-option label="YOLOv8n (最快)" value="yolov8n">
                  <div>
                    <span>YOLOv8n</span>
                    <div style="font-size: 12px; color: #909399;">最快速度，适合实时应用</div>
                  </div>
                </el-option>
                <el-option label="YOLOv8s (平衡)" value="yolov8s">
                  <div>
                    <span>YOLOv8s</span>
                    <div style="font-size: 12px; color: #909399;">速度与精度平衡</div>
                  </div>
                </el-option>
                <el-option label="YOLOv8m (中等)" value="yolov8m">
                  <div>
                    <span>YOLOv8m</span>
                    <div style="font-size: 12px; color: #909399;">中等大小，较好精度</div>
                  </div>
                </el-option>
                <el-option label="YOLOv8l (较大)" value="yolov8l">
                  <div>
                    <span>YOLOv8l</span>
                    <div style="font-size: 12px; color: #909399;">较大模型，高精度</div>
                  </div>
                </el-option>
                <el-option label="YOLOv8x (最大)" value="yolov8x">
                  <div>
                    <span>YOLOv8x</span>
                    <div style="font-size: 12px; color: #909399;">最大模型，最高精度</div>
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
        </el-card>
      </el-col>

      <!-- 右侧：训练任务和模型管理 -->
      <el-col :span="8">
        <!-- 训练任务 -->
        <el-card class="tasks-card" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>训练任务</span>
              <el-badge :value="runningTasksCount" type="warning" :hidden="runningTasksCount === 0">
                <el-button text @click="refreshTasks">
                  <el-icon><List /></el-icon>
                </el-button>
              </el-badge>
            </div>
          </template>

          <div class="tasks-list">
            <div v-if="trainingTasks.length === 0" class="empty-state">
              <el-empty description="暂无训练任务" :image-size="80" />
            </div>
            <div v-else>
              <div
                  v-for="task in trainingTasks.slice(0, 5)"
                  :key="task.task_id"
                  class="task-item"
                  :class="{ 'active': task.status === 'running' }"
              >
                <div class="task-header">
                  <span class="task-name">{{ task.task_name || '未命名项目' }}</span>
                  <el-tag
                      :type="YOLOUtils.getStatusType(task.status)"
                      size="small"
                  >
                    {{ YOLOUtils.getStatusText(task.status) }}
                  </el-tag>
                </div>

                <div class="task-details">
                  <div class="task-time">{{ formatTime(task.created_at) }}</div>
                </div>

                <div class="task-actions">
                  <el-button size="small" @click="viewTaskDetails(task)">
                    详情
                  </el-button>
                  <el-button
                      v-if="task.status === 'running'"
                      size="small"
                      type="danger"
                      @click="cancelTask(task)"
                  >
                    取消
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 可用模型 -->
        <el-card class="models-card">
          <template #header>
            <div class="card-header">
              <span>可用模型</span>
              <el-button text @click="refreshModels">
                <el-icon><Box /></el-icon>
              </el-button>
            </div>
          </template>

          <div class="models-list">
            <div v-if="availableModels.length === 0" class="empty-state">
              <el-empty description="暂无可用模型" :image-size="80" />
            </div>
            <div v-else>
              <div
                  v-for="model in availableModels.slice(0, 5)"
                  :key="model.model_id"
                  class="model-item"
              >
                <div class="model-header">
                  <span class="model-name">{{ model.name }}</span>
                  <el-tag size="small">{{ model.type }}</el-tag>
                </div>
                <div class="model-details">
                  <div class="model-time">{{ formatTime(model.created_at) }}</div>
                </div>
                <div class="model-actions">
                  <el-button size="small" @click="predictWithModel(model)">预测</el-button>
                  <el-button size="small" @click="downloadModel(model)">下载</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据集上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传训练数据集" width="600px">
      <el-form :model="uploadForm" label-width="100px" :rules="uploadRules" ref="uploadFormRef">
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
            <el-button v-else size="small" @click="showInput">+ 添加类别</el-button>
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
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button
            type="primary"
            @click="uploadDataset"
            :loading="uploading"
        >
          {{ uploading ? '上传中...' : '开始上传' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 模型预测对话框 -->
    <el-dialog v-model="predictDialogVisible" title="模型预测测试" width="600px">
      <div class="predict-section">
        <div class="predict-model-info">
          <h4>使用模型: {{ currentModel?.name }}</h4>
        </div>

        <el-upload
            ref="predictUpload"
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :on-change="handleImageChange"
        >
          <el-button type="primary">选择图片</el-button>
        </el-upload>

        <div v-if="predictImage" class="image-preview">
          <img :src="predictImage" alt="预测图片" />
        </div>

        <div v-if="predictResult" class="predict-result">
          <h4>预测结果:</h4>
          <div class="result-summary">
            <span><strong>检测对象数:</strong> {{ predictResult.total_objects }}</span>
          </div>
          <div class="predictions-list">
            <div
                v-for="(pred, index) in predictResult.predictions"
                :key="index"
                class="prediction-item"
            >
              <span>类别ID: {{ pred.class_id }}</span>
              <span>置信度: {{ (pred.confidence * 100).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="predictDialogVisible = false">关闭</el-button>
        <el-button
            type="primary"
            @click="runPrediction"
            :loading="isPredicting"
            :disabled="!predictImageFile"
        >
          {{ isPredicting ? '预测中...' : '开始预测' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  RefreshRight, Monitor, Upload, List, Box, UploadFilled
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
      `<p><strong>数据集ID:</strong> ${dataset.dataset_id}</p>
     <p><strong>名称:</strong> ${dataset.name}</p>
     <p><strong>类别数:</strong> ${dataset.num_classes}</p>
     <p><strong>图片数:</strong> ${dataset.total_images}</p>
     <p><strong>状态:</strong> ${getDatasetStatusText(dataset.status)}</p>
     <p><strong>类别列表:</strong> ${dataset.classes.join(', ')}</p>`,
      '数据集详情',
      { dangerouslyUseHTMLString: true }
  )
}

const viewTaskDetails = (task: TrainingTaskInfo) => {
  ElMessageBox.alert(
      `<p><strong>任务ID:</strong> ${task.task_id}</p>
     <p><strong>任务名称:</strong> ${task.task_name}</p>
     <p><strong>状态:</strong> ${YOLOUtils.getStatusText(task.status)}</p>
     <p><strong>创建时间:</strong> ${formatTime(task.created_at)}</p>
     <p><strong>完成时间:</strong> ${formatTime(task.completed_at) || '未完成'}</p>`,
      '任务详情',
      { dangerouslyUseHTMLString: true }
  )
}

const cancelTask = async (task: TrainingTaskInfo) => {
  try {
    await ElMessageBox.confirm('确定要取消这个训练任务吗？', '确认取消', {
      type: 'warning'
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
.yolo-training-container {
  padding: 24px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  .header-content {
    h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }

    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.system-status {
  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
  }

  .status-item {
    text-align: center;
    padding: 16px;
    background: #f8f9ff;
    border-radius: 6px;

    .status-label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 8px;
    }

    .status-value {
      font-size: 24px;
      font-weight: 600;
      color: #409eff;
    }
  }
}

.datasets-list {
  .dataset-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
    }

    &.selected {
      border-color: #409eff;
      background-color: #f0f9ff;
    }

    .dataset-info {
      flex: 1;

      .dataset-name {
        font-weight: 500;
        margin-bottom: 8px;
      }

      .dataset-details {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        font-size: 13px;
        color: #606266;
      }

      .dataset-classes {
        .more-classes {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}

.tasks-list, .models-list {
  max-height: 400px;
  overflow-y: auto;

  .task-item, .model-item {
    padding: 12px;
    margin-bottom: 8px;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
    }

    &.active {
      border-color: #67c23a;
      background-color: #f0f9ff;
    }

    .task-header, .model-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .task-name, .model-name {
        font-weight: 500;
        font-size: 14px;
      }
    }

    .task-details, .model-details {
      margin: 8px 0;

      .task-time, .model-time {
        font-size: 12px;
        color: #909399;
      }
    }

    .task-actions, .model-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
  }
}

.classes-input {
  min-height: 60px;
  padding: 8px 0;
}

.predict-section {
  .predict-model-info {
    margin-bottom: 16px;
    padding: 12px;
    background: #f8f9ff;
    border-radius: 6px;

    h4 {
      margin: 0;
      color: #409eff;
    }
  }

  .image-preview {
    margin: 20px 0;
    text-align: center;

    img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  }

  .predict-result {
    margin-top: 20px;
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 6px;

    h4 {
      margin: 0 0 12px 0;
      color: #303133;
    }

    .result-summary {
      margin-bottom: 12px;
      font-weight: 500;
    }

    .predictions-list {
      .prediction-item {
        display: flex;
        justify-content: space-between;
        margin: 8px 0;
        padding: 8px 12px;
        background-color: white;
        border-radius: 4px;
        font-size: 13px;
      }
    }
  }
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

// 响应式布局
@media (max-width: 1200px) {
  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .yolo-training-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>