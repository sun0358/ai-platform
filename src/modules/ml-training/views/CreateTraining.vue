<template>
  <div class="create-training-page ai-gradient-bg">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Plus /></el-icon>
          创建训练任务
        </h1>
        <p class="page-subtitle">配置并启动机器学习模型训练</p>
      </div>
      <div class="header-actions">
        <el-button @click="loadTemplate">
          <el-icon><Document /></el-icon>
          使用模板
        </el-button>
        <el-button type="primary" @click="router.push('/ml-training/tasks')">
          <el-icon><List /></el-icon>
          任务列表
        </el-button>
      </div>
    </div>

    <!-- 训练配置向导 -->
    <div class="training-wizard">
      <el-steps :active="currentStep" align-center>
        <el-step title="选择模型" icon="Cpu" />
        <el-step title="准备数据" icon="Document" />
        <el-step title="配置参数" icon="Setting" />
        <el-step title="确认启动" icon="CircleCheck" />
      </el-steps>

      <!-- Step 1: 选择模型 -->
      <div v-show="currentStep === 0" class="wizard-step">
        <AICard variant="glass">
          <template #header>
            <h3>选择训练模型</h3>
          </template>

          <div class="model-categories">
            <el-radio-group v-model="selectedCategory" size="large">
              <el-radio-button label="classification">分类模型</el-radio-button>
              <el-radio-button label="regression">回归模型</el-radio-button>
              <el-radio-button label="clustering">聚类模型</el-radio-button>
              <el-radio-button label="deeplearning">深度学习</el-radio-button>
            </el-radio-group>
          </div>

          <div class="model-grid">
            <div
                v-for="model in filteredModels"
                :key="model.id"
                class="model-card"
                :class="{ selected: trainingConfig.modelId === model.id }"
                @click="trainingConfig.modelId = model.id"
            >
              <div class="model-header">
                <div class="model-icon" :style="{ background: model.color }">
                  <el-icon :size="32"><component :is="model.icon" /></el-icon>
                </div>
                <el-tag v-if="model.isNew" type="danger" size="small">NEW</el-tag>
              </div>
              <h4>{{ model.name }}</h4>
              <p>{{ model.description }}</p>
              <div class="model-meta">
                <span><el-icon><Timer /></el-icon> {{ model.estimatedTime }}</span>
                <span><el-icon><Cpu /></el-icon> {{ model.complexity }}</span>
              </div>
              <div class="model-tags">
                <el-tag v-for="tag in model.tags" :key="tag" size="small">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
        </AICard>
      </div>

      <!-- Step 2: 准备数据 -->
      <div v-show="currentStep === 1" class="wizard-step">
        <AICard variant="glass">
          <template #header>
            <h3>准备训练数据</h3>
          </template>

          <div class="data-source-tabs">
            <el-tabs v-model="dataSourceType">
              <el-tab-pane label="上传数据" name="upload">
                <div class="upload-section">
                  <el-upload
                      drag
                      multiple
                      :auto-upload="false"
                      :file-list="uploadedFiles"
                      @change="handleFileChange"
                  >
                    <el-icon :size="60"><UploadFilled /></el-icon>
                    <div class="el-upload__text">
                      拖拽数据文件到此处或<em>点击上传</em>
                    </div>
                    <div class="upload-hint">
                      支持 CSV、Excel、JSON 格式，可上传多个文件
                    </div>
                  </el-upload>

                  <div v-if="uploadedFiles.length > 0" class="uploaded-files">
                    <h4>已上传文件</h4>
                    <div class="file-list">
                      <div
                          v-for="file in uploadedFiles"
                          :key="file.uid"
                          class="file-item"
                      >
                        <el-icon><Document /></el-icon>
                        <span class="file-name">{{ file.name }}</span>
                        <span class="file-size">{{ formatFileSize(file.size) }}</span>
                        <el-button
                            type="danger"
                            size="small"
                            text
                            @click="removeFile(file)"
                        >
                          删除
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="数据库" name="database">
                <div class="database-section">
                  <el-form :model="dbConfig" label-width="100px">
                    <el-form-item label="数据源">
                      <el-select v-model="dbConfig.source" placeholder="选择数据源">
                        <el-option label="MySQL" value="mysql" />
                        <el-option label="PostgreSQL" value="postgresql" />
                        <el-option label="MongoDB" value="mongodb" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="查询SQL">
                      <el-input
                          v-model="dbConfig.query"
                          type="textarea"
                          :rows="4"
                          placeholder="输入查询语句"
                      />
                    </el-form-item>
                    <el-form-item>
                      <el-button @click="testConnection">测试连接</el-button>
                      <el-button type="primary" @click="previewData">预览数据</el-button>
                    </el-form-item>
                  </el-form>
                </div>
              </el-tab-pane>

              <el-tab-pane label="示例数据" name="sample">
                <div class="sample-section">
                  <el-alert type="info" :closable="false">
                    使用内置示例数据集进行训练测试
                  </el-alert>
                  <el-radio-group v-model="selectedSampleData" class="sample-list">
                    <el-radio
                        v-for="sample in sampleDatasets"
                        :key="sample.id"
                        :label="sample.id"
                        border
                    >
                      <div class="sample-info">
                        <h5>{{ sample.name }}</h5>
                        <p>{{ sample.description }}</p>
                        <el-tag size="small">{{ sample.size }}</el-tag>
                      </div>
                    </el-radio>
                  </el-radio-group>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>

          <!-- 数据预处理 -->
          <div class="data-preprocessing">
            <h4>数据预处理</h4>
            <el-checkbox-group v-model="preprocessingOptions">
              <el-checkbox label="normalize">数据标准化</el-checkbox>
              <el-checkbox label="fillna">缺失值填充</el-checkbox>
              <el-checkbox label="encode">类别编码</el-checkbox>
              <el-checkbox label="split">自动划分训练/测试集</el-checkbox>
            </el-checkbox-group>
          </div>
        </AICard>
      </div>

      <!-- Step 3: 配置参数 -->
      <div v-show="currentStep === 2" class="wizard-step">
        <el-row :gutter="24">
          <el-col :span="16">
            <AICard variant="glass">
              <template #header>
                <h3>模型参数配置</h3>
              </template>

              <div class="params-config">
                <el-form :model="modelParams" label-width="140px">
                  <h4>基础参数</h4>
                  <el-form-item label="训练轮数">
                    <el-slider
                        v-model="modelParams.epochs"
                        :min="1"
                        :max="100"
                        show-input
                    />
                  </el-form-item>
                  <el-form-item label="批次大小">
                    <el-select v-model="modelParams.batchSize">
                      <el-option :label="16" :value="16" />
                      <el-option :label="32" :value="32" />
                      <el-option :label="64" :value="64" />
                      <el-option :label="128" :value="128" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="学习率">
                    <el-input-number
                        v-model="modelParams.learningRate"
                        :min="0.0001"
                        :max="1"
                        :step="0.0001"
                        :precision="4"
                    />
                  </el-form-item>

                  <h4>高级参数</h4>
                  <el-form-item label="优化器">
                    <el-select v-model="modelParams.optimizer">
                      <el-option label="Adam" value="adam" />
                      <el-option label="SGD" value="sgd" />
                      <el-option label="RMSprop" value="rmsprop" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="损失函数">
                    <el-select v-model="modelParams.lossFunction">
                      <el-option label="交叉熵" value="crossentropy" />
                      <el-option label="均方误差" value="mse" />
                      <el-option label="MAE" value="mae" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="正则化">
                    <el-checkbox v-model="modelParams.useRegularization">
                      启用L2正则化
                    </el-checkbox>
                  </el-form-item>
                </el-form>
              </div>
            </AICard>
          </el-col>

          <el-col :span="8">
            <AICard variant="gradient" class="params-preview">
              <template #header>
                <h3>参数预览</h3>
              </template>

              <div class="preview-content">
                <div class="preview-item">
                  <span class="label">预计训练时间</span>
                  <span class="value">{{ estimatedTime }}</span>
                </div>
                <div class="preview-item">
                  <span class="label">所需GPU内存</span>
                  <span class="value">{{ estimatedMemory }} GB</span>
                </div>
                <div class="preview-item">
                  <span class="label">参数数量</span>
                  <span class="value">{{ parameterCount }}</span>
                </div>
                <div class="preview-item">
                  <span class="label">计算复杂度</span>
                  <el-progress
                      :percentage="complexityScore"
                      :color="getComplexityColor"
                  />
                </div>
              </div>

              <el-alert
                  v-if="modelParams.epochs > 50"
                  type="warning"
                  :closable="false"
              >
                训练轮数较多，可能需要较长时间
              </el-alert>
            </AICard>

            <AICard variant="glass" class="tips-card">
              <template #header>
                <h4>优化建议</h4>
              </template>
              <ul class="tips-list">
                <li>对于小数据集，建议减少批次大小</li>
                <li>学习率过大可能导致训练不稳定</li>
                <li>使用早停策略避免过拟合</li>
                <li>考虑使用数据增强技术</li>
              </ul>
            </AICard>
          </el-col>
        </el-row>
      </div>

      <!-- Step 4: 确认启动 -->
      <div v-show="currentStep === 3" class="wizard-step">
        <AICard variant="glass">
          <template #header>
            <h3>确认训练配置</h3>
          </template>

          <div class="config-summary">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="任务名称">
                <el-input
                    v-model="trainingConfig.taskName"
                    placeholder="输入任务名称"
                />
              </el-descriptions-item>
              <el-descriptions-item label="模型类型">
                {{ getSelectedModel()?.name }}
              </el-descriptions-item>
              <el-descriptions-item label="数据源">
                {{ dataSourceType === 'upload' ? `${uploadedFiles.length} 个文件` : dataSourceType }}
              </el-descriptions-item>
              <el-descriptions-item label="训练轮数">
                {{ modelParams.epochs }}
              </el-descriptions-item>
              <el-descriptions-item label="批次大小">
                {{ modelParams.batchSize }}
              </el-descriptions-item>
              <el-descriptions-item label="学习率">
                {{ modelParams.learningRate }}
              </el-descriptions-item>
              <el-descriptions-item label="预计时间">
                {{ estimatedTime }}
              </el-descriptions-item>
              <el-descriptions-item label="优先级">
                <el-radio-group v-model="trainingConfig.priority">
                  <el-radio :label="1">低</el-radio>
                  <el-radio :label="5">中</el-radio>
                  <el-radio :label="10">高</el-radio>
                </el-radio-group>
              </el-descriptions-item>
            </el-descriptions>

            <div class="additional-options">
              <h4>附加选项</h4>
              <el-checkbox v-model="trainingConfig.notifications">
                训练完成后发送通知
              </el-checkbox>
              <el-checkbox v-model="trainingConfig.autoSave">
                自动保存最佳模型
              </el-checkbox>
              <el-checkbox v-model="trainingConfig.tensorboard">
                启用TensorBoard监控
              </el-checkbox>
            </div>
          </div>

          <template #footer>
            <div class="launch-actions">
              <el-button size="large" @click="saveConfig">
                <el-icon><Document /></el-icon>
                保存配置
              </el-button>
              <el-button
                  type="primary"
                  size="large"
                  :loading="launching"
                  @click="launchTraining"
              >
                <el-icon><VideoPlay /></el-icon>
                启动训练
              </el-button>
            </div>
          </template>
        </AICard>
      </div>

      <!-- 步骤导航 -->
      <div class="wizard-navigation">
        <el-button
            v-show="currentStep > 0"
            @click="currentStep--"
        >
          <el-icon><ArrowLeft /></el-icon>
          上一步
        </el-button>
        <el-button
            v-show="currentStep < 3"
            type="primary"
            :disabled="!canProceed"
            @click="currentStep++"
        >
          下一步
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Document, List, Cpu, Setting, CircleCheck,
  Timer, UploadFilled, Document as DocIcon, ArrowLeft,
  ArrowRight, VideoPlay
} from '@element-plus/icons-vue'
import AICard from '@/modules/common/components/AICard.vue'

