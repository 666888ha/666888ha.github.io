<template>
  <div class="customer-page">
    <!-- 新建/编辑跟进弹框 -->
    <t-dialog
      v-model:visible="followUpDialogVisible"
      :header="dialogTitle"
      width="820px"
      :footer="false"
      :close-on-overlay-click="false"
      @close="handleClose"
    >
      <!-- 复用跟进管理的新增/编辑表单组件，表单字段与 /followUpManagement/edit 一致 -->
      <follow-up-add :query-id="queryId" :type="formType" :on-success="handleSuccess" />
    </t-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';

import FollowUpAdd from '@/pages/followUpManagement/components/add.vue';

const emit = defineEmits(['success']);

// 弹框显隐
const followUpDialogVisible = ref(false);
// 当前编辑的跟进记录ID（编辑模式下使用）
const queryId = ref<string>('');
// 表单模式：'1' 新建；'2' 编辑
const formType = ref<'1' | '2'>('1');

// 弹框标题
const dialogTitle = computed(() => (formType.value === '2' ? '编辑跟进' : '新建跟进'));

// 供外部调用：根据是否传入 id 决定是新建还是编辑
const show = (id?: string | number | null) => {
  if (id) {
    formType.value = '2';
    queryId.value = String(id);
  } else {
    formType.value = '1';
    queryId.value = '';
  }
  followUpDialogVisible.value = true;
};

// 表单提交成功回调：关闭弹框并通知父组件刷新
const handleSuccess = () => {
  followUpDialogVisible.value = false;
  emit('success');
};

// 关闭弹框
const handleClose = () => {
  followUpDialogVisible.value = false;
};

defineExpose({
  show,
});
</script>
<style scoped lang="less">
.follow-up-form {
  margin-top: 10px;
}
.attachments {
  margin-top: 10px;
  color: #666;
  cursor: pointer;
}
.add-icon {
  margin-left: 10px;
  color: #666;
  cursor: pointer;
}
</style>
