<template>
  <div class="stats-group" :class="{ 'stats-group--compact': compact }">
    <div
        v-for="stat in stats"
        :key="stat.id || stat.label"
        class="stat-card"
        :class="{ 'stat-card--clickable': stat.onClick }"
        @click="stat.onClick?.()"
    >
      <div
          class="stat-icon"
          :style="{ background: stat.color || getDefaultColor(stat.type) }"
      >
        <el-icon :size="iconSize">
          <component :is="stat.icon" />
        </el-icon>
      </div>
      <div class="stat-info">
        <h3 class="stat-value">
          <animated-number
              v-if="stat.animated !== false"
              :value="stat.value"
              :decimals="stat.decimals || 0"
          />
          <span v-else>{{ stat.value }}</span>
          <span v-if="stat.suffix" class="stat-suffix">{{ stat.suffix }}</span>
        </h3>
        <p class="stat-label">{{ stat.label }}</p>
        <div v-if="stat.trend !== undefined" class="stat-trend" :class="getTrendClass(stat.trend)">
          <el-icon><component :is="stat.trend > 0 ? 'Top' : 'Bottom'" /></el-icon>
          <span>{{ Math.abs(stat.trend) }}%</span>
        </div>
      </div>
      <div v-if="stat.extra" class="stat-extra">
        {{ stat.extra }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AnimatedNumber from './AnimatedNumber.vue'

interface StatItem {
  id?: string
  label: string
  value: number | string
  icon: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  color?: string
  suffix?: string
  decimals?: number
  animated?: boolean
  trend?: number
  extra?: string
  onClick?: () => void
}

interface Props {
  stats: StatItem[]
  compact?: boolean
  iconSize?: number
}

withDefaults(defineProps<Props>(), {
  compact: false,
  iconSize: 32
})

const getDefaultColor = (type?: string) => {
  const colors: Record<string, string> = {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  }
  return colors[type || 'primary']
}

const getTrendClass = (trend: number) => {
  return trend > 0 ? 'trend-up' : 'trend-down'
}
</script>

<style lang="scss" scoped>
.stats-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;

  &--compact {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;

    .stat-card {
      padding: 16px;
    }
  }

  .stat-card {
    background: var(--ai-card-bg);
    border: 1px solid var(--ai-border);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    transition: all 0.3s ease;

    &--clickable {
      cursor: pointer;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      }
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .stat-info {
      flex: 1;

      .stat-value {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: var(--ai-text-primary);
        display: flex;
        align-items: baseline;
        gap: 4px;

        .stat-suffix {
          font-size: 18px;
          font-weight: 400;
          color: var(--ai-text-secondary);
        }
      }

      .stat-label {
        margin: 4px 0 0 0;
        color: var(--ai-text-secondary);
        font-size: 14px;
      }

      .stat-trend {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-top: 8px;
        font-size: 14px;

        &.trend-up {
          color: var(--ai-success);
        }

        &.trend-down {
          color: var(--ai-error);
        }
      }
    }

    .stat-extra {
      font-size: 12px;
      color: var(--ai-text-muted);
    }
  }
}
</style>