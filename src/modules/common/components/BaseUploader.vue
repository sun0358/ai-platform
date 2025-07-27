<template>
  <el-upload
      ref="uploadRef"
      class="base-uploader"
      drag
      :accept="accept"
      :multiple="false"
      :auto-upload="false"
      :show-file-list="false"
      :on-change="handleChange"
      :before-upload="beforeUpload"
      :limit="1"
  >
    <slot></slot>
  </el-upload>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { UploadFile, UploadInstance } from 'element-plus';
import { ElMessage } from 'element-plus';

interface Props {
  modelValue: File | null;
  accept?: string;
  maxSize?: number; // MB
}

const props = withDefaults(defineProps<Props>(), {
  accept: '*',
  maxSize: 10,
});

const emit = defineEmits<{
  'update:modelValue': [file: File | null];
  'change': [file: File | null];
}>();

// 获取 upload 组件实例
const uploadRef = ref<UploadInstance>();

// 监听 modelValue 变化，当变为 null 时清空上传列表
watch(() => props.modelValue, (newVal) => {
  if (!newVal && uploadRef.value) {
    // 清空 el-upload 内部的文件列表
    uploadRef.value.clearFiles();
  }
});

const handleChange = (file: UploadFile) => {
  const rawFile = file.raw;
  if (rawFile) {
    emit('update:modelValue', rawFile);
    emit('change', rawFile);
  }
};

const beforeUpload = (file: File) => {
  if (props.maxSize > 0 && file.size / 1024 / 1024 > props.maxSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`);
    return false;
  }
  // 复杂的类型校验交给上层业务组件
  return true;
};

// 暴露清空方法供外部调用
defineExpose({
  clearFiles: () => {
    uploadRef.value?.clearFiles();
  }
});
</script>

<style scoped lang="scss">
.base-uploader, :deep(.el-upload), :deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
}

// 主题适配的上传区域样式
:deep(.el-upload-dragger) {
  background: var(--ai-glass-bg) !important;
  border: 2px dashed var(--ai-border) !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;

  &:hover {
    border-color: var(--ai-primary) !important;
    background: rgba(99, 102, 241, 0.05) !important;
  }

  // 确保在不同主题下都有适当的文字颜色
  * {
    color: var(--ai-text-primary) !important;
  }
}
</style>