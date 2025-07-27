<template>
  <div class="page-header">
    <div class="header-content">
      <h1 class="page-title">
        <el-icon v-if="icon" :size="titleIconSize"><component :is="icon" /></el-icon>
        {{ title }}
      </h1>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="header-actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  icon?: string
  titleIconSize?: number
}

withDefaults(defineProps<Props>(), {
  titleIconSize: 32
})
</script>

<style lang="scss" scoped>
.page-header {
  width: 100%; // 添加100%宽度
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid var(--ai-border);

  .header-content {
    .page-title {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: var(--ai-text-primary);
      display: flex;
      align-items: center;
      gap: 12px;

      .el-icon {
        color: var(--ai-primary);
      }
    }

    .page-subtitle {
      margin: 8px 0 0 0;
      font-size: 16px;
      color: var(--ai-text-secondary);
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}
</style>