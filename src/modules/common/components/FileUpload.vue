<template>
  <div class="file-upload-container">
    <el-upload
      v-model:file-list="fileList"
      class="upload-demo"
      drag
      :accept="accept"
      :multiple="false"
      :auto-upload="false"
      :on-change="handleChange"
      :on-remove="handleRemove"
      :before-upload="beforeUpload"
      :limit="1"
    >
      <div class="upload-content">
        <el-icon class="upload-icon" :size="iconSize || 60">
          <component :is="fileIcon || 'UploadFilled'" />
        </el-icon>
        <div class="upload-text">
          <h3 v-if="title">{{ title }}</h3>
          <p v-if="description">{{ description }}</p>
        </div>
      </div>
    </el-upload>

    <!-- 文件预览区域 -->
    <div v-if="uploadedFile" class="file-preview fade-slide">
      <div class="file-info">
        <el-icon class="file-icon"><component :is="getFileIcon(uploadedFile.name)" /></el-icon>
        <div class="file-details">
          <h4>{{ uploadedFile.name }}</h4>
          <p>{{ formatFileSize(uploadedFile.size) }}</p>
        </div>
        <el-button @click="removeFile" type="danger" text class="remove-btn">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>

      <!-- 图片预览 -->
      <div v-if="isImage(uploadedFile.name)" class="image-preview">
        <img :src="previewUrl" :alt="uploadedFile.name" />
      </div>
    </div>

    <!-- 额外内容插槽 -->
    <div v-if="uploadedFile && $slots.extra" class="extra-content fade-slide">
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { UploadFile, UploadFiles } from 'element-plus'
import { ElMessage } from 'element-plus'
import { UploadFilled, DocumentCopy, Picture, Delete } from '@element-plus/icons-vue'

interface Props {
  modelValue?: File | null
  accept?: string
  maxSize?: number // MB
  title?: string
  description?: string
  fileIcon?: string
  iconSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  accept: '*',
  maxSize: 10,
  fileIcon: 'UploadFilled',
  iconSize: 60
})

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
  'change': [file: File | null]
}>()

const fileList = ref<UploadFiles>([])
const uploadedFile = ref<File | null>(null)
const previewUrl = ref<string>('')

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== uploadedFile.value) {
    uploadedFile.value = newValue
    if (newValue && isImage(newValue.name)) {
      previewUrl.value = URL.createObjectURL(newValue)
    }
  }
}, { immediate: true })

const handleChange = (file: UploadFile, files: UploadFiles) => {
  const rawFile = file.raw
  if (rawFile) {
    uploadedFile.value = rawFile

    // 如果是图片，创建预览URL
    if (isImage(rawFile.name)) {
      previewUrl.value = URL.createObjectURL(rawFile)
    }

    emit('update:modelValue', rawFile)
    emit('change', rawFile)
  }
}

const handleRemove = () => {
  removeFile()
}

const removeFile = () => {
  uploadedFile.value = null
  fileList.value = []
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  emit('update:modelValue', null)
  emit('change', null)
}

const beforeUpload = (file: File) => {
  // 检查文件大小
  if (file.size / 1024 / 1024 > props.maxSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }

  // 检查文件类型
  if (props.accept !== '*') {
    const acceptTypes = props.accept.split(',').map(type => type.trim())
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    const isAccepted = acceptTypes.some(type =>
      type === fileExtension ||
      type === file.type ||
      (type.includes('*') && file.type.startsWith(type.replace('*', '')))
    )

    if (!isAccepted) {
      ElMessage.error(`不支持的文件格式，请上传 ${props.accept} 格式的文件`)
      return false
    }
  }

  return true
}

const isImage = (filename: string) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
  const extension = '.' + filename.split('.').pop()?.toLowerCase()
  return imageExtensions.includes(extension)
}

const getFileIcon = (filename: string) => {
  if (isImage(filename)) {
    return 'Picture'
  }
  const extension = filename.split('.').pop()?.toLowerCase()
  if (['xlsx', 'xls'].includes(extension || '')) {
    return 'DocumentCopy'
  }
  return 'Document'
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped lang="scss">
@import '@/styles/mixins.scss';
@import '@/styles/animations.scss';

.file-upload-container {
  width: 100%;

  .upload-demo {
    width: 100%;

    :deep(.el-upload-dragger) {
      @include upload-area;
      width: 100%;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;

    .upload-icon {
      color: var(--ai-primary);
      margin-bottom: 16px;
      transition: all 0.3s ease;
    }

    .upload-text {
      text-align: center;

      h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 500;
        color: var(--ai-text-primary);
      }

      p {
        margin: 0;
        font-size: 14px;
        color: var(--ai-text-secondary);
      }
    }
  }

  .file-preview {
    @include ai-card;
    margin-top: 16px;

    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .file-icon {
        color: var(--ai-primary);
        font-size: 24px;
      }

      .file-details {
        flex: 1;

        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: var(--ai-text-primary);
          @include text-ellipsis;
        }

        p {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: var(--ai-text-secondary);
        }
      }

      .remove-btn {
        color: var(--ai-error);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(239, 68, 68, 0.1);
          transform: scale(1.1);
        }
      }
    }

    .image-preview {
      text-align: center;
      border-radius: 8px;
      overflow: hidden;
      background: var(--ai-bg-tertiary);

      img {
        max-width: 100%;
        max-height: 200px;
        border-radius: 8px;
        object-fit: contain;
        transition: transform 0.3s ease;

        &:hover {
          transform: scale(1.02);
        }
      }
    }
  }

  .extra-content {
    margin-top: 16px;
  }

  // 上传区域悬停效果增强
  .upload-demo:hover {
    .upload-icon {
      color: var(--ai-primary-light);
      transform: scale(1.1);
    }
  }
}

// 深色主题特定样式
html.dark .file-upload-container {
  .upload-content .upload-text {
    h3, p {
      color: var(--ai-text-primary);
    }
  }
}

// 浅色主题特定样式
html.light .file-upload-container {
  .upload-content .upload-text {
    h3 {
      color: var(--ai-text-primary);
    }
    p {
      color: var(--ai-text-secondary);
    }
  }
}
</style>