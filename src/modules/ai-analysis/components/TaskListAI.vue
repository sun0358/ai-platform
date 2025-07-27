<template>
  <div class="task-list-ai">
    <AICard :title="cardTitle" icon="List" variant="glass">
      <template #actions>
        <el-button
            v-if="!singleTaskId"
            type="primary"
            size="small"
            :icon="Refresh"
            @click="refresh"
            class="refresh-btn"
        >
          刷新
        </el-button>
      </template>

      <div v-if="!singleTaskId" class="task-filters">
        <el-segmented
            v-model="filterStatus"
            :options="statusOptions"
            size="default"
        />
      </div>

      <div class="task-items" v-loading="loading">
        <TransitionGroup name="task-list">
          <div
              v-for="task in filteredTasks"
              :key="task.task_id"
              class="task-item"
              :class="`task-item--${task.status}`"
              @click="handleTaskClick(task)"
          >
            <div class="task-indicator">
              <el-icon
                  :size="24"
                  :class="{ 'pulse': task.status === 'running' }"
              >
                <component :is="getStatusIcon(task.status)" />
              </el-icon>
            </div>

            <div class="task-info">
              <h4 class="task-name">{{ task.task_name }}</h4>
              <div class="task-meta">
                <span class="meta-item">
                  <el-icon><Cpu /></el-icon>
                  {{ task.model_name || '未知模型' }}
                </span>
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(task.created_at) }}
                </span>
              </div>
            </div>

            <div class="task-progress">
              <template v-if="task.status === 'running'">
                <el-progress
                    :percentage="task.progress || 0"
                    :stroke-width="6"
                    color="#6366f1"
                />
              </template>
              <template v-else-if="task.status === 'completed'">
                <div class="task-score">
                  <span class="score-label">最佳匹配</span>
                  <span class="score-value">
                    {{ getTaskScore(task) }}%
                  </span>
                </div>
              </template>
              <template v-else-if="task.status === 'failed'">
                <el-tag type="danger" size="small">失败</el-tag>
              </template>
            </div>

            <div class="task-actions">
              <el-button
                  v-if="task.status === 'completed'"
                  type="primary"
                  size="small"
                  @click.stop="$emit('view-result', task)"
              >
                查看结果
              </el-button>
            </div>
          </div>
        </TransitionGroup>

        <el-empty
            v-if="!loading && filteredTasks.length === 0"
            :description="emptyDescription"
            class="empty-state"
        />
      </div>
    </AICard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Refresh, Clock, Cpu, Loading,
  CircleCheck, CircleClose, Timer
} from '@element-plus/icons-vue'
import AICard from '@/modules/common/components/AICard.vue'
import { imageComparisonApi } from '../api'

interface Props {
  taskType?: string
  autoRefresh?: boolean
  refreshInterval?: number
  singleTaskId?: string
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: true,
  refreshInterval: 5,
  singleTaskId: undefined
})

const emit = defineEmits<{
  'view-result': [task: any]
}>()

const loading = ref(false)
const tasks = ref<any[]>([])
const filterStatus = ref('all')
let refreshTimer: number | null = null

const cardTitle = computed(() => props.singleTaskId ? '已完成的任务' : '任务列表')
const emptyDescription = computed(() => props.singleTaskId ? '无法加载任务详情' : '暂无任务')

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'running' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' }
]

