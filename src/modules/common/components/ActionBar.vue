<!-- src/modules/common/components/ActionBar.vue -->
<template>
  <div class="action-bar" :class="[`action-bar--${align}`, customClass]">
    <div class="action-bar__left" v-if="$slots.left || title">
      <h3 v-if="title" class="action-bar__title">
        <el-icon v-if="icon" :size="20"><component :is="icon" /></el-icon>
        {{ title }}
      </h3>
      <slot name="left"></slot>
    </div>

    <div class="action-bar__center" v-if="$slots.center">
      <slot name="center"></slot>
    </div>

    <div class="action-bar__right" v-if="$slots.right || actions.length > 0">
      <slot name="right">
        <el-button
            v-for="action in actions"
            :key="action.key || action.text"
            :type="action.type || 'default'"
            :size="action.size || size"
            :icon="action.icon"
            :loading="action.loading"
            :disabled="action.disabled"
            :plain="action.plain"
            :round="action.round"
            @click="handleAction(action)"
        >
          {{ action.text }}
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ActionItem {
  key?: string
  text: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  size?: 'large' | 'default' | 'small'
  icon?: string
  loading?: boolean
  disabled?: boolean
  plain?: boolean
  round?: boolean
  handler?: () => void
}

interface Props {
  title?: string
  icon?: string
  actions?: ActionItem[]
  align?: 'left' | 'center' | 'between' | 'end'
  size?: 'large' | 'default' | 'small'
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  actions: () => [],
  align: 'between',
  size: 'default'
})

const emit = defineEmits<{
  action: [action: ActionItem]
}>()

const handleAction = (action: ActionItem) => {
  if (action.handler) {
    action.handler()
  }
  emit('action', action)
}
</script>

<style lang="scss" scoped>
.action-bar {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: var(--ai-card-bg);
  border-radius: 12px;
  border: 1px solid var(--ai-border);

  &--left {
    justify-content: flex-start;
  }

  &--center {
    justify-content: center;
  }

  &--between {
    justify-content: space-between;
  }

  &--end {
    justify-content: flex-end;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--ai-text-primary);
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon {
      color: var(--ai-primary);
    }
  }

  &__left,
  &__center,
  &__right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__left {
    flex: 1;
  }

  &__center {
    flex: 0 0 auto;
  }

  &__right {
    flex: 0 0 auto;
  }
}

// 响应式处理
@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    &__left,
    &__center,
    &__right {
      width: 100%;
      justify-content: center;
    }

    &--between,
    &--end {
      &__right {
        justify-content: center;
      }
    }
  }
}
</style>