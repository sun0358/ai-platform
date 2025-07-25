<template>
  <el-dialog
      v-model="visible"
      :title="title"
      :width="width"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @closed="handleClosed"
  >
    <div class="confirm-content">
      <div v-if="icon" class="confirm-icon" :class="`confirm-icon--${type}`">
        <el-icon :size="48"><component :is="icon" /></el-icon>
      </div>
      <div class="confirm-message">
        <h4 v-if="message">{{ message }}</h4>
        <p v-if="description">{{ description }}</p>
        <slot></slot>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">{{ cancelText }}</el-button>
      <el-button
          :type="confirmType"
          :loading="loading"
          @click="handleConfirm"
      >
        {{ confirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  message?: string
  description?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  icon?: string
  width?: string
  confirmText?: string
  cancelText?: string
  confirmType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  beforeConfirm?: () => Promise<boolean> | boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '提示',
  type: 'info',
  width: '420px',
  confirmText: '确定',
  cancelText: '取消',
  confirmType: 'primary'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const visible = ref(false)
const loading = ref(false)

// 监听外部值变化
watch(() => props.modelValue, (val) => {
  visible.value = val
})

// 监听内部值变化
watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 根据类型自动设置图标
const defaultIcon = computed(() => {
  const icons: Record<string, string> = {
    info: 'InfoFilled',
    success: 'CircleCheck',
    warning: 'Warning',
    error: 'CircleClose'
  }
  return props.icon || icons[props.type]
})

const handleConfirm = async () => {
  if (props.beforeConfirm) {
    loading.value = true
    try {
      const result = await props.beforeConfirm()
      if (result !== false) {
        visible.value = false
        emit('confirm')
      }
    } finally {
      loading.value = false
    }
  } else {
    visible.value = false
    emit('confirm')
  }
}

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

const handleClosed = () => {
  loading.value = false
}
</script>

<style lang="scss" scoped>
.confirm-content {
  text-align: center;
  padding: 20px 0;

  .confirm-icon {
    margin-bottom: 20px;

    &--info {
      color: var(--ai-info);
    }

    &--success {
      color: var(--ai-success);
    }

    &--warning {
      color: var(--ai-warning);
    }

    &--error {
      color: var(--ai-error);
    }
  }

  .confirm-message {
    h4 {
      margin: 0 0 12px 0;
      font-size: 18px;
      color: var(--ai-text-primary);
    }

    p {
      margin: 0;
      color: var(--ai-text-secondary);
      line-height: 1.6;
    }
  }
}

// 深色主题适配
:deep(.el-dialog) {
  background: var(--ai-bg-secondary);

  .el-dialog__header {
    border-bottom: 1px solid var(--ai-border);
  }

  .el-dialog__title {
    color: var(--ai-text-primary);
  }

  .el-dialog__footer {
    border-top: 1px solid var(--ai-border);
  }
}
</style>