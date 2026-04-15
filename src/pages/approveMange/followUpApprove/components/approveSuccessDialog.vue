<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="审批通过"
    width="500px"
    :close-on-overlay-click="false"
    @close="handleClose"
  >
    <template #body>
      <div class="dialog-content">
        <!-- 点评信息 -->
        <div class="form-item">
          <div class="form-label">点评信息:</div>
          <t-textarea
            v-model="approvalComment"
            placeholder="请输入备注信息"
            :autosize="{ minRows: 4, maxRows: 8 }"
            :maxlength="300"
            show-word-limit
            class="comment-textarea"
          />
        </div>

        <!-- 通知人员 -->
        <div class="form-item">
          <div class="form-label">通知人员:</div>
          <t-select
            v-model="notifyUserIds"
            :options="employeeOptions"
            placeholder="请选择通知人员"
            multiple
            clearable
            filterable
            class="notify-select"
          />
          <div class="form-tip">注:审批完成后,将自动通知到所选人员。</div>
        </div>
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
import { onMounted, ref } from 'vue';

import { followApproval, getEmployeeList } from '@/api/customer/customer';

defineOptions({
  name: 'ApproveSuccessDialog',
});

const emit = defineEmits(['success']);

// 弹框显示/隐藏
const dialogVisible = ref(false);

// 当前审批的客户ID
const currentFollowId = ref<string | number | null>(null);

// 审批点评
const approvalComment = ref('');

// 通知人员ID列表
const notifyUserIds = ref<Array<string | number>>([]);

// 员工选项列表
const employeeOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingEmployees = ref(false);

// 加载员工列表
const loadEmployeeOptions = async () => {
  if (loadingEmployees.value || employeeOptions.value.length > 0) {
    return;
  }
  loadingEmployees.value = true;
  try {
    const res = await getEmployeeList({
      limit: 1000, // 获取所有员工
    });
    if (res.code === 0 || res.code === 200) {
      const data = res.data || [];
      employeeOptions.value = data.map((emp: any) => ({
        label: emp.real_name || '',
        value: emp.id || '',
      }));
    }
  } catch (error: any) {
    console.error('获取员工列表失败:', error);
    MessagePlugin.error('获取员工列表失败，请重试');
  } finally {
    loadingEmployees.value = false;
  }
};

// 显示弹框
const show = (followId: string | number) => {
  currentFollowId.value = followId;
  approvalComment.value = '';
  notifyUserIds.value = [];
  dialogVisible.value = true;
  // 如果员工列表未加载，则加载
  if (employeeOptions.value.length === 0) {
    loadEmployeeOptions();
  }
};

// 关闭弹框
const handleClose = () => {
  dialogVisible.value = false;
  approvalComment.value = '';
  notifyUserIds.value = [];
  currentFollowId.value = null;
};

// 确认提交
const handleConfirm = async () => {
  // 验证审批点评
  const comment = approvalComment.value.trim();
  if (!comment) {
    MessagePlugin.warning('请填写审批点评');
    return;
  }
  if (comment.length < 1) {
    MessagePlugin.warning('审批点评至少需要1个字符');
    return;
  }
  if (comment.length > 1000) {
    MessagePlugin.warning('审批点评不能超过1000个字符');
    return;
  }

  // 验证通知人员
  if (!notifyUserIds.value || notifyUserIds.value.length === 0) {
    MessagePlugin.warning('请选择通知人员');
    return;
  }

  if (!currentFollowId.value) {
    MessagePlugin.error('缺少跟进ID，无法提交审批');
    return;
  }

  // 获取选中人员的名称
  const selectedNames = notifyUserIds.value
    .map((id) => {
      const emp = employeeOptions.value.find((opt) => String(opt.value) === String(id));
      return emp?.label || '';
    })
    .filter((name) => name);

  try {
    const res = await followApproval({
      id: currentFollowId.value,
      approval_status: 1, // 1 表示通过
      approval_comment: comment,
      notify_user_ids: notifyUserIds.value.map((id) => String(id)).join(','), // 格式：1,2
      notify_user_names: selectedNames.join('，'), // 格式：张三，李四
    });

    if (res.code === 0 || res.code === 200) {
      MessagePlugin.success('审批通过成功');
      handleClose();
      emit('success');
    } else {
      MessagePlugin.error(res.message || res.msg || '审批通过失败');
    }
  } catch (error: any) {
    console.error('审批通过失败:', error);
    MessagePlugin.error(error.message || '审批通过失败，请重试');
  }
};

onMounted(() => {
  loadEmployeeOptions();
});

defineExpose({
  show,
});
</script>
<style lang="less" scoped>
.dialog-content {
  padding: 8px 0;

  .form-item {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .form-label {
      font-size: 14px;
      color: var(--td-text-color-primary);
      margin-bottom: 8px;
    }

    .comment-textarea {
      width: 100%;
    }

    .notify-select {
      width: 100%;
    }

    .form-tip {
      font-size: 12px;
      color: var(--td-text-color-placeholder);
      margin-top: 8px;
    }
  }
}
</style>
