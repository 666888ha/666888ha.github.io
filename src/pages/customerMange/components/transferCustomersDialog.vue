<template>
  <t-dialog
    v-model:visible="visible"
    header="转移客户"
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
        <!-- 新归属人 -->
        <t-form-item label="新归属人" name="new_owner_id" required>
          <t-select
            v-model="formData.new_owner_id"
            placeholder="请选择新归属人"
            clearable
            :options="personnelOptions"
            :loading="loadingPersonnel"
          />
        </t-form-item>

        <!-- 转移原因 -->
        <t-form-item label="转移原因" name="reason" required>
          <t-textarea
            v-model="formData.reason"
            placeholder="请输入转移原因"
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

import { changeOwner, getEmployeeList } from '@/api/customer/customer';

defineOptions({
  name: 'TransferCustomersDialog',
});

// 定义事件
const emit = defineEmits<{
  success: [];
}>();

// 弹框显示/隐藏
const visible = ref(false);

// 表单引用
const formRef = ref();

// 客户 ID（从父组件传入）
const customerId = ref<number | string>('');

// 表单数据
const formData = reactive({
  new_owner_id: '', // 新归属人 ID
  reason: '', // 原因（必填）
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
  new_owner_id: [{ required: true, message: '请选择新归属人', type: 'error', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入转移原因', type: 'error', trigger: 'blur' }],
};

// 显示弹框
const show = (id?: number | string) => {
  // 保存客户 ID
  if (id) {
    customerId.value = id;
  }
  // 先清除验证状态（如果表单已经渲染）
  if (formRef.value) {
    formRef.value.clearValidate();
  }
  // 重置表单数据
  formData.new_owner_id = '';
  formData.reason = '';
  // 显示弹框
  visible.value = true;
  // 加载人员列表（如果还没有加载过）
  loadPersonnelOptions();
  // 在弹框完全渲染后清除所有验证状态，确保验证错误不显示
  nextTick(() => {
    formRef.value?.clearValidate(['new_owner_id', 'reason']);
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
    if (!customerId.value) {
      MessagePlugin.error('客户ID不能为空');
      return;
    }
    try {
      const response = await changeOwner({
        id: customerId.value,
        new_owner_id: formData.new_owner_id,
        reason: formData.reason.trim(),
      });
      if (response.code === 0 || response.code === 200) {
        MessagePlugin.success('转移客户成功');
        handleClose();
        // 触发成功事件，让父组件可以刷新数据
        emit('success');
      } else {
        MessagePlugin.error(response.message || response.msg || '转移客户失败');
      }
    } catch (error: any) {
      console.error('转移客户失败:', error);
      MessagePlugin.error(error.message || '转移客户失败，请重试');
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
