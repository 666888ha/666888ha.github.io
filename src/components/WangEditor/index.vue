<template>
  <div class="wang-editor-container">
    <div ref="editorRef" class="editor"></div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import E from 'wangeditor';

import { useUserStore } from '@/store';

const props = defineProps<{
  modelValue: string;
  height?: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editorRef = ref<HTMLElement | null>(null);
let editor: any = null;
const userStore = useUserStore();
const { token } = userStore;

onMounted(() => {
  if (editorRef.value) {
    // 创建编辑器
    editor = new E(editorRef.value);

    // 设置编辑器高度
    editor.config.height = props.height || 300;
    editor.config.placeholder = '请输入内容...';

    // 配置图片上传
    editor.config.uploadImgServer = '/api/dict/upload'; // 上传接口
    editor.config.uploadImgMaxSize = 2 * 1024 * 1024; // 2MB
    editor.config.uploadImgMaxLength = 10; // 最多上传10张
    editor.config.uploadImgParams = {}; // 上传参数
    editor.config.uploadFileName = 'file'; // 上传文件的name字段

    // 监听内容变化
    editor.config.onchange = function (html: string) {
      emit('update:modelValue', html);
    };

    // 创建编辑器
    editor.create();

    // 设置初始内容
    if (props.modelValue) {
      editor.txt.html(props.modelValue);
    }
  }
});

onUnmounted(() => {
  if (editor) {
    editor.destroy();
    editor = null;
  }
});

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && editor.txt.html() !== newValue) {
      editor.txt.html(newValue);
    }
  },
);
</script>
<style scoped lang="less">
.wang-editor-container {
  width: 100%;
  .editor {
    border: 1px solid #e5e6eb;
    border-radius: 4px;
    overflow: hidden;
  }
}
</style>
