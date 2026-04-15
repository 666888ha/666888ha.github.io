<template>
  <div class="login-wrapper">
    <div class="login-container">
      <div class="login-form-card">
        <!-- Logo和标题 -->
        <div class="logo-container">
          <div class="logo">
            <img src="@/assets/aside-logo.png" alt="logo" style="height: 100px" />
          </div>
          <h1 class="login-title">客户关系管理系统</h1>
          <p class="login-subtitle">Customer Relationship Management</p>
        </div>

        <!-- 登录表单 -->
        <login />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';

import TdesignSetting from '@/layouts/setting.vue';
import { t } from '@/locales';

import LoginHeader from './components/Header.vue';
import Login from './components/Login.vue';
import Register from './components/Register.vue';

defineOptions({
  name: 'LoginIndex',
});
</script>
<style lang="less" scoped>
@import './index.less';
</style>