const router = useRouter()

// 响应式数据
const currentStep = ref(0)
const selectedCategory = ref('classification')
const dataSourceType = ref('upload')
const launching = ref(false)
const uploadedFiles = ref<any[]>([])
const selectedSampleData = ref('')
const preprocessingOptions = ref(['normalize', 'split'])

const trainingConfig = ref({
  taskName: '',
  modelId: '',
  priority: 5,
  notifications: true,
  autoSave: true,
  tensorboard: false
})

const dbConfig = ref({
  source: 'mysql',
  query: ''
})

const modelParams = ref({
  epochs: 10,
  batchSize: 32,
  learningRate: 0.001,
  optimizer: 'adam',
  lossFunction: 'crossentropy',
  useRegularization: false
})

// 模型数据
const models = [
  {
    id: 'rf',
    category: 'classification',
    name: '随机森林',
    icon: 'Grid',
    description: '集成学习方法，适用于分类和回归',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    estimatedTime: '10-30分钟',
    complexity: '中等',
    tags: ['集成学习', '高准确率'],
    isNew: false
  },
  {
    id: 'nn',
    category: 'deeplearning',
    name: '神经网络',
    icon: 'Share',
    description: '深度学习基础模型，可处理复杂模式',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    estimatedTime: '1-3小时',
    complexity: '高',
    tags: ['深度学习', '灵活性强'],
    isNew: true
  },
  {
    id: 'svm',
    category: 'classification',
    name: '支持向量机',
    icon: 'Aim',
    description: '适用于高维数据的分类算法',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    estimatedTime: '20-40分钟',
    complexity: '中等',
    tags: ['二分类', '核方法'],
    isNew: false
  },
  {
    id: 'kmeans',
    category: 'clustering',
    name: 'K-Means',
    icon: 'Connection',
    description: '经典聚类算法，自动发现数据分组',
    color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    estimatedTime: '5-15分钟',
    complexity: '简单',
    tags: ['无监督', '快速'],
    isNew: false
  }
]

