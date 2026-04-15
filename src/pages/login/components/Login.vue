<template>
  <t-form ref="form" class="login-form" :data="formData" :rules="FORM_RULES" label-width="0" @submit="onSubmit">
    <t-form-item name="username">
      <t-input v-model="formData.username" size="large" placeholder="请输入用户名称">
        <template #prefix-icon>
          <t-icon name="user" />
        </template>
      </t-input>
    </t-form-item>

    <t-form-item name="password">
      <t-input v-model="formData.password" size="large" type="password" placeholder="请输入登录密码">
        <template #prefix-icon>
          <t-icon name="lock-on" />
        </template>
      </t-input>
    </t-form-item>

    <t-form-item class="btn-container">
      <t-button block size="large" type="submit" theme="primary" :loading="loading">登录</t-button>
    </t-form-item>
  </t-form>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule, SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useUserStore } from '@/store';

const userStore = useUserStore();

const INITIAL_DATA = {
  username: '',
  password: '',
};

const FORM_RULES: Record<string, FormRule[]> = {
  username: [{ required: true, message: '请输入用户名称', type: 'error' }],
  password: [{ required: true, message: '请输入登录密码', type: 'error' }],
};

const form = ref<FormInstanceFunctions>();
const formData = ref({ ...INITIAL_DATA });
const loading = ref(false);

const router = useRouter();
const route = useRoute();

const onSubmit = async (ctx: SubmitContext) => {
  if (ctx.validateResult === true) {
    loading.value = true;
    try {
      await userStore.login(formData.value);

      MessagePlugin.success('登录成功');
      const redirect = route.query.redirect as string | undefined;

      let redirectUrl = '/workbench/workbench';
      if (redirect) {
        let decoded = redirect;
        try {
          // 处理多次 encode 的场景，例如含有 %252F、%25253F 等
          for (let i = 0; i < 10; i += 1) {
            if (decoded.includes('%25')) {
              decoded = decodeURIComponent(decoded);
            } else {
              break;
            }
          }
          // 最终解码
          if (!decoded.includes('%')) {
            decoded = decodeURIComponent(decoded);
          }

          // 检查是否包含登录页路径，避免循环重定向
          if (decoded && !decoded.startsWith('/login')) {
            redirectUrl = decoded;
          }
        } catch (error) {
          // 解码异常时退回到工作台
          redirectUrl = '/workbench/workbench';
        }
      }

      router.push(redirectUrl);
    } catch (e: any) {
      console.log(e);
      MessagePlugin.error(e.message || '登录失败，请检查用户名和密码');
    } finally {
      loading.value = false;
    }
  }
};
</script>
<style lang="less" scoped>
@import '../index.less';
</style>
