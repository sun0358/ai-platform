<template>
  <div class="data-cleaning-page ai-gradient-bg">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Brush /></el-icon>
          智能数据清洗
        </h1>
        <p class="page-subtitle">自动检测和修复数据质量问题</p>
      </div>
      <div class="header-actions">
        <el-button @click="showRules = true">
          <el-icon><Setting /></el-icon>
          清洗规则
        </el-button>
        <el-button type="primary" @click="showHistory = true">
          <el-icon><Clock /></el-icon>
          清洗历史
        </el-button>
      </div>
    </div>

    <!-- 数据上传和预览 -->
    <div class="data-upload-section">
      <AICard variant="glass">
        <template #header>
          <h3>数据源</h3>
          <el-tag v-if="dataLoaded" type="success">已加载</el-tag>
        </template>

        <div class="upload-area" v-if="!dataLoaded">
          <el-upload
              drag
              :auto-upload="false"
              accept=".csv,.xlsx,.json"
              @change="handleFileUpload"
          >
            <el-icon :size="60"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              拖拽数据文件到此处或<em>点击上传</em>
            </div>
            <div class="upload-tips">
              支持 CSV、Excel、JSON 格式
            </div>
          </el-upload>
        </div>

        <div v-else class="data-info">
          <div class="file-info">
            <el-icon :size="40"><Document /></el-icon>
            <div class="file-details">
              <h4>{{ uploadedFile?.name }}</h4>
              <div class="data-stats">
                <span><el-icon><Grid /></el-icon> {{ dataStats.rows }} 行</span>
                <span><el-icon><Operation /></el-icon> {{ dataStats.columns }} 列</span>
                <span><el-icon><Files /></el-icon> {{ formatFileSize(dataStats.size) }}</span>
              </div>
            </div>
            <el-button type="danger" text @click="clearData">
              <el-icon><Delete /></el-icon>
              清除
            </el-button>
          </div>

          <!-- 数据预览 -->
          <div class="data-preview">
            <h4>数据预览</h4>
            <el-table :data="previewData" style="width: 100%" max-height="300">
              <el-table-column
                  v-for="col in previewColumns"
                  :key="col"
                  :prop="col"
                  :label="col"
              >
                <template #default="{ row }">
                  <span :class="{ 'error-cell': hasError(row[col]) }">
                    {{ row[col] || '-' }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </AICard>
    </div>

    <!-- 数据质量检测 -->
    <div v-if="dataLoaded" class="quality-detection">
      <AICard variant="gradient">
        <template #header>
          <h3>数据质量检测</h3>
          <el-button
              type="primary"
              size="small"
              :loading="detecting"
              @click="startDetection"
          >
            <el-icon><Search /></el-icon>
            {{ detecting ? '检测中...' : '开始检测' }}
          </el-button>
        </template>

        <div v-if="!detectionResult" class="detection-empty">
          <el-icon :size="60"><InfoFilled /></el-icon>
          <p>点击"开始检测"进行数据质量分析</p>
        </div>

        <div v-else class="detection-results">
          <!-- 质量评分 -->
          <div class="quality-score">
            <div class="score-circle">
              <el-progress
                  type="circle"
                  :percentage="detectionResult.qualityScore"
                  :width="140"
                  :color="getScoreColor"
              >
                <template #default="{ percentage }">
                  <span class="score-text">{{ percentage }}</span>
                  <span class="score-label">质量评分</span>
                </template>
              </el-progress>
            </div>
            <div class="score-details">
              <h4>数据质量{{ getQualityLevel(detectionResult.qualityScore) }}</h4>
              <p>检测到 {{ detectionResult.totalIssues }} 个数据质量问题</p>
              <div class="issue-breakdown">
                <div
                    v-for="issue in detectionResult.issueTypes"
                    :key="issue.type"
                    class="issue-item"
                >
                  <el-icon :style="{ color: issue.color }">
                    <component :is="issue.icon" />
                  </el-icon>
                  <span class="issue-name">{{ issue.name }}</span>
                  <span class="issue-count">{{ issue.count }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 问题详情 -->
          <div class="issue-details">
            <el-tabs v-model="activeIssueTab">
              <el-tab-pane
                  v-for="issue in detectionResult.issueTypes"
                  :key="issue.type"
                  :label="`${issue.name} (${issue.count})`"
                  :name="issue.type"
              >
                <div class="issue-content">
                  <p class="issue-description">{{ issue.description }}</p>
                  <div class="affected-columns">
                    <h5>受影响的列：</h5>
                    <el-tag
                        v-for="col in issue.affectedColumns"
                        :key="col"
                        type="warning"
                    >
                      {{ col }}
                    </el-tag>
                  </div>
                  <div class="sample-issues">
                    <h5>问题示例：</h5>
                    <el-table :data="issue.samples" size="small">
                      <el-table-column prop="row" label="行号" width="80" />
                      <el-table-column prop="column" label="列名" />
                      <el-table-column prop="value" label="问题值" />
                      <el-table-column prop="suggestion" label="建议修复" />
                    </el-table>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </AICard>
    </div>

    <!-- 清洗配置 -->
    <div v-if="detectionResult" class="cleaning-config">
      <AICard variant="glass">
        <template #header>
          <h3>清洗配置</h3>
        </template>

        <el-form :model="cleaningConfig" label-width="140px">
          <h4>自动清洗规则</h4>
          <el-form-item label="缺失值处理">
            <el-select v-model="cleaningConfig.missingValue" style="width: 100%">
              <el-option label="删除包含缺失值的行" value="drop" />
              <el-option label="使用均值填充（数值列）" value="mean" />
              <el-option label="使用中位数填充（数值列）" value="median" />
              <el-option label="使用众数填充" value="mode" />
              <el-option label="向前填充" value="ffill" />
              <el-option label="向后填充" value="bfill" />
              <el-option label="自定义值填充" value="custom" />
            </el-select>
          </el-form-item>

          <el-form-item
              v-if="cleaningConfig.missingValue === 'custom'"
              label="自定义填充值"
          >
            <el-input v-model="cleaningConfig.customFillValue" />
          </el-form-item>

          <el-form-item label="重复值处理">
            <el-select v-model="cleaningConfig.duplicates" style="width: 100%">
              <el-option label="保留第一个" value="first" />
              <el-option label="保留最后一个" value="last" />
              <el-option label="删除所有重复" value="drop_all" />
              <el-option label="不处理" value="none" />
            </el-select>
          </el-form-item>

          <el-form-item label="异常值处理">
            <el-select v-model="cleaningConfig.outliers" style="width: 100%">
              <el-option label="使用IQR方法删除" value="iqr" />
              <el-option label="使用Z-score方法删除" value="zscore" />
              <el-option label="截断到合理范围" value="clip" />
              <el-option label="不处理" value="none" />
            </el-select>
          </el-form-item>

          <el-form-item label="数据类型修正">
            <el-switch v-model="cleaningConfig.typeCorrection" />
          </el-form-item>

          <el-form-item label="格式标准化">
            <el-checkbox-group v-model="cleaningConfig.standardization">
              <el-checkbox label="date">日期格式</el-checkbox>
              <el-checkbox label="phone">电话号码</el-checkbox>
              <el-checkbox label="email">邮箱地址</el-checkbox>
              <el-checkbox label="currency">货币金额</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <h4 style="margin-top: 24px">高级选项</h4>
          <el-form-item label="文本处理">
            <el-checkbox-group v-model="cleaningConfig.textProcessing">
              <el-checkbox label="trim">去除首尾空格</el-checkbox>
              <el-checkbox label="lowercase">转换为小写</el-checkbox>
              <el-checkbox label="remove_special">移除特殊字符</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="保留原始数据">
            <el-switch v-model="cleaningConfig.keepOriginal" />
            <span class="form-tip">清洗后保留原始数据副本</span>
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="cleaning-actions">
            <el-button @click="previewCleaning">
              <el-icon><View /></el-icon>
              预览清洗结果
            </el-button>
            <el-button
                type="primary"
                :loading="cleaning"
                @click="startCleaning"
            >
              <el-icon><MagicStick /></el-icon>
              开始清洗
            </el-button>
          </div>
        </template>
      </AICard>
    </div>

    <!-- 清洗结果 -->
    <transition name="fade-slide">
      <div v-if="cleaningResult" class="cleaning-result">
        <AICard variant="gradient">
          <template #header>
            <h3>清洗结果</h3>
            <el-tag type="success">清洗完成</el-tag>
          </template>

          <div class="result-summary">
            <div class="summary-grid">
              <div class="summary-item">
                <h4>处理前</h4>
                <div class="summary-stats">
                  <div class="stat">
                    <span class="stat-label">总行数</span>
                    <span class="stat-value">{{ cleaningResult.before.rows }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">问题数</span>
                    <span class="stat-value error">{{ cleaningResult.before.issues }}</span>
                  </div>
                </div>
              </div>
              <div class="summary-arrow">
                <el-icon :size="32"><Right /></el-icon>
              </div>
              <div class="summary-item">
                <h4>处理后</h4>
                <div class="summary-stats">
                  <div class="stat">
                    <span class="stat-label">总行数</span>
                    <span class="stat-value">{{ cleaningResult.after.rows }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">问题数</span>
                    <span class="stat-value success">{{ cleaningResult.after.issues }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="improvement-metrics">
              <MetricCard
                  label="数据完整性"
                  :value="cleaningResult.metrics.completeness"
                  icon="CircleCheck"
                  type="success"
                  suffix="%"
                  :decimals="1"
              />
              <MetricCard
                  label="一致性提升"
                  :value="cleaningResult.metrics.consistency"
                  icon="TrendCharts"
                  type="primary"
                  suffix="%"
                  :decimals="1"
              />
              <MetricCard
                  label="准确性改善"
                  :value="cleaningResult.metrics.accuracy"
                  icon="Aim"
                  type="warning"
                  suffix="%"
                  :decimals="1"
              />
              <MetricCard
                  label="处理时间"
                  :value="cleaningResult.metrics.processingTime"
                  icon="Timer"
                  type="info"
                  suffix="s"
                  :decimals="2"
              />
            </div>
          </div>

          <div class="result-actions">
            <el-button @click="downloadCleanedData">
              <el-icon><Download /></el-icon>
              下载清洗后数据
            </el-button>
            <el-button @click="viewCleaningReport">
              <el-icon><Document /></el-icon>
              查看清洗报告
            </el-button>
            <el-button type="primary" @click="applyToProduction">
              <el-icon><Upload /></el-icon>
              应用到生产环境
            </el-button>
          </div>
        </AICard>
      </div>
    </transition>

    <!-- 清洗规则对话框 -->
    <el-dialog v-model="showRules" title="清洗规则管理" width="800px">
      <div class="rules-management">
        <el-button type="primary" @click="addRule">
          <el-icon><Plus /></el-icon>
          添加规则
        </el-button>
        <el-table :data="customRules" style="width: 100%; margin-top: 16px">
          <el-table-column prop="name" label="规则名称" />
          <el-table-column prop="type" label="类型">
            <template #default="{ row }">
              <el-tag>{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="condition" label="条件" />
          <el-table-column prop="action" label="操作" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="editRule(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteRule(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Brush, Setting, Clock, UploadFilled, Document, Delete,
  Grid, Operation, Files, Search, InfoFilled, View,
  MagicStick, Download, Upload, Right, Plus, Warning,
  CircleClose, CircleCheck, TrendCharts, Aim, Timer
} from '@element-plus/icons-vue'
import AICard from '@/modules/common/components/AICard.vue'
import MetricCard from '@/modules/common/components/MetricCard.vue'

// 响应式数据
const dataLoaded = ref(false)
const uploadedFile = ref<File | null>(null)
const detecting = ref(false)
const cleaning = ref(false)
const showRules = ref(false)
const showHistory = ref(false)
const activeIssueTab = ref('missing')
const detectionResult = ref<any>(null)
const cleaningResult = ref<any>(null)

const dataStats = ref({
  rows: 0,
  columns: 0,
  size: 0
})

const previewData = ref<any[]>([])
const previewColumns = ref<string[]>([])

const cleaningConfig = ref({
  missingValue: 'drop',
  customFillValue: '',
  duplicates: 'first',
  outliers: 'iqr',
  typeCorrection: true,
  standardization: ['date', 'phone'],
  textProcessing: ['trim'],
  keepOriginal: true
})

const customRules = ref([
  {
    id: 1,
    name: '邮箱格式验证',
    type: 'validation',
    condition: 'column == "email"',
    action: '验证邮箱格式'
  },
  {
    id: 2,
    name: '负值修正',
    type: 'correction',
    condition: 'value < 0 AND column == "price"',
    action: '转换为绝对值'
  }
])

// 计算属性
const getScoreColor = computed(() => {
  const score = detectionResult.value?.qualityScore || 0
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
})

// 方法
const handleFileUpload = (file: any) => {
  uploadedFile.value = file
  dataLoaded.value = true

  // 模拟数据加载
  dataStats.value = {
    rows: 10000,
    columns: 15,
    size: file.size
  }

  // 模拟预览数据
  previewColumns.value = ['ID', '姓名', '年龄', '邮箱', '电话', '地址']
  previewData.value = [
    { ID: 1, 姓名: '张三', 年龄: 25, 邮箱: 'zhang@example', 电话: '1234567890', 地址: '北京市' },
    { ID: 2, 姓名: '李四', 年龄: null, 邮箱: 'li@example.com', 电话: '987654321', 地址: '' },
    { ID: 3, 姓名: '王五', 年龄: -30, 邮箱: 'wang@@example.com', 电话: '12345', 地址: '上海市' }
  ]

  ElMessage.success('数据加载成功')
}

const clearData = () => {
  dataLoaded.value = false
  uploadedFile.value = null
  detectionResult.value = null
  cleaningResult.value = null
  previewData.value = []
  previewColumns.value = []
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const hasError = (value: any) => {
  return value === null || value === '' || (typeof value === 'number' && value < 0)
}

const startDetection = async () => {
  detecting.value = true

  // 模拟检测过程
  setTimeout(() => {
    detectionResult.value = {
      qualityScore: 72,
      totalIssues: 156,
      issueTypes: [
        {
          type: 'missing',
          name: '缺失值',
          icon: 'CircleClose',
          color: '#ef4444',
          count: 45,
          description: '数据中存在空值或缺失的字段',
          affectedColumns: ['年龄', '地址', '电话'],
          samples: [
            { row: 2, column: '年龄', value: 'null', suggestion: '使用平均值填充' },
            { row: 2, column: '地址', value: '空', suggestion: '标记为"未知"' }
          ]
        },
        {
          type: 'invalid',
          name: '无效格式',
          icon: 'Warning',
          color: '#f59e0b',
          count: 38,
          description: '数据格式不符合预期',
          affectedColumns: ['邮箱', '电话'],
          samples: [
            { row: 1, column: '邮箱', value: 'zhang@example', suggestion: '添加域名后缀' },
            { row: 3, column: '电话', value: '12345', suggestion: '补充完整号码' }
          ]
        },
        {
          type: 'outlier',
          name: '异常值',
          icon: 'InfoFilled',
          color: '#3b82f6',
          count: 23,
          description: '数值超出正常范围',
          affectedColumns: ['年龄', '价格'],
          samples: [
            { row: 3, column: '年龄', value: '-30', suggestion: '修正为正数' }
          ]
        },
        {
          type: 'duplicate',
          name: '重复值',
          icon: 'CopyDocument',
          color: '#8b5cf6',
          count: 50,
          description: '存在重复的数据记录',
          affectedColumns: ['ID', '邮箱'],
          samples: [
            { row: '5,8', column: 'ID', value: '1001', suggestion: '保留第一条' }
          ]
        }
      ]
    }

    detecting.value = false
    ElMessage.success('数据质量检测完成')
  }, 2000)
}

const getQualityLevel = (score: number) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 60) return '一般'
  return '较差'
}

const previewCleaning = () => {
  ElMessage.info('预览清洗结果')
}

const startCleaning = async () => {
  cleaning.value = true

  // 模拟清洗过程
  setTimeout(() => {
    cleaningResult.value = {
      before: {
        rows: 10000,
        issues: 156
      },
      after: {
        rows: 9850,
        issues: 12
      },
      metrics: {
        completeness: 98.5,
        consistency: 35.2,
        accuracy: 28.7,
        processingTime: 3.24
      }
    }

    cleaning.value = false
    ElMessage.success('数据清洗完成')
  }, 3000)
}

const downloadCleanedData = () => {
  ElMessage.success('开始下载清洗后的数据')
}

const viewCleaningReport = () => {
  ElMessage.info('生成清洗报告')
}

const applyToProduction = () => {
  ElMessage.success('已应用到生产环境')
}

const addRule = () => {
  ElMessage.info('添加自定义规则')
}

const editRule = (rule: any) => {
  ElMessage.info(`编辑规则: ${rule.name}`)
}

const deleteRule = (rule: any) => {
  ElMessage.warning(`删除规则: ${rule.name}`)
}
</script>

<style lang="scss" scoped>
@use '@/styles/ai-theme.scss';

.data-cleaning-page {
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

.data-upload-section {
  max-width: 1200px;
  margin: 0 auto 32px;

  .upload-area {
    text-align: center;

    :deep(.el-upload-dragger) {
      background: var(--ai-bg-tertiary);
      border-color: var(--ai-border);

      &:hover {
        border-color: var(--ai-primary);
      }
    }

    .upload-tips {
      margin-top: 8px;
      color: var(--ai-text-muted);
      font-size: 14px;
    }
  }

  .data-info {
    .file-info {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--ai-bg-tertiary);
      border-radius: 12px;
      margin-bottom: 24px;

      .el-icon {
        color: var(--ai-primary);
      }

      .file-details {
        flex: 1;

        h4 {
          margin: 0 0 8px 0;
          color: var(--ai-text-primary);
        }

        .data-stats {
          display: flex;
          gap: 24px;

          span {
            display: flex;
            align-items: center;
            gap: 4px;
            color: var(--ai-text-secondary);
            font-size: 14px;
          }
        }
      }
    }

    .data-preview {
      h4 {
        margin: 0 0 12px 0;
        color: var(--ai-text-primary);
      }

      .error-cell {
        color: var(--ai-error);
      }
    }
  }
}

.quality-detection {
  max-width: 1200px;
  margin: 0 auto 32px;

  .detection-empty {
    text-align: center;
    padding: 60px 0;
    color: var(--ai-text-muted);

    .el-icon {
      margin-bottom: 16px;
    }
  }

  .detection-results {
    .quality-score {
      display: flex;
      gap: 32px;
      margin-bottom: 32px;

      .score-circle {
        flex-shrink: 0;

        :deep(.el-progress__text) {
          display: flex;
          flex-direction: column;
          align-items: center;

          .score-text {
            font-size: 32px;
            font-weight: 700;
            color: var(--ai-text-primary);
          }

          .score-label {
            font-size: 14px;
            color: var(--ai-text-secondary);
          }
        }
      }

      .score-details {
        flex: 1;

        h4 {
          margin: 0 0 8px 0;
          color: var(--ai-text-primary);
        }

        p {
          margin: 0 0 16px 0;
          color: var(--ai-text-secondary);
        }

        .issue-breakdown {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;

          .issue-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            background: var(--ai-card-bg);
            border-radius: 8px;

            .issue-name {
              flex: 1;
              color: var(--ai-text-secondary);
            }

            .issue-count {
              font-weight: 600;
              color: var(--ai-text-primary);
            }
          }
        }
      }
    }

    .issue-details {
      .issue-content {
        .issue-description {
          margin: 0 0 16px 0;
          color: var(--ai-text-secondary);
        }

        .affected-columns,
        .sample-issues {
          margin-bottom: 16px;

          h5 {
            margin: 0 0 8px 0;
            color: var(--ai-text-primary);
          }

          .el-tag {
            margin-right: 8px;
          }
        }
      }
    }
  }
}

.cleaning-config {
  max-width: 1200px;
  margin: 0 auto 32px;

  h4 {
    margin: 0 0 16px 0;
    color: var(--ai-text-primary);
  }

  .form-tip {
    margin-left: 12px;
    color: var(--ai-text-muted);
    font-size: 14px;
  }

  .cleaning-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  :deep(.el-form-item__label) {
    color: var(--ai-text-secondary);
  }
}

.cleaning-result {
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease-out;

  .result-summary {
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 24px;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: var(--ai-bg-tertiary);
      border-radius: 12px;

      .summary-item {
        text-align: center;

        h4 {
          margin: 0 0 16px 0;
          color: var(--ai-text-primary);
        }

        .summary-stats {
          display: flex;
          justify-content: center;
          gap: 32px;

          .stat {
            .stat-label {
              display: block;
              font-size: 14px;
              color: var(--ai-text-muted);
              margin-bottom: 4px;
            }

            .stat-value {
              font-size: 24px;
              font-weight: 700;
              color: var(--ai-text-primary);

              &.error {
                color: var(--ai-error);
              }

              &.success {
                color: var(--ai-success);
              }
            }
          }
        }
      }

      .summary-arrow {
        color: var(--ai-primary);
      }
    }

    .improvement-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
  }

  .result-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
  }
}

.rules-management {
  .el-table {
    margin-top: 16px;
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

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
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