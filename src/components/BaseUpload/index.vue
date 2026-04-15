<template>
  <t-upload
    v-model="fileList"
    :action="uploadAction"
    :multiple="multiple"
    name="file"
    :tips="uploadTips"
    :headers="headers"
    :theme="theme"
    :size-limit="sizeLimit"
    :format-response="formatResponse"
    :before-upload="beforeUpload"
    @fail="handleUploadFail"
    @success="handleUploadSuccess"
  >
    <t-button theme="default" variant="outline">
      <template #icon>
        <t-icon name="upload" />
      </template>
      {{ buttonText }}
    </t-button>
  </t-upload>
</template>
<script setup lang="ts">
import type { UploadFailContext, UploadFile } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';

import { useUserStore } from '@/store';

defineOptions({
  name: 'BaseUpload',
});

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  uploadAction: '/api/dict/upload',
  theme: 'file',
  multiple: true,
  buttonText: '选择附件',
  tips: '支持格式:.rar .zip .doc .docx .pdf,单个文件不能超过20MB',
  maxSize: 20,
  allowedTypes: () => ['.rar', '.zip', '.doc', '.docx', '.pdf'],
  sizeLimit: () => ({ size: 20, unit: 'MB' }),
});

const emit = defineEmits<{
  'update:modelValue': [value: UploadFile[]];
  success: [file: UploadFile, response: any];
  fail: [context: UploadFailContext];
  change: [files: UploadFile[]];
}>();

interface Props {
  modelValue?: UploadFile[];
  uploadAction?: string;
  multiple?: boolean;
  theme?: 'file' | 'image';
  buttonText?: string;
  tips?: string;
  maxSize?: number; // MB
  allowedTypes?: string[]; // 允许的文件类型，如 ['.rar', '.zip', '.doc', '.docx', '.pdf']
  sizeLimit?: { size: number; unit: string };
}
const VITE_API_URL = import.meta.env.VITE_API_URL;

const userStore = useUserStore();
const { token } = userStore;

const fileList = ref<UploadFile[]>(props.modelValue || []);
const uploadTips = computed(() => props.tips);
const headers = computed(() => ({ Authorization: `Bearer ${token}` }));

// 监听外部传入的 modelValue 变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(fileList.value)) {
      fileList.value = newVal || [];
    }
  },
  { deep: true, immediate: true },
);

// 监听内部 fileList 变化，同步到外部
watch(
  fileList,
  (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(props.modelValue)) {
      emit('update:modelValue', newVal);
      emit('change', newVal);
    }
  },
  { deep: true },
);

// 文件上传前的验证
const beforeUpload = (file: UploadFile): boolean => {
  const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;

  if (props.allowedTypes && props.allowedTypes.length > 0) {
    if (!props.allowedTypes.includes(fileExtension)) {
      MessagePlugin.warning(`请上传 ${props.allowedTypes.join('、')} 格式的文件`);
      return false;
    }
  }

  if (file.size > props.maxSize * 1024 * 1024) {
    MessagePlugin.warning(`上传文件不能大于${props.maxSize}MB`);
    return false;
  }

  return true;
};

// 上传失败处理
const handleUploadFail = (options: UploadFailContext) => {
  MessagePlugin.error(`文件 ${options.file.name} 上传失败`);
  emit('fail', options);
};

// 格式化响应：返回完整的文件信息以支持图片预览，避免循环引用
const formatResponse = (res: any, file: UploadFile) => {
  // 常见返回格式：{ code, msg, data: { url/file_url, name/file_name, size/file_size } } 或 { url, file_url }
  const data = res?.data || res || {};
  const { url, file_url, name, file_name, original_name, size, file_size } = data;

  // 只提取必要的文件属性，避免循环引用
  const { name: fileName, size: fileSize, type, lastModified } = file;

  return {
    url: VITE_API_URL + (url || file_url),
    name: name || file_name || original_name || fileName,
    size: size || file_size || fileSize,
    type,
    lastModified,
    response: res,
  };
};

// 上传成功处理：统一按成功处理，由后端状态码控制 fail 事件
const handleUploadSuccess = (context: { file: UploadFile; response: any }) => {
  const { file, response } = context;
  MessagePlugin.success('文件上传成功');
  emit('success', file, response);
};

// 暴露方法供外部调用
defineExpose({
  clear: () => {
    fileList.value = [];
  },
  getFileList: () => fileList.value,
});
</script>
<style scoped lang="less">
// 可以在这里添加自定义样式
</style>
