<!-- frontend/src/modules/auth/views/Login.vue -->

<template>
  <div class="modern-login-container">
    <!-- 动态背景 -->
    <div class="animated-bg">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
      <div class="grid-pattern"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- 左侧装饰 -->
      <div class="card-decoration">
        <div class="tech-lines">
          <span v-for="i in 5" :key="i" class="line"></span>
        </div>
        <div class="welcome-text">
          <h1>智能分析</h1>
          <p>AI驱动的数据洞察平台</p>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-form-section">
        <div class="form-header">
          <div class="logo-container">
            <div class="logo-orb">
              <el-icon :size="32"><DataAnalysis /></el-icon>
            </div>
            <div class="logo-ring"></div>
          </div>
          <h2>欢迎回来</h2>
          <p>登录以继续使用AI平台</p>
        </div>

        <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            class="login-form"
        >
          <el-form-item prop="username">
            <div class="input-wrapper">
              <el-icon class="input-icon"><User /></el-icon>
              <el-input
                  v-model="form.username"
                  placeholder="请输入用户名"
                  size="large"
                  clearable
              />
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <div class="input-wrapper">
              <el-icon class="input-icon"><Lock /></el-icon>
              <el-input
                  v-model="form.password"
                  type="password"
                  placeholder="请输入密码"
                  size="large"
                  show-password
                  @keyup.enter="handleLogin"
              />
            </div>
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="rememberMe" class="remember-me">记住我</el-checkbox>
            <el-link type="primary" :underline="false">忘记密码？</el-link>
          </div>

          <el-form-item>
            <el-button
                type="primary"
                size="large"
                :loading="loading"
                @click="handleLogin"
                class="login-btn"
            >
              <span v-if="!loading">立即登录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="divider">
          <span>或</span>
        </div>

        <div class="quick-login">
          <div class="quick-login-btn">
            <el-icon><ChromeFilled /></el-icon>
            <span>使用Google登录</span>
          </div>
          <div class="quick-login-btn">
            <el-icon><Connection /></el-icon>
            <span>使用GitHub登录</span>
          </div>
        </div>

        <div class="register-link">
          <span>还没有账号？</span>
          <el-link type="primary" @click="goToRegister">立即注册</el-link>
        </div>
      </div>
    </div>

    <!-- 装饰元素 -->
    <div class="floating-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import {
  DataAnalysis, User, Lock, ChromeFilled, Connection
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const success = await authStore.login(form.username, form.password)

      if (success) {
        // 记住用户名
        if (rememberMe.value) {
          localStorage.setItem('remembered_username', form.username)
        } else {
          localStorage.removeItem('remembered_username')
        }

        ElMessage({
          message: '登录成功，正在跳转...',
          type: 'success',
          duration: 1500
        })

        setTimeout(() => {
          router.push('/dashboard')
        }, 800)
      } else {
        ElMessage.error('用户名或密码错误')
      }
    } catch (error) {
      console.error('Login error:', error)
      ElMessage.error('登录失败，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}

const goToRegister = () => {
  router.push('/register')
}

onMounted(() => {
  // 检查是否记住了用户名
  const rememberedUsername = localStorage.getItem('remembered_username')
  if (rememberedUsername) {
    form.username = rememberedUsername
    rememberMe.value = true
  }
})
</script>

<style lang="scss" scoped>
.modern-login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  position: relative;
  overflow: hidden;
}

// 动态背景
.animated-bg {
  position: absolute;
  inset: 0;
  z-index: 0;

  .gradient-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    animation: float-orb 20s ease-in-out infinite;

    &.orb-1 {
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
      top: -200px;
      left: -200px;
    }

    &.orb-2 {
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(20, 184, 166, 0.4) 0%, transparent 70%);
      bottom: -300px;
      right: -300px;
      animation-delay: -7s;
    }

    &.orb-3 {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: -14s;
    }
  }

  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: grid-move 20s linear infinite;
  }
}

