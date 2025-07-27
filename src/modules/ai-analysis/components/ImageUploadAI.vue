<template>
  <div class="image-upload-ai" :class="{ compact: compact }">
    <BaseUploader
        ref="baseUploaderRef"
        v-model="internalFile"
        :accept="accept"
        :max-size="maxSize"
        @change="handleFileChange"
    >
      <div class="image-upload-area">
        <div v-if="!previewUrl" class="placeholder">
          <el-icon :size="compact ? 32 : 50"><Picture /></el-icon>
          <div v-if="!compact" class="text">{{ placeholder || '上传图片' }}</div>
        </div>
        <div v-else class="image-preview">
          <img :src="previewUrl" alt="Preview" />
          <div class="overlay">
            <el-button circle type="primary" @click.stop="viewerVisible = true"><el-icon><View /></el-icon></el-button>
            <el-button circle type="danger" @click.stop="handleRemove"><el-icon><Delete /></el-icon></el-button>
          </div>
        </div>
      </div>
    </BaseUploader>

    <el-dialog v-model="viewerVisible" width="80%" :title="placeholder" append-to-body>
      <img :src="previewUrl" style="max-width: 100%; display: block; margin: 0 auto;" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Picture, View, Delete } from '@element-plus/icons-vue';
import BaseUploader from '@/modules/common/components/BaseUploader.vue';

interface Props {
  modelValue: string | null;
  placeholder?: string;
  compact?: boolean;
  maxSize?: number;
  accept?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  compact: false,
  maxSize: 10,
  accept: 'image/*'
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null],
  'change': [file: File | null]
}>();

// 获取 BaseUploader 的引用
const baseUploaderRef = ref<InstanceType<typeof BaseUploader>>();
const internalFile = ref<File | null>(null);
const previewUrl = ref<string | null>(props.modelValue);
const viewerVisible = ref(false);

// 监听外部 modelValue 的变化
watch(() => props.modelValue, (newVal) => {
  previewUrl.value = newVal;
  if (!newVal) {
    internalFile.value = null;
    // 确保清空 BaseUploader 的内部状态
    baseUploaderRef.value?.clearFiles();
  }
});

const handleFileChange = (file: File | null) => {
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target?.result as string;
      previewUrl.value = base64;
      emit('update:modelValue', base64);
      emit('change', file);
    };
    reader.readAsDataURL(file);
  } else {
    // 删除图片时，完全清空所有状态
    previewUrl.value = null;
    internalFile.value = null;
    emit('update:modelValue', null);
    emit('change', null);
    // 清空上传组件的内部文件列表
    baseUploaderRef.value?.clearFiles();
  }
};

const handleRemove = () => {
  // 确保完全清空状态
  handleFileChange(null);
};

// 暴露清空方法供外部调用
defineExpose({
  clear: () => {
    handleFileChange(null);
  }
});
</script>

<style lang="scss" scoped>
@use '@/styles/mixins' as mixins;

.image-upload-ai {
  width: 100%;
  height: 100%;

  &.compact {
    .image-upload-area {
      min-height: 120px;

      .placeholder {
        .text {
          font-size: 12px;
        }
      }
    }
  }

  .image-upload-area {
    @include mixins.upload-area;
    padding: 0;
    overflow: hidden;
    min-height: 200px;

    // 确保主题颜色正确应用
    background: var(--ai-glass-bg);
    border-color: var(--ai-border);

    &:hover {
      border-color: var(--ai-primary);
      background: var(--ai-glass-bg);
    }

    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: var(--ai-text-secondary);

      .el-icon {
        color: var(--ai-primary);
        margin-bottom: 8px;
        transition: all 0.3s ease;
      }

      .text {
        margin-top: 8px;
        font-size: 14px;
        color: var(--ai-text-secondary);
      }
    }

    .image-preview {
      position: relative;
      width: 100%;
      height: 100%;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
      }

      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 10px;
      }

      &:hover .overlay {
        opacity: 1;
      }
    }

    // Hover状态下图标颜色变化
    &:hover .placeholder .el-icon {
      color: var(--ai-primary-light);
      transform: scale(1.1);
    }
  }
}

// 对话框样式适配主题
:deep(.el-dialog) {
  background: var(--ai-card-bg);
  border: 1px solid var(--ai-border);

  .el-dialog__header {
    background: var(--ai-glass-bg);
    border-bottom: 1px solid var(--ai-border);

    .el-dialog__title {
      color: var(--ai-text-primary);
    }
  }

  .el-dialog__body {
    background: var(--ai-card-bg);
  }
}
</style>