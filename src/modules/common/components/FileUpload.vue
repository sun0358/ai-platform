<template>
  <div class="file-upload-ai-style">
    <BaseUploader
        v-if="!modelValue"
        v-model="internalFile"
        :accept="accept"
        :max-size="maxSize"
        @change="handleFileChange"
    >
      <div class="upload-area">
        <el-icon class="upload-icon" :size="iconSize"><component :is="fileIcon" /></el-icon>
        <div class="upload-text">
          <h3 v-if="title">{{ title }}</h3>
          <p v-if="description">{{ description }}</p>
        </div>
      </div>
    </BaseUploader>

    <div v-else class="preview-card animate-fade-in">
      <div class="file-info-bar">
        <div class="file-details">
          <el-icon class="file-icon" :size="32"><component :is="getIconByFileName(modelValue.name)" /></el-icon>
          <div class="file-meta">
            <h4 class="file-name">{{ modelValue.name }}</h4>
            <p class="file-size">{{ formatFileSize(modelValue.size) }}</p>
          </div>
        </div>
        <el-button @click="handleRemove" type="danger" text>
          <el-icon><Delete /></el-icon>
          <span>移除</span>
        </el-button>
      </div>
      <div v-if="$slots.extra" class="extra-content">
        <slot name="extra"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Delete, Document, UploadFilled, Tickets, Service } from '@element-plus/icons-vue';
import BaseUploader from './BaseUploader.vue'; // 引入底层发动机

interface Props {
  modelValue: File | null;
  accept?: string;
  maxSize?: number;
  title?: string;
  description?: string;
  fileIcon?: string;
  iconSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  accept: '*',
  maxSize: 10,
  fileIcon: 'UploadFilled',
  iconSize: 60,
});

const emit = defineEmits<{
  'update:modelValue': [file: File | null];
  'change': [file: File | null];
}>();

// internalFile 仅用于与BaseUploader交互，实际状态由props.modelValue驱动
const internalFile = ref<File | null>(null);

const handleFileChange = (file: File | null) => {
  emit('update:modelValue', file);
  emit('change', file);
};

const handleRemove = () => {
  handleFileChange(null);
};

// 辅助函数
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getIconByFileName = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return Tickets;
  if (['doc', 'docx'].includes(ext)) return Document;
  if (['pdf'].includes(ext)) return Service;
  return Document;
};
</script>

<style lang="scss" scoped>
@use '@/styles/mixins' as mixins;
@use '@/styles/animations.scss';

.file-upload-ai-style {
  .upload-area {
    @include mixins.upload-area;

    // 确保主题颜色正确应用
    background: var(--ai-glass-bg);
    border-color: var(--ai-border);
    color: var(--ai-text-primary);

    &:hover {
      border-color: var(--ai-primary);
      background: var(--ai-glass-bg);

      .upload-icon {
        color: var(--ai-primary);
      }
    }
  }

  .upload-icon {
    color: var(--ai-primary);
    margin-bottom: 16px;
    transition: all 0.3s ease;
  }

  .upload-text {
    text-align: center;

    h3 {
      font-size: 18px;
      color: var(--ai-text-primary);
      margin: 0 0 8px;
    }

    p {
      font-size: 14px;
      color: var(--ai-text-secondary);
      margin: 0;
    }
  }

  .preview-card {
    @include mixins.ai-card;
    padding: 20px;
    background: var(--ai-card-bg);
    border: 1px solid var(--ai-border);

    .file-info-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .file-details {
      display: flex;
      align-items: center;
      gap: 16px;

      .file-icon {
        color: var(--ai-primary);
      }

      .file-meta {
        .file-name {
          @include mixins.text-ellipsis;
          max-width: 400px;
          margin: 0;
          font-size: 16px;
          color: var(--ai-text-primary);
        }

        .file-size {
          margin: 4px 0 0;
          font-size: 12px;
          color: var(--ai-text-secondary);
        }
      }
    }

    .extra-content {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--ai-border);
    }
  }
}
</style>