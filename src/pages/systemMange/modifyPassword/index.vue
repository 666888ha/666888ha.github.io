<template>
  <div class="modify-password-container">
    <div class="password-form-wrapper">
      <t-form
        :data="formData"
        :rules="rules"
        label-align="right"
        :label-width="120"
        class="password-form"
        @submit="handleSubmit"
      >
        <t-form-item name="oldPassword" label="原密码">
          <t-input
            v-model="formData.oldPassword"
            type="password"
            placeholder="原登录密码"
            :show-password="showOldPassword"
          />
        </t-form-item>
        <t-form-item name="newPassword" label="新密码">
          <t-input
            v-model="formData.newPassword"
            type="password"
            placeholder="新的登录密码"
            :show-password="showNewPassword"
          />
        </t-form-item>
        <t-form-item name="confirmPassword" label="确认密码">
          <t-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="确认新的密码"
            :show-password="showConfirmPassword"
          />
        </t-form-item>
        <t-form-item>
          <div class="form-actions">
            <t-button type="primary" native-type="submit" :loading="loading">提交</t-button>
            <t-button variant="outline" @click="handleReset">重置</t-button>
          </div>
        </t-form-item>
      </t-form>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { FormRules } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { reactive, ref } from 'vue';

import { modifyPassword } from '@/api/system/user';

type PasswordFormData = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// 表单数据
const formData = reactive<PasswordFormData>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// 加载状态
const loading = ref(false);

// 显示密码
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// 表单验证规则
const rules: FormRules<PasswordFormData> = {
  oldPassword: [{ required: true, message: '请输入原密码', type: 'error' }],
  newPassword: [
    { required: true, message: '请输入新密码', type: 'error' },
    { min: 6, max: 20, message: '密码长度在 6-20 个字符', type: 'error' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', type: 'error' },
    {
      validator: (val: string) => val === formData.newPassword,
      message: '两次输入的密码不一致',
      type: 'error',
      trigger: 'blur',
    },
  ],
};

// 提交表单
const handleSubmit = async ({ validateResult, firstError }: any) => {
  if (validateResult !== true) {
    MessagePlugin.warning(firstError || '请完善表单信息');
    return;
  }

  loading.value = true;
  try {
    const response = await modifyPassword({
      old_password: formData.oldPassword,
      new_password: formData.newPassword,
      confirm_password: formData.confirmPassword,
    });

    if (response.code === 0 || response.code === 200) {
      MessagePlugin.success(response.msg || '密码修改成功');
      handleReset();
    } else {
      MessagePlugin.error(response.msg || response.message || '密码修改失败');
    }
  } catch (error: any) {
    console.error('修改密码失败:', error);
    MessagePlugin.error(error.message || '密码修改失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 重置表单
const handleReset = () => {
  formData.oldPassword = '';
  formData.newPassword = '';
  formData.confirmPassword = '';
};
</script>
<style scoped>
.modify-password-container {
  min-height: 100vh;
  background-color: #fff;
  display: flex;
  padding: 20px;
}

.password-form-wrapper {
  width: 100%;
  max-width: 500px;
  padding: 40px;
}

.password-form {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.form-actions .t-button {
  min-width: 120px;
  height: 40px;
  font-size: 16px;
}
</style>
