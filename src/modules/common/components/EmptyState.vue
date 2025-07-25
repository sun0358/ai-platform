<template>
  <div class="empty-state" :style="{ minHeight: minHeight + 'px' }">
    <div class="empty-content">
      <el-icon :size="iconSize" :style="{ color: iconColor }">
        <component :is="icon || 'InfoFilled'" />
      </el-icon>
      <h4 v-if="title">{{ title }}</h4>
      <p>{{ description }}</p>
      <div v-if="$slots.action" class="empty-action">
        <slot name="action"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string
  iconSize?: number
  iconColor?: string
  title?: string
  description?: string
  minHeight?: number
}

withDefaults(defineProps<Props>(), {
  iconSize: 60,
  iconColor: 'var(--ai-text-muted)',
  description: '暂无数据',
  minHeight: 300
})
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;

  .empty-content {
    text-align: center;

    .el-icon {
      margin-bottom: 16px;
    }

    h4 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: var(--ai-text-primary);
    }

    p {
      margin: 0 0 20px 0;
      color: var(--ai-text-secondary);
    }

    .empty-action {
      margin-top: 20px;
    }
  }
}
</style>