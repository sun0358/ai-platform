<template>
  <div class="image-comparison-page ai-gradient-bg">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Camera /></el-icon>
          智能图像对比分析
        </h1>
        <p class="page-subtitle">基于AI的多维度图像相似度分析</p>
      </div>
      <div class="header-actions">
        <el-button
            type="primary"
            :icon="viewMode === 'create' ? 'List' : 'Plus'"
            @click="toggleViewMode"
        >
          {{ viewMode === 'create' ? '任务列表' : '创建任务' }}
        </el-button>
      </div>
    </div>

    <div v-show="viewMode === 'create' && !hideUploadArea">
      <div class="create-view">
        <AICard variant="glass" class="upload-card">
          <template #header>
            <div class="card-header-content">
              <h3>创建对比任务</h3>
              <div class="model-selector">
                <label>选择模型：</label>
                <el-select
                    v-model="formData.model"
                    placeholder="选择对比模型"
                    size="large"
                    :disabled="!!currentTask"
                >
                  <el-option
                      v-for="model in availableModels"
                      :key="model.name"
                      :label="model.description"
                      :value="model.model_id"
                  >
                    <div class="model-option">
                      <el-icon><Cpu /></el-icon>
                      <div>
                        <div class="model-name">{{ model.description }}</div>
                        <div class="model-id">{{ model.model_id }}</div>
                      </div>
                    </div>
                  </el-option>
                </el-select>
              </div>
            </div>
          </template>

          <div class="task-name-input">
            <el-input
                v-model="formData.task_name"
                placeholder="输入任务名称（可选）"
                size="large"
                clearable
                :disabled="!!currentTask"
            >
              <template #prefix>
                <el-icon><Edit /></el-icon>
              </template>
            </el-input>
          </div>

          <div class="upload-grid">
            <div class="upload-section main-upload">
              <h4>
                <el-icon><Picture /></el-icon>
                实际图片
              </h4>
              <ImageUploadAI
                  v-model="images.actual_image"
                  @change="(file) => handleImageUpload(file, 'actual_image')"
                  :preview-size="600"
                  placeholder="上传实际图片"
                  :disabled="!!currentTask"
              />
            </div>

            <div class="upload-section compare-uploads">
              <h4>
                <el-icon><Grid /></el-icon>
                对比图片
              </h4>
              <div class="compare-grid">
                <div
                    v-for="hour in forecastHours"
                    :key="hour"
                    class="compare-item"
                >
                  <h5>{{ hour }}小时预报</h5>
                  <ImageUploadAI
                      v-model="images[`forecast_${hour}h`]"
                      @change="(file) => handleImageUpload(file, `forecast_${hour}h`)"
                      :preview-size="150"
                      :compact="true"
                      :disabled="!!currentTask"
                  />
                </div>
              </div>
            </div>
          </div>

          <template #footer>
            <div v-if="currentTask && (currentTask.status === 'running' || currentTask.status === 'pending')" class="analysis-in-progress">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>正在进行智能分析，请稍候...</span>
            </div>
            <div v-else class="action-buttons">
              <el-button
                  type="primary"
                  size="large"
                  :loading="submitting"
                  :disabled="!canSubmit"
                  @click="handleSubmit"
                  class="submit-btn"
              >
                <el-icon><MagicStick /></el-icon>
                {{ currentTask ? '重新开始分析' : '开始智能分析' }}
              </el-button>
              <el-button
                  size="large"
                  @click="clearAll"
                  class="reset-btn"
              >
                <el-icon><RefreshRight /></el-icon>
                重置
              </el-button>
            </div>
          </template>
        </AICard>
      </div>

      <transition name="fade-slide">
        <div v-if="currentTask" class="current-task-progress">
          <AICard variant="glass" class="progress-card">
            <template #header>
              <div class="progress-header">
                <h3>{{ currentTask.task_name || '图像对比分析任务' }}</h3>
                <el-tag :type="getTaskStatusType(currentTask.status)">
                  {{ getTaskStatusText(currentTask.status) }}
                </el-tag>
              </div>
            </template>

            <div v-if="currentTask.status === 'running'" class="task-progress">
              <div class="progress-info">
                <span>分析进度</span>
                <span>{{ currentTask.progress || 0 }}%</span>
              </div>
              <el-progress :percentage="currentTask.progress || 0" status="active"/>
            </div>

            <div v-else-if="currentTask.status === 'completed' && currentTask.result" class="task-result">
              <div class="result-summary">
                <div class="best-match">
                  <h4>最佳匹配</h4>
                  <div class="match-info">
                    <span class="match-title">{{ currentTask.result.best_match }}小时预报</span>
                    <span class="match-score">{{ getBestScore(currentTask.result) }}%</span>
                  </div>
                </div>
                <div class="analysis-time">
                  <span>分析用时: {{ currentTask.result.analysis_time || '0' }}秒</span>
                </div>
              </div>
              <div class="result-actions">
                <el-button type="primary" @click="viewDetailedResult(currentTask.task_id)">
                  <el-icon><View /></el-icon> 查看详细图表
                </el-button>
              </div>
            </div>

            <div v-else-if="currentTask.status === 'failed'" class="task-failed">
              <el-result icon="error" title="分析失败" sub-title="任务执行过程中遇到问题">
                <template #extra>
                  <el-button type="primary" @click="retryTask">重试</el-button>
                </template>
              </el-result>
            </div>
          </AICard>
        </div>
      </transition>
    </div>

    <transition name="fade-slide">
      <div v-if="viewMode === 'tasks'" class="tasks-view">
        <TaskListAI
            ref="taskListRef"
            task-type="image_comparison"
            @view-result="handleViewResult"
        />
      </div>
    </transition>

    <!-- 详细分析结果 -->
    <transition name="fade-slide">
      <div v-if="detailedResult" class="comparison-result-section">
        <!-- 返回按钮 -->
        <div class="result-header" v-if="resultViewSource === 'list'">
          <el-button
              @click="backToList"
              :icon="ArrowLeft"
          >
            返回任务列表
          </el-button>
        </div>

        <ComparisonResult
            :result="detailedResult.result"
            :task-info="detailedResult.taskInfo"
            :details="detailedResult.details"
            class="comparison"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import {
  Camera, List, Plus, Cpu, Edit, Picture,
  Grid, MagicStick, RefreshRight, View, Loading,
  ArrowLeft
} from '@element-plus/icons-vue'
import AICard from '@/modules/common/components/AICard.vue'
import ImageUploadAI from '../components/ImageUploadAI.vue'
import TaskListAI from '../components/TaskListAI.vue'
import ComparisonResult from '../components/ComparisonResult.vue'
import { imageComparisonApi } from '../api'

