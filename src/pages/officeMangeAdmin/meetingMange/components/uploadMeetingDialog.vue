<template>
  <t-dialog
    v-model:visible="visible"
    header="上传会议纪要"
    :width="800"
    :confirm-loading="confirmLoading"
    :destroy-on-close="true"
    :close-on-overlay-click="false"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <t-form ref="formRef" :data="formData" :rules="rules" label-align="right" :label-width="100">
      <t-form-item label="会议纪要" name="content">
        <wang-editor v-model="formData.content" :height="300" />
      </t-form-item>
      <t-form-item label="上传附件" name="attachments">
        <base-upload
          v-model="formData.attachments"
          :upload-action="uploadAction"
          :multiple="true"
          button-text="选择附件"
          tips="支持格式:.rar .zip .doc .docx .pdf,单个文件不能超过20MB"
          :max-size="20"
          :allowed-types="['.rar', '.zip', '.doc', '.docx', '.pdf']"
        />
      </t-form-item>
    </t-form>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule, UploadFile } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

import { addOfficeMeeting } from '@/api/office';
import BaseUpload from '@/components/BaseUpload/index.vue';
import WangEditor from '@/components/WangEditor/index.vue';

const emit = defineEmits<{
  success: [];
}>();

const formRef = ref<FormInstanceFunctions>();
const visible = ref(false);
const confirmLoading = ref(false);
const uploadAction = ref('/api/dict/upload');

const formData = ref<{
  content: string;
  attachments: UploadFile[];
}>({
  content: '',
  attachments: [],
});

const rules: Record<string, FormRule[]> = {
  content: [{ required: true, message: '请输入会议纪要内容', type: 'error' }],
};

// 对外暴露：显示弹框
const show = () => {
  formData.value = {
    content: '',
    attachments: [],
  };
  visible.value = true;
};

// 格式化附件为URL字符串
const formatAttachments = (files: UploadFile[]) => {
  if (!files || files.length === 0) return '';
  return files
    .filter((file) => file.url || (file as any).response) // 只处理已上传成功的文件
    .map((file) => {
      const resp: any = (file as any).response || {};
      return file.url || resp.url || resp.data?.url || resp.data?.file_url || '';
    })
    .filter(Boolean)
    .join(',');
};

const handleConfirm = async () => {
  const result = await formRef.value?.validate();
  if (result !== true) return;

  confirmLoading.value = true;
  try {
    const payload: any = {
      content: formData.value.content,
      hyurl: formatAttachments(formData.value.attachments || []),
    };

    const res = await addOfficeMeeting(payload);

    if (res && (res.code === 0 || res.code === 200)) {
      MessagePlugin.success(res.msg || '上传成功');
      visible.value = false;
      emit('success');
    } else {
      MessagePlugin.error(res?.msg || '上传失败');
    }
  } catch (error: any) {
    console.error('上传会议纪要失败:', error);
    MessagePlugin.error(error?.response?.data?.msg || error?.message || '上传失败，请重试');
  } finally {
    confirmLoading.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
};

defineExpose({
  show,
});
</script>
<style scoped lang="less">
::v-deep(.t-dialog__body) {
  padding-top: 12px;
}
</style>
