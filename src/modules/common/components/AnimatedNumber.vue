<!-- src/modules/common/components/AnimatedNumber.vue -->

<template>
  <span class="animated-number">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface Props {
  value: number
  decimals?: number
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  decimals: 0,
  duration: 1000
})

const displayValue = ref(0)

const animateValue = (start: number, end: number) => {
  const startTime = Date.now()
  const endTime = startTime + props.duration

  const update = () => {
    const now = Date.now()
    const progress = Math.min((now - startTime) / props.duration, 1)

    // 使用缓动函数
    const easeOutQuart = 1 - Math.pow(1 - progress, 4)
    const current = start + (end - start) * easeOutQuart

    displayValue.value = parseFloat(current.toFixed(props.decimals))

    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }

  requestAnimationFrame(update)
}

watch(() => props.value, (newVal, oldVal) => {
  animateValue(oldVal || 0, newVal)
})

onMounted(() => {
  animateValue(0, props.value)
})
</script>

<style scoped>
.animated-number {
  display: inline-block;
  font-variant-numeric: tabular-nums;
}
</style>