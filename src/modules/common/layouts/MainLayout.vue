<!-- src/modules/common/layouts/MainLayout.vue -->

<template>
  <div class="ai-modern-layout">
    <!-- 智能粒子背景 -->
    <div class="intelligent-bg">
      <div class="particle" v-for="i in 20" :key="i"></div>
    </div>

    <!-- 顶部悬浮导航栏 -->
    <nav class="floating-navbar">
      <div class="nav-glass">
        <!-- Logo -->
        <div class="nav-logo" @click="router.push('/')">
          <div class="logo-orb">
            <el-icon :size="24"><DataAnalysis /></el-icon>
          </div>
          <span class="logo-text">AI Platform</span>
        </div>

        <!-- 中央导航菜单 -->
        <div class="nav-center">
          <div class="nav-pills">
            <a
                v-for="item in navItems"
                :key="item.path"
                class="nav-pill"
                :class="{ active: isActiveRoute(item.path) }"
                @click="navigateTo(item)"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
              <div class="pill-glow"></div>
            </a>
          </div>
        </div>

        <!-- 右侧工具栏 -->
        <div class="nav-tools">
          <!-- AI助手按钮 -->
          <div class="ai-assistant-btn">
            <div class="assistant-orb">
              <el-icon :size="20"><Promotion /></el-icon>
            </div>
            <span class="pulse-ring"></span>
          </div>

          <!-- 通知中心 -->
          <div class="notification-center">
            <el-badge :value="notifications" :max="9">
              <div class="tool-btn">
                <el-icon :size="20"><Bell /></el-icon>
              </div>
            </el-badge>
          </div>

          <!-- 用户中心 -->
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="user-avatar-wrapper">
              <div class="user-avatar">
                <el-icon :size="24"><User /></el-icon>
              </div>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="modern-dropdown">
                <div class="dropdown-header">
                  <div class="user-info">
                    <h4>{{ authStore.username }}</h4>
                    <p>智能分析专家</p>
                  </div>
                </div>
                <el-dropdown-item command="profile">
                  <el-icon><UserFilled /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item command="theme">
                  <el-icon><component :is="isDark ? 'Sunny' : 'Moon'" /></el-icon>
                  {{ isDark ? '浅色主题' : '深色主题' }}
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="ai-content">
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="page-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 底部智能Dock栏 -->
    <div class="smart-dock">
      <div class="dock-container">
        <div class="dock-items">
          <div
              v-for="quick in quickAccess"
              :key="quick.path"
              class="dock-item"
              @click="router.push(quick.path)"
              :class="{ active: route.path === quick.path }"
          >
            <div class="dock-icon" :style="{ background: quick.color }">
              <el-icon :size="24"><component :is="quick.icon" /></el-icon>
            </div>
            <span class="dock-label">{{ quick.label }}</span>
            <div class="dock-indicator"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 子菜单悬浮面板 -->
    <transition name="submenu-slide">
      <div v-if="activeSubmenu" class="submenu-panel" @mouseleave="activeSubmenu = null">
        <h3>{{ activeSubmenu.title }}</h3>
        <div class="submenu-grid">
          <div
              v-for="child in activeSubmenu.children"
              :key="child.path"
              class="submenu-item"
              @click="router.push(child.path)"
          >
            <div class="submenu-icon">
              <el-icon><component :is="child.icon || 'Document'" /></el-icon>
            </div>
            <span>{{ child.title }}</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- 个人中心弹窗 -->
    <el-dialog
      v-model="showProfileDialog"
      title="个人中心"
      :width="'80%'"
      :before-close="handleCloseProfile"
      class="modern-dialog"
    >
      <Profile />
    </el-dialog>

    <!-- 系统设置弹窗 -->
    <el-dialog
      v-model="showSettingsDialog"
      title="系统设置"
      :width="'80%'"
      :before-close="handleCloseSettings"
      class="modern-dialog"
    >
      <SettingPage />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import Profile from '@/modules/auth/views/Profile.vue'
