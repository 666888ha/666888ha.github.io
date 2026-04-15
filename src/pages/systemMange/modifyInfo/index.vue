<template>
  <div class="modify-password-container">
    <t-card :bordered="false" class="form-card">
      <div class="form-header">
        <div class="header-left">
          <t-icon name="user" class="header-icon" />
          <h2>修改资料</h2>
        </div>
      </div>

      <t-form
        ref="formRef"
        :data="formData"
        :rules="formRules"
        label-align="top"
        :label-width="120"
        @submit="handleSubmit"
        @reset="handleReset"
      >
        <!-- 基本资料 -->
        <div class="form-section">
          <div class="section-title">
            <span>基本资料</span>
          </div>
          <t-row :gutter="[24, 24]">
            <t-col :span="6">
              <t-form-item label="员工姓名" name="employeeName">
                <t-input v-model="formData.employeeName" placeholder="员工姓名" />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="登录账号" name="loginAccount">
                <t-input v-model="formData.loginAccount" placeholder="登录账号" disabled />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="所属部门" name="department">
                <t-input v-model="formData.department" placeholder="所属部门" disabled />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="当前职位" name="position">
                <t-input v-model="formData.position" placeholder="当前职位" disabled />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="员工性别" name="gender">
                <t-radio-group v-model="formData.gender">
                  <t-radio value="male">男</t-radio>
                  <t-radio value="female">女</t-radio>
                  <t-radio value="other">保密</t-radio>
                </t-radio-group>
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="员工生日" name="birthday">
                <t-date-picker v-model="formData.birthday" placeholder="员工生日" />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="邮箱地址" name="address">
                <t-input v-model="formData.address" placeholder="邮箱地址" />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="手机号码" name="phone">
                <t-input v-model="formData.phone" placeholder="手机号码" />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="微信账号" name="wechat">
                <t-input v-model="formData.wechat" placeholder="微信账号" />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="座机号码" name="landline">
                <t-input v-model="formData.landline" placeholder="座机号码" />
              </t-form-item>
            </t-col>
          </t-row>
        </div>

        <!-- 更多信息 -->
        <div class="form-section">
          <div class="section-title">
            <span>更多信息</span>
          </div>
          <t-row :gutter="[24, 24]">
            <t-col :span="6">
              <t-form-item label="工号" name="employeeId">
                <t-input v-model="formData.employeeId" placeholder="工号" />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="籍贯" name="hometown">
                <t-input v-model="formData.hometown" placeholder="籍贯" />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="毕业院校" name="school">
                <t-input v-model="formData.school" placeholder="毕业院校" />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="毕业时间" name="graduationDate">
                <t-date-picker v-model="formData.graduationDate" placeholder="毕业时间" />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="学历" name="education">
                <t-select v-model="formData.education" placeholder="学历">
                  <t-option label="高中" value="highSchool" />
                  <t-option label="大专" value="juniorCollege" />
                  <t-option label="本科" value="undergraduate" />
                  <t-option label="硕士" value="master" />
                  <t-option label="博士" value="doctor" />
                </t-select>
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item label="所学专业" name="major">
                <t-input v-model="formData.major" placeholder="所学专业" />
              </t-form-item>
            </t-col>
            <t-col :span="12">
              <t-form-item label="备注" name="remark">
                <t-textarea v-model="formData.remark" placeholder="备注" :autosize="{ minRows: 4, maxRows: 8 }" />
              </t-form-item>
            </t-col>
          </t-row>
        </div>

        <!-- 表单操作按钮 -->
        <t-form-item class="form-actions">
          <t-space>
            <t-button theme="primary" type="submit" :loading="loading">提交</t-button>
            <t-button theme="default" variant="outline" type="reset" :disabled="loading">重置</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRules, SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { getEmployeeInfo } from '@/api/system/user';

const router = useRouter();
const formRef = ref<FormInstanceFunctions>();
const loading = ref(false);

// 用户头像
const userAvatar = ref('');

// 表单数据
const formData = ref({
  // 基本资料
  employeeName: '张三',
  loginAccount: 'zhangsan',
  department: '销售部',
  position: '销售经理',
  gender: 'male',
  birthday: '1990-01-01',
  address: '北京市朝阳区',
  phone: '13800138000',
  wechat: 'zhangsan123',
  landline: '010-88888888',
  // 更多信息
  employeeId: 'EMP001',
  hometown: '北京市',
  school: '北京大学',
  graduationDate: '2012-06-30',
  education: 'undergraduate',
  major: '计算机科学与技术',
  remark: '这是一个备注信息',
});