const viewMode = ref<'create' | 'tasks'>('create')
const forecastHours = [12, 24, 36, 48]
const submitting = ref(false)
const availableModels = ref<any[]>([])
const images = ref<Record<string, string>>({})
const taskListRef = ref()
const currentTask = ref<any>(null)
const detailedResult = ref<any>(null) // 用于存储详细分析结果
const hideUploadArea = ref(false) // 控制上传区域的显示
const resultViewSource = ref<'current' | 'list'>('current') // 记录结果视图的来源

const formData = ref({
  task_name: '',
  model: 'rain_specific',
  actual_image: '',
  forecast_12h: '',
  forecast_24h: '',
  forecast_36h: '',
  forecast_48h: '',
  priority: 5
})

const canSubmit = computed(() => {
  return images.value.actual_image &&
      images.value.forecast_12h &&
      images.value.forecast_24h &&
      images.value.forecast_36h &&
      images.value.forecast_48h
})

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'create' ? 'tasks' : 'create'
  detailedResult.value = null // 切换视图时清空详细结果
  hideUploadArea.value = false // 添加这一行
}

const loadModels = async () => {
  try {
    const models = await imageComparisonApi.getModels()
    availableModels.value = models
    if (models.length > 0 && !formData.value.model) {
      formData.value.model = models[0].model_id
    }
  } catch (error) {
    console.error('Failed to load models:', error)
  }
}

const handleImageUpload = (file: File | null, type: string) => {
  if (!file) {
    // 删除图片时，同时清空 formData 和 images 状态
    formData.value[type as keyof typeof formData.value] = ''
    delete images.value[type] // 删除对应的图片数据
    return
  }

  // 上传新图片时，从 images 状态中获取 base64 数据
  const base64 = images.value[type]
  if (base64) {
    formData.value[type as keyof typeof formData.value] = base64.split(',')[1]
  }
}

