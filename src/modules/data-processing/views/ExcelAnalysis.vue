<template>
  <div class="excel-analysis-page">
    <!-- 页面头部 -->
    <PageHeader
        title="Excel智能分析"
        subtitle="上传Excel文件，AI自动分析数据并生成洞察报告"
        icon="DocumentCopy"
    >
      <template #actions>
        <el-button @click="showTemplate = true">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
        <el-button type="primary" @click="showGuide = true">
          <el-icon><QuestionFilled /></el-icon>
          使用指南
        </el-button>
      </template>
    </PageHeader>

    <!-- 上传区域 -->
    <AICard v-if="!analysisResults" class="upload-section">
      <FileUpload
          v-model="uploadedFile"
          accept=".xlsx,.xls"
          :max-size="20"
          title="上传Excel文件进行智能分析"
          description="支持 .xlsx 和 .xls 格式，最大 20MB"
          file-icon="DocumentCopy"
          :icon-size="80"
          @change="handleFileChange"
      >
        <template #extra>
          <!-- 分析选项 -->
          <div class="analysis-options" v-if="uploadedFile">
            <h4>分析选项</h4>
            <el-form label-width="100px">
              <el-form-item label="分析类型">
                <el-checkbox-group v-model="analysisOptions.types">
                  <el-checkbox label="statistical">统计分析</el-checkbox>
                  <el-checkbox label="trend">趋势分析</el-checkbox>
                  <el-checkbox label="correlation">相关性分析</el-checkbox>
                  <el-checkbox label="anomaly">异常检测</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="工作表">
                <el-select v-model="analysisOptions.sheet" placeholder="选择要分析的工作表">
                  <el-option
                      v-for="sheet in fileStats.sheetNames"
                      :key="sheet"
                      :label="sheet"
                      :value="sheet"
                  />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" size="large" @click="startAnalysis" :loading="analyzing">
                  <el-icon><DataAnalysis /></el-icon>
                  开始分析
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </template>
      </FileUpload>
    </AICard>

    <!-- 分析结果 -->
    <div v-else class="results-section">
      <!-- 操作栏 -->
      <div class="result-actions">
        <el-button @click="resetAnalysis">
          <el-icon><DocumentAdd /></el-icon>
          新的分析
        </el-button>
        <el-button-group>
          <el-button @click="exportReport('pdf')">
            <el-icon><Download /></el-icon>
            导出PDF
          </el-button>
          <el-button @click="exportReport('pptx')">导出PPT</el-button>
          <el-button @click="exportReport('html')">导出HTML</el-button>
        </el-button-group>
      </div>

      <!-- AI洞察 -->
      <AICard title="AI洞察分析" icon="MagicStick" class="insights-card">
        <div class="ai-insights">
          <div class="insight-item" v-for="insight in analysisResults.insights" :key="insight.id">
            <div class="insight-icon" :style="{ background: insight.color }">
              <el-icon><component :is="insight.icon" /></el-icon>
            </div>
            <div class="insight-content">
              <h4>{{ insight.title }}</h4>
              <p>{{ insight.description }}</p>
              <el-button text type="primary" @click="viewInsightDetail(insight)">
                查看详情
                <el-icon><ArrowRight /></el-icon>
              </el-button>
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
      <AICard title="统计摘要" icon="DataLine">
        <StatsGroup :stats="statisticsData" />
      </AICard>

      <!-- 数据表格预览 -->
      <AICard title="数据预览" icon="Grid">
        <el-table :data="tableData" style="width: 100%" max-height="400">
          <el-table-column
              v-for="col in tableColumns"
              :key="col.prop"
              :prop="col.prop"
              :label="col.label"
              :width="col.width"
          />
        </el-table>
      </AICard>
    </div>

    <!-- 模板下载对话框 -->
    <el-dialog v-model="showTemplate" title="下载Excel模板" width="600px">
      <div class="template-list">
        <div
            v-for="template in templates"
            :key="template.id"
            class="template-item"
            @click="downloadTemplate(template)"
        >
          <el-icon :size="48"><DocumentCopy /></el-icon>
          <div class="template-info">
            <h4>{{ template.name }}</h4>
            <p>{{ template.description }}</p>
          </div>
          <el-button type="primary" text>下载</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 使用指南对话框 -->
    <el-dialog v-model="showGuide" title="使用指南" width="700px">
      <div class="guide-content">
        <el-steps direction="vertical" :active="4">
          <el-step title="准备数据" description="确保Excel文件格式正确，数据完整" />
          <el-step title="上传文件" description="点击上传区域或拖拽文件上传" />
          <el-step title="选择分析选项" description="根据需求选择分析类型和工作表" />
          <el-step title="查看结果" description="AI将自动分析数据并生成可视化报告" />
        </el-steps>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DocumentCopy, Download, QuestionFilled, DocumentAdd,
  DataAnalysis, ArrowRight, Histogram, TrendCharts,
  DataLine, Grid, MagicStick
} from '@element-plus/icons-vue'
import AICard from '@/modules/common/components/AICard.vue'
import FileUpload from '@/modules/common/components/FileUpload.vue'
import DataVisualization from '@/modules/common/components/DataVisualization.vue'
import PageHeader from '@/modules/common/components/PageHeader.vue'
import StatsGroup from '@/modules/common/components/StatsGroup.vue'