// 登录卡片
.login-card {
  position: relative;
  z-index: 10;
  width: 900px;
  height: 800px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  display: flex;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: card-entrance 0.8s ease-out;

  // 左侧装饰
  .card-decoration {
    flex: 1;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%);
    padding: 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    overflow: hidden;

    .tech-lines {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
      opacity: 0.1;

      .line {
        position: absolute;
        height: 1px;
        width: 100%;
        background: linear-gradient(90deg, transparent, #6366f1, transparent);
        animation: scan-line 3s linear infinite;

        @for $i from 1 through 5 {
          &:nth-child(#{$i}) {
            top: #{$i * 20}%;
            animation-delay: #{$i * 0.5}s;
          }
        }
      }
    }

    .welcome-text {
      position: relative;
      z-index: 1;

      h1 {
        font-size: 48px;
        font-weight: 800;
        margin: 0 0 16px 0;
        background: linear-gradient(135deg, #6366f1 0%, #14b8a6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: text-glow 3s ease-in-out infinite;
      }

      p {
        font-size: 18px;
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
      }
    }
  }

  // 右侧表单
  .login-form-section {
    flex: 1;
    padding: 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);

    .form-header {
      text-align: center;
      margin-bottom: 40px;

      .logo-container {
        position: relative;
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;

        .logo-orb {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #6366f1, #14b8a6);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
          z-index: 1;
          animation: logo-float 3s ease-in-out infinite;
        }

        .logo-ring {
          position: absolute;
          inset: -8px;
          border: 2px solid transparent;
          border-radius: 24px;
          background: linear-gradient(135deg, #6366f1, #14b8a6) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: rotate 4s linear infinite;
        }
      }

      h2 {
        margin: 0 0 8px 0;
        font-size: 28px;
        color: white;
      }

      p {
        margin: 0;
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .login-form {
      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;

        .input-icon {
          position: absolute;
          left: 16px;
          color: rgba(255, 255, 255, 0.4);
          z-index: 1;
          font-size: 20px;
        }

        :deep(.el-input) {
          .el-input__wrapper {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.1);
            padding-left: 48px;
            border-radius: 12px;
            transition: all 0.3s ease;

            &:hover {
              background: rgba(255, 255, 255, 0.08);
              border-color: rgba(255, 255, 255, 0.2);
            }

            &.is-focus {
              background: rgba(255, 255, 255, 0.1);
              border-color: #6366f1;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
          }

          .el-input__inner {
            color: white;
            font-size: 16px;

            &::placeholder {
              color: rgba(255, 255, 255, 0.3);
            }
          }

          .el-input__suffix {
            color: rgba(255, 255, 255, 0.4);
          }
        }
      }

      .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;

        .remember-me {
          :deep(.el-checkbox__label) {
            color: rgba(255, 255, 255, 0.6);
          }

          :deep(.el-checkbox__inner) {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
          }

          :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
            background: #6366f1;
            border-color: #6366f1;
          }
        }

        .el-link {
          color: #6366f1;
        }
      }

      .login-btn {
        width: 100%;
        height: 48px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 12px;
        background: linear-gradient(135deg, #6366f1, #14b8a6);
        border: none;
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.5);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }
      }
    }

    .divider {
      position: relative;
      text-align: center;
      margin: 32px 0;

      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
      }

      span {
        position: relative;
        padding: 0 16px;
        background: rgba(20, 20, 30, 1);
        color: rgba(255, 255, 255, 0.4);
        font-size: 14px;
      }
    }

    .quick-login {
      display: flex;
      gap: 12px;
      margin-bottom: 32px;

      .quick-login-btn {
        flex: 1;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .el-icon {
          font-size: 20px;
        }
      }
    }

    .register-link {
      text-align: center;
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;

      .el-link {
        margin-left: 4px;
      }
    }
  }
}

// 浮动装饰
.floating-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;

  .shape {
    position: absolute;
    border: 2px solid rgba(99, 102, 241, 0.3);
    border-radius: 50%;
    animation: float-shape 15s ease-in-out infinite;

    &.shape-1 {
      width: 100px;
      height: 100px;
      top: 10%;
      left: 10%;
    }

    &.shape-2 {
      width: 60px;
      height: 60px;
      top: 70%;
      left: 80%;
      animation-delay: -5s;
    }

    &.shape-3 {
      width: 80px;
      height: 80px;
      top: 30%;
      right: 10%;
      animation-delay: -10s;
    }
  }
}

// 动画
@keyframes float-orb {
  0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
  33% { transform: translate(30px, -30px) scale(1.1) rotate(120deg); }
  66% { transform: translate(-20px, 20px) scale(0.9) rotate(240deg); }
}

@keyframes grid-move {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

@keyframes card-entrance {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes scan-line {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes text-glow {
  0%, 100% { filter: brightness(1) drop-shadow(0 0 20px rgba(99, 102, 241, 0.5)); }
  50% { filter: brightness(1.2) drop-shadow(0 0 30px rgba(99, 102, 241, 0.8)); }
}

@keyframes logo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float-shape {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(20px, -20px) rotate(90deg); }
  50% { transform: translate(-10px, 10px) rotate(180deg); }
  75% { transform: translate(-20px, -10px) rotate(270deg); }
}

// 响应式
@media (max-width: 968px) {
  .login-card {
    width: 90%;
    max-width: 450px;
    height: auto;
    flex-direction: column;

    .card-decoration {
      display: none;
    }

    .login-form-section {
      padding: 40px 30px;
    }
  }
}

// 错误提示样式
:deep(.el-form-item__error) {
  color: #f56c6c;
  font-size: 12px;
  padding-top: 4px;
}

// Loading 状态
:deep(.el-loading-mask) {
  background-color: rgba(0, 0, 0, 0.8);

  .el-loading-spinner {
    .circular {
      animation-duration: 2s;
    }
  }
}
</style>