const sampleDatasets = [
  { id: 'iris', name: '鸢尾花数据集', description: '经典分类数据集', size: '150样本' },
  { id: 'house', name: '房价预测数据', description: '回归任务示例', size: '500样本' },
  { id: 'customer', name: '客户分群数据', description: '聚类任务示例', size: '1000样本' }
]

// 计算属性
const filteredModels = computed(() => {
  return models.filter(m => m.category === selectedCategory.value)
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return !!trainingConfig.value.modelId
    case 1:
      return uploadedFiles.value.length > 0 || selectedSampleData.value || dbConfig.value.query
    case 2:
      return true
    default:
      return false
  }
})

const estimatedTime = computed(() => {
  const baseTime = modelParams.value.epochs * 2
  return `约 ${Math.ceil(baseTime / 60)} 小时`
})

const estimatedMemory = computed(() => {
  return (modelParams.value.batchSize * 0.1).toFixed(1)
})

const parameterCount = computed(() => {
  return '1.2M'
})

const complexityScore = computed(() => {
  return Math.min(modelParams.value.epochs * 2 + modelParams.value.batchSize / 10, 100)
})

const getComplexityColor = computed(() => (percentage: number) => {
  if (percentage < 30) return '#10b981'
  if (percentage < 70) return '#f59e0b'
  return '#ef4444'
})

