<template>
  <t-dialog
    v-model:visible="visible"
    header="转他人审批"
    :width="600"
    :close-on-overlay-click="false"
    @close="handleClose"
  >
    <template #body>
      <t-form
        ref="formRef"
        :data="formData"
        :rules="formRules"
        label-width="100"
        label-align="top"
        @submit="handleSubmit"
      >
        <!-- 选择人员 -->
        <t-form-item label="选择人员" name="approver_ids" required>
          <t-select
            v-model="formData.approver_ids"
            placeholder="选择人员"
            clearable
            multiple
            :options="personnelOptions"
            :loading="loadingPersonnel"
            filterable
          />
        </t-form-item>

        <!-- 转交原因 -->
        <t-form-item label="转交原因" name="reason" required>
          <t-textarea
            v-model="formData.reason"
            placeholder="请输入备注信息"
            :maxlength="300"
            :autosize="{ minRows: 4, maxRows: 6 }"
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
import { nextTick, onMounted, reactive, ref } from 'vue';

import { transferContractApproval } from '@/api/contract';
import { getEmployeeList } from '@/api/customer/customer';

defineOptions({
  name: 'TransferApprovalDialog',
});

// 定义事件
const emit = defineEmits<{
  success: [];
}>();

// 弹框显示/隐藏
const visible = ref(false);

// 表单引用
const formRef = ref();

// 合同 ID（从父组件传入）
const contractId = ref<number | string>('');

// 表单数据
const formData = reactive({
  approver_ids: [] as Array<string | number>, // 审批人ID列表（多选）
  reason: '', // 转交原因（必填）
});

// 人员选项
const personnelOptions = ref<Array<{ label: string; value: string | number }>>([]);
// 加载状态
const loadingPersonnel = ref(false);

// 加载人员列表
const loadPersonnelOptions = async () => {
  // 如果已经有数据，不再重复加载
  if (personnelOptions.value.length > 0) {
    return;
  }

  loadingPersonnel.value = true;
  try {
    const response = await getEmployeeList({
      limit: 1000, // 获取所有员工
    });
    if (response.code === 0 || response.code === 200) {
      // response.data 直接是数组，不是 { list: [] } 对象
      const data = response.data || [];
      personnelOptions.value = data
        .map((item: any) => ({
          label: item.real_name || '',
          value: item.id || '',
        }))
        .filter((item: any) => item.label && item.value); // 过滤掉空值
    }
  } catch (error) {
    console.error('获取人员列表失败:', error);
    MessagePlugin.error('获取人员列表失败，请重试');
  } finally {
    loadingPersonnel.value = false;
  }
};

// 表单验证规则
const formRules: FormRules = {
  approver_ids: [{ required: true, message: '请选择人员', type: 'error', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入转交原因', type: 'error', trigger: 'blur' }],
};

// 显示弹框
const show = (id?: number | string) => {
  // 保存合同 ID
  if (id) {
    contractId.value = id;
  }
  // 先清除验证状态（如果表单已经渲染）
  if (formRef.value) {
    formRef.value.clearValidate();
  }
  // 重置表单数据
  formData.approver_ids = [];
  formData.reason = '';
  // 显示弹框
  visible.value = true;
  // 加载人员列表（如果还没有加载过）
  loadPersonnelOptions();
  // 在弹框完全渲染后清除所有验证状态，确保验证错误不显示
  nextTick(() => {
    formRef.value?.clearValidate(['approver_ids', 'reason']);
    // 再次确保清除所有验证
    setTimeout(() => {
      formRef.value?.clearValidate();
    }, 100);
  });
};

// 关闭弹框
const handleClose = () => {
  visible.value = false;
};

// 取消
const handleCancel = () => {
  handleClose();
};

// 提交按钮点击
const handleSubmitClick = () => {
  formRef.value?.submit();
};

// 提交表单
const handleSubmit = async ({ validateResult, firstError }: SubmitContext) => {
  if (validateResult === true) {
    if (!contractId.value) {
      MessagePlugin.error('合同ID不能为空');
      return;
    }
    if (!formData.approver_ids || formData.approver_ids.length === 0) {
      MessagePlugin.error('请选择人员');
      return;
    }
    try {
      const response = await transferContractApproval({
        id: contractId.value,
        approver_ids: formData.approver_ids,
        reason: formData.reason.trim(),
      });
      if (response.code === 0 || response.code === 200) {
        MessagePlugin.success('转他人审批成功');
        handleClose();
        // 触发成功事件，让父组件可以刷新数据
        emit('success');
      } else {
        MessagePlugin.error(response.message || response.msg || '转他人审批失败');
      }
    } catch (error: any) {
      console.error('转他人审批失败:', error);
      MessagePlugin.error(error.message || '转他人审批失败，请重试');
    }
  } else {
    console.log('表单验证失败:', firstError);
    MessagePlugin.warning(firstError || '请完善表单信息');
  }
};

// 组件挂载时加载人员列表
onMounted(() => {
  loadPersonnelOptions();
});

// 暴露方法给父组件调用
defineExpose({
  show,
});
</script>
<style lang="less" scoped>
.form-tip {
  margin-top: -16px;
  margin-bottom: 24px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  line-height: 1.5;
}

:deep(.t-form-item__label) {
  font-weight: normal;
}

:deep(.t-checkbox-group) {
  display: flex;
  flex-direction: row;
  gap: 24px;
  flex-wrap: wrap;
}
</style>
