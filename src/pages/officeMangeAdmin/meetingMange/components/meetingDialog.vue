<template>
  <t-dialog
    v-model:visible="visible"
    :header="isEdit ? '编辑会议纪要' : '新建会议纪要'"
    :width="800"
    :confirm-loading="confirmLoading"
    :destroy-on-close="true"
    :close-on-overlay-click="false"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <t-form ref="formRef" :data="formData" :rules="rules" label-align="right" :label-width="100">
      <t-form-item label="会议标题" name="title">
        <t-input v-model="formData.title" maxlength="100" placeholder="请输入会议标题" />
      </t-form-item>
      <t-form-item label="会议内容" name="content">
        <wang-editor v-model="formData.content" :height="300" />
      </t-form-item>
      <t-form-item label="会议备注" name="remark">
        <t-textarea
          v-model="formData.remark"
          :autosize="{ minRows: 3, maxRows: 6 }"
          maxlength="500"
          placeholder="请输入会议备注"
          show-word-limit
        />
      </t-form-item>
    </t-form>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref } from 'vue';

import { addOfficeMeeting, editOfficeMeeting } from '@/api/office';
import WangEditor from '@/components/WangEditor/index.vue';

const emit = defineEmits<{
  success: [];
}>();

const formRef = ref<FormInstanceFunctions>();
const visible = ref(false);
const confirmLoading = ref(false);

const formData = ref<{
  id?: string | number;
  title: string;
  content: string;
  remark: string;
}>({
  id: undefined,
  title: '',
  content: '',
  remark: '',
});

const isEdit = computed(() => !!formData.value.id);

const rules: Record<string, FormRule[]> = {
  title: [{ required: true, message: '请输入会议标题', type: 'error' }],
  content: [{ required: true, message: '请输入会议内容', type: 'error' }],
};

// 对外暴露：显示弹框（可传入行数据用于编辑）
const show = (record?: any) => {
  if (record && record.id) {
    formData.value = {
      id: record.id,
      title: record.title || record.name || record.topic || '',
      content: record.content || '',
      remark: record.remark || '',
    };
  } else {
    formData.value = {
      id: undefined,
      title: '',
      content: '',
      remark: '',
    };
  }
  visible.value = true;
};

const handleConfirm = async () => {
  const result = await formRef.value?.validate();
  if (result !== true) return;

  confirmLoading.value = true;
  try {
    const payload: any = {
      title: formData.value.title.trim(),
      content: formData.value.content.trim(),
      remark: formData.value.remark.trim(),
    };

    let res;
    if (isEdit.value && formData.value.id) {
      payload.id = formData.value.id;
      res = await editOfficeMeeting(payload);
    } else {
      res = await addOfficeMeeting(payload);
    }

    if (res && (res.code === 0 || res.code === 200)) {
      MessagePlugin.success(res.msg || '操作成功');
      visible.value = false;
      emit('success');
    } else {
      MessagePlugin.error(res?.msg || '操作失败');
    }
  } catch (error: any) {
    console.error('保存会议失败:', error);
    MessagePlugin.error(error?.response?.data?.msg || error?.message || '保存失败，请重试');
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