import SettingPage from '@/modules/auth/views/SettingPage.vue'
import {
  DataAnalysis,
  Bell, User, UserFilled, SwitchButton,
  Promotion, Setting
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const notifications = ref(3)
// const isDark = ref(true)
const { isDark, toggleTheme } = useTheme() // 使用主题管理
const activeSubmenu = ref<any>(null)

// 弹窗控制变量
const showProfileDialog = ref(false)
const showSettingsDialog = ref(false)

// 顶部导航项
const navItems = [
  {
    path: '/dashboard',
    title: '控制台',
    icon: 'DataAnalysis'
  },
  {
    path: '/ai-analysis',
    title: 'AI分析',
    icon: 'View',
    children: [
      { path: '/ai-analysis/image-comparison', title: '智能图像对比', icon: 'Camera' },
      { path: '/ai-analysis/object-detection', title: '目标检测', icon: 'Aim' },
      { path: '/ai-analysis/image-recognition', title: '图像识别', icon: 'PictureFilled' }
    ]
  },
  {
    path: '/data-processing',
    title: '数据处理',
    icon: 'Document',
    children: [
      { path: '/data-processing/excel-analysis', title: 'Excel智能分析', icon: 'DocumentCopy' },
      { path: '/data-processing/data-clustering', title: '数据聚类', icon: 'Connection' },
      { path: '/data-processing/data-cleaning', title: '数据清洗', icon: 'Brush' }
    ]
  },
  {
    path: '/ml-training',
    title: '模型训练',
    icon: 'TrendCharts',
    children: [
      { path: '/ml-training/create', title: '创建训练', icon: 'Plus' },
      { path: '/ml-training/tasks', title: '任务管理', icon: 'List' },
      { path: '/ml-training/models', title: '模型仓库', icon: 'Box' },
      {path: '/ml-training/yolo', title: 'YOLO训练', icon: 'view' }
    ]
  }
]

// 底部快速访问
const quickAccess = [
  {
    path: '/ai-analysis/image-comparison',
    label: '图像对比',
    icon: 'Camera',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    path: '/data-processing/excel-analysis',
    label: 'Excel分析',
    icon: 'Document',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    path: '/ml-training/create',
    label: '模型训练',
    icon: 'TrendCharts',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    path: '/dashboard',
    label: '控制台',
    icon: 'Grid',
    color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  }
]

const isActiveRoute = (path: string) => {
  if (path === '/dashboard') {
    return route.path === path
  }
  return route.path.startsWith(path)
}

const navigateTo = (item: any) => {
  if (item.children) {
    activeSubmenu.value = item
  } else {
    router.push(item.path)
    activeSubmenu.value = null
  }
}

const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      showProfileDialog.value = true
      break
    case 'settings':
      showSettingsDialog.value = true
      break
    case 'theme':
      toggleTheme()
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        authStore.logout()
        ElMessage.success('已退出登录')
      } catch {
        // 用户取消
      }
      break
  }
}

// 关闭弹窗的处理函数
const handleCloseProfile = (done: () => void) => {
  done()
}

const handleCloseSettings = (done: () => void) => {
  done()
}
</script>

<style lang="scss" scoped>
@use '@/styles/ai-theme.scss';
@use 'sass:math';

.ai-modern-layout {
  min-height: 100vh;
  background: #0a0a0a;
  position: relative;
}

// 智能背景
.intelligent-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  background:
      radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 50%, rgba(20, 184, 166, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 50% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);

  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    animation: float 20s infinite;

    @for $i from 1 through 20 {
      &:nth-child(#{$i}) {
        left: math.random() * 100%;
        top: math.random() * 100%;
        animation-delay: math.random() * 20s;
        animation-duration: (15 + math.random() * 10) * 1s;
      }
    }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100vh) translateX(50px); }
}

// 顶部导航栏
.floating-navbar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 1400px;
  z-index: 100;

  .nav-glass {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;

    .logo-orb {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #6366f1, #14b8a6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
        transform: rotate(45deg);
        animation: shine 3s infinite;
      }

      .el-icon { color: white; z-index: 1; }
    }

    .logo-text {
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #6366f1, #14b8a6);
      -webkit-background-clip: text;
      background-clip: text; // 添加标准属性
      -webkit-text-fill-color: transparent;
    }
  }

  .nav-center {
    .nav-pills {
      display: flex;
      gap: 8px;
      background: rgba(255, 255, 255, 0.02);
      padding: 6px;
      border-radius: 16px;

      .nav-pill {
        position: relative;
        padding: 10px 20px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;

        &:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        &.active {
          color: white;
          background: rgba(99, 102, 241, 0.2);

          .pill-glow {
            opacity: 1;
          }
        }

        .pill-glow {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #14b8a6);
          opacity: 0;
          filter: blur(10px);
          transition: opacity 0.3s ease;
          z-index: -1;
        }
      }
    }
  }

  .nav-tools {
    display: flex;
    align-items: center;
    gap: 20px;

    .ai-assistant-btn {
      position: relative;
      cursor: pointer;

      .assistant-orb {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #8b5cf6, #ec4899);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        animation: assistant-glow 2s ease-in-out infinite;
      }

      .pulse-ring {
        position: absolute;
        inset: -4px;
        border: 2px solid rgba(236, 72, 153, 0.5);
        border-radius: 50%;
        animation: pulse-ring 2s ease-out infinite;
      }
    }

    .tool-btn {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
    }

    .user-avatar-wrapper {
      position: relative;
      cursor: pointer;
      width: 44px; /* 设定容器尺寸 */
      height: 44px; /* 设定容器尺寸 */

      /* 使用伪元素来创建光环 */
      &::before {
        content: '';
        position: absolute;
        inset: -3px; /* 控制光环的粗细 */
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1, #14b8a6);
        animation: rotate 4s linear infinite;
        z-index: -1; /* 将光环置于头像下方 */
      }

      .user-avatar {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #6366f1, #14b8a6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      @keyframes rotate {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    }
  }
}

// 主内容区域
.ai-content {
  position: relative;
  z-index: 10;
  padding: 120px 20px 100px;
  min-height: 100vh;
  overflow-y: auto;

  .content-wrapper {
    max-width: 1600px;
    margin: 0 auto;
  }
}

// 底部Dock栏
.smart-dock {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;

  .dock-container {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  .dock-items {
    display: flex;
    gap: 12px;

    .dock-item {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.05);

        .dock-icon {
          transform: translateY(-4px) scale(1.1);
        }

        .dock-label {
          opacity: 1;
          transform: translateY(0);
        }
      }

      &.active {
        .dock-indicator {
          opacity: 1;
          width: 30px;
        }
      }

      .dock-icon {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          inset: 0;
          background: inherit;
          filter: blur(20px);
          opacity: 0.5;
          z-index: -1;
        }
      }

      .dock-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        opacity: 0;
        transform: translateY(4px);
        transition: all 0.3s ease;
        position: absolute;
        bottom: -20px;
        white-space: nowrap;
      }

      .dock-indicator {
        position: absolute;
        bottom: 0;
        height: 3px;
        width: 3px;
        background: linear-gradient(90deg, #6366f1, #14b8a6);
        border-radius: 3px;
        opacity: 0;
        transition: all 0.3s ease;
      }
    }
  }
}

