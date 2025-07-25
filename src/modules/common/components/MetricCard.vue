<template>
  <div class="metric-card" :class="`metric-card--${type}`">
    <div class="metric-card__icon">
      <el-icon :size="32"><component :is="icon" /></el-icon>
    </div>

    <div class="metric-card__content">
      <h4 class="metric-card__label">{{ label }}</h4>
      <div class="metric-card__value">
        <animated-number :value="value" :decimals="decimals" />
        <span class="metric-card__suffix" v-if="suffix">{{ suffix }}</span>
      </div>

      <div class="metric-card__trend" v-if="trend">
        <el-icon :class="trend > 0 ? 'trend-up' : 'trend-down'">
          <component :is="trend > 0 ? 'TrendCharts' : 'Bottom'" />
        </el-icon>
        <span>{{ Math.abs(trend) }}%</span>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="metric-card__bg-decoration"></div>

    <!-- 悬浮提示 -->
    <el-tooltip
        v-if="tooltip"
        :content="tooltip"
        placement="top"
        effect="light"
    >
      <el-icon class="metric-card__info"><InfoFilled /></el-icon>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { InfoFilled, TrendCharts, Bottom } from '@element-plus/icons-vue'
import AnimatedNumber from './AnimatedNumber.vue'

interface Props {
  label: string
  value: number
  icon: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  suffix?: string
  decimals?: number
  trend?: number
  tooltip?: string
}

withDefaults(defineProps<Props>(), {
  type: 'primary',
  decimals: 0
})
</script>

<style lang="scss" scoped>
.metric-card {
  position: relative;
  padding: 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.08);

    .metric-card__bg-decoration {
      transform: scale(1.2) rotate(15deg);
    }
  }

  &--primary {
    .metric-card__icon { color: var(--ai-primary); }
    .metric-card__bg-decoration { background: var(--ai-primary); }
  }

  &--success {
    .metric-card__icon { color: var(--ai-success); }
    .metric-card__bg-decoration { background: var(--ai-success); }
  }

  &--warning {
    .metric-card__icon { color: var(--ai-warning); }
    .metric-card__bg-decoration { background: var(--ai-warning); }
  }

  &--danger {
    .metric-card__icon { color: var(--ai-error); }
    .metric-card__bg-decoration { background: var(--ai-error); }
  }

  &__icon {
    margin-bottom: 16px;
  }

  &__label {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: var(--ai-text-secondary);
    font-weight: 400;
  }

  &__value {
    font-size: 32px;
    font-weight: 700;
    color: var(--ai-text-primary);
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  &__suffix {
    font-size: 18px;
    font-weight: 400;
    color: var(--ai-text-secondary);
  }

  &__trend {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;

    &.trend-up {
      color: var(--ai-success);
    }

    &.trend-down {
      color: var(--ai-error);
    }
  }

  &__bg-decoration {
    position: absolute;
    top: -50%;
    right: -30%;
    width: 150%;
    height: 150%;
    opacity: 0.05;
    border-radius: 50%;
    transition: transform 0.5s ease;
    pointer-events: none;
  }

  &__info {
    position: absolute;
    top: 12px;
    right: 12px;
    color: var(--ai-text-muted);
    cursor: help;
  }
}
</style>