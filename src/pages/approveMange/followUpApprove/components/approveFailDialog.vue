<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="审批否决"
    width="500px"
    :close-on-overlay-click="false"
    @close="handleClose"
  >
    <template #body>
      <div class="dialog-content">
        <div class="tip-text">否决,需要填写否决原因</div>
        <t-textarea
          v-model="rejectReason"
          placeholder="请填写否决原因"
          :autosize="{ minRows: 4, maxRows: 8 }"
          :maxlength="300"
          show-word-limit
          class="reason-textarea"
        />
      </div>
    </template>
    <template #footer>
      <t-space>
        <t-button theme="default" variant="outline" @click="handleClose">取消</t-button>
        <t-button theme="primary" @click="handleConfirm">确定</t-button>
      </t-space>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

import { followApproval } from '@/api/customer/customer';

defineOptions({
  name: 'ApproveFailDialog',
});

const emit = defineEmits(['success']);

// 弹框显示/隐藏
const dialogVisible = ref(false);

// 当前审批的客户ID
const currentFollowId = ref<string | number | null>(null);

// 否决原因
const rejectReason = ref('');

// 显示弹框
const show = (customerId: string | number) => {
  currentFollowId.value = customerId;
  rejectReason.value = '';
  dialogVisible.value = true;
};

// 关闭弹框
const handleClose = () => {
  dialogVisible.value = false;
  rejectReason.value = '';
  currentFollowId.value = null;
};

// 确认提交
const handleConfirm = async () => {
  // 验证否决原因
  const reason = rejectReason.value.trim();
  if (!reason) {
    MessagePlugin.warning('请填写否决原因');
    return;
  }
  if (reason.length < 1) {
    MessagePlugin.warning('否决原因至少需要1个字符');
    return;
  }
  if (reason.length > 1000) {
    MessagePlugin.warning('否决原因不能超过1000个字符');
    return;
  }

  if (!currentFollowId.value) {
    MessagePlugin.error('缺少跟进ID，无法提交审批');
    return;
  }

  try {
    const res = await followApproval({
      id: currentFollowId.value,
      approval_status: 2, // 2 表示否决
      reject_reason: reason,
    });

    if (res.code === 0 || res.code === 200) {
      MessagePlugin.success('审批否决成功');
      handleClose();
      emit('success');
    } else {
      MessagePlugin.error(res.message || res.msg || '审批否决失败');
    }
  } catch (error: any) {
    console.error('审批否决失败:', error);
    MessagePlugin.error(error.message || '审批否决失败，请重试');
  }
};

defineExpose({
  show,
});
</script>
<style lang="less" scoped>
.dialog-content {
  padding: 8px 0;

  .tip-text {
    font-size: 14px;
    color: var(--td-text-color-secondary);
    margin-bottom: 16px;
  }

  .reason-textarea {
    width: 100%;
  }
}
</style>