// 响应式数据
const uploadedFile = ref<File | null>(null)
const analyzing = ref(false)
const showTemplate = ref(false)
const showGuide = ref(false)
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

// 图表数据
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

// 统计数据（用于 StatsGroup 组件）
const statisticsData = computed(() => [
  {
    label: '数据行数',
    value: analysisResults.value?.statistics?.[0]?.values?.[0]?.value || 1250,
    icon: 'Document',
    type: 'primary',
    suffix: '行'
  },
  {
    label: '数据列数',
    value: analysisResults.value?.statistics?.[0]?.values?.[1]?.value || 15,
    icon: 'Grid',
    type: 'success',
    suffix: '列'
  },
  {
    label: '空值率',
    value: analysisResults.value?.statistics?.[0]?.values?.[2]?.value || 2.3,
    icon: 'Warning',
    type: 'warning',
    suffix: '%',
    decimals: 1
  },
  {
    label: '数据质量',
    value: analysisResults.value?.statistics?.[0]?.values?.[3]?.value || 97.7,
    icon: 'CircleCheck',
    type: 'success',
    suffix: '%',
    decimals: 1
  }
])

// 表格数据
const tableData = ref<any[]>([])
const tableColumns = ref<any[]>([])

// 模板列表
const templates = [
  { id: 1, name: '销售数据模板', description: '适用于销售数据分析，包含订单、客户、产品等字段' },
  { id: 2, name: '财务报表模板', description: '标准财务报表格式，支持损益表、资产负债表等' },
  { id: 3, name: '库存管理模板', description: '库存进销存数据模板，支持多仓库管理' },
  { id: 4, name: '人事数据模板', description: '员工信息、考勤、绩效等人事数据分析模板' }
]

// 方法
const handleFileChange = (file: File | null) => {
  if (file) {
    // 模拟获取文件信息
    fileStats.value = {
      sheets: 3,
      rows: 1250,
      columns: 15,
      sheetNames: ['销售数据', '客户信息', '产品清单']
    }
    analysisOptions.value.sheet = fileStats.value.sheetNames[0]
  }
}

