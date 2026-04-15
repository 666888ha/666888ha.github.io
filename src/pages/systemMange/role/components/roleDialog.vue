<template>
  <t-dialog
    v-model:visible="visible"
    :header="isEdit ? '编辑角色' : '添加角色'"
    :width="420"
    :confirm-loading="confirmLoading"
    :destroy-on-close="true"
    :close-on-overlay-click="false"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <t-form ref="formRef" :data="formData" :rules="rules" label-align="right" :label-width="90">
      <t-form-item label="角色名称" name="role_name">
        <t-input v-model="formData.role_name" maxlength="30" placeholder="请输入角色名称" />
      </t-form-item>
      <t-form-item label="数据范围" name="data_scope">
        <t-select v-model="formData.data_scope" :options="dataScopeOptions" placeholder="请选择数据范围" />
      </t-form-item>
    </t-form>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref } from 'vue';

import type { SaveSystemRoleParams, SystemRoleItem } from '@/api/system/role';
import { saveSystemRole } from '@/api/system/role';

const emit = defineEmits<{
  success: [];
}>();

const formRef = ref<FormInstanceFunctions>();
const visible = ref(false);
const confirmLoading = ref(false);

const dataScopeOptions = [
  { label: '本人(self)', value: 'self' },
  { label: '本部门(dept)', value: 'dept' },
  { label: '本部门及子部门(office)', value: 'office' },
  { label: '全部(all)', value: 'all' },
];

const formData = ref<SaveSystemRoleParams>({
  id: undefined,
  role_name: '',
  data_scope: 'self',
});

const isEdit = computed(() => !!formData.value.id);

const rules: Record<string, FormRule[]> = {
  role_name: [{ required: true, message: '请输入角色名称', type: 'error' }],
};

// 外部调用：显示弹框（可带上行数据用于编辑）
const show = (record?: SystemRoleItem) => {
  if (record) {
    formData.value = {
      id: record.id,
      role_name: record.role_name || '',
      data_scope: record.data_scope || 'self',
    };
  } else {
    formData.value = {
      id: undefined,
      role_name: '',
      data_scope: 'self',
    };
  }
  visible.value = true;
};

const handleConfirm = async () => {
  const result = await formRef.value?.validate();
  if (result !== true) return;

  confirmLoading.value = true;
  try {
    const payload: SaveSystemRoleParams = {
      id: formData.value.id,
      role_name: formData.value.role_name.trim(),
      data_scope: formData.value.data_scope || 'self',
    };
    const res = await saveSystemRole(payload);
    if (res && (res.code === 0 || res.code === 200)) {
      MessagePlugin.success(res.msg || '操作成功');
      visible.value = false;
      emit('success');
    } else {
      MessagePlugin.error(res?.msg || '操作失败');
    }
  } catch (error: any) {
    console.error('保存角色失败:', error);
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
