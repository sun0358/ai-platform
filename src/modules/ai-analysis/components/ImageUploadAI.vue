<template>
  <div class="image-upload-ai" :class="{ 'compact': compact }">
    <div
        class="upload-wrapper"
        :class="{ 'has-image': modelValue }"
        @click="handleClick"
        @dragover.prevent
        @drop.prevent="handleDrop"
    >
      <!-- 上传占位符 -->
      <div v-if="!modelValue" class="upload-placeholder">
        <div class="upload-icon">
          <el-icon :size="compact ? 40 : 60">
            <UploadFilled />
          </el-icon>
        </div>
        <div class="upload-text">
          {{ placeholder || '拖拽图片到此处或点击上传' }}
        </div>
        <div class="upload-hint" v-if="!compact">
          支持 JPG、PNG、BMP 格式
        </div>
      </div>

      <!-- 图片预览 -->
      <div v-else class="image-preview">
        <img :src="modelValue" :alt="placeholder" />

        <!-- 悬浮操作层 -->
        <div class="preview-overlay">
          <div class="overlay-actions">
            <el-button
                circle
                type="primary"
                :size="compact ? 'small' : 'default'"
                @click.stop="handleView"
            >
              <el-icon><View /></el-icon>
            </el-button>
            <el-button
                circle
                type="danger"
                :size="compact ? 'small' : 'default'"
                @click.stop="handleRemove"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 加载动画 -->
        <div class="loading-overlay" v-if="loading">
          <el-icon class="loading-icon" :size="40">
            <Loading />
          </el-icon>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleFileChange"
    />

    <!-- 图片查看器 -->
    <el-dialog
        v-model="viewerVisible"
        width="80%"
        :title="placeholder"
        append-to-body
        class="image-viewer-dialog"
    >
      <div class="viewer-content">
        <img :src="modelValue" style="width: 100%;" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  UploadFilled, View, Delete, Loading
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: string
  placeholder?: string
  previewSize?: number
  compact?: boolean
  maxSize?: number // MB
}

const props = withDefaults(defineProps<Props>(), {
  previewSize: 200,
  compact: false,
  maxSize: 10
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [file: File | null]
}>()

const fileInputRef = ref<HTMLInputElement>()
const viewerVisible = ref(false)
const loading = ref(false)

// 点击上传
const handleClick = () => {
  fileInputRef.value?.click()
}

// 文件选择处理
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

// 拖拽处理
const handleDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

// 处理文件
const processFile = async (file: File) => {
  // 检查文件大小
  if (file.size > props.maxSize * 1024 * 1024) {
    ElMessage.error(`图片大小不能超过${props.maxSize}MB`)
    return
  }

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  loading.value = true

  try {
    // 读取文件
    const reader = new FileReader()
    reader.onload = (e) => {
      emit('update:modelValue', e.target?.result as string)
      emit('change', file)
      loading.value = false
    }
    reader.onerror = () => {
      ElMessage.error('图片读取失败')
      loading.value = false
    }
    reader.readAsDataURL(file)
  } catch (error) {
    ElMessage.error('图片处理失败')
    loading.value = false
  }
}

// 查看图片
const handleView = () => {
  viewerVisible.value = true
}

// 移除图片
const handleRemove = () => {
  emit('update:modelValue', '')
  emit('change', null)
}
</script>

<style lang="scss" scoped>
.image-upload-ai {
  width: 100%;

  &.compact {
    .upload-wrapper {
      min-height: 150px;
    }
  }

  .upload-wrapper {
    position: relative;
    width: 100%;
    min-height: 200px;
    background: rgba(255, 255, 255, 0.03);
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    overflow: hidden;

    &:hover {
      border-color: var(--ai-primary);
      background: rgba(255, 255, 255, 0.05);

      .upload-icon {
        transform: scale(1.1);
      }
    }

    &.has-image {
      border-style: solid;
      border-color: rgba(255, 255, 255, 0.1);
    }
  }

  .upload-placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;

    .upload-icon {
      color: var(--ai-primary);
      margin-bottom: 12px;
      transition: transform 0.3s ease;
    }

    .upload-text {
      font-size: 14px;
      color: var(--ai-text-secondary);
      margin-bottom: 8px;
    }

    .upload-hint {
      font-size: 12px;
      color: var(--ai-text-muted);
    }
  }

  .image-preview {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .preview-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;

      .overlay-actions {
        display: flex;
        gap: 12px;
      }
    }

    &:hover .preview-overlay {
      opacity: 1;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;

      .loading-icon {
        color: var(--ai-primary);
        animation: rotate 1s linear infinite;
      }
    }
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 深色主题对话框
:global(.image-viewer-dialog) {
  .el-dialog__header {
    background: var(--ai-bg-secondary);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .el-dialog__body {
    background: var(--ai-bg-primary);
    padding: 0;
  }

  .viewer-content {
    padding: 20px;
    text-align: center;
    max-height: 70vh;
    overflow: auto;
  }
}
</style>