<template>
  <div class="settings-page ai-gradient-bg">
    <PageHeader
        title="系统设置"
        subtitle="配置系统参数和全局选项"
        icon="Setting"
    />

    <div class="settings-container">
      <el-row :gutter="24">
        <!-- 左侧导航 -->
        <el-col :span="6">
          <AICard variant="glass" class="settings-nav">
            <el-menu
                :default-active="activeMenu"
                @select="handleMenuSelect"
            >
              <el-menu-item
                  v-for="item in settingsMenu"
                  :key="item.index"
                  :index="item.index"
              >
                <el-icon><component :is="item.icon" /></el-icon>
                <span>{{ item.title }}</span>
              </el-menu-item>
            </el-menu>
          </AICard>
        </el-col>

        <!-- 右侧内容 -->
        <el-col :span="18">
          <!-- 通用设置 -->
          <AICard v-show="activeMenu === 'general'" variant="glass">
            <template #header>
              <h3>通用设置</h3>
            </template>

            <el-form label-width="140px" class="ai-form">
              <div class="setting-section">
                <h4>系统信息</h4>
                <el-form-item label="系统名称">
                  <el-input v-model="generalSettings.systemName" />
                </el-form-item>
                <el-form-item label="系统版本">
                  <el-tag>{{ generalSettings.version }}</el-tag>
                </el-form-item>
                <el-form-item label="授权信息">
                  <el-tag type="success">{{ generalSettings.license }}</el-tag>
                </el-form-item>
              </div>

              <el-divider />

              <div class="setting-section">
                <h4>区域设置</h4>
                <el-form-item label="时区">
                  <el-select v-model="generalSettings.timezone">
                    <el-option label="UTC+8 北京时间" value="Asia/Shanghai" />
                    <el-option label="UTC+0 格林威治时间" value="UTC" />
                    <el-option label="UTC-5 纽约时间" value="America/New_York" />
                  </el-select>
                </el-form-item>
                <el-form-item label="日期格式">
                  <el-select v-model="generalSettings.dateFormat">
                    <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
                    <el-option label="DD/MM/YYYY" value="DD/MM/YYYY" />
                    <el-option label="MM/DD/YYYY" value="MM/DD/YYYY" />
                  </el-select>
                </el-form-item>
                <el-form-item label="货币单位">
                  <el-select v-model="generalSettings.currency">
                    <el-option label="人民币 (¥)" value="CNY" />
                    <el-option label="美元 ($)" value="USD" />
                    <el-option label="欧元 (€)" value="EUR" />
                  </el-select>
                </el-form-item>
              </div>

              <div class="form-actions">
                <el-button type="primary" @click="saveGeneralSettings">保存设置</el-button>
              </div>
            </el-form>
          </AICard>

          <!-- AI配置 -->
          <AICard v-show="activeMenu === 'ai'" variant="glass">
            <template #header>
              <h3>AI配置</h3>
            </template>

            <el-form label-width="140px" class="ai-form">
              <div class="setting-section">
                <h4>模型设置</h4>
                <el-form-item label="默认模型">
                  <el-select v-model="aiSettings.defaultModel">
                    <el-option label="GPT-4" value="gpt-4" />
                    <el-option label="GPT-3.5" value="gpt-3.5" />
                    <el-option label="自定义模型" value="custom" />
                  </el-select>
                </el-form-item>
                <el-form-item label="温度参数">
                  <el-slider
                      v-model="aiSettings.temperature"
                      :min="0"
                      :max="1"
                      :step="0.1"
                      show-input
                  />
                </el-form-item>
                <el-form-item label="最大令牌数">
                  <el-input-number
                      v-model="aiSettings.maxTokens"
                      :min="100"
                      :max="4000"
                      :step="100"
                  />
                </el-form-item>
              </div>

              <el-divider />

              <div class="setting-section">
                <h4>计算资源</h4>
                <el-form-item label="GPU分配">
                  <el-select v-model="aiSettings.gpuAllocation">
                    <el-option label="自动分配" value="auto" />
                    <el-option label="单GPU" value="single" />
                    <el-option label="多GPU" value="multi" />
                  </el-select>
                </el-form-item>
                <el-form-item label="内存限制">
                  <el-input v-model="aiSettings.memoryLimit">
                    <template #append>GB</template>
                  </el-input>
                </el-form-item>
                <el-form-item label="并发任务数">
                  <el-input-number
                      v-model="aiSettings.concurrentTasks"
                      :min="1"
                      :max="10"
                  />
                </el-form-item>
              </div>

              <div class="form-actions">
                <el-button type="primary" @click="saveAISettings">保存设置</el-button>
              </div>
            </el-form>
          </AICard>

          <!-- 数据管理 -->
          <AICard v-show="activeMenu === 'data'" variant="glass">
            <template #header>
              <h3>数据管理</h3>
            </template>

            <div class="data-management">
              <div class="storage-overview">
                <h4>存储概览</h4>
                <div class="storage-stats">
                  <div class="storage-item">
                    <span class="label">已用空间</span>
                    <span class="value">{{ formatSize(storageStats.used) }}</span>
                  </div>
                  <div class="storage-item">
                    <span class="label">总空间</span>
                    <span class="value">{{ formatSize(storageStats.total) }}</span>
                  </div>
                  <div class="storage-item">
                    <span class="label">使用率</span>
                    <span class="value">{{ storageStats.percentage }}%</span>
                  </div>
                </div>
                <el-progress
                    :percentage="storageStats.percentage"
                    :color="getStorageColor"
                />
              </div>

              <el-divider />

              <div class="data-cleanup">
                <h4>数据清理</h4>
                <div class="cleanup-options">
                  <div
                      v-for="option in cleanupOptions"
                      :key="option.key"
                      class="cleanup-item"
                  >
                    <el-checkbox v-model="option.selected">
                      <div class="cleanup-info">
                        <h5>{{ option.title }}</h5>
                        <p>{{ option.description }}</p>
                        <span class="size">可释放: {{ formatSize(option.size) }}</span>
                      </div>
                    </el-checkbox>
                  </div>
                </div>
                <el-button
                    type="danger"
                    :disabled="!hasSelectedCleanup"
                    @click="performCleanup"
                >
                  <el-icon><Delete /></el-icon>
                  清理选中项
                </el-button>
              </div>

              <el-divider />

              <div class="backup-settings">
                <h4>备份设置</h4>
                <el-form label-width="140px" class="ai-form">
                  <el-form-item label="自动备份">
                    <el-switch v-model="backupSettings.autoBackup" />
                  </el-form-item>
                  <el-form-item v-if="backupSettings.autoBackup" label="备份频率">
                    <el-select v-model="backupSettings.frequency">
                      <el-option label="每天" value="daily" />
                      <el-option label="每周" value="weekly" />
                      <el-option label="每月" value="monthly" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="备份位置">
                    <el-input v-model="backupSettings.location" readonly>
                      <template #append>
                        <el-button @click="selectBackupLocation">浏览</el-button>
                      </template>
                    </el-input>
                  </el-form-item>
                  <div class="form-actions">
                    <el-button @click="performBackup">立即备份</el-button>
                    <el-button type="primary" @click="saveBackupSettings">保存设置</el-button>
                  </div>
                </el-form>
              </div>
            </div>
          </AICard>

          <!-- 安全设置 -->
          <AICard v-show="activeMenu === 'security'" variant="glass">
            <template #header>
              <h3>安全设置</h3>
            </template>

            <div class="security-settings">
              <div class="setting-section">
                <h4>访问控制</h4>
                <el-form label-width="140px" class="ai-form">
                  <el-form-item label="登录超时">
                    <el-input-number
                        v-model="securitySettings.sessionTimeout"
                        :min="5"
                        :max="120"
                    >
                      <template #append>分钟</template>
                    </el-input-number>
                  </el-form-item>
                  <el-form-item label="密码复杂度">
                    <el-select v-model="securitySettings.passwordComplexity">
                      <el-option label="低 (最少6位)" value="low" />
                      <el-option label="中 (最少8位，含字母数字)" value="medium" />
                      <el-option label="高 (最少12位，含特殊字符)" value="high" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="登录失败锁定">
                    <el-switch v-model="securitySettings.loginLock" />
                  </el-form-item>
                  <el-form-item v-if="securitySettings.loginLock" label="失败次数">
                    <el-input-number
                        v-model="securitySettings.maxAttempts"
                        :min="3"
                        :max="10"
                    />
                  </el-form-item>
                </el-form>
              </div>

              <el-divider />

              <div class="setting-section">
                <h4>API安全</h4>
                <div class="api-keys">
                  <div class="key-list">
                    <div
                        v-for="key in apiKeys"
                        :key="key.id"
                        class="key-item"
                    >
                      <div class="key-info">
                        <h5>{{ key.name }}</h5>
                        <p>{{ key.key }}</p>
                        <span class="key-meta">
                          创建于: {{ formatDate(key.createdAt) }} ·
                          {{ key.usage }} 次调用
                        </span>
                      </div>
                      <div class="key-actions">
                        <el-button
                            size="small"
                            @click="regenerateKey(key)"
                        >
                          重新生成
                        </el-button>
                        <el-button
                            size="small"
                            type="danger"
                            @click="deleteKey(key)"
                        >
                          删除
                        </el-button>
                      </div>
                    </div>
                  </div>
                  <el-button type="primary" @click="createNewKey">
                    <el-icon><Plus /></el-icon>
                    创建新密钥
                  </el-button>
                </div>
              </div>

              <div class="form-actions">
                <el-button type="primary" @click="saveSecuritySettings">保存设置</el-button>
              </div>
            </div>
          </AICard>

          <!-- 日志管理 -->
          <AICard v-show="activeMenu === 'logs'" variant="glass">
            <template #header>
              <h3>日志管理</h3>
            </template>

            <div class="log-management">
              <div class="log-filters">
                <el-form inline>
                  <el-form-item label="日志级别">
                    <el-select v-model="logFilters.level" placeholder="全部">
                      <el-option label="全部" value="" />
                      <el-option label="错误" value="error" />
                      <el-option label="警告" value="warning" />
                      <el-option label="信息" value="info" />
                      <el-option label="调试" value="debug" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="时间范围">
                    <el-date-picker
                        v-model="logFilters.dateRange"
                        type="daterange"
                        range-separator="至"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                    />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="searchLogs">搜索</el-button>
                    <el-button @click="exportLogs">导出</el-button>
                  </el-form-item>
                </el-form>
              </div>

              <div class="log-table">
                <el-table :data="logs" style="width: 100%">
                  <el-table-column prop="timestamp" label="时间" width="180">
                    <template #default="{ row }">
                      {{ formatDateTime(row.timestamp) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="level" label="级别" width="80">
                    <template #default="{ row }">
                      <el-tag :type="getLogLevelType(row.level)" size="small">
                        {{ row.level }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="module" label="模块" width="120" />
                  <el-table-column prop="message" label="消息" />
                  <el-table-column label="操作" width="80">
                    <template #default="{ row }">
                      <el-button size="small" text @click="viewLogDetail(row)">
                        详情
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <el-divider />

              <div class="log-settings">
                <h4>日志设置</h4>
                <el-form label-width="140px" class="ai-form">
                  <el-form-item label="日志级别">
                    <el-select v-model="logSettings.level">
                      <el-option label="错误" value="error" />
                      <el-option label="警告" value="warning" />
                      <el-option label="信息" value="info" />
                      <el-option label="调试" value="debug" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="保留时长">
                    <el-select v-model="logSettings.retention">
                      <el-option label="7天" :value="7" />
                      <el-option label="30天" :value="30" />
                      <el-option label="90天" :value="90" />
                      <el-option label="永久" :value="-1" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="自动清理">
                    <el-switch v-model="logSettings.autoClean" />
                  </el-form-item>
                  <div class="form-actions">
                    <el-button @click="clearLogs">清空日志</el-button>
                    <el-button type="primary" @click="saveLogSettings">保存设置</el-button>
                  </div>
                </el-form>
              </div>
            </div>
          </AICard>

          <!-- 集成管理 -->
          <AICard v-show="activeMenu === 'integrations'" variant="glass">
            <template #header>
              <h3>集成管理</h3>
            </template>

            <div class="integrations">
              <div class="integration-list">
                <div
                    v-for="integration in integrations"
                    :key="integration.id"
                    class="integration-item"
                >
                  <div class="integration-icon">
                    <img :src="integration.icon" :alt="integration.name" />
                  </div>
                  <div class="integration-info">
                    <h4>{{ integration.name }}</h4>
                    <p>{{ integration.description }}</p>
                    <div class="integration-status">
                      <el-tag
                          :type="integration.connected ? 'success' : 'info'"
                          size="small"
                      >
                        {{ integration.connected ? '已连接' : '未连接' }}
                      </el-tag>
                      <span v-if="integration.connected" class="last-sync">
                        最后同步: {{ formatDate(integration.lastSync) }}
                      </span>
                    </div>
                  </div>
                  <div class="integration-actions">
                    <el-button
                        v-if="!integration.connected"
                        type="primary"
                        @click="connectIntegration(integration)"
                    >
                      连接
                    </el-button>
                    <el-dropdown v-else trigger="click">
                      <el-button>
                        设置
                        <el-icon><ArrowDown /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="configureIntegration(integration)">
                            配置
                          </el-dropdown-item>
                          <el-dropdown-item @click="syncIntegration(integration)">
                            立即同步
                          </el-dropdown-item>
                          <el-dropdown-item
                              divided
                              @click="disconnectIntegration(integration)"
                          >
                            断开连接
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
              </div>
            </div>
          </AICard>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting, Operation, Cpu, Files, Lock, Document,
  Connection, Delete, Plus, ArrowDown
} from '@element-plus/icons-vue'
import PageHeader from '@/modules/common/components/PageHeader.vue'
import AICard from '@/modules/common/components/AICard.vue'

// 响应式数据
const activeMenu = ref('general')

const settingsMenu = [
  { index: 'general', title: '通用设置', icon: 'Setting' },
  { index: 'ai', title: 'AI配置', icon: 'Cpu' },
  { index: 'data', title: '数据管理', icon: 'Files' },
  { index: 'security', title: '安全设置', icon: 'Lock' },
  { index: 'logs', title: '日志管理', icon: 'Document' },
  { index: 'integrations', title: '集成管理', icon: 'Connection' }
]

// 通用设置
const generalSettings = reactive({
  systemName: 'AI智能分析平台',
  version: 'v2.1.0',
  license: '企业版',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  currency: 'CNY'
})

// AI设置
const aiSettings = reactive({
  defaultModel: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  gpuAllocation: 'auto',
  memoryLimit: '16',
  concurrentTasks: 3
})

// 存储统计
const storageStats = reactive({
  used: 53687091200, // 50GB
  total: 107374182400, // 100GB
  percentage: 50
})

// 清理选项
const cleanupOptions = reactive([
  {
    key: 'temp',
    title: '临时文件',
    description: '系统运行产生的临时文件和缓存',
    size: 5368709120, // 5GB
    selected: false
  },
  {
    key: 'logs',
    title: '过期日志',
    description: '超过90天的系统日志文件',
    size: 2147483648, // 2GB
    selected: false
  },
  {
    key: 'models',
    title: '未使用模型',
    description: '超过30天未使用的模型文件',
    size: 10737418240, // 10GB
    selected: false
  }
])

// 备份设置
const backupSettings = reactive({
  autoBackup: true,
  frequency: 'daily',
  location: '/backup/ai-platform'
})

// 安全设置
const securitySettings = reactive({
  sessionTimeout: 30,
  passwordComplexity: 'medium',
  loginLock: true,
  maxAttempts: 5
})

// API密钥
const apiKeys = ref([
  {
    id: 1,
    name: '生产环境密钥',
    key: 'sk-...abc123',
    createdAt: new Date('2024-01-01'),
    usage: 15280
  },
  {
    id: 2,
    name: '测试环境密钥',
    key: 'sk-...def456',
    createdAt: new Date('2024-02-01'),
    usage: 3420
  }
])

// 日志过滤器
const logFilters = reactive({
  level: '',
  dateRange: null
})

// 日志数据
const logs = ref([
  {
    id: 1,
    timestamp: new Date(),
    level: 'error',
    module: 'AI分析',
    message: '模型加载失败: 内存不足'
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 3600000),
    level: 'warning',
    module: '数据处理',
    message: '数据集包含缺失值'
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 7200000),
    level: 'info',
    module: '系统',
    message: '定时备份任务完成'
  }
])

