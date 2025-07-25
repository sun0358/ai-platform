<template>
  <div class="training-tasks-page ai-gradient-bg">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><List /></el-icon>
          训练任务管理
        </h1>
        <p class="page-subtitle">监控和管理机器学习训练任务</p>
      </div>
      <div class="header-actions">
        <el-button @click="refreshTasks">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="router.push('/ml-training/create')">
          <el-icon><Plus /></el-icon>
          创建任务
        </el-button>
      </div>
    </div>

    <!-- 任务统计 -->
    <div class="task-statistics">
      <MetricCard
          label="运行中"
          :value="taskStats.running"
          icon="Loading"
          type="primary"
      />
      <MetricCard
          label="排队中"
          :value="taskStats.queued"
          icon="Timer"
          type="warning"
      />
      <MetricCard
          label="已完成"
          :value="taskStats.completed"
          icon="CircleCheck"
          type="success"
      />
      <MetricCard
          label="失败"
          :value="taskStats.failed"
          icon="CircleClose"
          type="danger"
      />
      <MetricCard
          label="GPU使用率"
          :value="taskStats.gpuUsage"
          icon="Cpu"
          type="info"
          suffix="%"
      />
    </div>

    <!-- 任务筛选 -->
    <div class="task-filters">
      <AICard variant="glass">
        <div class="filter-content">
          <el-form :model="filters" inline>
            <el-form-item label="状态">
              <el-select v-model="filters.status" placeholder="全部状态" clearable>
                <el-option label="运行中" value="running" />
                <el-option label="排队中" value="queued" />
                <el-option label="已完成" value="completed" />
                <el-option label="失败" value="failed" />
                <el-option label="已暂停" value="paused" />
              </el-select>
            </el-form-item>
            <el-form-item label="模型类型">
              <el-select v-model="filters.modelType" placeholder="全部类型" clearable>
                <el-option label="分类模型" value="classification" />
                <el-option label="回归模型" value="regression" />
                <el-option label="聚类模型" value="clustering" />
                <el-option label="深度学习" value="deeplearning" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                  v-model="filters.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
              />
            </el-form-item>
            <el-form-item>
              <el-input
                  v-model="filters.search"
                  placeholder="搜索任务名称..."
                  clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </div>
      </AICard>
    </div>

    <!-- 任务列表 -->
    <div class="task-list">
      <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="task-card"
          :class="`task-card--${task.status}`"
      >
        <AICard variant="glass">
          <div class="task-content">
            <!-- 任务基本信息 -->
            <div class="task-header">
              <div class="task-info">
                <h3>{{ task.name }}</h3>
                <div class="task-meta">
                  <el-tag :type="getStatusType(task.status)">
                    {{ getStatusText(task.status) }}
                  </el-tag>
                  <span class="meta-item">
                    <el-icon><User /></el-icon>
                    {{ task.creator }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Clock /></el-icon>
                    {{ formatTime(task.createdAt) }}
                  </span>
                </div>
              </div>
              <div class="task-actions">
                <el-dropdown trigger="click">
                  <el-button circle>
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                          v-if="task.status === 'running'"
                          @click="pauseTask(task)"
                      >
                        <el-icon><VideoPause /></el-icon>
                        暂停任务
                      </el-dropdown-item>
                      <el-dropdown-item
                          v-if="task.status === 'paused'"
                          @click="resumeTask(task)"
                      >
                        <el-icon><VideoPlay /></el-icon>
                        恢复任务
                      </el-dropdown-item>
                      <el-dropdown-item @click="viewDetails(task)">
                        <el-icon><View /></el-icon>
                        查看详情
                      </el-dropdown-item>
                      <el-dropdown-item @click="viewLogs(task)">
                        <el-icon><Document /></el-icon>
                        查看日志
                      </el-dropdown-item>
                      <el-dropdown-item
                          v-if="task.status === 'completed'"
                          @click="downloadModel(task)"
                      >
                        <el-icon><Download /></el-icon>
                        下载模型
                      </el-dropdown-item>
                      <el-dropdown-item
                          divided
                          @click="deleteTask(task)"
                      >
                        <el-icon><Delete /></el-icon>
                        删除任务
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <!-- 任务进度 -->
            <div v-if="task.status === 'running'" class="task-progress">
              <div class="progress-info">
                <span>训练进度</span>
                <span>{{ task.currentEpoch }}/{{ task.totalEpochs }} 轮</span>
              </div>
              <el-progress
                  :percentage="task.progress"
                  :stroke-width="10"
                  :color="customProgressColors"
              />
              <div class="progress-details">
                <span>预计剩余时间: {{ task.estimatedTime }}</span>
                <span>当前损失: {{ task.currentLoss?.toFixed(4) || '-' }}</span>
              </div>
            </div>

            <!-- 任务指标 -->
            <div class="task-metrics">
              <div class="metric-group">
                <h4>模型信息</h4>
                <div class="metric-items">
                  <div class="metric-item">
                    <span class="label">模型类型</span>
                    <span class="value">{{ task.modelType }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">数据集</span>
                    <span class="value">{{ task.datasetName }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">参数数量</span>
                    <span class="value">{{ task.parameterCount }}</span>
                  </div>
                </div>
              </div>

              <div v-if="task.status === 'completed'" class="metric-group">
                <h4>训练结果</h4>
                <div class="metric-items">
                  <div class="metric-item">
                    <span class="label">最终损失</span>
                    <span class="value success">{{ task.finalLoss?.toFixed(4) }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">准确率</span>
                    <span class="value success">{{ task.accuracy }}%</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">训练时长</span>
                    <span class="value">{{ task.duration }}</span>
                  </div>
                </div>
              </div>

              <div class="metric-group">
                <h4>资源使用</h4>
                <div class="resource-usage">
                  <div class="resource-item">
                    <span class="resource-label">
                      <el-icon><Cpu /></el-icon>
                      GPU
                    </span>
                    <el-progress
                        :percentage="task.gpuUsage || 0"
                        :show-text="false"
                        :stroke-width="6"
                    />
                    <span class="resource-value">{{ task.gpuUsage || 0 }}%</span>
                  </div>
                  <div class="resource-item">
                    <span class="resource-label">
                      <el-icon><Coin /></el-icon>
                      内存
                    </span>
                    <el-progress
                        :percentage="task.memoryUsage || 0"
                        :show-text="false"
                        :stroke-width="6"
                    />
                    <span class="resource-value">{{ task.memoryUsage || 0 }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 实时日志预览 -->
            <div v-if="task.status === 'running'" class="task-logs">
              <div class="logs-header">
                <h4>实时日志</h4>
                <el-button text size="small" @click="viewLogs(task)">
                  查看全部
                </el-button>
              </div>
              <div class="logs-content">
                <pre>{{ task.recentLogs || '等待日志输出...' }}</pre>
              </div>
            </div>
          </div>
        </AICard>
      </div>

      <el-empty v-if="filteredTasks.length === 0" description="没有找到匹配的任务" />
    </div>

    <!-- 任务详情对话框 -->
    <el-dialog
        v-model="showDetailsDialog"
        title="任务详情"
        width="800px"
    >
      <div v-if="selectedTask" class="task-details-dialog">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="任务ID">
                {{ selectedTask.id }}
              </el-descriptions-item>
              <el-descriptions-item label="任务名称">
                {{ selectedTask.name }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatDateTime(selectedTask.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="开始时间">
                {{ formatDateTime(selectedTask.startedAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="完成时间">
                {{ selectedTask.completedAt ? formatDateTime(selectedTask.completedAt) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="优先级">
                <el-tag>{{ getPriorityText(selectedTask.priority) }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="训练配置" name="config">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="批次大小">
                {{ selectedTask.config?.batchSize }}
              </el-descriptions-item>
              <el-descriptions-item label="学习率">
                {{ selectedTask.config?.learningRate }}
              </el-descriptions-item>
              <el-descriptions-item label="优化器">
                {{ selectedTask.config?.optimizer }}
              </el-descriptions-item>
              <el-descriptions-item label="损失函数">
                {{ selectedTask.config?.lossFunction }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="训练曲线" name="charts">
            <div class="training-charts">
              <DataVisualization
                  type="line"
                  :data="getTrainingChartData()"
                  :height="300"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  List, Refresh, Plus, Loading, Timer, CircleCheck,
  CircleClose, Cpu, Search, User, Clock, More,
  VideoPause, VideoPlay, View, Document, Download,
  Delete, Coin
} from '@element-plus/icons-vue'
import AICard from '@/modules/common/components/AICard.vue'
import MetricCard from '@/modules/common/components/MetricCard.vue'
import DataVisualization from '@/modules/common/components/DataVisualization.vue'

const router = useRouter()

// 响应式数据
const showDetailsDialog = ref(false)
const selectedTask = ref<any>(null)
const activeTab = ref('info')

const filters = ref({
  status: '',
  modelType: '',
  dateRange: null,
  search: ''
})

const taskStats = ref({
  running: 3,
  queued: 5,
  completed: 42,
  failed: 2,
  gpuUsage: 75
})

const tasks = ref([
  {
    id: 'task_001',
    name: '客户分类模型训练',
    status: 'running',
    creator: '张三',
    createdAt: new Date(Date.now() - 3600000),
    modelType: '随机森林',
    datasetName: 'customer_data.csv',
    parameterCount: '1.2M',
    progress: 65,
    currentEpoch: 13,
    totalEpochs: 20,
    currentLoss: 0.3421,
    estimatedTime: '25分钟',
    gpuUsage: 82,
    memoryUsage: 65,
    recentLogs: 'Epoch 13/20 - loss: 0.3421 - accuracy: 0.8932\nValidation loss: 0.3856\nSaving checkpoint...',
    priority: 5
  },
  {
    id: 'task_002',
    name: '图像识别模型优化',
    status: 'completed',
    creator: '李四',
    createdAt: new Date(Date.now() - 7200000),
    startedAt: new Date(Date.now() - 7200000),
    completedAt: new Date(Date.now() - 3600000),
    modelType: '卷积神经网络',
    datasetName: 'images_dataset',
    parameterCount: '25.6M',
    finalLoss: 0.0234,
    accuracy: 96.5,
    duration: '1小时',
    priority: 10
  },
  {
    id: 'task_003',
    name: '销售预测模型',
    status: 'queued',
    creator: '王五',
    createdAt: new Date(Date.now() - 1800000),
    modelType: 'LSTM',
    datasetName: 'sales_history.xlsx',
    parameterCount: '5.8M',
    priority: 3
  },
  {
    id: 'task_004',
    name: '异常检测模型',
    status: 'failed',
    creator: '赵六',
    createdAt: new Date(Date.now() - 10800000),
    modelType: '自编码器',
    datasetName: 'anomaly_data.csv',
    parameterCount: '3.2M',
    error: 'CUDA out of memory',
    priority: 5
  },
  {
    id: 'task_005',
    name: '推荐系统训练',
    status: 'paused',
    creator: '钱七',
    createdAt: new Date(Date.now() - 5400000),
    modelType: '协同过滤',
    datasetName: 'user_behavior.json',
    parameterCount: '800K',
    progress: 40,
    currentEpoch: 8,
    totalEpochs: 20,
    priority: 7
  }
])

// 计算属性
const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    if (filters.value.status && task.status !== filters.value.status) {
      return false
    }
    if (filters.value.search && !task.name.toLowerCase().includes(filters.value.search.toLowerCase())) {
      return false
    }
    return true
  })
})

const customProgressColors = [
  { color: '#ef4444', percentage: 20 },
  { color: '#f59e0b', percentage: 40 },
  { color: '#3b82f6', percentage: 60 },
  { color: '#10b981', percentage: 80 },
  { color: '#8b5cf6', percentage: 100 }
]

// 方法
const refreshTasks = () => {
  ElMessage.success('任务列表已刷新')
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    running: 'primary',
    queued: 'warning',
    completed: 'success',
    failed: 'danger',
    paused: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    running: '运行中',
    queued: '排队中',
    completed: '已完成',
    failed: '失败',
    paused: '已暂停'
  }
  return texts[status] || status
}

const getPriorityText = (priority: number) => {
  if (priority >= 8) return '高'
  if (priority >= 4) return '中'
  return '低'
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
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

const pauseTask = async (task: any) => {
  try {
    await ElMessageBox.confirm('确定要暂停该任务吗？', '暂停任务', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    task.status = 'paused'
    ElMessage.success('任务已暂停')
  } catch {
    // 用户取消
  }
}

const resumeTask = (task: any) => {
  task.status = 'running'
  ElMessage.success('任务已恢复')
}

const viewDetails = (task: any) => {
  selectedTask.value = task
  showDetailsDialog.value = true
}

const viewLogs = (task: any) => {
  ElMessage.info(`查看任务日志: ${task.name}`)
}

const downloadModel = (task: any) => {
  ElMessage.success(`开始下载模型: ${task.name}`)
}

const deleteTask = async (task: any) => {
  try {
    await ElMessageBox.confirm('删除任务将无法恢复，确定继续吗？', '删除任务', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const index = tasks.value.indexOf(task)
    if (index > -1) {
      tasks.value.splice(index, 1)
    }
    ElMessage.success('任务已删除')
  } catch {
    // 用户取消
  }
}

const getTrainingChartData = () => {
  return {
    categories: Array.from({ length: 20 }, (_, i) => `Epoch ${i + 1}`),
    series: [
      {
        name: '训练损失',
        data: Array.from({ length: 20 }, (_, i) => 1 - i * 0.04 + Math.random() * 0.1)
      },
      {
        name: '验证损失',
        data: Array.from({ length: 20 }, (_, i) => 1.1 - i * 0.04 + Math.random() * 0.15)
      }
    ]
  }
}

// 生命周期
let refreshInterval: number | null = null

onMounted(() => {
  // 定时刷新运行中的任务
  refreshInterval = window.setInterval(() => {
    tasks.value.forEach(task => {
      if (task.status === 'running' && task.progress < 100) {
        task.progress = Math.min(task.progress + Math.random() * 5, 100)
        task.currentEpoch = Math.min(task.currentEpoch + 1, task.totalEpochs)
        task.currentLoss = Math.max(0.1, task.currentLoss - Math.random() * 0.01)
      }
    })
  }, 3000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/ai-theme.scss';

.training-tasks-page {
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

.task-statistics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.task-filters {
  margin-bottom: 32px;

  .filter-content {
    padding: 20px;

    :deep(.el-form) {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }

    :deep(.el-form-item) {
      margin: 0;
    }

    :deep(.el-form-item__label) {
      color: var(--ai-text-secondary);
    }
  }
}

.task-list {
  .task-card {
    margin-bottom: 24px;

    &--running {
      :deep(.ai-card) {
        border-left: 3px solid var(--ai-primary);
      }
    }

    &--completed {
      :deep(.ai-card) {
        border-left: 3px solid var(--ai-success);
      }
    }

    &--failed {
      :deep(.ai-card) {
        border-left: 3px solid var(--ai-error);
      }
    }

    &--queued {
      :deep(.ai-card) {
        border-left: 3px solid var(--ai-warning);
      }
    }

    &--paused {
      :deep(.ai-card) {
        border-left: 3px solid var(--ai-info);
      }
    }
  }

  .task-content {
    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 24px;

      .task-info {
        h3 {
          margin: 0 0 12px 0;
          font-size: 20px;
          color: var(--ai-text-primary);
        }

        .task-meta {
          display: flex;
          align-items: center;
          gap: 16px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
            color: var(--ai-text-muted);
            font-size: 14px;
          }
        }
      }
    }

    .task-progress {
      margin-bottom: 24px;

      .progress-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        color: var(--ai-text-secondary);
      }

      .progress-details {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font-size: 14px;
        color: var(--ai-text-muted);
      }
    }

    .task-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 24px;

      .metric-group {
        h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: var(--ai-text-primary);
        }

        .metric-items {
          display: grid;
          gap: 12px;

          .metric-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: var(--ai-bg-tertiary);
            border-radius: 8px;

            .label {
              color: var(--ai-text-muted);
              font-size: 14px;
            }

            .value {
              font-weight: 600;
              color: var(--ai-text-primary);

              &.success {
                color: var(--ai-success);
              }
            }
          }
        }

        .resource-usage {
          display: grid;
          gap: 16px;

          .resource-item {
            display: grid;
            grid-template-columns: 80px 1fr 50px;
            align-items: center;
            gap: 12px;

            .resource-label {
              display: flex;
              align-items: center;
              gap: 4px;
              color: var(--ai-text-secondary);
              font-size: 14px;
            }

            .resource-value {
              text-align: right;
              font-weight: 600;
              color: var(--ai-text-primary);
            }
          }
        }
      }
    }

    .task-logs {
      .logs-header {
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

      .logs-content {
        background: var(--ai-bg-tertiary);
        border-radius: 8px;
        padding: 12px;
        max-height: 150px;
        overflow-y: auto;

        pre {
          margin: 0;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 13px;
          color: var(--ai-text-secondary);
          white-space: pre-wrap;
        }
      }
    }
  }
}

.task-details-dialog {
  .training-charts {
    padding: 20px 0;
  }

  :deep(.el-descriptions__label) {
    color: var(--ai-text-secondary);
    background: var(--ai-bg-tertiary);
  }

  :deep(.el-descriptions__content) {
    color: var(--ai-text-primary);
  }
}

// 主题适配
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
</style>