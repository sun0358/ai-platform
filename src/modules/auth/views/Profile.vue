<template>
  <div class="profile-page ai-gradient-bg">
    <PageHeader
        title="个人中心"
        subtitle="管理您的个人信息和账户设置"
        icon="UserFilled"
    />

    <div class="profile-container">
      <el-row :gutter="24">
        <!-- 左侧：用户信息卡片 -->
        <el-col :span="8">
          <AICard variant="glass" class="user-info-card">
            <div class="user-avatar-section">
              <div class="avatar-wrapper">
                <el-avatar :size="120" :src="userInfo.avatar">
                  <el-icon :size="60"><UserFilled /></el-icon>
                </el-avatar>
                <el-button
                    class="avatar-upload-btn"
                    circle
                    type="primary"
                    size="small"
                    @click="handleAvatarUpload"
                >
                  <el-icon><Camera /></el-icon>
                </el-button>
              </div>
              <h2>{{ userInfo.fullName }}</h2>
              <p>@{{ userInfo.username }}</p>
              <div class="user-badges">
                <el-tag v-for="badge in userInfo.badges" :key="badge" type="info">
                  {{ badge }}
                </el-tag>
              </div>
            </div>

            <el-divider />

            <div class="user-stats">
              <div class="stat-item">
                <span class="stat-value">{{ userStats.tasksCompleted }}</span>
                <span class="stat-label">任务完成</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ userStats.modelsCreated }}</span>
                <span class="stat-label">模型创建</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ userStats.analysisCount }}</span>
                <span class="stat-label">分析次数</span>
              </div>
            </div>

            <el-divider />

            <div class="user-meta">
              <div class="meta-item">
                <el-icon><Calendar /></el-icon>
                <span>注册时间：{{ formatDate(userInfo.createdAt) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Location /></el-icon>
                <span>{{ userInfo.location || '未设置' }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Promotion /></el-icon>
                <span>{{ userInfo.department || '未设置' }}</span>
              </div>
            </div>
          </AICard>

          <!-- 快速操作 -->
          <AICard variant="glass" class="quick-actions-card">
            <template #header>
              <h3>快速操作</h3>
            </template>
            <div class="action-list">
              <div
                  v-for="action in quickActions"
                  :key="action.id"
                  class="action-item"
                  @click="handleQuickAction(action)"
              >
                <el-icon :style="{ color: action.color }">
                  <component :is="action.icon" />
                </el-icon>
                <span>{{ action.label }}</span>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              </div>
            </div>
          </AICard>
        </el-col>

        <!-- 右侧：设置表单 -->
        <el-col :span="16">
          <el-tabs v-model="activeTab" class="profile-tabs">
            <!-- 基本信息 -->
            <el-tab-pane label="基本信息" name="basic">
              <AICard variant="glass">
                <el-form
                    ref="basicFormRef"
                    :model="basicForm"
                    :rules="basicRules"
                    label-width="120px"
                    class="ai-form"
                >
                  <el-form-item label="用户名" prop="username">
                    <el-input v-model="basicForm.username" disabled />
                  </el-form-item>

                  <el-form-item label="姓名" prop="fullName">
                    <el-input v-model="basicForm.fullName" placeholder="请输入真实姓名" />
                  </el-form-item>

                  <el-form-item label="邮箱" prop="email">
                    <el-input v-model="basicForm.email" placeholder="请输入邮箱地址">
                      <template #append>
                        <el-button
                            v-if="!basicForm.emailVerified"
                            @click="sendVerificationEmail"
                        >
                          验证邮箱
                        </el-button>
                        <el-tag v-else type="success">已验证</el-tag>
                      </template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="手机号" prop="phone">
                    <el-input v-model="basicForm.phone" placeholder="请输入手机号" />
                  </el-form-item>

                  <el-form-item label="部门" prop="department">
                    <el-select v-model="basicForm.department" placeholder="请选择部门">
                      <el-option label="技术部" value="tech" />
                      <el-option label="产品部" value="product" />
                      <el-option label="运营部" value="operation" />
                      <el-option label="市场部" value="marketing" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="职位" prop="position">
                    <el-input v-model="basicForm.position" placeholder="请输入职位" />
                  </el-form-item>

                  <el-form-item label="地址" prop="location">
                    <el-input v-model="basicForm.location" placeholder="请输入地址" />
                  </el-form-item>

                  <el-form-item label="个人简介" prop="bio">
                    <el-input
                        v-model="basicForm.bio"
                        type="textarea"
                        :rows="4"
                        placeholder="介绍一下自己..."
                    />
                  </el-form-item>

                  <div class="form-actions">
                    <el-button @click="resetBasicForm">重置</el-button>
                    <el-button type="primary" @click="saveBasicInfo">保存修改</el-button>
                  </div>
                </el-form>
              </AICard>
            </el-tab-pane>

            <!-- 安全设置 -->
            <el-tab-pane label="安全设置" name="security">
              <AICard variant="glass">
                <div class="security-section">
                  <h4>修改密码</h4>
                  <el-form
                      ref="passwordFormRef"
                      :model="passwordForm"
                      :rules="passwordRules"
                      label-width="120px"
                      class="ai-form"
                  >
                    <el-form-item label="当前密码" prop="oldPassword">
                      <el-input
                          v-model="passwordForm.oldPassword"
                          type="password"
                          show-password
                          placeholder="请输入当前密码"
                      />
                    </el-form-item>

                    <el-form-item label="新密码" prop="newPassword">
                      <el-input
                          v-model="passwordForm.newPassword"
                          type="password"
                          show-password
                          placeholder="请输入新密码"
                      />
                      <div class="password-strength">
                        <span>密码强度：</span>
                        <el-progress
                            :percentage="passwordStrength"
                            :color="passwordStrengthColor"
                            :show-text="false"
                        />
                        <span :style="{ color: passwordStrengthColor }">
                          {{ passwordStrengthText }}
                        </span>
                      </div>
                    </el-form-item>

                    <el-form-item label="确认密码" prop="confirmPassword">
                      <el-input
                          v-model="passwordForm.confirmPassword"
                          type="password"
                          show-password
                          placeholder="请再次输入新密码"
                      />
                    </el-form-item>

                    <div class="form-actions">
                      <el-button type="primary" @click="changePassword">修改密码</el-button>
                    </div>
                  </el-form>
                </div>

                <el-divider />

                <div class="security-section">
                  <h4>两步验证</h4>
                  <p class="section-desc">启用两步验证可以大幅提升账户安全性</p>
                  <div class="two-factor-auth">
                    <el-switch
                        v-model="twoFactorEnabled"
                        @change="toggleTwoFactor"
                    />
                    <span class="switch-label">
                      {{ twoFactorEnabled ? '已启用' : '未启用' }}
                    </span>
                  </div>
                </div>

                <el-divider />

                <div class="security-section">
                  <h4>登录设备</h4>
                  <p class="section-desc">管理您的登录设备和会话</p>
                  <div class="device-list">
                    <div
                        v-for="device in loginDevices"
                        :key="device.id"
                        class="device-item"
                    >
                      <div class="device-info">
                        <el-icon :size="24">
                          <component :is="device.icon" />
                        </el-icon>
                        <div>
                          <h5>{{ device.name }}</h5>
                          <p>{{ device.location }} · {{ device.lastActive }}</p>
                        </div>
                      </div>
                      <el-button
                          v-if="!device.current"
                          size="small"
                          @click="removeDevice(device)"
                      >
                        移除
                      </el-button>
                      <el-tag v-else type="success" size="small">当前设备</el-tag>
                    </div>
                  </div>
                </div>
              </AICard>
            </el-tab-pane>

            <!-- 通知设置 -->
            <el-tab-pane label="通知设置" name="notifications">
              <AICard variant="glass">
                <div class="notification-settings">
                  <h4>邮件通知</h4>
                  <div class="setting-list">
                    <div
                        v-for="setting in emailNotifications"
                        :key="setting.key"
                        class="setting-item"
                    >
                      <div class="setting-info">
                        <h5>{{ setting.title }}</h5>
                        <p>{{ setting.description }}</p>
                      </div>
                      <el-switch v-model="setting.enabled" />
                    </div>
                  </div>

                  <el-divider />

                  <h4>系统通知</h4>
                  <div class="setting-list">
                    <div
                        v-for="setting in systemNotifications"
                        :key="setting.key"
                        class="setting-item"
                    >
                      <div class="setting-info">
                        <h5>{{ setting.title }}</h5>
                        <p>{{ setting.description }}</p>
                      </div>
                      <el-switch v-model="setting.enabled" />
                    </div>
                  </div>

                  <div class="form-actions">
                    <el-button type="primary" @click="saveNotificationSettings">
                      保存设置
                    </el-button>
                  </div>
                </div>
              </AICard>
            </el-tab-pane>

            <!-- 偏好设置 -->
            <el-tab-pane label="偏好设置" name="preferences">
              <AICard variant="glass">
                <div class="preference-settings">
                  <h4>界面设置</h4>
                  <div class="setting-group">
                    <div class="setting-item">
                      <div class="setting-info">
                        <h5>主题模式</h5>
                        <p>选择您喜欢的界面主题</p>
                      </div>
                      <el-select v-model="preferences.theme" style="width: 150px">
                        <el-option label="深色模式" value="dark" />
                        <el-option label="浅色模式" value="light" />
                        <el-option label="跟随系统" value="auto" />
                      </el-select>
                    </div>

                    <div class="setting-item">
                      <div class="setting-info">
                        <h5>语言</h5>
                        <p>选择界面显示语言</p>
                      </div>
                      <el-select v-model="preferences.language" style="width: 150px">
                        <el-option label="简体中文" value="zh-CN" />
                        <el-option label="English" value="en-US" />
                      </el-select>
                    </div>
                  </div>

                  <el-divider />

                  <h4>默认设置</h4>
                  <div class="setting-group">
                    <div class="setting-item">
                      <div class="setting-info">
                        <h5>默认分析模型</h5>
                        <p>设置默认使用的分析模型</p>
                      </div>
                      <el-select v-model="preferences.defaultModel" style="width: 200px">
                        <el-option label="传统模型" value="traditional" />
                        <el-option label="深度学习模型" value="deep_learning" />
                        <el-option label="雨量专用模型" value="rain_specific" />
                      </el-select>
                    </div>

                    <div class="setting-item">
                      <div class="setting-info">
                        <h5>数据保存时长</h5>
                        <p>设置临时数据的保存时长</p>
                      </div>
                      <el-select v-model="preferences.dataRetention" style="width: 150px">
                        <el-option label="7天" :value="7" />
                        <el-option label="30天" :value="30" />
                        <el-option label="90天" :value="90" />
                        <el-option label="永久保存" :value="-1" />
                      </el-select>
                    </div>
                  </div>

                  <div class="form-actions">
                    <el-button @click="resetPreferences">恢复默认</el-button>
                    <el-button type="primary" @click="savePreferences">保存设置</el-button>
                  </div>
                </div>
              </AICard>
            </el-tab-pane>
          </el-tabs>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import {
  UserFilled, Camera, Calendar, Location, Promotion,
  ArrowRight, Monitor, Cellphone, Key, Lock, Message,
  Setting, DataAnalysis, Document
} from '@element-plus/icons-vue'
import PageHeader from '@/modules/common/components/PageHeader.vue'
import AICard from '@/modules/common/components/AICard.vue'

// 响应式数据
const activeTab = ref('basic')
const basicFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const twoFactorEnabled = ref(false)

// 用户信息
const userInfo = reactive({
  avatar: '',
  username: 'zhangsan',
  fullName: '张三',
  email: 'zhangsan@example.com',
  emailVerified: true,
  badges: ['高级用户', 'AI专家'],
  createdAt: new Date('2023-01-15'),
  location: '北京市朝阳区',
  department: '技术部'
})

// 用户统计
const userStats = reactive({
  tasksCompleted: 156,
  modelsCreated: 23,
  analysisCount: 892
})

// 基本信息表单
const basicForm = reactive({
  username: userInfo.username,
  fullName: userInfo.fullName,
  email: userInfo.email,
  emailVerified: userInfo.emailVerified,
  phone: '13800138000',
  department: 'tech',
  position: '高级工程师',
  location: userInfo.location,
  bio: '专注于机器学习和数据分析'
})

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 偏好设置
const preferences = reactive({
  theme: 'dark',
  language: 'zh-CN',
  defaultModel: 'deep_learning',
  dataRetention: 30
})

// 快速操作
const quickActions = [
  { id: 1, label: '我的任务', icon: 'List', color: '#6366f1' },
  { id: 2, label: '我的模型', icon: 'Box', color: '#14b8a6' },
  { id: 3, label: '使用统计', icon: 'DataLine', color: '#f59e0b' },
  { id: 4, label: 'API密钥', icon: 'Key', color: '#ef4444' }
]

// 登录设备
const loginDevices = ref([
  {
    id: 1,
    name: 'Chrome on MacBook',
    icon: 'Monitor',
    location: '北京',
    lastActive: '当前在线',
    current: true
  },
  {
    id: 2,
    name: 'Safari on iPhone',
    icon: 'Cellphone',
    location: '上海',
    lastActive: '2小时前',
    current: false
  }
])

// 通知设置
const emailNotifications = reactive([
  {
    key: 'task_complete',
    title: '任务完成通知',
    description: '当您的任务完成时发送邮件通知',
    enabled: true
  },
  {
    key: 'model_training',
    title: '模型训练通知',
    description: '模型训练开始和完成时发送通知',
    enabled: true
  },
  {
    key: 'weekly_report',
    title: '周报',
    description: '每周发送使用统计报告',
    enabled: false
  }
])

const systemNotifications = reactive([
  {
    key: 'browser',
    title: '浏览器通知',
    description: '在浏览器中显示桌面通知',
    enabled: true
  },
  {
    key: 'sound',
    title: '声音提醒',
    description: '重要事件时播放提示音',
    enabled: false
  }
])

// 表单验证规则
const basicRules = {
  fullName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度不能少于8位', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value === passwordForm.oldPassword) {
          callback(new Error('新密码不能与当前密码相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 计算属性
const passwordStrength = computed(() => {
  const password = passwordForm.newPassword
  if (!password) return 0

  let strength = 0
  if (password.length >= 8) strength += 25
  if (password.length >= 12) strength += 25
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25
  if (/\d/.test(password)) strength += 12.5
  if (/[!@#$%^&*]/.test(password)) strength += 12.5

  return strength
})

const passwordStrengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength >= 75) return '#10b981'
  if (strength >= 50) return '#f59e0b'
  return '#ef4444'
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength >= 75) return '强'
  if (strength >= 50) return '中'
  return '弱'
})

// 方法
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

const handleAvatarUpload = () => {
  ElMessage.info('选择新头像')
}

const handleQuickAction = (action: any) => {
  ElMessage.info(`执行操作: ${action.label}`)
}

const sendVerificationEmail = () => {
  ElMessage.success('验证邮件已发送')
}

const saveBasicInfo = async () => {
  const valid = await basicFormRef.value?.validate()
  if (valid) {
    ElMessage.success('基本信息已保存')
  }
}

const resetBasicForm = () => {
  basicFormRef.value?.resetFields()
}

const changePassword = async () => {
  const valid = await passwordFormRef.value?.validate()
  if (valid) {
    ElMessage.success('密码修改成功')
    passwordFormRef.value?.resetFields()
  }
}

const toggleTwoFactor = (enabled: boolean) => {
  if (enabled) {
    ElMessage.success('两步验证已启用')
  } else {
    ElMessage.warning('两步验证已关闭')
  }
}

const removeDevice = (device: any) => {
  ElMessage.success(`已移除设备: ${device.name}`)
  const index = loginDevices.value.indexOf(device)
  if (index > -1) {
    loginDevices.value.splice(index, 1)
  }
}

const saveNotificationSettings = () => {
  ElMessage.success('通知设置已保存')
}

const savePreferences = () => {
  ElMessage.success('偏好设置已保存')
}

const resetPreferences = () => {
  preferences.theme = 'dark'
  preferences.language = 'zh-CN'
  preferences.defaultModel = 'deep_learning'
  preferences.dataRetention = 30
  ElMessage.success('已恢复默认设置')
}
</script>

<style lang="scss" scoped>
@use '@/styles/ai-theme.scss';

.profile-page {
  min-height: 100vh;
  padding: 20px;
  background-color: var(--ai-bg-primary);
}

.profile-container {
  max-width: 1400px;
  margin: 0 auto;

  // 用户信息卡片
  .user-info-card {
    margin-bottom: 24px;

    .user-avatar-section {
      text-align: center;
      padding: 24px 0;

      .avatar-wrapper {
        position: relative;
        display: inline-block;
        margin-bottom: 16px;

        .avatar-upload-btn {
          position: absolute;
          bottom: 0;
          right: 0;
        }
      }

      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: var(--ai-text-primary);
      }

      p {
        margin: 0 0 16px 0;
        color: var(--ai-text-secondary);
      }

      .user-badges {
        display: flex;
        justify-content: center;
        gap: 8px;
      }
    }

    .user-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      text-align: center;

      .stat-item {
        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: var(--ai-primary);
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: var(--ai-text-secondary);
        }
      }
    }

    .user-meta {
      .meta-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        color: var(--ai-text-secondary);

        &:last-child {
          margin-bottom: 0;
        }

        .el-icon {
          color: var(--ai-text-muted);
        }
      }
    }
  }

  // 快速操作卡片
  .quick-actions-card {
    .action-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .action-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: var(--ai-bg-tertiary);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: var(--ai-card-bg-hover);
          transform: translateX(4px);
        }

        .el-icon:first-child {
          font-size: 24px;
        }

        span {
          flex: 1;
          color: var(--ai-text-primary);
        }

        .arrow-icon {
          color: var(--ai-text-muted);
        }
      }
    }
  }

  // 标签页
  .profile-tabs {
    :deep(.el-tabs__nav-wrap) {
      background: transparent;

      &::after {
        background-color: var(--ai-border);
      }
    }

    :deep(.el-tabs__item) {
      color: var(--ai-text-secondary);
      font-size: 16px;

      &.is-active {
        color: var(--ai-primary);
      }
    }

    :deep(.el-tabs__active-bar) {
      background-color: var(--ai-primary);
      height: 3px;
    }
  }

  // 安全设置
  .security-section {
    margin-bottom: 32px;

    &:last-child {
      margin-bottom: 0;
    }

    h4 {
      margin: 0 0 12px 0;
      color: var(--ai-text-primary);
    }

    .section-desc {
      margin: 0 0 16px 0;
      color: var(--ai-text-secondary);
    }

    .password-strength {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      font-size: 14px;
      color: var(--ai-text-secondary);

      .el-progress {
        flex: 1;
      }
    }

    .two-factor-auth {
      display: flex;
      align-items: center;
      gap: 12px;

      .switch-label {
        color: var(--ai-text-secondary);
      }
    }

    .device-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .device-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: var(--ai-bg-tertiary);
        border-radius: 12px;

        .device-info {
          display: flex;
          align-items: center;
          gap: 16px;

          h5 {
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
  }

  // 通知设置
  .notification-settings {
    h4 {
      margin: 0 0 16px 0;
      color: var(--ai-text-primary);
    }

    .setting-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 32px;

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: var(--ai-bg-tertiary);
        border-radius: 12px;

        .setting-info {
          flex: 1;

          h5 {
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
  }

  // 偏好设置
  .preference-settings {
    h4 {
      margin: 0 0 16px 0;
      color: var(--ai-text-primary);
    }

    .setting-group {
      margin-bottom: 32px;

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: var(--ai-bg-tertiary);
        border-radius: 12px;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .setting-info {
          flex: 1;

          h5 {
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
  }
}

// 导入表单样式
@import '@/styles/forms.scss';
</style>