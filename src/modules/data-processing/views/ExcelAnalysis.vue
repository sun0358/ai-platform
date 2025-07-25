<template>
  <div class="excel-analysis-page ai-gradient-bg">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><DocumentCopy /></el-icon>
          Excel智能分析
        </h1>
        <p class="page-subtitle">AI驱动的数据洞察与可视化分析</p>
      </div>
      <div class="header-actions">
        <el-button @click="showTemplate = true">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
        <el-button type="primary" @click="showGuide = true">
          <el-icon><QuestionFilled /></el-icon>
          使用指南
        </el-button>
      </div>
    </div>

    <!-- 文件上传区域 -->
    <div class="upload-section">
      <AICard variant="glass">
        <div
            class="upload-area"
            :class="{ 'has-file': uploadedFile }"
            @click="!uploadedFile && selectFile()"
            @dragover.prevent
            @drop.prevent="handleDrop"
        >
          <div v-if="!uploadedFile" class="upload-placeholder">
            <el-icon :size="80"><DocumentAdd /></el-icon>
            <h3>拖拽Excel文件到此处</h3>
            <p>或点击选择文件</p>
            <div class="file-tips">
              <el-tag>支持 .xlsx</el-tag>
              <el-tag>支持 .xls</el-tag>
              <el-tag>最大 50MB</el-tag>
            </div>
          </div>

          <div v-else class="file-info">
            <div class="file-icon">
              <el-icon :size="48"><Document /></el-icon>
            </div>
            <div class="file-details">
              <h4>{{ uploadedFile.name }}</h4>
              <p>{{ formatFileSize(uploadedFile.size) }}</p>
              <div class="file-meta">
                <span><el-icon><Grid /></el-icon> {{ fileStats.sheets }} 个工作表</span>
                <span><el-icon><List /></el-icon> {{ fileStats.rows }} 行数据</span>
                <span><el-icon><Operation /></el-icon> {{ fileStats.columns }} 列</span>
              </div>
            </div>
            <el-button type="danger" :icon="Delete" circle @click.stop="removeFile" />
          </div>
        </div>

        <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            style="display: none"
            @change="handleFileSelect"
        />

        <div v-if="uploadedFile" class="analysis-options">
          <h4>分析选项</h4>
          <el-form :model="analysisOptions" label-width="120px">
            <el-form-item label="分析类型">
              <el-checkbox-group v-model="analysisOptions.types">
                <el-checkbox label="statistical">统计分析</el-checkbox>
                <el-checkbox label="trend">趋势分析</el-checkbox>
                <el-checkbox label="correlation">相关性分析</el-checkbox>
                <el-checkbox label="anomaly">异常检测</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="数据范围">
              <el-select v-model="analysisOptions.sheet" placeholder="选择工作表">
                <el-option
                    v-for="sheet in fileStats.sheetNames"
                    :key="sheet"
                    :label="sheet"
                    :value="sheet"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="智能推荐">
              <el-switch v-model="analysisOptions.autoSuggest" />
            </el-form-item>
          </el-form>
        </div>

        <template #footer>
          <el-button
              type="primary"
              size="large"
              :loading="analyzing"
              :disabled="!uploadedFile"
              @click="startAnalysis"
          >
            <el-icon><DataAnalysis /></el-icon>
            开始智能分析
          </el-button>
        </template>
      </AICard>
    </div>

    <!-- 分析结果 -->
    <transition name="fade-slide">
      <div v-if="analysisResults" class="results-section">
        <!-- AI洞察 -->
        <AICard variant="gradient" class="insights-card">
          <template #header>
            <h3>AI洞察</h3>
            <el-tag type="success">
              <el-icon><CircleCheck /></el-icon>
              分析完成
            </el-tag>
          </template>

          <div class="ai-insights">
            <div class="insight-item" v-for="insight in analysisResults.insights" :key="insight.id">
              <div class="insight-icon" :style="{ background: insight.color }">
                <el-icon><component :is="insight.icon" /></el-icon>
              </div>
              <div class="insight-content">
                <h4>{{ insight.title }}</h4>
                <p>{{ insight.description }}</p>
                <div class="insight-action">
                  <el-button text type="primary" @click="viewInsightDetail(insight)">
                    查看详情
                    <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </AICard>

        <!-- 数据可视化 -->
        <el-row :gutter="24">
          <el-col :span="12">
            <AICard title="数据分布" icon="Histogram">
              <DataVisualization
                  type="bar"
                  :data="chartData.distribution"
                  :height="300"
              />
            </AICard>
          </el-col>
          <el-col :span="12">
            <AICard title="趋势分析" icon="TrendCharts">
              <DataVisualization
                  type="line"
                  :data="chartData.trend"
                  :height="300"
              />
            </AICard>
          </el-col>
        </el-row>

        <!-- 统计信息 -->
        <AICard title="统计摘要" icon="DataLine" class="statistics-card">
          <div class="stats-grid">
            <div class="stat-group" v-for="group in analysisResults.statistics" :key="group.name">
              <h4>{{ group.name }}</h4>
              <div class="stat-items">
                <div class="stat-item" v-for="stat in group.values" :key="stat.label">
                  <span class="stat-label">{{ stat.label }}</span>
                  <span class="stat-value">{{ formatStatValue(stat) }}</span>
                </div>
              </div>
            </div>
          </div>
        </AICard>

        <!-- 数据表格预览 -->
        <AICard title="数据预览" icon="Grid" class="preview-card">
          <el-table
              :data="analysisResults.preview.data"
              style="width: 100%"
              max-height="400"
          >
            <el-table-column
                v-for="col in analysisResults.preview.columns"
                :key="col.prop"
                :prop="col.prop"
                :label="col.label"
                :width="col.width"
            />
          </el-table>
        </AICard>

        <!-- 导出选项 -->
        <AICard variant="glass" class="export-card">
          <template #header>
            <h3>导出报告</h3>
          </template>

          <div class="export-options">
            <div class="export-format">
              <h4>选择格式</h4>
              <el-radio-group v-model="exportFormat" size="large">
                <el-radio-button label="pdf">PDF报告</el-radio-button>
                <el-radio-button label="pptx">PPT演示</el-radio-button>
                <el-radio-button label="html">网页报告</el-radio-button>
                <el-radio-button label="json">JSON数据</el-radio-button>
              </el-radio-group>
            </div>

            <div class="export-actions">
              <el-button type="primary" @click="exportReport">
                <el-icon><Download /></el-icon>
                导出{{ exportFormatName }}
              </el-button>
              <el-button @click="shareReport">
                <el-icon><Share /></el-icon>
                分享报告
              </el-button>
            </div>
          </div>
        </AICard>
      </div>
    </transition>

    <!-- 模板下载对话框 -->
    <el-dialog v-model="showTemplate" title="下载Excel模板" width="600px">
      <div class="template-list">
        <div
            v-for="template in templates"
            :key="template.id"
            class="template-item"
            @click="downloadTemplate(template)"
        >
          <el-icon :size="32"><Document /></el-icon>
          <div class="template-info">
            <h4>{{ template.name }}</h4>
            <p>{{ template.description }}</p>
          </div>
          <el-button type="primary" text>下载</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DocumentCopy, Download, QuestionFilled, DocumentAdd, Document,
  Delete, Grid, List, Operation, DataAnalysis, CircleCheck,
  ArrowRight, Histogram, TrendCharts, DataLine, Share
} from '@element-plus/icons-vue'
import AICard from '@/modules/common/components/AICard.vue'
import DataVisualization from '@/modules/common/components/DataVisualization.vue'

