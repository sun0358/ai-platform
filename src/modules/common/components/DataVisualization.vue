<template>
  <div class="data-viz">
    <div class="data-viz__header" v-if="title || $slots.header">
      <h3 v-if="title">{{ title }}</h3>
      <slot name="header" />
    </div>

    <div class="data-viz__content">
      <v-chart
          ref="chartRef"
          :option="chartOption"
          :style="{ height: height + 'px' }"
          :theme="theme"
          autoresize
      />
    </div>

    <div class="data-viz__footer" v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import {
  LineChart,
  BarChart,
  RadarChart,
  PieChart,
  ScatterChart
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent,
  PolarComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  RadarChart,
  PieChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent,
  PolarComponent
])

interface Props {
  type: 'line' | 'bar' | 'radar' | 'pie' | 'scatter' | 'custom'
  data: any
  title?: string
  height?: number
  theme?: 'dark' | 'light'
  options?: any
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  theme: 'dark'
})

const chartRef = ref()

// AI主题配色
const aiTheme = {
  color: [
    '#6366f1',
    '#14b8a6',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#10b981',
    '#3b82f6'
  ],
  backgroundColor: 'transparent',
  textStyle: {
    color: '#f1f5f9'
  },
  title: {
    textStyle: {
      color: '#f1f5f9'
    }
  },
  legend: {
    textStyle: {
      color: '#cbd5e1'
    }
  },
  tooltip: {
    backgroundColor: 'rgba(15, 15, 35, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textStyle: {
      color: '#f1f5f9'
    }
  }
}

// 生成图表配置
const chartOption = computed(() => {
  const baseConfig = {
    ...aiTheme,
    tooltip: {
      ...aiTheme.tooltip,
      trigger: props.type === 'pie' ? 'item' : 'axis'
    },
    legend: {
      ...aiTheme.legend,
      top: 'bottom'
    }
  }

  // 自定义配置
  if (props.type === 'custom') {
    return { ...baseConfig, ...props.options }
  }

  // 预设图表类型
  switch (props.type) {
    case 'radar':
      return {
        ...baseConfig,
        radar: {
          indicator: props.data.indicator,
          axisName: {
            color: '#cbd5e1'
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          splitArea: {
            areaStyle: {
              color: ['rgba(99, 102, 241, 0.05)', 'rgba(99, 102, 241, 0.1)']
            }
          }
        },
        series: [{
          type: 'radar',
          data: props.data.series,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2
          },
          areaStyle: {
            opacity: 0.3
          }
        }]
      }

    case 'bar':
      return {
        ...baseConfig,
        xAxis: {
          type: 'category',
          data: props.data.categories,
          axisLine: {
            lineStyle: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          axisLabel: {
            color: '#cbd5e1'
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            lineStyle: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          splitLine: {
            lineStyle: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          axisLabel: {
            color: '#cbd5e1'
          }
        },
        series: props.data.series.map((s: any) => ({
          ...s,
          type: 'bar',
          barWidth: '60%',
          itemStyle: {
            borderRadius: [4, 4, 0, 0]
          }
        }))
      }

    default:
      return baseConfig
  }
})

// 暴露方法
defineExpose({
  refresh: () => chartRef.value?.refresh(),
  getChart: () => chartRef.value?.chart
})
</script>

<style lang="scss" scoped>
.data-viz {
  &__header {
    margin-bottom: 16px;

    h3 {
      margin: 0;
      font-size: 16px;
      color: var(--ai-text-primary);
    }
  }

  &__content {
    position: relative;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  &__footer {
    margin-top: 16px;
  }
}
</style>