<template>
  <t-dialog
    v-model:visible="visible"
    header="点评报告"
    :width="600"
    :close-on-overlay-click="false"
    @close="handleClose"
  >
    <template #body>
      <t-form
        ref="formRef"
        :data="formData"
        :rules="formRules"
        label-width="100px"
        label-align="top"
        @submit="handleSubmit"
      >
        <t-form-item label="点评内容" name="approve_comment" required>
          <t-textarea
            v-model="formData.approve_comment"
            placeholder="请输入点评内容"
            :maxlength="500"
            :autosize="{ minRows: 6, maxRows: 10 }"
            show-word-limit
          />
        </t-form-item>
      </t-form>
    </template>
    <template #footer>
      <span class="dialog-footer">
        <t-button @click="handleCancel">取消</t-button>
        <t-button theme="primary" @click="handleSubmitClick">确定</t-button>
      </span>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormRules, SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, reactive, ref } from 'vue';

import { approveWorkReport } from '@/api/workReport';

defineOptions({
  name: 'ApproveCommentDialog',
});

const emit = defineEmits<{
  success: [];
}>();

const visible = ref(false);
const formRef = ref();
const reportId = ref<number | string>('');

const formData = reactive({
  approve_comment: '', // 点评内容
});

const formRules: FormRules = {
  approve_comment: [{ required: true, message: '请输入点评内容', type: 'error', trigger: 'blur' }],
};

const show = (id: number | string) => {
  reportId.value = id;
  formData.approve_comment = '';
  visible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

const handleClose = () => {
  visible.value = false;
};

const handleCancel = () => {
  handleClose();
};

const handleSubmitClick = () => {
  formRef.value?.submit();
};

const handleSubmit = async ({ validateResult, firstError }: SubmitContext) => {
  if (validateResult === true) {
    if (!reportId.value) {
      MessagePlugin.error('报告ID不能为空');
      return;
    }
    try {
      const response = await approveWorkReport({
        id: reportId.value,
        approve_comment: formData.approve_comment.trim(),
      });
      if (response.code === 0 || response.code === 200) {
        MessagePlugin.success('点评成功');
        handleClose();
        emit('success');
      } else {
        MessagePlugin.error(response.message || response.msg || '点评失败');
      }
    } catch (error: any) {
      console.error('点评报告失败:', error);
      MessagePlugin.error(error.message || '点评失败，请重试');
    }
  } else {
    MessagePlugin.warning(firstError || '请完善表单信息');
  }
};

defineExpose({
  show,
});
</script>
<style lang="less" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
