<template>
  <div
      class="ai-card"
      :class="[
      `ai-card--${variant}`,
      { 'ai-card--glow': glow },
      { 'ai-card--interactive': interactive }
    ]"
  >
    <!-- 装饰性光效 -->
    <div class="ai-card__glow-effect" v-if="glow"></div>

    <!-- 头部 -->
    <div class="ai-card__header" v-if="$slots.header || title">
      <div class="ai-card__header-content">
        <h3 v-if="title" class="ai-card__title">
          <el-icon v-if="icon" class="ai-card__icon"><component :is="icon" /></el-icon>
          {{ title }}
        </h3>
        <slot name="header" />
      </div>
      <div class="ai-card__header-actions" v-if="$slots.actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="ai-card__body">
      <slot />
    </div>

    <!-- 底部 -->
    <div class="ai-card__footer" v-if="$slots.footer">
      <slot name="footer" />
    </div>

    <!-- 角标装饰 -->
    <div class="ai-card__corner" v-if="showCorner">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  icon?: string
  variant?: 'default' | 'glass' | 'gradient' | 'neon'
  glow?: boolean
  interactive?: boolean
  showCorner?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'glass',
  glow: false,
  interactive: true,
  showCorner: true
})
</script>

<style lang="scss" scoped>
.ai-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // 默认玻璃态
  &--glass {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  // 渐变风格
  &--gradient {
    background: linear-gradient(135deg,
        rgba(99, 102, 241, 0.1) 0%,
        rgba(20, 184, 166, 0.1) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  // 霓虹风格
  &--neon {
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid var(--ai-primary);
    box-shadow:
        inset 0 0 20px rgba(99, 102, 241, 0.1),
        0 0 20px rgba(99, 102, 241, 0.2);
  }

  // 交互效果
  &--interactive {
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);

      &.ai-card--glass {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
      }

      .ai-card__corner span {
        width: 25px;
        height: 25px;
      }
    }
  }

  // 发光效果
  &--glow {
    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg,
          var(--ai-primary),
          var(--ai-accent),
          var(--ai-primary)
      );
      border-radius: 16px;
      opacity: 0.3;
      filter: blur(10px);
      z-index: -1;
      animation: glow-rotate 3s linear infinite;
    }
  }

  &__glow-effect {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
        transparent,
        var(--ai-primary),
        transparent
    );
    animation: scan 3s linear infinite;
  }

  &__header {
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--ai-text-primary);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__icon {
    font-size: 24px;
    color: var(--ai-primary);
  }

  &__body {
    padding: 24px;
  }

  &__footer {
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.02);
  }

  // 角标装饰
  &__corner {
    span {
      position: absolute;
      width: 20px;
      height: 20px;
      transition: all 0.3s ease;

      &::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 2px;
        background: var(--ai-primary);
      }

      &::after {
        content: '';
        position: absolute;
        width: 2px;
        height: 100%;
        background: var(--ai-primary);
      }

      &:nth-child(1) {
        top: 0;
        left: 0;
        &::before { top: 0; left: 0; }
        &::after { top: 0; left: 0; }
      }

      &:nth-child(2) {
        top: 0;
        right: 0;
        &::before { top: 0; right: 0; }
        &::after { top: 0; right: 0; }
      }

      &:nth-child(3) {
        bottom: 0;
        left: 0;
        &::before { bottom: 0; left: 0; }
        &::after { bottom: 0; left: 0; }
      }

      &:nth-child(4) {
        bottom: 0;
        right: 0;
        &::before { bottom: 0; right: 0; }
        &::after { bottom: 0; right: 0; }
      }
    }
  }
}

@keyframes glow-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>