const startAnalysis = async () => {
  analyzing.value = true

  try {
    // 模拟分析过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模拟分析结果
    analysisResults.value = {
      insights: [
        {
          id: 1,
          title: '销售趋势发现',
          description: '过去6个月销售额呈上升趋势，月均增长率达到15.3%，预计下季度将突破新高',
          icon: 'TrendCharts',
          color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          type: 'trend'
        },
        {
          id: 2,
          title: '异常数据检测',
          description: '发现3月份数据存在异常波动，建议核查相关订单记录',
          icon: 'Warning',
          color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          type: 'anomaly'
        },
        {
          id: 3,
          title: '客户分布洞察',
          description: '80%的收入来自20%的核心客户，建议加强核心客户维护',
          icon: 'PieChart',
          color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          type: 'distribution'
        }
      ],
      statistics: [
        {
          name: '数据概览',
          values: [
            { label: '总行数', value: 1250 },
            { label: '总列数', value: 15 },
            { label: '空值率', value: 2.3 },
            { label: '数据质量', value: 97.7 }
          ]
        }
      ]
    }

    // 模拟表格数据
    tableData.value = Array(20).fill(null).map((_, i) => ({
      date: `2024-01-${i + 1}`,
      product: `产品${i + 1}`,
      sales: Math.floor(Math.random() * 10000),
      quantity: Math.floor(Math.random() * 100),
      customer: `客户${Math.floor(Math.random() * 50)}`
    }))

    tableColumns.value = [
      { prop: 'date', label: '日期', width: 120 },
      { prop: 'product', label: '产品' },
      { prop: 'sales', label: '销售额' },
      { prop: 'quantity', label: '数量' },
      { prop: 'customer', label: '客户' }
    ]

    ElMessage.success('分析完成！')
  } catch (error) {
    ElMessage.error('分析失败，请重试')
  } finally {
    analyzing.value = false
  }
}

const resetAnalysis = () => {
  analysisResults.value = null
  uploadedFile.value = null
  fileStats.value = {
    sheets: 0,
    rows: 0,
    columns: 0,
    sheetNames: []
  }
}

const exportReport = (format: string) => {
  ElMessage.success(`正在导出${format.toUpperCase()}格式报告...`)
}

const downloadTemplate = (template: any) => {
  ElMessage.success(`正在下载${template.name}...`)
}

const viewInsightDetail = (insight: any) => {
  ElMessage.info(`查看${insight.title}详情`)
}
</script>

<style lang="scss" scoped>
@use '@/styles/mixins.scss';
@use '@/styles/animations.scss';
@use '@/styles/ai-theme.scss';  // 添加这行