const filteredTasks = computed(() => {
  if (props.singleTaskId) {
    return tasks.value
  }

  if (filterStatus.value === 'all') {
    return tasks.value.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  if (filterStatus.value === 'running') {
    return tasks.value.filter(t =>
        t.status === 'running' || t.status === 'pending'
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  return tasks.value.filter(t => t.status === filterStatus.value)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

const hasRunningTasks = computed(() => {
  return tasks.value.some(task =>
      task.status === 'running' || task.status === 'pending'
  )
})

const getStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    'pending': Timer, 'running': Loading, 'completed': CircleCheck, 'failed': CircleClose
  }
  return icons[status] || Timer
}

const getTaskScore = (task: any) => {
  if (task.result?.best_match) {
    const bestScore = task.result.scores?.find(
        (s: any) => s.forecast_type === task.result.best_match
    )
    return bestScore ? (bestScore.total_score * 100).toFixed(1) : '0'
  }
  return '0'
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleDateString('zh-CN')
}

const refresh = async () => {
  loading.value = true
  try {
    // --- 核心修复点 ---
    if (props.singleTaskId) {
      // 1. 仍然调用 getTasks 获取全量数据
      const allTasks = await imageComparisonApi.getTasks({ task_type: props.taskType });
      // 2. 在前端进行查找
      const singleTask = allTasks.find((task: any) => task.task_id === props.singleTaskId);
      tasks.value = singleTask ? [singleTask] : [];
      stopAutoRefresh();
    } else {
      const data = await imageComparisonApi.getTasks({ task_type: props.taskType });
      tasks.value = data;
      if (hasRunningTasks.value) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    }
  } catch (error) {
    console.error('Failed to load tasks:', error);
    tasks.value = [];
  } finally {
    loading.value = false;
  }
}

const handleTaskClick = (task: any) => {
  if (task.status === 'completed') {
    emit('view-result', task)
  }
}

const startAutoRefresh = () => {
  if (props.singleTaskId || !props.autoRefresh || refreshTimer) return

  if (hasRunningTasks.value) {
    refreshTimer = window.setInterval(refresh, props.refreshInterval * 1000)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const addTask = (task: any) => {
  if (props.singleTaskId) return
  tasks.value.unshift(task)
  if (task.status === 'running' || task.status === 'pending') {
    startAutoRefresh()
  }
}

watch(() => props.singleTaskId, (newId, oldId) => {
  if (!newId && oldId) {
    refresh();
  }
});

onMounted(() => {
  refresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

defineExpose({ refresh, addTask })
</script>

<style lang="scss" scoped>
.task-list-ai {
  .refresh-btn {
    //background: rgba(99, 102, 241, 0.1);
    background: transparent;
    border-color: var(--ai-primary);
    color: var(--ai-primary);

    &:hover {
      background: rgba(99, 102, 241, 0.2);
    }
  }

  .task-filters {
    margin-bottom: 24px;

    :deep(.el-segmented) {
      background: rgba(255, 255, 255, 0.05);

      .el-segmented__item {
        color: var(--ai-text-secondary);

        &.is-selected {
          background: var(--ai-primary);
          color: white;
        }
      }
    }
  }

  .task-items {
    min-height: 150px; /* 在单任务模式下，不需要太高的高度 */
  }

  .task-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    margin-bottom: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      transform: translateX(4px);
      border-color: var(--ai-primary);
    }

    &--running {
      border-left: 3px solid var(--ai-warning);
    }

    &--completed {
      border-left: 3px solid var(--ai-success);
    }

    &--failed {
      border-left: 3px solid var(--ai-error);
    }

    .task-indicator {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 12px;

      .el-icon {
        color: var(--ai-primary);

        &.pulse {
          animation: pulse 2s infinite;
        }
      }
    }

    .task-info {
      flex: 1;

      .task-name {
        margin: 0 0 8px 0;
        font-size: 16px;
        color: var(--ai-text-primary);
      }

      .task-meta {
        display: flex;
        gap: 16px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--ai-text-muted);

          .el-icon {
            font-size: 14px;
          }
        }
      }
    }

    .task-progress {
      width: 150px;

      .task-score {
        text-align: center;

        .score-label {
          display: block;
          font-size: 12px;
          color: var(--ai-text-muted);
          margin-bottom: 4px;
        }

        .score-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: var(--ai-success);
        }
      }
    }

    .task-actions {
      flex-shrink: 0;
    }
  }

  .empty-state {
    padding: 40px 0;

    :deep(.el-empty__description) {
      color: var(--ai-text-muted);
    }
  }
}

// 列表动画
.task-list-move,
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.3s ease;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.task-list-leave-active {
  position: absolute;
  width: 100%;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>