// 响应式数据
const uploadedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()
const analyzing = ref(false)
const showTemplate = ref(false)
const showGuide = ref(false)
const exportFormat = ref('pdf')
const analysisResults = ref<any>(null)

const fileStats = ref({
  sheets: 0,
  rows: 0,
  columns: 0,
  sheetNames: [] as string[]
})

const analysisOptions = ref({
  types: ['statistical', 'trend'],
  sheet: '',
  autoSuggest: true
})

const chartData = ref({
  distribution: {
    categories: ['类别A', '类别B', '类别C', '类别D'],
    series: [
      { name: '数量', data: [120, 200, 150, 80] }
    ]
  },
  trend: {
    categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
    series: [
      { name: '销售额', data: [820, 932, 901, 934, 1290, 1330] },
      { name: '利润', data: [320, 432, 401, 434, 590, 630] }
    ]
  }
})

const templates = [
  { id: 1, name: '销售数据模板', description: '适用于销售数据分析，包含订单、客户、产品等字段' },
  { id: 2, name: '财务报表模板', description: '标准财务报表格式，支持损益表、资产负债表等' },
  { id: 3, name: '库存管理模板', description: '库存进销存数据模板，支持多仓库管理' },
  { id: 4, name: '人事数据模板', description: '员工信息、考勤、绩效等人事数据分析模板' }
]