// 方法
const getSelectedModel = () => {
  return models.find(m => m.id === trainingConfig.value.modelId)
}

const handleFileChange = (file: any, fileList: any) => {
  uploadedFiles.value = fileList
}

const removeFile = (file: any) => {
  const index = uploadedFiles.value.indexOf(file)
  if (index > -1) {
    uploadedFiles.value.splice(index, 1)
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const testConnection = () => {
  ElMessage.info('测试数据库连接...')
}

const previewData = () => {
  ElMessage.info('预览数据...')
}

const loadTemplate = () => {
  ElMessage.info('加载训练模板')
}

const saveConfig = () => {
  ElMessage.success('配置已保存')
}

const launchTraining = async () => {
  if (!trainingConfig.value.taskName) {
    ElMessage.warning('请输入任务名称')
    return
  }

  try {
    await ElMessageBox.confirm(
        '确定要启动训练任务吗？任务启动后将消耗计算资源。',
        '确认启动',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )

    launching.value = true

    // 模拟启动过程
    setTimeout(() => {
      launching.value = false
      ElMessage.success('训练任务已启动')
      router.push('/ml-training/tasks')
    }, 2000)
  } catch {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/ai-theme.scss';

.create-training-page {
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

.training-wizard {
  //max-width: 1400px;
  margin: 0 auto;

  .el-steps {
    margin-bottom: 48px;

    :deep(.el-step__title) {
      color: var(--ai-text-primary);
    }

    :deep(.el-step__description) {
      color: var(--ai-text-secondary);
    }
  }

  .wizard-step {
    min-height: 500px;
    margin-bottom: 24px;

    .model-categories {
      margin-bottom: 24px;
      text-align: center;
    }

    .model-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;

      .model-card {
        background: var(--ai-card-bg);
        border: 2px solid var(--ai-border);
        border-radius: 16px;
        padding: 24px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-4px);
          border-color: var(--ai-primary);
        }

        &.selected {
          border-color: var(--ai-primary);
          background: rgba(99, 102, 241, 0.1);
        }

        .model-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 16px;

          .model-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
        }

        h4 {
          margin: 0 0 8px 0;
          color: var(--ai-text-primary);
        }

        p {
          margin: 0 0 16px 0;
          color: var(--ai-text-secondary);
          font-size: 14px;
        }

        .model-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;

          span {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: var(--ai-text-muted);
          }
        }

        .model-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
      }
    }

    .data-source-tabs {
      .upload-section {
        .upload-hint {
          margin-top: 8px;
          color: var(--ai-text-muted);
          font-size: 14px;
        }

        .uploaded-files {
          margin-top: 24px;

          h4 {
            margin: 0 0 12px 0;
            color: var(--ai-text-primary);
          }

          .file-list {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .file-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px;
              background: var(--ai-bg-tertiary);
              border-radius: 8px;

              .file-name {
                flex: 1;
                color: var(--ai-text-primary);
              }

              .file-size {
                color: var(--ai-text-muted);
                font-size: 14px;
              }
            }
          }
        }
      }

      .database-section {
        padding: 20px 0;
      }

      .sample-section {
        padding: 20px 0;

        .sample-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;

          .sample-info {
            h5 {
              margin: 0 0 4px 0;
              color: var(--ai-text-primary);
            }

            p {
              margin: 0 0 8px 0;
              font-size: 14px;
              color: var(--ai-text-secondary);
            }
          }
        }
      }
    }

    .data-preprocessing {
      margin-top: 32px;
      padding: 20px;
      background: var(--ai-bg-tertiary);
      border-radius: 12px;

      h4 {
        margin: 0 0 16px 0;
        color: var(--ai-text-primary);
      }

      .el-checkbox-group {
        display: flex;
        gap: 24px;
      }
    }

    .params-config {
      h4 {
        margin: 24px 0 16px 0;
        color: var(--ai-text-primary);

        &:first-child {
          margin-top: 0;
        }
      }

      :deep(.el-form-item__label) {
        color: var(--ai-text-secondary);
      }
    }

    .params-preview {
      .preview-content {
        .preview-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--ai-border);

          &:last-child {
            border-bottom: none;
          }

          .label {
            color: var(--ai-text-secondary);
          }

          .value {
            font-weight: 600;
            color: var(--ai-text-primary);
          }
        }
      }

      .el-alert {
        margin-top: 16px;
      }
    }

    .tips-card {
      margin-top: 24px;

      .tips-list {
        margin: 0;
        padding-left: 20px;
        color: var(--ai-text-secondary);

        li {
          margin-bottom: 8px;
          line-height: 1.6;
        }
      }
    }

    .config-summary {
      .el-descriptions {
        margin-bottom: 32px;

        :deep(.el-descriptions__label) {
          color: var(--ai-text-secondary);
          background: var(--ai-bg-tertiary);
        }

        :deep(.el-descriptions__content) {
          color: var(--ai-text-primary);
        }
      }

      .additional-options {
        h4 {
          margin: 0 0 16px 0;
          color: var(--ai-text-primary);
        }

        .el-checkbox {
          display: block;
          margin-bottom: 12px;
        }
      }
    }

    .launch-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
    }
  }

  .wizard-navigation {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 32px;
  }
}

// 主题适配
:deep(.el-upload-dragger) {
  background: var(--ai-bg-tertiary);
  border-color: var(--ai-border);

  &:hover {
    border-color: var(--ai-primary);
  }
}

:deep(.el-radio) {
  --el-radio-text-color: var(--ai-text-primary);
}

:deep(.el-checkbox) {
  --el-checkbox-text-color: var(--ai-text-secondary);
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  background: var(--ai-bg-tertiary);
  color: var(--ai-text-primary);
}
</style>