// 子菜单面板
.submenu-panel {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.05);
  width: max-content; /* 关键：让宽度由内容决定 */
  max-width: 80vw;  /* 可选：防止菜单过长，超出视口 */
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 99;

  h3 {
    margin: 0 0 20px 0;
    color: var(--ai-text-primary);
    font-size: 18px;
  }

  .submenu-grid {
    display: flex;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    .submenu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: var(--ai-text-primary);

      &:hover {
        background: rgba(99, 102, 241, 0.2);
        color: white;
        transform: translateX(4px);
      }

      .submenu-icon {
        width: 32px;
        height: 32px;
        background: rgba(99, 102, 241, 0.2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}

// 动画
@keyframes shine {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

@keyframes assistant-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5); }
  50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.8); }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 页面过渡
.page-slide-enter-active,
.page-slide-leave-active {
  transition: all 0.05s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.98);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.98);
}

.submenu-slide-enter-active,
.submenu-slide-leave-active {
  transition: all 0.3s ease;
}

.submenu-slide-enter-from,
.submenu-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

// 深色主题下拉菜单
:deep(.modern-dropdown) {
  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 8px;

  .dropdown-header {
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 8px;

    .user-info {
      h4 {
        margin: 0 0 4px 0;
        color: white;
      }
      p {
        margin: 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
      }
    }
  }

  .el-dropdown-menu__item {
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.8);

    &:hover {
      background: rgba(99, 102, 241, 0.2);
      color: white;
    }
  }
}

// 现代化弹窗样式
:deep(.modern-dialog) {
  .el-dialog {
    background: rgba(20, 20, 30, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  }

  .el-dialog__header {
    background: linear-gradient(135deg, #6366f1, #14b8a6);
    padding: 20px 24px;
    border-radius: 20px 20px 0 0;
    border: none;

    .el-dialog__title {
      color: white;
      font-size: 18px;
      font-weight: 600;
    }

    .el-dialog__headerbtn {
      top: 20px;
      right: 24px;

      .el-dialog__close {
        color: white;
        font-size: 20px;

        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }

  .el-dialog__body {
    padding: 0;
    background: transparent;
  }
}

// 浅色主题适配
:global(html.light) {
  .ai-modern-layout {
    background: #f8fafc;

    .intelligent-bg {
      background:
          radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 50%, rgba(20, 184, 166, 0.05) 0%, transparent 50%);
    }

    .floating-navbar .nav-glass,
    .smart-dock .dock-container,
    .submenu-panel {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      border-color: rgba(0, 0, 0, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .nav-pill,
    .tool-btn {
      color: #64748b;

      &:hover {
        color: #1e293b;
        background: rgba(0, 0, 0, 0.05);
      }

      &.active {
        color: #6366f1;
        background: rgba(99, 102, 241, 0.1);
      }
    }

    .dock-label,
    .submenu-item {
      color: #64748b;
    }
  }

  .modern-dialog {
    .el-dialog {
      background: rgba(255, 255, 255, 0.95);
      border-color: rgba(0, 0, 0, 0.1);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
    }
  }
}
</style>