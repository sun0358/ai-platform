<template>
  <div class="file-upload-component">
    <div
        class="upload-area"
        :class="{ 'has-file': hasFile, 'is-dragging': isDragging }"
        @click="!hasFile && selectFile()"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
    >
      <!-- 上传占位符 -->
      <div v-if="!hasFile" class="upload-placeholder">
        <el-icon :size="iconSize"><component :is="uploadIcon || 'UploadFilled'" /></el-icon>
        <h4>{{ title || '拖拽文件到此处' }}</h4>
        <p>{{ description || '或点击选择文件' }}</p>
        <div v-if="showFormats && acceptFormats.length > 0" class="file-formats">
          <el-tag v-for="format in acceptFormats" :key="format" size="small">
            {{ format }}
          </el-tag>
        </div>
      </div>

      <!-- 文件信息 -->
      <div v-else class="file-info">
        <div class="file-icon">
          <el-icon :size="48"><component :is="fileIcon || 'Document'" /></el-icon>
        </div>
        <div class="file-details">
          <h4>{{ fileName }}</h4>
          <div class="file-meta">
            <span>{{ formatFileSize(fileSize) }}</span>
            <span v-if="$slots.meta"><slot name="meta"></slot></span>
          </div>
        </div>
        <el-button type="danger" circle @click.stop="removeFile">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        style="display: none"
        @change="handleFileSelect"
    />

    <!-- 额外内容插槽 -->
    <div v-if="$slots.extra" class="upload-extra">
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document, Delete } from '@element-plus/icons-vue'

interface Props {
  accept?: string
  multiple?: boolean
  maxSize?: number // MB
  title?: string
  description?: string
  uploadIcon?: string
  fileIcon?: string
  iconSize?: number
  showFormats?: boolean
  formats?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  accept: '*',
  multiple: false,
  maxSize: 10,
  iconSize: 60,
  showFormats: true,
  formats: () => []
})

const emit = defineEmits<{
  change: [files: File | File[] | null]
  remove: []
}>()

// 响应式数据
const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const uploadedFile = ref<File | null>(null)
const uploadedFiles = ref<File[]>([])

// 计算属性
const hasFile = computed(() => props.multiple ? uploadedFiles.value.length > 0 : !!uploadedFile.value)
const fileName = computed(() => uploadedFile.value?.name || '多个文件')
const fileSize = computed(() => uploadedFile.value?.size || 0)
const acceptFormats = computed(() => {
  if (props.formats.length > 0) return props.formats
  if (!props.accept || props.accept === '*') return []
  return props.accept.split(',').map(ext => ext.trim().replace('.', '').toUpperCase())
})

// 方法
const selectFile = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files) {
    processFiles(files)
  }
}

const handleDragOver = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files) {
    processFiles(files)
  }
}

const processFiles = (files: FileList) => {
  // 验证文件
  for (const file of Array.from(files)) {
    if (props.maxSize && file.size > props.maxSize * 1024 * 1024) {
      ElMessage.error(`文件 ${file.name} 大小超过 ${props.maxSize}MB`)
      return
    }
  }

  if (props.multiple) {
    uploadedFiles.value = Array.from(files)
    emit('change', uploadedFiles.value)
  } else {
    uploadedFile.value = files[0]
    emit('change', uploadedFile.value)
  }
}

const removeFile = () => {
  uploadedFile.value = null
  uploadedFiles.value = []
  emit('remove')
  emit('change', null)

  // 重置input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 暴露方法
defineExpose({
  selectFile,
  removeFile
})
</script>

<style lang="scss" scoped>
.file-upload-component {
  width: 100%;

  .upload-area {
    position: relative;
    min-height: 200px;
    background: var(--ai-bg-tertiary);
    border: 2px dashed var(--ai-border);
    border-radius: 12px;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover:not(.has-file) {
      border-color: var(--ai-primary);
      background: var(--ai-card-bg-hover);
    }

    &.is-dragging {
      border-color: var(--ai-primary);
      background: rgba(99, 102, 241, 0.1);
    }

    &.has-file {
      border-style: solid;
      cursor: default;
    }

    .upload-placeholder {
      height: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;

      .el-icon {
        color: var(--ai-primary);
        margin-bottom: 16px;
      }

      h4 {
        margin: 0 0 8px 0;
        color: var(--ai-text-primary);
      }

      p {
        margin: 0 0 16px 0;
        color: var(--ai-text-secondary);
      }

      .file-formats {
        display: flex;
        gap: 8px;
        justify-content: center;
      }
    }

    .file-info {
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;

      .file-icon {
        width: 64px;
        height: 64px;
        background: rgba(99, 102, 241, 0.1);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--ai-primary);
      }

      .file-details {
        flex: 1;

        h4 {
          margin: 0 0 8px 0;
          color: var(--ai-text-primary);
        }

        .file-meta {
          display: flex;
          gap: 16px;
          color: var(--ai-text-muted);
          font-size: 14px;
        }
      }
    }
  }

  .upload-extra {
    margin-top: 16px;
  }
}
</style>