<!-- src/modules/common/views/Dashboard.vue -->

<template>
  <div class="ai-intelligent-dashboard">
    <!-- 全屏欢迎区 -->
    <section class="hero-section">
      <div class="hero-bg">
        <!-- 添加 will-change 优化 -->
        <div class="gradient-orb orb-1" style="will-change: transform"></div>
        <div class="gradient-orb orb-2" style="will-change: transform"></div>
        <div class="gradient-orb orb-3" style="will-change: transform"></div>
      </div>

      <div class="hero-content">
        <div class="welcome-message">
          <h1 class="welcome-title">WELCOME</h1>
          <p class="subtitle">{{ greeting }}，{{ authStore.username || '智能分析师' }}</p>
          <p class="tagline">让AI赋能您的每一次决策</p>
        </div>

        <!-- 实时数据环 -->
        <div class="data-ring">
          <svg viewBox="0 0 200 200" class="ring-svg">
            <circle cx="100" cy="100" r="90" class="ring-bg" />
            <circle cx="100" cy="100" r="90" class="ring-progress"
                    :style="`stroke-dasharray: ${progressValue} 565.5`" />
          </svg>
          <div class="ring-content">
            <div class="ring-value">{{ todayScore }}%</div>
            <div class="ring-label">今日效率</div>
          </div>
        </div>
      </div>

      <div class="scroll-indicator">
        <el-icon :size="24"><Bottom /></el-icon>
      </div>
    </section>

    <!-- 智能指标卡片 -->
    <section class="metrics-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-icon"><el-icon><DataLine /></el-icon></span>
          实时指标
        </h2>
        <div class="refresh-time">
          <el-icon><Clock /></el-icon>
          <span>{{ lastUpdateTime }}</span>
        </div>
      </div>

      <div class="metrics-container">
        <div
            v-for="(metric, index) in intelligentMetrics"
            :key="metric.id"
            class="metric-card-3d"
            :style="`--delay: ${index * 0.01}s`"
        >
          <div class="card-3d-inner">
            <div class="card-face card-front">
              <div class="metric-icon" :style="`background: ${metric.gradient}`">
                <el-icon :size="32"><component :is="metric.icon" /></el-icon>
              </div>
              <div class="metric-info">
                <h3>{{ metric.label }}</h3>
                <div class="metric-value">
                  <animated-number :value="metric.value" :decimals="metric.decimals || 0" />
                  <span class="value-suffix">{{ metric.suffix }}</span>
                </div>
                <div class="metric-trend" v-if="metric.trend">
                  <el-icon :class="metric.trend > 0 ? 'trend-up' : 'trend-down'">
                    <component :is="metric.trend > 0 ? 'Top' : 'Bottom'" />
                  </el-icon>
                  <span>{{ Math.abs(metric.trend) }}%</span>
                </div>
              </div>
              <div class="metric-chart">
                <canvas :ref="`chart-${metric.id}`"></canvas>
              </div>
            </div>
            <div class="card-face card-back">
              <h4>{{ metric.label }}详情</h4>
              <p>{{ metric.description }}</p>
              <el-button type="primary" size="small">查看报告</el-button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- AI功能网格 -->
    <section class="ai-features-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-icon"><el-icon><Cpu /></el-icon></span>
          AI能力中心
        </h2>
      </div>

      <div class="features-grid">
        <div
            v-for="feature in aiFeatures"
            :key="feature.id"
            class="feature-card-modern"
            @click="navigateToFeature(feature.path)"
        >
          <div class="feature-bg" :style="`background: ${feature.gradient}`"></div>
          <div class="feature-content">
            <div class="feature-header">
              <div class="feature-icon">
                <el-icon :size="40"><component :is="feature.icon" /></el-icon>
              </div>
              <div class="feature-badge" v-if="feature.isNew">NEW</div>
            </div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">{{ feature.usage }}</span>
                <span class="stat-label">今日使用</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ feature.accuracy }}%</span>
                <span class="stat-label">准确率</span>
              </div>
            </div>
          </div>
          <div class="feature-hover-effect"></div>
        </div>
      </div>
    </section>

    <!-- 活动时间线 -->
    <section class="activity-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-icon"><el-icon><Timer /></el-icon></span>
          智能活动流
        </h2>
        <el-button class="view-all-btn" text>
          查看全部
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>

      <div class="activity-timeline-modern">
        <div
            v-for="activity in recentActivities"
            :key="activity.id"
            class="timeline-item"
        >
          <div class="timeline-marker" :class="`marker-${activity.type}`">
            <el-icon><component :is="activity.icon" /></el-icon>
          </div>
          <div class="timeline-content">
            <div class="content-header">
              <h4>{{ activity.title }}</h4>
              <span class="time-tag">{{ activity.time }}</span>
            </div>
            <p>{{ activity.description }}</p>
            <div class="content-actions" v-if="activity.actions">
              <el-button
                  v-for="action in activity.actions"
                  :key="action.id"
                  size="small"
                  :type="action.type"
                  @click="handleAction(action)"
              >
                {{ action.label }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- AI助手悬浮球 -->
    <div class="ai-assistant-float">
      <div class="assistant-avatar" @click="toggleAssistant">
        <el-icon :size="28"><Promotion /></el-icon>
        <div class="assistant-status"></div>
      </div>
      <transition name="assistant-panel">
        <div v-if="assistantOpen" class="assistant-panel">
          <div class="panel-header">
            <h3>AI助手</h3>
            <el-icon @click="assistantOpen = false"><Close /></el-icon>
          </div>
          <div class="panel-body">
            <div class="quick-actions">
              <div class="action-item" v-for="action in quickActions" :key="action.id">
                <el-icon><component :is="action.icon" /></el-icon>
                <span>{{ action.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import {
  Bottom, DataLine, Clock, Cpu, Timer, ArrowRight,
  Top, Calendar, Loading, CircleCheck, Warning,
  Camera, Document, Histogram, TrendCharts, Promotion,
  Close, Search, QuestionFilled, Lightning
} from '@element-plus/icons-vue'
import AnimatedNumber from '../components/AnimatedNumber.vue'
import Chart from 'chart.js/auto'

const router = useRouter()
const authStore = useAuthStore()
const { isDark } = useTheme() // 使用统一的主题状态

// 响应式数据
const todayScore = ref(0)
const progressValue = computed(() => (todayScore.value / 100) * 565.5)
const lastUpdateTime = ref('刚刚更新')
const assistantOpen = ref(false)

// 计算今日效率分数
const calculateTodayScore = () => {
  // 基于任务完成情况计算分数
  const totalTasks = intelligentMetrics.value[0].value
  const processingTasks = intelligentMetrics.value[1].value
  const successRate = intelligentMetrics.value[2].value

  // 简单的计算公式：成功率 * (1 - 处理中任务占比)
  const completionRatio = totalTasks > 0 ? (totalTasks - processingTasks) / totalTasks : 1
  const score = Math.round(successRate * completionRatio)

  // 动画效果显示分数
  setTimeout(() => {
    todayScore.value = score
  }, 500)
}

// 问候语
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

// 智能指标
const intelligentMetrics = ref([
  {
    id: 'tasks',
    label: '今日任务',
    value: 24,
    icon: 'Calendar',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    trend: 12,
    description: '相比昨日增长12%，保持良好势头'
  },
  {
    id: 'processing',
    label: '处理中',
    value: 5,
    icon: 'Loading',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    description: '5个任务正在智能处理中'
  },
  {
    id: 'success',
    label: '成功率',
    value: 96.5,
    suffix: '%',
    decimals: 1,
    icon: 'CircleCheck',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    trend: 2.3,
    description: '任务成功率持续提升'
  },
  {
    id: 'models',
    label: 'AI模型',
    value: 12,
    icon: 'Cpu',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    description: '12个AI模型随时待命'
  }
])

// AI功能
const aiFeatures = ref([
  {
    id: 'image-comparison',
    path: '/ai-analysis/image-comparison',
    icon: 'Camera',
    title: '智能图像对比',
    description: '深度学习驱动的图像相似度分析',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    usage: 156,
    accuracy: 98.5,
    isNew: false
  },
  {
    id: 'excel-analysis',
    path: '/data-processing/excel-analysis',
    icon: 'Document',
    title: 'Excel智能分析',
    description: '自动识别数据模式，生成洞察报告',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    usage: 89,
    accuracy: 95.2,
    isNew: true
  },
  {
    id: 'data-clustering',
    path: '/data-processing/data-clustering',
    icon: 'Histogram',
    title: '数据聚类分析',
    description: '无监督学习发现数据隐藏模式',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    usage: 45,
    accuracy: 92.8,
    isNew: false
  },
  {
    id: 'ml-training',
    path: '/ml-training/create',
    icon: 'TrendCharts',
    title: '模型训练中心',
    description: '定制化机器学习模型训练平台',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    usage: 23,
    accuracy: 94.1,
    isNew: false
  }
])

// 最近活动
const recentActivities = ref([
  {
    id: 1,
    type: 'success',
    icon: 'CircleCheck',
    title: '图像对比任务完成',
    description: '降雨图对比分析任务执行成功，相似度达到95.8%',
    time: '5分钟前',
    actions: [
      { id: 'view', label: '查看结果', type: 'primary' },
      { id: 'download', label: '下载报告', type: 'default' }
    ]
  },
  {
    id: 2,
    type: 'processing',
    icon: 'Loading',
    title: '数据聚类进行中',
    description: '客户数据聚类分析正在处理，预计10分钟后完成',
    time: '10分钟前'
  },
  {
    id: 3,
    type: 'warning',
    icon: 'Warning',
    title: '模型训练需要注意',
    description: '训练数据集可能存在不平衡，建议进行数据增强',
    time: '1小时前',
    actions: [
      { id: 'fix', label: '立即处理', type: 'warning' }
    ]
  }
])

// 快捷操作
const quickActions = ref([
  { id: 'search', icon: 'Search', label: '快速搜索' },
  { id: 'help', icon: 'QuestionFilled', label: '获取帮助' },
  { id: 'quick', icon: 'Lightning', label: '快捷命令' }
])

// 方法
const navigateToFeature = (path: string) => {
  router.push(path)
}

const toggleAssistant = () => {
  assistantOpen.value = !assistantOpen.value
}

const handleAction = (action: any) => {
  console.log('Action:', action)
}

// 生命周期
onMounted(() => {
  // 初始化迷你图表
  initMiniCharts()

  // 启动动画
  startAnimations()

  // 计算今日效率
  calculateTodayScore()

  requestAnimationFrame(() => {
    todayScore.value = calculateTodayScore()
  })
  // 定时更新
  const updateTimer = setInterval(() => {
    lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }, 60000)

  onUnmounted(() => {
    clearInterval(updateTimer)
  })
})

onUnmounted(() => {
  // 清理资源
})

// 初始化迷你图表
const initMiniCharts = () => {
  // 这里可以为每个指标卡片创建小型图表
}

// 启动动画
const startAnimations = () => {
  // 可以添加一些动态效果
}
</script>

<style lang="scss" scoped>
@use '@/styles/ai-theme.scss';

.ai-intelligent-dashboard {
  position: relative;
  min-height: 100vh;
  background-color: var(--ai-bg-primary); // 使用CSS变量
  transition: background-color 0.3s ease; // 添加过渡效果
}

// 全屏欢迎区
.hero-section {
  position: relative;
  height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .hero-bg {
    position: absolute;
    inset: 0;
    z-index: 0;

    .gradient-orb {
      transform: translate3d(0, 0, 0);
      will-change: transform; // 提示浏览器优化

      // 减少动画复杂度
      &.orb-1, &.orb-2, &.orb-3 {
        animation: orb-float-simple 20s ease-in-out infinite;
      }
    }
  }

  .hero-content {
    position: relative;
    z-index: 1;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 60px;

    .welcome-message {
      .glitch {
        font-size: 80px;
        font-weight: 900;
        text-transform: uppercase;
        position: relative;
        color: white;
        letter-spacing: 8px;
        margin: 0;

        &::before,
        &::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        &::before {
          animation: glitch-1 0.3s infinite;
          color: #00ffff;
          z-index: -1;
        }

        &::after {
          animation: glitch-2 0.3s infinite;
          color: #ff00ff;
          z-index: -2;
        }
      }

      .subtitle {
        font-size: 24px;
        color: var(--ai-text-secondary); // 使用CSS变量替代硬编码
        margin: 20px 0 10px;
      }

      .tagline {
        font-size: 18px;
        color: var(--ai-text-muted); // 使用CSS变量替代硬编码
        margin: 0;
      }
    }

    .data-ring {
      position: relative;
      width: 200px;
      height: 200px;

      .ring-svg {
        transform: rotate(-90deg);

        .ring-bg {
          fill: none;
          stroke: rgba(255, 255, 255, 0.1);
          stroke-width: 8;
        }

        .ring-progress {
          fill: none;
          stroke: url(#gradient);
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dasharray 1s ease;
          filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.5));
        }
      }

      .ring-content {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .ring-value {
          font-size: 48px;
          font-weight: 700;
          color: var(--ai-text-primary); // 使用CSS变量
        }

        .ring-label {
          font-size: 14px;
          color: var(--ai-text-muted); // 使用CSS变量
        }
      }
    }
  }

  .scroll-indicator {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.6);
    animation: bounce 2s infinite;
  }
}

// 指标区域
.metrics-section {
  padding: 80px 40px;

  .metrics-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin-top: 40px;

    .metric-card-3d {
      perspective: 1000px;
      height: 200px;
      animation: slide-up 0.1s ease-out backwards;
      animation-delay: var(--delay);

      &:hover .card-3d-inner {
        transform: rotateY(180deg);
      }

      .card-3d-inner {
        position: relative;
        width: 100%;
        height: 100%;
        transition: transform 0.6s;
        transform-style: preserve-3d;

        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 20px;
          padding: 30px;
          background: rgba(136, 42, 42, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card-front {
          display: flex;
          align-items: center;
          gap: 20px;

          .metric-icon {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
          }

          .metric-info {
            flex: 1;

            h3 {
              margin: 0 0 8px;
              font-size: 16px;
              color: var(--ai-text-secondary); // 使用CSS变量
            }

            .metric-value {
              font-size: 32px;
              font-weight: 700;
              color: var(--ai-text-primary); // 使用CSS变量
              display: flex;
              align-items: baseline;
              gap: 4px;

              .value-suffix {
                font-size: 18px;
                font-weight: 400;
                color: var(--ai-text-muted); // 使用CSS变量
              }
            }

            .metric-trend {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 14px;
              margin-top: 8px;

              &.trend-up { color: #10b981; }
              &.trend-down { color: #ef4444; }
            }
          }

          .metric-chart {
            width: 80px;
            height: 40px;
            opacity: 0.6;
          }
        }

        .card-back {
          transform: rotateY(180deg);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;

          h4 {
            margin: 0 0 12px;
            color: white;
          }

          p {
            margin: 0 0 20px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
          }
        }
      }
    }
  }
}

// AI功能网格
.ai-features-section {
  padding: 80px 40px;
  background: rgba(255, 255, 255, 0.02);

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 30px;
    margin-top: 40px;

    .feature-card-modern {
      position: relative;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 24px;
      padding: 40px;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);

      &:hover {
        transform: translateY(-8px);
        border-color: rgba(99, 102, 241, 0.5);

        .feature-bg {
          opacity: 0.2;
          transform: scale(1.5);
        }

        .feature-hover-effect {
          opacity: 1;
        }
      }

      .feature-bg {
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        border-radius: 50%;
        opacity: 0.1;
        transition: all 0.5s ease;
        pointer-events: none;
      }

      .feature-content {
        position: relative;
        z-index: 1;

        .feature-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 20px;

          .feature-icon {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .feature-badge {
            background: linear-gradient(135deg, #f59e0b, #ef4444);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }
        }

        h3 {
          margin: 0 0 12px;
          font-size: 24px;
          color: var(--ai-text-primary); // 使用CSS变量
        }

        p {
          margin: 0 0 24px;
          color: var(--ai-text-secondary); // 使用CSS变量
          line-height: 1.6;
        }

        .feature-stats {
          display: flex;
          gap: 30px;

          .stat-item {
            .stat-value {
              display: block;
              font-size: 20px;
              font-weight: 700;
              color: var(--ai-text-primary); // 使用CSS变量
              margin-bottom: 4px;
            }

            .stat-label {
              font-size: 14px;
              color: var(--ai-text-muted); // 使用CSS变量
            }
          }
        }
      }

      .feature-hover-effect {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }
    }
  }
}

// 活动时间线
.activity-section {
  padding: 80px 40px;

  .activity-timeline-modern {
    margin-top: 40px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 30px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(to bottom, rgba(99, 102, 241, 0.5), transparent);
    }

    .timeline-item {
      display: flex;
      gap: 30px;
      margin-bottom: 40px;
      animation: slide-in 0.1s ease-out backwards;

      &:nth-child(1) { animation-delay: 0.05s; }
      &:nth-child(2) { animation-delay: 0.1s; }
      &:nth-child(3) { animation-delay: 0.15s; }

      .timeline-marker {
        flex-shrink: 0;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        position: relative;
        z-index: 1;

        &.marker-success {
          background: linear-gradient(135deg, #10b981, #34d399);
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
        }

        &.marker-processing {
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          box-shadow: 0 0 30px rgba(245, 158, 11, 0.5);
        }

        &.marker-warning {
          background: linear-gradient(135deg, #ef4444, #f87171);
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
        }
      }

      .timeline-content {
        flex: 1;
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          h4 {
            margin: 0;
            color: var(--ai-text-primary); // 使用CSS变量
            font-size: 18px;
          }

          .time-tag {
            font-size: 14px;
            color: var(--ai-text-muted); // 使用CSS变量
          }
        }

        p {
          margin: 0 0 16px;
          color: var(--ai-text-secondary); // 使用CSS变量
          line-height: 1.6;
        }

        .content-actions {
          display: flex;
          gap: 12px;
        }
      }
    }
  }
}

// AI助手
.ai-assistant-float {
  position: fixed;
  bottom: 40px;
  right: 40px;
  z-index: 100;

  .assistant-avatar {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
    position: relative;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.1);
    }

    .assistant-status {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 12px;
      height: 12px;
      background: #10b981;
      border-radius: 50%;
      border: 2px solid #0a0a0a;
    }
  }

  .assistant-panel {
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 320px;
    background: rgba(20, 20, 30, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      h3 {
        margin: 0;
        color: white;
      }

      .el-icon {
        cursor: pointer;
        color: rgba(255, 255, 255, 0.6);

        &:hover {
          color: white;
        }
      }
    }

    .panel-body {
      padding: 20px;

      .quick-actions {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;

        .action-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: rgba(255, 255, 255, 0.7);

          &:hover {
            background: rgba(99, 102, 241, 0.2);
            color: white;
          }

          .el-icon {
            font-size: 24px;
          }

          span {
            font-size: 12px;
          }
        }
      }
    }
  }
}