// 日志设置
const logSettings = reactive({
  level: 'info',
  retention: 30,
  autoClean: true
})

// 集成列表
const integrations = ref([
  {
    id: 1,
    name: 'GitHub',
    description: '代码仓库和版本控制',
    icon: '/icons/github.png',
    connected: true,
    lastSync: new Date(Date.now() - 3600000)
  },
  {
    id: 2,
    name: 'Slack',
    description: '团队协作和通知',
    icon: '/icons/slack.png',
    connected: false
  },
  {
    id: 3,
    name: 'AWS S3',
    description: '云存储服务',
    icon: '/icons/aws.png',
    connected: true,
    lastSync: new Date(Date.now() - 7200000)
  }
])

// 计算属性
const hasSelectedCleanup = computed(() => {
  return cleanupOptions.some(option => option.selected)
})

const getStorageColor = computed(() => (percentage: number) => {
  if (percentage < 60) return '#10b981'
  if (percentage < 80) return '#f59e0b'
  return '#ef4444'
})

// 方法
const handleMenuSelect = (index: string) => {
  activeMenu.value = index
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
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

const saveGeneralSettings = () => {
  ElMessage.success('通用设置已保存')
}

const saveAISettings = () => {
  ElMessage.success('AI配置已保存')
}

const performCleanup = async () => {
  const selectedItems = cleanupOptions.filter(opt => opt.selected)
  if (selectedItems.length === 0) {
    ElMessage.warning('请选择要清理的项目')
    return
  }

  try {
    await ElMessageBox.confirm(
        `确定要清理选中的 ${selectedItems.length} 个项目吗？`,
        '清理确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )

    ElMessage.success('清理完成')
    selectedItems.forEach(item => {
      item.selected = false
    })
  } catch {
    // 用户取消
  }
}

const selectBackupLocation = () => {
  ElMessage.info('选择备份位置')
}

const performBackup = () => {
  ElMessage.success('备份任务已开始')
}

const saveBackupSettings = () => {
  ElMessage.success('备份设置已保存')
}

const saveSecuritySettings = () => {
  ElMessage.success('安全设置已保存')
}

const regenerateKey = (key: any) => {
  ElMessage.success(`密钥 ${key.name} 已重新生成`)
}

const deleteKey = async (key: any) => {
  try {
    await ElMessageBox.confirm(
        `确定要删除密钥 "${key.name}" 吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )

    const index = apiKeys.value.indexOf(key)
    if (index > -1) {
      apiKeys.value.splice(index, 1)
    }
    ElMessage.success('密钥已删除')
  } catch {
    // 用户取消
  }
}

const createNewKey = () => {
  ElMessage.info('创建新的API密钥')
}

const searchLogs = () => {
  ElMessage.success('日志搜索完成')
}

const exportLogs = () => {
  ElMessage.success('日志导出中...')
}

const viewLogDetail = (log: any) => {
  ElMessage.info(`查看日志详情: ${log.message}`)
}

const getLogLevelType = (level: string) => {
  const types: Record<string, string> = {
    error: 'danger',
    warning: 'warning',
    info: 'info',
    debug: ''
  }
  return types[level] || ''
}

const clearLogs = async () => {
  try {
    await ElMessageBox.confirm(
        '确定要清空所有日志吗？此操作不可恢复。',
        '清空日志',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )

    logs.value = []
    ElMessage.success('日志已清空')
  } catch {
    // 用户取消
  }
}

const saveLogSettings = () => {
  ElMessage.success('日志设置已保存')
}

const connectIntegration = (integration: any) => {
  ElMessage.info(`连接 ${integration.name}`)
}

const configureIntegration = (integration: any) => {
  ElMessage.info(`配置 ${integration.name}`)
}

const syncIntegration = (integration: any) => {
  ElMessage.success(`${integration.name} 同步中...`)
}

const disconnectIntegration = async (integration: any) => {
  try {
    await ElMessageBox.confirm(
        `确定要断开与 ${integration.name} 的连接吗？`,
        '断开连接',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )

    integration.connected = false
    ElMessage.success('已断开连接')
  } catch {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/ai-theme.scss';
// 导入表单样式
@use '@/styles/forms.scss';

.settings-page {
  min-height: 100vh;
  padding: 20px;
  background-color: var(--ai-bg-primary);
}

.settings-container {
  max-width: 1400px;
  margin: 0 auto;

  // 左侧导航
  .settings-nav {
    position: sticky;
    top: 20px;

    :deep(.el-menu) {
      background: transparent;
      border: none;

      .el-menu-item {
        color: var(--ai-text-secondary);
        margin-bottom: 4px;
        border-radius: 8px;

        &:hover {
          background: var(--ai-card-bg-hover);
          color: var(--ai-text-primary);
        }

        &.is-active {
          background: rgba(99, 102, 241, 0.1);
          color: var(--ai-primary);
        }
      }
    }
  }

  // 设置区域
  .setting-section {
    margin-bottom: 32px;

    &:last-child {
      margin-bottom: 0;
    }

    h4 {
      margin: 0 0 20px 0;
      font-size: 18px;
      color: var(--ai-text-primary);
    }
  }

  // 数据管理
  .data-management {
    .storage-overview {
      margin-bottom: 32px;

      .storage-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin: 20px 0;

        .storage-item {
          text-align: center;

          .label {
            display: block;
            font-size: 14px;
            color: var(--ai-text-secondary);
            margin-bottom: 4px;
          }

          .value {
            font-size: 24px;
            font-weight: 700;
            color: var(--ai-text-primary);
          }
        }
      }
    }

    .cleanup-options {
      margin-bottom: 20px;

      .cleanup-item {
        margin-bottom: 16px;

        .cleanup-info {
          h5 {
            margin: 0 0 4px 0;
            color: var(--ai-text-primary);
          }

          p {
            margin: 0 0 4px 0;
            font-size: 14px;
            color: var(--ai-text-secondary);
          }

          .size {
            font-size: 13px;
            color: var(--ai-text-muted);
          }
        }
      }
    }
  }

  // API密钥
  .api-keys {
    .key-list {
      margin-bottom: 20px;

      .key-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: var(--ai-bg-tertiary);
        border-radius: 12px;
        margin-bottom: 12px;

        .key-info {
          h5 {
            margin: 0 0 4px 0;
            color: var(--ai-text-primary);
          }

          p {
            margin: 0 0 4px 0;
            font-family: monospace;
            color: var(--ai-text-secondary);
          }

          .key-meta {
            font-size: 13px;
            color: var(--ai-text-muted);
          }
        }

        .key-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  // 日志管理
  .log-management {
    .log-filters {
      margin-bottom: 20px;
      padding: 16px;
      background: var(--ai-bg-tertiary);
      border-radius: 12px;
    }

    .log-table {
      margin-bottom: 32px;
    }
  }

  // 集成管理
  .integrations {
    .integration-list {
      .integration-item {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px;
        background: var(--ai-bg-tertiary);
        border-radius: 12px;
        margin-bottom: 16px;

        .integration-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 12px;

          img {
            width: 32px;
            height: 32px;
          }
        }

        .integration-info {
          flex: 1;

          h4 {
            margin: 0 0 4px 0;
            color: var(--ai-text-primary);
          }

          p {
            margin: 0 0 8px 0;
            color: var(--ai-text-secondary);
            font-size: 14px;
          }

          .integration-status {
            display: flex;
            align-items: center;
            gap: 12px;

            .last-sync {
              font-size: 13px;
              color: var(--ai-text-muted);
            }
          }
        }
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