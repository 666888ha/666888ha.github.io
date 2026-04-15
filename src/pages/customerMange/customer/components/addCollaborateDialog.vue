<template>
  <t-dialog
    v-model:visible="visible"
    header="添加协作"
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
        <!-- 选择类型 -->
        <t-form-item label="选择类型" name="type" required>
          <t-radio-group v-model="formData.type" :options="typeOptions" />
        </t-form-item>

        <!-- 选择人员 -->
        <t-form-item label="选择人员" name="collaborator_ids" required>
          <div class="personnel-input-wrapper">
            <t-select
              v-model="formData.collaborator_ids"
              placeholder="选择人员"
              clearable
              multiple
              :options="personnelOptions"
              :loading="loadingPersonnel"
              style="width: 100%"
            />
          </div>
        </t-form-item>

        <!-- 说明文字 -->
        <div class="form-tips">
          <div class="tip-item">*新增指在已有协作人的基础上增加新的协作人</div>
          <div class="tip-item">*替换指将已有的协作人替换为新的协作人</div>
          <div class="tip-item">*移除指从已有的协作人中移除所选用户</div>
        </div>
      </t-form>
    </template>
    <template #footer>
      <span class="dialog-footer">
        <t-button @click="handleCancel">取消</t-button>
        <t-button theme="primary" @click="handleSubmitClick">保存</t-button>
      </span>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormRules, SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, onMounted, reactive, ref } from 'vue';

import { getEmployeeList, manageCustomerCollaborator } from '@/api/customer/customer';

defineOptions({
  name: 'AddCollaborateDialog',
});

// 弹框显示/隐藏
const visible = ref(false);

// 表单引用
const formRef = ref();

// 表单数据
const formData = reactive({
  id: '' as string | number,
  type: 'add', // 选择类型：add-新增, replace-替换, remove-移除
  collaborator_ids: [] as Array<string | number>, // 选择人员
});

// 类型选项
const typeOptions = [
  { label: '新增', value: 'add' },
  { label: '替换', value: 'replace' },
  { label: '移除', value: 'remove' },
];

// 人员选项（从员工接口获取）
const personnelOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingPersonnel = ref(false);

// 表单验证规则
const formRules: FormRules = {
  type: [{ required: true, message: '请选择类型', type: 'error', trigger: 'blur' }],
  collaborator_ids: [{ required: true, message: '请选择人员', type: 'error', trigger: 'blur' }],
};

// 加载员工列表作为协作人候选
const loadPersonnelOptions = async () => {
  if (loadingPersonnel.value || personnelOptions.value.length > 0) return;
  loadingPersonnel.value = true;
  try {
    const res = await getEmployeeList({ limit: 1000 });
    if (res.code === 0 || res.code === 200) {
      const list = res.data || [];
      personnelOptions.value = list.map((item: any) => ({
        label: item.real_name || '',
        value: item.id,
      }));
    } else {
      MessagePlugin.error(res.msg || '获取员工列表失败');
    }
  } catch (error: any) {
    console.error('获取员工列表失败:', error);
    MessagePlugin.error('获取员工列表失败，请重试');
  } finally {
    loadingPersonnel.value = false;
  }
};

onMounted(() => {
  loadPersonnelOptions();
});

// 显示弹框
const show = (id: string | number) => {
  // 先清除验证状态（如果表单已经渲染）
  if (formRef.value) {
    formRef.value.clearValidate();
  }
  // 重置表单数据
  formData.id = id;
  formData.type = 'add';
  formData.collaborator_ids = [];
  // 显示弹框
  visible.value = true;
  // 在弹框完全渲染后清除所有验证状态，确保验证错误不显示
  nextTick(() => {
    formRef.value?.clearValidate(['type', 'collaborator_ids']);
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
    try {
      const res = await manageCustomerCollaborator({
        id: formData.id,
        type: formData.type,
        collaborator_ids: formData.collaborator_ids as (number | string)[],
      });
      if (res.code === 0 || res.code === 200) {
        MessagePlugin.success('添加协作成功');
        handleClose();
      } else {
        MessagePlugin.error(res.msg || '添加协作失败');
      }
    } catch (error: any) {
      console.error('添加协作失败:', error);
      MessagePlugin.error('添加协作失败，请重试');
    }
  } else {
    console.log('表单验证失败:', firstError);
    MessagePlugin.warning(firstError || '请完善表单信息');
  }
};

// 暴露方法给父组件调用
defineExpose({
  show,
});
</script>
<style lang="less" scoped>
.personnel-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;

  .t-select {
    flex: 1;
    width: 100%;
  }

  .select-person-btn {
    flex-shrink: 0;
    width: 40px;
    padding: 0;

    :deep(.t-icon) {
      font-size: 16px;
    }
  }
}

.form-tips {
  margin-top: -16px;
  margin-bottom: 24px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  line-height: 1.8;

  .tip-item {
    margin-bottom: 4px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
}

:deep(.t-form-item__label) {
  font-weight: normal;
}

:deep(.t-radio-group) {
  display: flex;
  gap: 24px;
}
</style>
