<template>
  <t-dialog
    v-model:visible="visible"
    :header="isEdit ? '编辑用户' : '添加用户'"
    :width="480"
    :confirm-loading="confirmLoading"
    :destroy-on-close="true"
    :close-on-overlay-click="false"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <t-form ref="formRef" :data="formData" :rules="rules" label-align="right" :label-width="100">
      <t-form-item label="用户账号" name="username">
        <t-input v-model="formData.username" maxlength="20" placeholder="4-20位字母或数字" />
      </t-form-item>
      <t-form-item label="姓名" name="real_name">
        <t-input v-model="formData.real_name" maxlength="10" />
      </t-form-item>
      <t-form-item label="角色" name="role_id">
        <t-select
          v-model="formData.role_id"
          :options="roleOptions"
          placeholder="请选择角色"
          clearable
          :loading="loadingRoleOptions"
          style="width: 100%"
        />
      </t-form-item>
      <t-form-item label="所属部门" name="dept_id">
        <t-select
          v-model="formData.dept_id"
          :options="deptOptions"
          placeholder="请选择部门"
          clearable
          :loading="loadingDeptOptions"
          style="width: 100%"
        />
      </t-form-item>
      <t-form-item label="密码" name="password">
        <t-input v-model="formData.password" type="password" maxlength="20" placeholder="请输入密码" />
      </t-form-item>
    </t-form>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import { getSystemDeptOptions } from '@/api/system/dept';
import { getSystemRoleList } from '@/api/system/role';
import type { SaveSystemEmployeeParams, SystemEmployeeItem } from '@/api/system/user';
import { getSystemEmployeeDetail, saveSystemEmployee } from '@/api/system/user';

const emit = defineEmits<{
  success: [];
}>();

const formRef = ref<FormInstanceFunctions>();
const visible = ref(false);
const confirmLoading = ref(false);
const loadingDeptOptions = ref(false);
const deptOptions = ref<Array<{ label: string; value: number | string }>>([]);
const loadingRoleOptions = ref(false);
const roleOptions = ref<Array<{ label: string; value: number | string }>>([]);

const formData = ref<SaveSystemEmployeeParams>({
  id: undefined,
  username: '',
  real_name: '',
  role_id: undefined,
  dept_id: undefined,
  phone: '',
  status: undefined,
  password: '',
});

const isEdit = computed(() => !!formData.value.id);

const rules: Record<string, FormRule[]> = {
  username: [
    { required: true, message: '请输入登录账号', type: 'error' },
    {
      validator: (val: string) => /^[a-z0-9]{4,20}$/i.test(val || ''),
      message: '账号需为4-20位字母或数字',
      type: 'error',
      trigger: 'blur',
    },
  ],
  real_name: [
    { required: true, message: '请输入姓名', type: 'error' },
    {
      validator: (val: string) => !!val && val.length >= 2 && val.length <= 10,
      message: '姓名长度为2-10个字符',
      type: 'error',
      trigger: 'blur',
    },
  ],
  role_id: [{ required: true, message: '请选择角色', type: 'error' }],
  dept_id: [{ required: true, message: '请选择所属部门', type: 'error' }],
  password: [
    {
      required: !isEdit.value,
      message: '请输入密码',
      type: 'error',
    },
    {
      validator: (val: string) => !val || (val.length >= 6 && val.length <= 20),
      message: '密码长度为6-20个字符',
      type: 'error',
      trigger: 'blur',
    },
  ],
};

// 加载角色选项
const loadRoleOptions = async () => {
  if (roleOptions.value.length > 0) {
    return; // 已加载过，不再重复加载
  }
  loadingRoleOptions.value = true;
  try {
    const res = await getSystemRoleList({ limit: 1000 }); // 获取所有角色
    if (res.code === 0 || res.code === 200) {
      const data = res.data || [];
      roleOptions.value = data.map((item: any) => ({
        label: item.role_name || '',
        value: item.id || '',
      }));
    } else {
      MessagePlugin.error(res.msg || '获取角色选项失败');
    }
  } catch (error: any) {
    console.error('获取角色选项失败:', error);
    MessagePlugin.error('获取角色选项失败，请重试');
  } finally {
    loadingRoleOptions.value = false;
  }
};

// 加载部门选项
const loadDeptOptions = async () => {
  if (deptOptions.value.length > 0) {
    return; // 已加载过，不再重复加载
  }
  loadingDeptOptions.value = true;
  try {
    const res = await getSystemDeptOptions();
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      // 将接口返回的对象格式 {1: "技术部", 2: "市场部"} 转换为下拉选项格式
      deptOptions.value = Object.entries(data).map(([id, name]) => ({
        label: name as string,
        value: Number(id) || id, // 将字符串ID转为数字，如果转换失败则保持原值
      }));
    } else {
      MessagePlugin.error(res.msg || '获取部门选项失败');
    }
  } catch (error: any) {
    console.error('获取部门选项失败:', error);
    MessagePlugin.error('获取部门选项失败，请重试');
  } finally {
    loadingDeptOptions.value = false;
  }
};

// 加载详情
const loadDetail = async (id: number | string) => {
  try {
    const res = await getSystemEmployeeDetail(id);
    if (res && (res.code === 0 || res.code === 200) && res.data) {
      const d = res.data;
      formData.value = {
        id: d.id,
        username: d.username || '',
        real_name: d.real_name || '',
        role_id: d.role_id || d.role?.id,
        dept_id: d.dept_id,
        phone: d.phone || '',
        status: typeof d.status === 'number' ? d.status : Number(d.status),
      };
    } else {
      MessagePlugin.error(res?.msg || '获取用户详情失败');
    }
  } catch (error: any) {
    console.error('获取用户详情失败:', error);
    MessagePlugin.error(error?.response?.data?.msg || error?.message || '获取用户详情失败，请重试');
  }
};

// 对外暴露：打开弹框（可传入已有数据做编辑）
const show = async (record?: SystemEmployeeItem) => {
  // 加载角色和部门选项
  await Promise.all([loadRoleOptions(), loadDeptOptions()]);

  // 初始化表单
  formData.value = {
    id: undefined,
    username: '',
    real_name: '',
    role_id: undefined,
    dept_id: undefined,
    phone: '',
    status: undefined,
    password: '',
  };

  if (record && record.id) {
    await loadDetail(record.id);
  }

  visible.value = true;
};

const handleConfirm = async () => {
  // 使用表单校验
  const result = await formRef.value?.validate();
  if (result !== true) return;

  confirmLoading.value = true;
  try {
    const payload: SaveSystemEmployeeParams = {
      id: formData.value.id,
      username: formData.value.username.trim(),
      real_name: formData.value.real_name.trim(),
      role_id: formData.value.role_id!,
      dept_id: formData.value.dept_id,
    };

    // 添加密码字段（仅在添加用户或编辑时明确填写密码时）
    if (formData.value.password) {
      payload.password = formData.value.password;
    }

    // 编辑时如果有状态，则添加
    if (isEdit.value && formData.value.status !== undefined) {
      payload.status = formData.value.status;
    }

    const res = await saveSystemEmployee(payload);
    if (res && (res.code === 0 || res.code === 200)) {
      MessagePlugin.success(res.msg || '操作成功');
      visible.value = false;
      emit('success');
    } else {
      MessagePlugin.error(res?.msg || '操作失败');
    }
  } catch (error: any) {
    console.error('保存用户失败:', error);
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