const handleSubmit = async () => {
  if (currentTask.value) {
    createNewTask();
    await nextTick();
  }
  if (!canSubmit.value) {
    ElMessage.warning('请上传所有必需的图片')
    return
  }
  submitting.value = true
  detailedResult.value = null
  try {
    const response = await imageComparisonApi.createTask(formData.value)
    ElMessage({ type: 'success', message: '任务创建成功，正在进行智能分析...', duration: 3000 })
    const modelInfo = availableModels.value.find(m => m.model_id === formData.value.model)
    currentTask.value = {
      task_id: response.task_id,
      task_name: formData.value.task_name || '图像对比分析任务',
      model_name: modelInfo?.description || formData.value.model,
      status: 'running',
      created_at: new Date().toISOString(),
      progress: 0
    }
    startTaskMonitoring(response.task_id)
  } catch (error) {
    ElMessage.error('创建任务失败，请重试')
    currentTask.value = null
  } finally {
    submitting.value = false
  }
}

let taskMonitoringTimer: number | null = null

const startTaskMonitoring = (taskId: string) => {
  if (taskMonitoringTimer) clearInterval(taskMonitoringTimer)

  taskMonitoringTimer = window.setInterval(async () => {
    try {
      if (!currentTask.value || currentTask.value.task_id !== taskId) {
        clearInterval(taskMonitoringTimer!)
        return
      }
      const taskStatus = await imageComparisonApi.getTaskStatus(taskId)
      if (currentTask.value && currentTask.value.task_id === taskId) {
        currentTask.value.status = taskStatus.status
        currentTask.value.progress = taskStatus.progress || 0
        if (taskStatus.status === 'completed' || taskStatus.status === 'failed') {
          clearInterval(taskMonitoringTimer!)
          taskMonitoringTimer = null
          if (taskStatus.status === 'completed') {
            const allTasks = await imageComparisonApi.getTasks({ task_type: 'image_comparison' });
            const completedTask = allTasks.find((task: any) => task.task_id === taskId);
            if (completedTask) {
              currentTask.value = completedTask; // 更新摘要卡片
              ElMessage.success('分析完成！');
              await nextTick(() => {
                document.querySelector('.current-task-progress')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              });
            } else {
              ElMessage.error('分析完成，但获取结果摘要失败。');
            }
          } else {
            ElMessage.error('分析失败，请重试');
          }
        }
      }
    } catch (error) {
      console.error('获取任务状态失败:', error);
      clearInterval(taskMonitoringTimer!);
    }
  }, 2000)
}