.excel-analysis-page {
  padding: 24px;
  min-height: 100vh;
  background: var(--ai-bg-primary);
  color: var(--ai-text-primary);

  .upload-section {
    margin-bottom: 24px;
    @include mixins.fade-slide;

    .analysis-options {
      @include mixins.glass-card;  // 使用玻璃卡片 mixin
      margin-top: 24px;
      padding: 20px;

      h4 {
        margin: 0 0 16px 0;
        color: var(--ai-text-primary);
        font-size: 18px;
        font-weight: 600;
      }

      .el-form {
        :deep(.el-form-item__label) {
          color: var(--ai-text-secondary);
        }

        :deep(.el-checkbox__label) {
          color: var(--ai-text-primary);
        }

        :deep(.el-select) {
          .el-input__inner {
            background: var(--ai-glass-bg);
            border-color: var(--ai-border);
            color: var(--ai-text-primary);
          }
        }

        :deep(.el-button--primary) {
          @include mixins.ai-button-gradient;
        }
      }
    }
  }

  .results-section {
    @include mixins.fade-slide;

    .result-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 16px 0;

      .el-button {
        @include mixins.ai-button-gradient;

        &:hover {
          background: var(--ai-glass-bg);
          border-color: var(--ai-primary);
          color: var(--ai-primary);
        }
      }
    }

    .insights-card {
      margin-bottom: 24px;

      .ai-insights {
        .insight-item {
          @include mixins.glass-card;  // 使用 glass-card mixin
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          margin-bottom: 16px;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: var(--ai-glass-shadow);
          }

          &:last-child {
            margin-bottom: 0;
          }

          .insight-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
          }

          .insight-content {
            flex: 1;

            h4 {
              margin: 0 0 8px 0;
              color: var(--ai-text-primary);
              font-size: 16px;
              font-weight: 600;
            }

            p {
              margin: 0;
              color: var(--ai-text-secondary);
              font-size: 14px;
              line-height: 1.5;
            }

            .el-button {
              margin-top: 8px;
              color: var(--ai-primary);

              &:hover {
                color: var(--ai-primary-light);
              }
            }
          }
        }
      }
    }
  }

  // 对话框样式
  :deep(.el-dialog) {
    background: var(--ai-card-bg);
    border: 1px solid var(--ai-border);

    .el-dialog__header {
      border-bottom: 1px solid var(--ai-border);

      .el-dialog__title {
        color: var(--ai-text-primary);
      }
    }

    .el-dialog__body {
      color: var(--ai-text-primary);
    }
  }

  .template-list {
    .template-item {
      @include mixins.ai-card-base;  // 使用卡片基础 mixin
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--ai-primary);
        background: rgba(99, 102, 241, 0.05);
        transform: translateY(-2px);
      }

      &:last-child {
        margin-bottom: 0;
      }

      .el-icon {
        color: var(--ai-primary);
      }

      .template-info {
        flex: 1;

        h4 {
          margin: 0 0 4px 0;
          color: var(--ai-text-primary);
          font-size: 16px;
          font-weight: 500;
        }

        p {
          margin: 0;
          color: var(--ai-text-secondary);
          font-size: 14px;
        }
      }

      .el-button {
        color: var(--ai-primary);

        &:hover {
          color: var(--ai-primary-light);
          background: rgba(99, 102, 241, 0.1);
        }
      }
    }
  }

  .guide-content {
    :deep(.el-steps) {
      .el-step__title {
        color: var(--ai-text-primary);
      }

      .el-step__description {
        color: var(--ai-text-secondary);
      }

      .el-step__icon {
        background: var(--ai-primary);
        border-color: var(--ai-primary);
      }

      .el-step__line {
        background: var(--ai-border);
      }
    }
  }

  // 表格样式
  :deep(.el-table) {
    background: var(--ai-card-bg);
    color: var(--ai-text-primary);

    .el-table__header {
      background: var(--ai-bg-secondary);

      th {
        background: var(--ai-bg-secondary);
        color: var(--ai-text-primary);
        border-bottom: 1px solid var(--ai-border);
      }
    }

    .el-table__body {
      tr {
        background: var(--ai-card-bg);

        &:hover {
          background: var(--ai-glass-bg);
        }

        td {
          border-bottom: 1px solid var(--ai-border);
          color: var(--ai-text-primary);
        }
      }
    }
  }
}

// 深色主题特定样式
html.dark .excel-analysis-page {
  .analysis-options {
    :deep(.el-checkbox) {
      .el-checkbox__input.is-checked .el-checkbox__inner {
        background-color: var(--ai-primary);
        border-color: var(--ai-primary);
      }
    }

    :deep(.el-select-dropdown) {
      background: var(--ai-card-bg);
      border: 1px solid var(--ai-border);

      .el-select-dropdown__item {
        color: var(--ai-text-primary);

        &:hover {
          background: var(--ai-glass-bg);
        }

        &.selected {
          background: var(--ai-primary);
          color: white;
        }
      }
    }
  }
}

// 浅色主题特定样式
html.light .excel-analysis-page {
  .analysis-options {
    background: rgba(255, 255, 255, 0.8);

    :deep(.el-checkbox) {
      .el-checkbox__input.is-checked .el-checkbox__inner {
        background-color: var(--ai-primary);
        border-color: var(--ai-primary);
      }
    }
  }

  .template-item {
    &:hover {
      background: rgba(99, 102, 241, 0.05);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .excel-analysis-page {
    padding: 16px;

    .result-actions {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    :deep(.el-col) {
      margin-bottom: 16px;
    }
  }
}
</style>