// 通用样式
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 32px;
    font-weight: 700;
    color: var(--ai-text-primary); // 使用CSS变量
    margin: 0;

    .title-icon {
      width: 48px;
      height: 48px;
      background: rgba(99, 102, 241, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6366f1;
    }
  }

  .refresh-time {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ai-text-muted); // 使用CSS变量
    font-size: 14px;
  }

  .view-all-btn {
    color: #6366f1;

    &:hover {
      transform: translateX(4px);
    }
  }
}

// 动画
@keyframes orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate3d(20px, -20px, 0) scale(1.05); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0) translateX(-50%); }
  40% { transform: translateY(-10px) translateX(-50%); }
  60% { transform: translateY(-5px) translateX(-50%); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

.assistant-panel-enter-active,
.assistant-panel-leave-active {
  transition: all 0.3s ease;
}

.assistant-panel-enter-from,
.assistant-panel-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}

// 添加渐变定义
svg {
  defs {
    linearGradient {
      stop:first-child { stop-color: #6366f1; }
      stop:last-child { stop-color: #14b8a6; }
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .hero-section .hero-content .welcome-message .glitch {
    font-size: 48px;
  }

  .metrics-container,
  .features-grid {
    grid-template-columns: 1fr;
  }

  .ai-assistant-float .assistant-panel {
    width: calc(100vw - 40px);
    right: -24px;
  }
}
</style>