// --- 核心改动：新的函数，用于获取并显示详细结果 ---
const showDetailedResult = async (taskId: string, baseTaskInfo: any, source: 'current' | 'list' = 'current') => {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在加载详细分析报告...',
    background: 'rgba(0, 0, 0, 0.7)',
  });

  try {
    const details = await imageComparisonApi.getAnalysisDetails(taskId);
    detailedResult.value = {
      result: baseTaskInfo.result,
      taskInfo: baseTaskInfo,
      details: details
    };

    // 添加这两行
    resultViewSource.value = source;
    if (source === 'list') {
      hideUploadArea.value = true;
    }

    await nextTick();

    // 修改滚动目标
    setTimeout(() => {
      const resultSection = document.querySelector('.comparison-result-section');
      if (resultSection) {
        resultSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 400); // 400ms 对应 CSS 中的过渡时间
  } catch (error) {
    ElMessage.error('加载详细报告失败');
    detailedResult.value = null;
  } finally {
    loadingInstance.close();
  }
}

  const viewDetailedResult = (taskId: string) => {
    if (currentTask.value && currentTask.value.result) {
      showDetailedResult(taskId, currentTask.value, 'current'); // 添加 'current' 参数
    } else {
      ElMessage.info('结果数据尚未就绪。');
    }
  }

  const handleViewResult = (task: any) => {
    if (task.result) {
      viewMode.value = 'create';
      showDetailedResult(task.task_id, task, 'list'); // 添加 'list' 参数
    } else {
      ElMessage.warning('该任务没有可供查看的详细结果。');
    }
  }

  // 添加这个新函数
  const backToList = () => {
    detailedResult.value = null;
    hideUploadArea.value = false;
    viewMode.value = 'tasks';
  }


  const createNewTask = () => {
    currentTask.value = null
    detailedResult.value = null
    hideUploadArea.value = false // 添加这一行
    clearAll()
    viewMode.value = 'create'
  }
const retryTask = async () => {
  if (currentTask.value) await handleSubmit()
}

const clearAll = () => {
  const modelToKeep = formData.value.model;
  Object.assign(formData.value, {
    task_name: '', model: modelToKeep, actual_image: '', forecast_12h: '',
    forecast_24h: '', forecast_36h: '', forecast_48h: '', priority: 5
  });
  images.value = {}
}

const getTaskStatusText = (status: string) => ({ running: '进行中', completed: '已完成', failed: '已失败', pending: '排队中' }[status] || status)
const getTaskStatusType = (status: string) => ({ running: 'info', completed: 'success', failed: 'danger' }[status] || 'info')

const getBestScore = (result: any) => {
  if (!result || !result.scores || result.scores.length === 0) return '0.0'
  const best = result.scores.reduce((prev: any, curr: any) => (prev.total_score > curr.total_score) ? prev : curr)
  return (best.total_score * 100).toFixed(1)
}

onMounted(() => { loadModels() })
onUnmounted(() => { if (taskMonitoringTimer) clearInterval(taskMonitoringTimer) })
</script>

<style lang="scss" scoped>
@use '@/styles/ai-theme.scss';
@use '@/styles/mixins' as mixins;

// 渐变动画关键帧
@keyframes gradient-shift {
  0% { background-position: 0 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

.image-comparison-page {
  min-height: 100vh;
  padding: 20px;
  position: relative;
  background: rgb(255, 255, 255);

  // 浅色主题
  :global(html.light) & {
    background: #f8fafc;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    padding: 24px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.15);

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

  .create-view {
    .upload-card {
      //max-width: 1400px;
      margin: 0 auto;

      .card-header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;

        h3 {
          margin: 20px;
          font-size: 20px;
          color: var(--ai-text-primary);
        }

        .model-selector {
          display: flex;
          align-items: center;
          gap: 12px;

          label {
            color: var(--ai-text-secondary);
          }

          .el-select {
            width: 450px;
          }
        }
      }

      .model-option {
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 4px 0;

        .el-icon {
          font-size: 20px;
          color: var(--ai-primary);
        }

        .model-name {
          font-size: 14px;
          color: var(--ai-text-primary);
        }

        .model-id {
          font-size: 12px;
          color: var(--ai-text-muted);
        }
      }

      .task-name-input {
        margin-bottom: 32px;
      }

      .upload-grid {
        display: grid;
        grid-template-columns: 2fr 3fr; // 实际图片占1/3，对比图片占2/3
        gap: 32px;
        align-items: center; // 添加垂直居中对齐

        @media (max-width: 1024px) {
          grid-template-columns: 1fr;
          align-items: stretch; // 小屏幕时恢复拉伸
        }

        .upload-section {
          border: 2px solid #000000; // 设置黑色边框
          border-radius: 12px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;

          &:hover {
            border-color: var(--ai-primary);
            background: rgba(99, 102, 241, 0.08);
          }

          h4, h5 {
            margin: 0 0 16px 0;
            color: var(--ai-text-primary);
            display: flex;
            align-items: center;
            gap: 8px;

            .el-icon {
              color: var(--ai-primary);
            }
          }

          h5 {
            font-size: 14px;
            color: var(--ai-text-secondary);
          }

          // 实际图片区域特殊样式
          &.main-upload {
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-height: 400px;
            border-width: 3px; // 实际图片区域边框更粗
          }
        }

        .compare-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px; // 稍微增大间距

          @media (max-width: 768px) {
            grid-template-columns: 1fr;
          }

          .compare-item {
            display: flex;
            flex-direction: column;
            padding: 16px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;

            &:hover {
              background: rgba(255, 255, 255, 0.05);
              border-color: rgba(99, 102, 241, 0.3);
            }

            h5 {
              margin: 0 0 12px 0;
              font-size: 14px;
              color: var(--ai-text-primary);
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 6px;

              // 可以添加一个小图标
              &::before {
                content: '📍';
                font-size: 12px;
              }
            }

            .image-upload-ai {
              flex: 1;
              min-height: 150px; // 确保有最小高度
            }
          }
        }
      }

      .action-buttons {
        display: flex;
        justify-content: center;
        gap: 16px;

        .el-button {
          min-width: 200px;
          height: 48px;
          font-size: 16px;
          border-radius: 8px;
          transition: all 0.3s ease;

          &.submit-btn {
            // 任何时候都显示正常颜色
            background: linear-gradient(135deg, #6366f1, #14b8a6) !important;
            border: none !important;
            color: #ffffff !important;
            font-weight: 600;

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.5);
              background: linear-gradient(135deg, #818cf8, #2dd4bf) !important;
            }

            // 禁用状态也保持渐变色，只降低透明度
            &:disabled,
            &.is-disabled {
              background: linear-gradient(135deg, #6366f1, #14b8a6) !important;
              color: #ffffff !important;
              opacity: 0.6;
              cursor: not-allowed;
            }

            &.is-loading {
              background: linear-gradient(135deg, #6366f1, #14b8a6) !important;
              color: #ffffff !important;
            }

            // 确保图标和文字都可见
            .el-icon {
              color: #ffffff !important;
            }

            span {
              color: #ffffff !important;
            }
          }

          &.reset-btn {
            background: rgba(255, 255, 255, 0.08) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            color: var(--ai-text-primary) !important;

            &:hover {
              background: rgba(255, 255, 255, 0.15) !important;
              border-color: #6366f1 !important;
              color: #6366f1 !important;
            }
          }
        }
      }
    }
  }

  .current-task-progress {
    max-width: 1200px;
    margin: 32px auto 0;
    .progress-card {
      // 样式可以根据需要调整
    }
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      h3 { margin: 0; font-size: 20px; }
    }
    .task-progress, .task-result, .task-failed {
      padding: 16px 0 0;
    }
    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      color: var(--ai-text-secondary);
    }
    .progress-tips {
      margin-top: 12px;
      color: var(--ai-text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
      .loading-icon {
        animation: spin 1s linear infinite;
      }
    }
    .result-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      h4 { margin: 0 0 8px; color: var(--ai-text-secondary); font-weight: normal; }
      .match-title { font-size: 20px; font-weight: bold; color: var(--ai-text-primary); }
      .match-score { font-size: 24px; font-weight: bold; color: var(--ai-primary); }
    }
    .detailed-scores {
      margin-bottom: 24px;
      h4 { margin: 0 0 12px; }
      .score-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      .score-item {
        background: rgba(255, 255, 255, 0.05);
        padding: 12px;
        border-radius: 8px;
        border: 1px solid transparent;
        transition: all 0.3s ease;
        &.best {
          border-color: #10b981;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
        }
      }
      .score-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-weight: bold;
      }
    }
    .result-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 24px;
    }
  }

  .tasks-view {
    max-width: 1400px;
    margin: 32px auto;
  }

  //.comparison{
  //  max-width: 1400px;
  //  margin: 32px auto;
  //  padding: 20px;
  //  background: rgba(255, 255, 255, 0.08);
  //  backdrop-filter: blur(10px);
  //  border-radius: 16px;
  //  border: 1px solid rgba(255, 255, 255, 0.15);
  //  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  //  animation: slideInUp 0.6s ease-out;
  //}

  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .fade-slide-enter-from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }

  .fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-20px) scale(0.98);
  }

  :deep(.el-select-dropdown) {
    background: var(--ai-bg-secondary);
    border-color: rgba(255, 255, 255, 0.1);

    .el-select-dropdown__item {
      color: var(--ai-text-secondary);
      &:hover { background: rgba(255, 255, 255, 0.05); }
      &.selected { color: var(--ai-primary); }
    }
  }

  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.05);

    .el-input__inner {
      color: var(--ai-text-primary);
      &::placeholder { color: var(--ai-text-muted); }
    }
  }

  &.is-focus {
    border-color: var(--ai-primary);
  }
  // 添加新的样式
  .comparison-result-section {
    max-width: 1400px;
    margin: 32px auto;

    .result-header {
      margin-bottom: 24px;
    }
  }

  // 修改任务列表的背景，避免白色闪烁
  .tasks-view {
    max-width: 1400px;
    margin: 32px auto;

    // 确保初始背景透明
    :deep(.task-list-ai) {
      background: transparent;
    }
  }
}
</style>