// 计算属性
const exportFormatName = computed(() => {
  const names: Record<string, string> = {
    pdf: 'PDF报告',
    pptx: 'PPT演示',
    html: '网页报告',
    json: 'JSON数据'
  }
  return names[exportFormat.value] || '报告'
})

// 方法
const selectFile = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files[0]
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    processFile(file)
  }
}

const processFile = (file: File) => {
  if (file.size > 50 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过50MB')
    return
  }

  uploadedFile.value = file

  // 模拟文件统计
  fileStats.value = {
    sheets: 3,
    rows: 1000,
    columns: 15,
    sheetNames: ['销售数据', '客户信息', '产品目录']
  }

  analysisOptions.value.sheet = fileStats.value.sheetNames[0]
}

const removeFile = () => {
  uploadedFile.value = null
  analysisResults.value = null
  fileStats.value = {
    sheets: 0,
    rows: 0,
    columns: 0,
    sheetNames: []
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const startAnalysis = async () => {
  analyzing.value = true

  // 模拟分析过程
  setTimeout(() => {
    analysisResults.value = {
      insights: [
        {
          id: 1,
          icon: 'TrendCharts',
          color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          title: '销售额持续增长',
          description: '过去6个月销售额增长率达到35%，其中3月份增长最为显著'
        },
        {
          id: 2,
          icon: 'Warning',
          color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          title: '库存异常',
          description: '检测到5个SKU的库存量异常偏高，建议及时调整采购策略'
        },
        {
          id: 3,
          icon: 'User',
          color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          title: '客户集中度风险',
          description: '前10大客户贡献了60%的销售额，存在一定的客户集中度风险'
        }
      ],
      statistics: [
        {
          name: '基础统计',
          values: [
            { label: '总记录数', value: 1000, format: 'number' },
            { label: '有效数据率', value: 98.5, format: 'percent' },
            { label: '数据时间跨度', value: '6个月', format: 'text' }
          ]
        },
        {
          name: '业务指标',
          values: [
            { label: '总销售额', value: 2850000, format: 'currency' },
            { label: '平均订单金额', value: 2850, format: 'currency' },
            { label: '客户数量', value: 156, format: 'number' }
          ]
        }
      ],
      preview: {
        columns: [
          { prop: 'date', label: '日期', width: 100 },
          { prop: 'customer', label: '客户', width: 150 },
          { prop: 'product', label: '产品', width: 150 },
          { prop: 'quantity', label: '数量', width: 80 },
          { prop: 'amount', label: '金额', width: 100 }
        ],
        data: [
          { date: '2024-01-01', customer: '客户A', product: '产品1', quantity: 100, amount: 10000 },
          { date: '2024-01-02', customer: '客户B', product: '产品2', quantity: 50, amount: 5000 }
        ]
      }
    }

    analyzing.value = false
    ElMessage.success('分析完成！')
  }, 3000)
}

const viewInsightDetail = (insight: any) => {
  ElMessage.info(`查看洞察详情: ${insight.title}`)
}

const formatStatValue = (stat: any) => {
  switch (stat.format) {
    case 'number':
      return stat.value.toLocaleString()
    case 'percent':
      return stat.value + '%'
    case 'currency':
      return '¥' + stat.value.toLocaleString()
    default:
      return stat.value
  }
}

const exportReport = () => {
  ElMessage.success(`正在导出${exportFormatName.value}...`)
}

const shareReport = () => {
  ElMessage.info('生成分享链接...')
}

const downloadTemplate = (template: any) => {
  ElMessage.success(`下载模板: ${template.name}`)
  showTemplate.value = false
}
</script>

<style lang="scss" scoped>
@use '@/styles/ai-theme.scss';

.excel-analysis-page {
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

.upload-section {
  max-width: 1000px;
  margin: 0 auto 32px;

  .upload-area {
    min-height: 300px;
    background: var(--ai-bg-tertiary);
    border: 2px dashed var(--ai-border);
    border-radius: 16px;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover:not(.has-file) {
      border-color: var(--ai-primary);
      background: var(--ai-card-bg-hover);
    }

    &.has-file {
      cursor: default;
      border-style: solid;
    }

    .upload-placeholder {
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;

      .el-icon {
        color: var(--ai-primary);
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 8px 0;
        color: var(--ai-text-primary);
      }

      p {
        margin: 0 0 16px 0;
        color: var(--ai-text-secondary);
      }

      .file-tips {
        display: flex;
        gap: 8px;
      }
    }

    .file-info {
      padding: 32px;
      display: flex;
      align-items: center;
      gap: 24px;

      .file-icon {
        width: 80px;
        height: 80px;
        background: rgba(99, 102, 241, 0.1);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--ai-primary);
      }

      .file-details {
        flex: 1;

        h4 {
          margin: 0 0 8px 0;
          color: var(--ai-text-primary);
        }

        p {
          margin: 0 0 12px 0;
          color: var(--ai-text-secondary);
        }

        .file-meta {
          display: flex;
          gap: 24px;

          span {
            display: flex;
            align-items: center;
            gap: 4px;
            color: var(--ai-text-muted);
            font-size: 14px;
          }
        }
      }
    }
  }

  .analysis-options {
    margin-top: 24px;
    padding: 24px;
    background: var(--ai-card-bg);
    border-radius: 12px;

    h4 {
      margin: 0 0 16px 0;
      color: var(--ai-text-primary);
    }

    :deep(.el-form-item__label) {
      color: var(--ai-text-secondary);
    }
  }
}

.results-section {
  animation: fadeInUp 0.6s ease-out;

  .insights-card {
    margin-bottom: 24px;

    .ai-insights {
      display: grid;
      gap: 16px;

      .insight-item {
        display: flex;
        gap: 16px;
        padding: 20px;
        background: var(--ai-card-bg);
        border-radius: 12px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateX(8px);
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);
        }

        .insight-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .insight-content {
          flex: 1;

          h4 {
            margin: 0 0 8px 0;
            color: var(--ai-text-primary);
          }

          p {
            margin: 0 0 12px 0;
            color: var(--ai-text-secondary);
            line-height: 1.6;
          }

          .insight-action {
            .el-button {
              padding: 0;
            }
          }
        }
      }
    }
  }

  .statistics-card {
    margin: 24px 0;

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 32px;

      .stat-group {
        h4 {
          margin: 0 0 16px 0;
          color: var(--ai-text-primary);
          font-size: 16px;
        }

        .stat-items {
          display: grid;
          gap: 12px;

          .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: var(--ai-bg-tertiary);
            border-radius: 8px;

            .stat-label {
              color: var(--ai-text-muted);
            }

            .stat-value {
              font-weight: 600;
              color: var(--ai-text-primary);
            }
          }
        }
      }
    }
  }

  .export-card {
    margin-top: 24px;

    .export-options {
      .export-format {
        margin-bottom: 24px;

        h4 {
          margin: 0 0 12px 0;
          color: var(--ai-text-primary);
        }
      }

      .export-actions {
        display: flex;
        gap: 12px;
      }
    }
  }
}

.template-list {
  display: grid;
  gap: 12px;

  .template-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--ai-card-bg);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: var(--ai-card-bg-hover);
      transform: translateX(4px);
    }

    .el-icon {
      color: var(--ai-primary);
    }

    .template-info {
      flex: 1;

      h4 {
        margin: 0 0 4px 0;
        color: var(--ai-text-primary);
      }

      p {
        margin: 0;
        font-size: 14px;
        color: var(--ai-text-secondary);
      }
    }
  }
}

// 动画
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 主题适配
:deep(.el-table) {
  background: transparent;

  th.el-table__cell {
    background: var(--ai-bg-tertiary);
    color: var(--ai-text-primary);
  }

  tr {
    background: transparent;

    &:hover > td.el-table__cell {
      background: var(--ai-card-bg-hover);
    }
  }

  td.el-table__cell {
    border-color: var(--ai-border);
    color: var(--ai-text-secondary);
  }
}
</style>