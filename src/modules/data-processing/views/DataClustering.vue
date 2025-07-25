<template>
  <div class="data-clustering-page ai-gradient-bg">
    <!-- 使用PageHeader组件 -->
    <PageHeader
      title="智能数据聚类"
      subtitle="无监督学习自动发现数据模式与分组"
      icon="Connection"
    >
      <template #actions>
        <el-button @click="showHelp = true">
          <el-icon><QuestionFilled /></el-icon>
          算法说明
        </el-button>
      </template>
    </PageHeader>

    <!-- 统计概览 - 使用StatsGroup组件 -->
    <StatsGroup v-if="clusteringResult" class="stats-overview">
      <MetricCard
        label="聚类数量"
        :value="clusteringResult.clusters.length"
        icon="Grid"
        type="primary"
      />
      <MetricCard
        label="总样本数"
        :value="clusteringResult.clusters.reduce((sum, c) => sum + c.size, 0)"
        icon="DataAnalysis"
        type="success"
      />
      <MetricCard
        label="轮廓系数"
        :value="clusteringResult.metrics.silhouette"
        icon="TrendCharts"
        type="warning"
        :decimals="3"
        tooltip="衡量聚类的紧密度和分离度，值越接近1越好"
      />
      <MetricCard
        label="戴维森堡丁指数"
        :value="clusteringResult.metrics.daviesBouldin"
        icon="Histogram"
        type="info"
        :decimals="3"
        tooltip="值越小表示聚类效果越好"
      />
    </StatsGroup>

    <!-- 主要内容区域 -->
    <div class="clustering-workspace">
      <el-row :gutter="24">
        <!-- 左侧：数据输入与配置 -->
        <el-col :span="10">
          <AICard variant="glass" class="config-card">
            <template #header>
              <h3>数据配置</h3>
            </template>

            <!-- 数据源选择 -->
            <div class="data-source">
              <h4>选择数据源</h4>
              <el-radio-group v-model="dataSource" size="large">
                <el-radio-button label="upload">上传文件</el-radio-button>
                <el-radio-button label="sample">示例数据</el-radio-button>
                <el-radio-button label="database">数据库</el-radio-button>
              </el-radio-group>

              <!-- 使用FileUpload组件 -->
              <div v-if="dataSource === 'upload'" class="upload-section">
                <FileUpload
                  accept=".csv,.xlsx,.json"
                  :multiple="false"
                  :max-size="10"
                  @upload="handleFileUpload"
                  @remove="handleFileRemove"
                >
                  <template #tip>
                    支持CSV、Excel、JSON格式，最大10MB
                  </template>
                </FileUpload>
              </div>

              <!-- 示例数据选择 -->
              <div v-else-if="dataSource === 'sample'" class="sample-select">
                <el-select v-model="selectedSample" placeholder="选择示例数据集" size="large">
                  <el-option
                      v-for="sample in sampleDatasets"
                      :key="sample.id"
                      :label="sample.name"
                      :value="sample.id"
                  >
                    <div class="sample-option">
                      <span>{{ sample.name }}</span>
                      <span class="sample-desc">{{ sample.description }}</span>
                    </div>
                  </el-option>
                </el-select>
              </div>

              <!-- 数据库连接 -->
              <div v-else-if="dataSource === 'database'" class="db-connect">
                <el-button @click="showDbDialog = true">
                  <el-icon><Link /></el-icon>
                  配置数据库连接
                </el-button>
              </div>
            </div>

            <!-- 聚类算法选择 -->
            <div class="algorithm-config">
              <h4>聚类算法</h4>
              <el-select v-model="selectedAlgorithm" size="large">
                <el-option
                    v-for="algo in algorithms"
                    :key="algo.id"
                    :label="algo.name"
                    :value="algo.id"
                >
                  <div class="algo-option">
                    <span class="algo-name">{{ algo.name }}</span>
                    <el-tag size="small" :type="algo.difficulty">{{ algo.difficultyText }}</el-tag>
                  </div>
                </el-option>
              </el-select>

              <!-- 算法参数 -->
              <div class="algo-params">
                <div v-if="selectedAlgorithm === 'kmeans'" class="param-item">
                  <label>聚类数量 (K)</label>
                  <el-slider
                      v-model="params.k"
                      :min="2"
                      :max="10"
                      :marks="{ 2: '2', 5: '5', 10: '10' }"
                      show-input
                  />
                </div>
                <div v-else-if="selectedAlgorithm === 'dbscan'" class="param-item">
                  <label>邻域半径 (eps)</label>
                  <el-input-number v-model="params.eps" :min="0.1" :max="10" :step="0.1" />
                </div>
                <div class="param-item">
                  <label>距离度量</label>
                  <el-select v-model="params.metric" size="default">
                    <el-option label="欧氏距离" value="euclidean" />
                    <el-option label="曼哈顿距离" value="manhattan" />
                    <el-option label="余弦相似度" value="cosine" />
                  </el-select>
                </div>
              </div>
            </div>

            <!-- 特征选择 -->
            <div class="feature-selection">
              <h4>特征选择</h4>
              <el-checkbox-group v-model="selectedFeatures">
                <el-checkbox
                    v-for="feature in availableFeatures"
                    :key="feature"
                    :label="feature"
                >
                  {{ feature }}
                </el-checkbox>
              </el-checkbox-group>
            </div>

            <template #footer>
              <el-button
                  type="primary"
                  size="large"
                  :loading="clustering"
                  :disabled="!canStartClustering"
                  @click="startClustering"
              >
                <el-icon><MagicStick /></el-icon>
                开始聚类分析
              </el-button>
            </template>
          </AICard>
        </el-col>

        <!-- 右侧：可视化结果 -->
        <el-col :span="14">
          <AICard variant="gradient" class="visualization-card">
            <template #header>
              <h3>聚类可视化</h3>
              <div v-if="clusteringResult" class="vis-controls">
                <el-select v-model="visualizationType" size="small">
                  <el-option label="2D散点图" value="scatter2d" />
                  <el-option label="3D散点图" value="scatter3d" />
                  <el-option label="平行坐标" value="parallel" />
                  <el-option label="热力图" value="heatmap" />
                </el-select>
              </div>
            </template>

            <div class="visualization-area">
              <!-- 使用EmptyState组件 -->
              <EmptyState
                v-if="!clusteringResult && !clustering"
                icon="DataAnalysis"
                title="等待聚类分析"
                description="请先配置数据源和算法参数，然后开始聚类分析"
              >
                <template #actions>
                  <el-button
                    type="primary"
                    :disabled="!canStartClustering"
                    @click="startClustering"
                  >
                    开始分析
                  </el-button>
                </template>
              </EmptyState>

              <!-- 分析进行中状态 -->
              <EmptyState
                v-else-if="clustering"
                icon="Loading"
                title="正在进行聚类分析"
                description="AI正在分析您的数据，请耐心等待..."
              />

              <div v-else class="vis-content">
                <!-- 主可视化图表 -->
                <div class="main-chart">
                  <DataVisualization
                      type="custom"
                      :options="getVisualizationOptions()"
                      :height="400"
                  />
                </div>

                <!-- 聚类统计 -->
                <div class="cluster-stats">
                  <div
                      v-for="cluster in clusteringResult.clusters"
                      :key="cluster.id"
                      class="cluster-card"
                      :style="{ borderColor: cluster.color }"
                  >
                    <div class="cluster-header">
                      <div class="cluster-color" :style="{ background: cluster.color }"></div>
                      <h5>聚类 {{ cluster.id }}</h5>
                      <el-tag size="small">{{ cluster.size }} 个样本</el-tag>
                    </div>
                    <div class="cluster-metrics">
                      <div class="metric">
                        <span class="metric-label">密度</span>
                        <span class="metric-value">{{ cluster.density.toFixed(2) }}</span>
                      </div>
                      <div class="metric">
                        <span class="metric-label">离散度</span>
                        <span class="metric-value">{{ cluster.dispersion.toFixed(2) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AICard>
        </el-col>
      </el-row>
    </div>

    <!-- 详细分析结果 -->
    <div v-if="clusteringResult" class="analysis-results">
      <AICard variant="glass">
        <template #header>
          <h3>详细分析</h3>
          <el-button-group>
            <el-button
                v-for="view in resultViews"
                :key="view.id"
                :type="activeView === view.id ? 'primary' : 'default'"
                @click="activeView = view.id"
            >
              {{ view.label }}
            </el-button>
          </el-button-group>
        </template>

        <!-- 特征重要性 -->
        <div v-show="activeView === 'features'" class="feature-importance">
          <h4>特征重要性分析</h4>
          <div class="importance-chart">
            <DataVisualization
                type="bar"
                :data="featureImportanceData"
                :height="300"
            />
          </div>
        </div>

        <!-- 样本分布 -->
        <div v-show="activeView === 'distribution'" class="sample-distribution">
          <h4>样本分布表</h4>
          <el-table :data="sampleTableData" style="width: 100%">
            <el-table-column prop="id" label="样本ID" width="100" />
            <el-table-column prop="cluster" label="所属聚类">
              <template #default="{ row }">
                <div class="cluster-tag">
                  <span
                      class="cluster-dot"
                      :style="{ background: getClusterColor(row.cluster) }"
                  ></span>
                  聚类 {{ row.cluster }}
                </div>
              </template>
            </el-table-column>
            <el-table-column
                v-for="feature in selectedFeatures"
                :key="feature"
                :prop="feature"
                :label="feature"
            />
            <el-table-column prop="distance" label="到中心距离" />
          </el-table>
        </div>

        <!-- 导出选项 -->
        <div v-show="activeView === 'export'" class="export-options">
          <h4>导出结果</h4>
          <el-form label-width="120px">
            <el-form-item label="导出格式">
              <el-checkbox-group v-model="exportOptions.formats">
                <el-checkbox label="csv">CSV数据</el-checkbox>
                <el-checkbox label="json">JSON格式</el-checkbox>
                <el-checkbox label="report">分析报告</el-checkbox>
                <el-checkbox label="visualization">可视化图表</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="包含内容">
              <el-checkbox-group v-model="exportOptions.content">
                <el-checkbox label="clusters">聚类结果</el-checkbox>
                <el-checkbox label="metrics">评估指标</el-checkbox>
                <el-checkbox label="features">特征分析</el-checkbox>
                <el-checkbox label="samples">样本数据</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="exportResults">
                <el-icon><Download /></el-icon>
                导出选中内容
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </AICard>
    </div>

    <!-- 算法说明对话框 -->
    <el-dialog v-model="showHelp" title="聚类算法说明" width="700px">
      <div class="help-content">
        <el-collapse>
          <el-collapse-item
              v-for="algo in algorithms"
              :key="algo.id"
              :title="algo.name"
              :name="algo.id"
          >
            <p>{{ algo.description }}</p>
            <div class="algo-details">
              <h5>适用场景</h5>
              <ul>
                <li v-for="(use, index) in algo.useCases" :key="index">{{ use }}</li>
              </ul>
              <h5>参数说明</h5>
              <ul>
                <li v-for="(param, index) in algo.parameters" :key="index">
                  <strong>{{ param.name }}:</strong> {{ param.description }}
                </li>
              </ul>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Connection, QuestionFilled, Upload, Link, MagicStick,
  DataAnalysis, Download
} from '@element-plus/icons-vue'
import AICard from '@/modules/common/components/AICard.vue'
import MetricCard from '@/modules/common/components/MetricCard.vue'
import DataVisualization from '@/modules/common/components/DataVisualization.vue'
import PageHeader from '@/modules/common/components/PageHeader.vue'
import StatsGroup from '@/modules/common/components/StatsGroup.vue'
import FileUpload from '@/modules/common/components/FileUpload.vue'
import EmptyState from '@/modules/common/components/EmptyState.vue'

// 响应式数据
const dataSource = ref('sample')
const selectedSample = ref('customer')
const selectedAlgorithm = ref('kmeans')
const clustering = ref(false)
const showHelp = ref(false)
const showDbDialog = ref(false)
const visualizationType = ref('scatter2d')
const activeView = ref('features')
const clusteringResult = ref<any>(null)

const params = ref({
  k: 3,
  eps: 0.5,
  metric: 'euclidean'
})

const selectedFeatures = ref(['age', 'income', 'spending'])
const availableFeatures = ref(['age', 'income', 'spending', 'score', 'visits'])

const exportOptions = ref({
  formats: ['csv', 'report'],
  content: ['clusters', 'metrics']
})

// 配置数据
const sampleDatasets = [
  { id: 'customer', name: '客户细分数据', description: '包含客户年龄、收入、消费等信息' },
  { id: 'product', name: '产品销售数据', description: '产品价格、销量、评分等多维数据' },
  { id: 'market', name: '市场调研数据', description: '用户行为、偏好、满意度调查数据' }
]

const algorithms = [
  {
    id: 'kmeans',
    name: 'K-Means',
    difficulty: 'success',
    difficultyText: '简单',
    description: '最常用的聚类算法，通过迭代优化将数据分为K个簇',
    useCases: ['客户细分', '图像压缩', '异常检测'],
    parameters: [
      { name: 'K', description: '聚类数量，需要预先指定' },
      { name: '距离度量', description: '计算样本间距离的方法' }
    ]
  },
  {
    id: 'dbscan',
    name: 'DBSCAN',
    difficulty: 'warning',
    difficultyText: '中等',
    description: '基于密度的聚类算法，可以发现任意形状的簇',
    useCases: ['异常检测', '地理数据分析', '噪声数据处理'],
    parameters: [
      { name: 'eps', description: '邻域半径' },
      { name: 'min_samples', description: '最小样本数' }
    ]
  },
  {
    id: 'hierarchical',
    name: '层次聚类',
    difficulty: 'danger',
    difficultyText: '复杂',
    description: '构建聚类的层次结构，可以得到不同粒度的聚类结果',
    useCases: ['生物分类', '社交网络分析', '文档聚类'],
    parameters: [
      { name: '链接方式', description: 'single, complete, average等' },
      { name: '距离阈值', description: '切割树的高度' }
    ]
  }
]

const resultViews = [
  { id: 'features', label: '特征分析' },
  { id: 'distribution', label: '样本分布' },
  { id: 'export', label: '导出结果' }
]

// 计算属性
const canStartClustering = computed(() => {
  return selectedFeatures.value.length > 0 && (
      (dataSource.value === 'sample' && selectedSample.value) ||
      dataSource.value === 'upload' ||
      dataSource.value === 'database'
  )
})

const featureImportanceData = computed(() => ({
  categories: selectedFeatures.value,
  series: [{
    name: '重要性得分',
    data: selectedFeatures.value.map(() => Math.random() * 100)
  }]
}))

const sampleTableData = computed(() => {
  if (!clusteringResult.value) return []
  return Array.from({ length: 10 }, (_, i) => ({
    id: `S${i + 1}`,
    cluster: Math.floor(Math.random() * params.value.k),
    age: Math.floor(Math.random() * 40 + 20),
    income: Math.floor(Math.random() * 100000 + 30000),
    spending: Math.floor(Math.random() * 1000 + 100),
    distance: (Math.random() * 2).toFixed(3)
  }))
})

// 方法
const handleFileUpload = (file: File) => {
  ElMessage.success(`文件上传成功: ${file.name}`)
  // 这里可以添加文件解析逻辑
  // 解析后更新 availableFeatures
  availableFeatures.value = ['age', 'income', 'spending', 'score', 'visits', 'category']
}

const handleFileRemove = (file: File) => {
  ElMessage.info(`已移除文件: ${file.name}`)
  // 重置特征列表
  availableFeatures.value = ['age', 'income', 'spending', 'score', 'visits']
  selectedFeatures.value = ['age', 'income', 'spending']
}

const handleFileChange = (file: any) => {
  ElMessage.success(`已选择文件: ${file.name}`)
}

const startClustering = async () => {
  clustering.value = true

  // 模拟聚类过程
  setTimeout(() => {
    clusteringResult.value = {
      clusters: Array.from({ length: params.value.k }, (_, i) => ({
        id: i,
        size: Math.floor(Math.random() * 100 + 50),
        color: ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'][i],
        density: Math.random() * 10,
        dispersion: Math.random() * 5
      })),
      metrics: {
        silhouette: 0.642,
        daviesBouldin: 0.823,
        calinskiHarabasz: 156.4
      }
    }

    clustering.value = false
    ElMessage.success('聚类分析完成！')
  }, 3000)
}

const getVisualizationOptions = () => {
  // 根据可视化类型返回不同的图表配置
  if (visualizationType.value === 'scatter2d') {
    return {
      xAxis: { type: 'value', name: selectedFeatures.value[0] },
      yAxis: { type: 'value', name: selectedFeatures.value[1] },
      series: clusteringResult.value.clusters.map((cluster: any) => ({
        name: `聚类 ${cluster.id}`,
        type: 'scatter',
        data: Array.from({ length: cluster.size }, () => [
          Math.random() * 100,
          Math.random() * 100
        ]),
        itemStyle: { color: cluster.color }
      }))
    }
  }
  return {}
}

const getClusterColor = (clusterId: number) => {
  const cluster = clusteringResult.value?.clusters.find((c: any) => c.id === clusterId)
  return cluster?.color || '#ccc'
}

const exportResults = () => {
  ElMessage.success('正在导出聚类结果...')
}
</script>

<style lang="scss" scoped>
@use '@/styles/ai-theme.scss';

.data-clustering-page {
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

.clustering-workspace {
  .config-card {
    height: 100%;

    .data-source {
      margin-bottom: 24px;

      h4 {
        margin: 0 0 12px 0;
        color: var(--ai-text-primary);
      }

      .upload-box {
        margin-top: 16px;

        :deep(.el-upload-dragger) {
          background: var(--ai-bg-tertiary);
          border-color: var(--ai-border);
        }
      }

      .sample-select {
        margin-top: 16px;

        .sample-option {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .sample-desc {
            font-size: 12px;
            color: var(--ai-text-muted);
          }
        }
      }

      .db-connect {
        margin-top: 16px;
      }
    }

    .algorithm-config {
      margin-bottom: 24px;

      h4 {
        margin: 0 0 12px 0;
        color: var(--ai-text-primary);
      }

      .algo-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .algo-params {
        margin-top: 16px;

        .param-item {
          margin-bottom: 16px;

          label {
            display: block;
            margin-bottom: 8px;
            color: var(--ai-text-secondary);
          }
        }
      }
    }

    .feature-selection {
      h4 {
        margin: 0 0 12px 0;
        color: var(--ai-text-primary);
      }

      .el-checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    }
  }

  .visualization-card {
    height: 100%;

    .vis-controls {
      display: flex;
      gap: 12px;
    }

    .visualization-area {
      min-height: 500px;

      .empty-state {
        height: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--ai-text-muted);

        .el-icon {
          margin-bottom: 16px;
        }
      }

      .vis-content {
        .main-chart {
          margin-bottom: 24px;
        }

        .cluster-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;

          .cluster-card {
            background: var(--ai-card-bg);
            border: 2px solid;
            border-radius: 12px;
            padding: 16px;

            .cluster-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 12px;

              .cluster-color {
                width: 16px;
                height: 16px;
                border-radius: 4px;
              }

              h5 {
                margin: 0;
                flex: 1;
                color: var(--ai-text-primary);
              }
            }

            .cluster-metrics {
              display: flex;
              gap: 16px;

              .metric {
                flex: 1;

                .metric-label {
                  display: block;
                  font-size: 12px;
                  color: var(--ai-text-muted);
                }

                .metric-value {
                  font-size: 18px;
                  font-weight: 600;
                  color: var(--ai-text-primary);
                }
              }
            }
          }
        }
      }
    }

    .quality-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }
  }
}

.analysis-results {
  margin-top: 32px;

  .feature-importance {
    h4 {
      margin: 0 0 16px 0;
      color: var(--ai-text-primary);
    }
  }

  .sample-distribution {
    h4 {
      margin: 0 0 16px 0;
      color: var(--ai-text-primary);
    }

    .cluster-tag {
      display: flex;
      align-items: center;
      gap: 6px;

      .cluster-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
    }
  }

  .export-options {
    h4 {
      margin: 0 0 16px 0;
      color: var(--ai-text-primary);
    }

    :deep(.el-form-item__label) {
      color: var(--ai-text-secondary);
    }
  }
}

.help-content {
  .algo-details {
    margin-top: 16px;

    h5 {
      margin: 16px 0 8px 0;
      color: var(--ai-text-primary);
    }

    ul {
      margin: 0;
      padding-left: 20px;
      color: var(--ai-text-secondary);

      li {
        margin-bottom: 4px;
      }
    }
  }
}

// 主题适配
:deep(.el-table) {
  background: transparent;

  th.el-table__cell {
    background: var(--ai-bg-tertiary);
    color: var(--ai-text-primary);
  }

  td.el-table__cell {
    border-color: var(--ai-border);
    color: var(--ai-text-secondary);
  }
}
</style>