// 获取员工信息
const loadUserInfo = async () => {
  try {
    loading.value = true;

    // 从本地存储获取用户信息
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      MessagePlugin.error('未找到用户信息');
      return;
    }

    const userData = JSON.parse(userStr);
    const userInfo = userData.userInfo || {};
    const userId = userInfo.user_id;

    if (!userId) {
      MessagePlugin.error('未找到用户ID');
      return;
    }

    const response = await getEmployeeInfo(userId);
    if (response.code === 0 || response.code === 200) {
      const employeeInfo: any = response.data || {};
      // 填充用户信息到表单
      formData.value.employeeName = employeeInfo.real_name || '';
      formData.value.loginAccount = employeeInfo.loginAccount || employeeInfo.username || '';
      formData.value.department = employeeInfo.department || '';
      formData.value.position = employeeInfo?.role?.role_name || '';
      formData.value.gender = employeeInfo.gender || 'male';
      formData.value.birthday = employeeInfo.birthday || '';
      formData.value.address = employeeInfo.address || '';
      formData.value.phone = employeeInfo.phone || '';
      formData.value.wechat = employeeInfo.wechat || '';
      formData.value.landline = employeeInfo.landline || '';
      formData.value.employeeId = employeeInfo.employeeId || '';
      formData.value.hometown = employeeInfo.hometown || '';
      formData.value.school = employeeInfo.school || '';
      formData.value.graduationDate = employeeInfo.graduationDate || '';
      formData.value.education = employeeInfo.education || 'undergraduate';
      formData.value.major = employeeInfo.major || '';
      formData.value.remark = employeeInfo.remark || '';
      userAvatar.value = employeeInfo.avatar || '';
    }
  } catch (error: any) {
    console.error('获取用户信息失败:', error);
    MessagePlugin.error('获取用户信息失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 提交表单
const handleSubmit = async ({ validateResult, firstError }: SubmitContext) => {
  if (validateResult !== true) {
    MessagePlugin.warning(firstError || '请完善表单信息');
    return;
  }

  loading.value = true;
  try {
    // 从本地存储获取用户信息
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      MessagePlugin.error('未找到用户信息');
      return;
    }

    const userData = JSON.parse(userStr);
    const userInfo = userData.userInfo || {};
    const userId = userInfo.user_id;

    if (!userId) {
      MessagePlugin.error('未找到用户ID');
      return;
    }

    // 调用修改资料接口
    const response = await import('@/api/system/user').then((m) =>
      m.updateUserProfile({
        ...formData.value,
        id: userId,
      }),
    );

    if (response.code === 0 || response.code === 200) {
      MessagePlugin.success(response.msg || '资料修改成功');
    } else {
      MessagePlugin.error(response.msg || '资料修改失败');
    }
  } catch (error: any) {
    console.error('修改资料失败:', error);
    MessagePlugin.error(error.message || '资料修改失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 重置表单
const handleReset = () => {
  formData.value.employeeName = '';
  formData.value.gender = 'male';
  formData.value.birthday = '';
  formData.value.address = '';
  formData.value.wechat = '';
  formData.value.landline = '';
  formData.value.employeeId = '';
  formData.value.hometown = '';
  formData.value.school = '';
  formData.value.graduationDate = '';
  formData.value.education = 'undergraduate';
  formData.value.major = '';
  formData.value.remark = '';
  userAvatar.value = '';
  MessagePlugin.info('密码表单已重置');
};

onMounted(() => {
  // 加载用户信息
  loadUserInfo();
});
</script>
<style scoped lang="less">
.modify-password-container {
  padding: 20px;
  background: #fff;
}

.form-card {
  :deep(.t-card__body) {
    padding: 32px;
  }
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 1px dashed var(--td-component-border);

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 24px;
      color: var(--td-brand-color);
    }

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }
  }

  .user-avatar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    .user-name {
      font-size: 16px;
      font-weight: 500;
      color: var(--td-text-color-primary);
    }
  }
}

.form-section {
  margin-bottom: 32px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;

    .section-icon {
      font-size: 18px;
      color: var(--td-brand-color);
    }

    span {
      font-size: 16px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }
  }
}

.password-section {
  padding: 24px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-top: 40px;
}

.form-actions {
  padding-top: 20px;
  border-top: 1px dashed var(--td-component-border);
  display: flex;
  justify-content: flex-start;
}
</style>
