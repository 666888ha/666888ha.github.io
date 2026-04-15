<template>
  <div class="modify-avatar-container">
    <div class="avatar-upload-area">
      <base-upload
        v-model="fileList"
        :upload-action="uploadAction"
        :multiple="false"
        theme="image"
        accept="image/*"
        tips="选择一张个人正面照片作为头像"
        :allowed-types="['.jpg', '.jpeg', '.png', '.gif']"
        :max-size="5"
      />
    </div>
    <div class="button-area">
      <t-button type="primary" :loading="uploading" @click="submitUpload">提交头像</t-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { UploadFile } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref } from 'vue';

import { submitAvatarUrl } from '@/api/system/user';
import BaseUpload from '@/components/BaseUpload/index.vue';
import { useUserStore } from '@/store';
// 获取环境变量
const uploadAction = ref('/api/dict/upload');
// 文件列表
const fileList = ref<UploadFile[]>([]);
const uploading = ref(false);

// 用户状态管理
const userStore = useUserStore();

// 提交上传
const submitUpload = async () => {
  if (fileList.value.length === 0) {
    MessagePlugin.warning('请先选择一张头像');
    return;
  }

  uploading.value = true;

  try {
    // 调用上传接口
    console.log(fileList.value);
    const res = await submitAvatarUrl(fileList.value[0].url);
    if (res?.code === 0 || res?.code === 200) {
      MessagePlugin.success('头像修改成功');
      // 更新用户状态中的头像，同步到导航头部
      const avatarUrl = fileList.value[0].url;
      userStore.updateAvatar(avatarUrl);
    } else {
      MessagePlugin.error(res?.msg || res?.message || '上传失败，请重试');
    }
  } catch (error: any) {
    MessagePlugin.error(error?.message || '头像上传失败，请重试');
  } finally {
    uploading.value = false;
  }
};
</script>
<style scoped>
.modify-avatar-container {
  margin: 0 auto;
  padding: 40px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.page-header {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 40px;
  color: #333;
}

.avatar-upload-area {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.avatar-upload :deep(.t-upload__trigger-container) {
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-trigger {
  width: 100%;
  height: 100%;
  border: 2px dashed #d9d9d9;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-trigger:hover {
  border-color: #1890ff;
  background-color: rgba(24, 144, 255, 0.05);
}

.upload-trigger .t-icon {
  color: #d9d9d9;
  margin-bottom: 16px;
}

.upload-tip {
  font-size: 14px;
  color: #999;
  text-align: center;
  padding: 0 20px;
}

.button-area {
  display: flex;
  justify-content: center;
}

.button-area .t-button {
  width: 120px;
  height: 40px;
  font-size: 16px;
}
::v-deep(.t-upload__card) {
  text-align: center;
}
</style>