<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="新建跟进"
    width="680px"
    :close-on-overlay-click="false"
    :footer="false"
  >
    <template #body>
      <t-form ref="formRef" :data="formData" :rules="formRules" label-width="120px" @submit="handleSubmit">
        <t-row :gutter="[24, 24]" style="margin-bottom: 20px">
          <!-- 关联客户 -->
          <t-col :span="12">
            <t-form-item label="关联客户" name="customer_id" required-mark>
              <t-select
                v-model="formData.customer_id"
                placeholder="请选择关联客户"
                clearable
                filterable
                disabled
                style="width: 100%"
              >
                <t-option v-for="item in customerOptions" :key="item.value" :value="item.value" :label="item.label" />
              </t-select>
            </t-form-item>
          </t-col>

          <!-- 拜访人（联系人） -->
          <t-col :span="12">
            <t-form-item label="拜访人" name="main_visitor">
              <t-select v-model="formData.main_visitor" placeholder="请选择拜访人" clearable disabled>
                <t-option
                  v-for="item in visitorcontactOptions"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                />
              </t-select>
            </t-form-item>
          </t-col>

          <!-- 拜访人身份（由拜访人自动带出） -->
          <t-col :span="12">
            <t-form-item label="拜访人身份" name="visitor_identity" required-mark>
              <t-input v-model="formData.visitor_identity" placeholder="拜访人身份" disabled />
            </t-form-item>
          </t-col>

          <!-- 跟进类型 -->
          <t-col :span="12">
            <t-form-item label="跟进类型" name="follow_type" required-mark>
              <t-select
                v-model="formData.follow_type"
                placeholder="请选择跟进类型"
                clearable
                :options="followTypeOptions"
                :loading="loadingFollowType"
              />
            </t-form-item>
          </t-col>
          <!-- 成交几率 -->
          <t-col :span="12">
            <t-form-item label="成交几率" name="win_rate">
              <t-select
                v-model="formData.win_rate"
                placeholder="请选择成交几率"
                :options="dealProbabilityOptions"
                clearable
                style="width: 100%"
              />
            </t-form-item>
          </t-col>
          <!-- 跟进信息 -->
          <t-col :span="12">
            <t-form-item label="跟进信息" name="follow_content" required-mark>
              <t-textarea
                v-model="formData.follow_content"
                placeholder="请输入备注信息"
                :autosize="{ minRows: 4, maxRows: 6 }"
                :maxlength="300"
                show-word-limit
                style="width: 100%"
              />
            </t-form-item>
          </t-col>

          <!-- 打卡 -->
          <t-col :span="12">
            <t-form-item label="打卡" name="punchIn">
              <div class="punch-in-section">
                <div class="punch-buttons">
                  <t-button theme="primary" variant="outline" @click="handleDepartPunch">
                    <template #icon>
                      <t-icon name="refresh" />
                    </template>
                    出发打卡
                  </t-button>
                  <t-button theme="primary" variant="outline" @click="handleArrivePunch">
                    <template #icon>
                      <t-icon name="refresh" />
                    </template>
                    到达打卡
                  </t-button>
                  <t-button theme="primary" variant="outline" @click="handleLeavePunch">
                    <template #icon>
                      <t-icon name="refresh" />
                    </template>
                    离开打卡拍照
                  </t-button>
                </div>
                <div class="punch-info">
                  <span class="punch-tip">点击打卡将记录时间；可选择拍照上传（走系统相机），仅传图片链接到后台，勿用手动填本地路径。</span>
                </div>
                <div v-if="formData.departure_photo || formData.arrival_photo || formData.leave_photo" class="punch-previews">
                  <div v-if="formData.departure_photo">出发照片：<t-link theme="primary" :href="formData.departure_photo" target="_blank">打开</t-link></div>
                  <div v-if="formData.arrival_photo">到达照片：<t-link theme="primary" :href="formData.arrival_photo" target="_blank">打开</t-link></div>
                  <div v-if="formData.leave_photo">离开照片：<t-link theme="primary" :href="formData.leave_photo" target="_blank">打开</t-link></div>
                </div>
              </div>
            </t-form-item>
          </t-col>
        </t-row>

        <!-- 按钮区域 -->
        <t-form-item>
          <t-space>
            <t-button theme="default" @click="handleClose">取消</t-button>
            <t-button theme="primary" type="submit">保存</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRules, SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  addFollowUp,
  editFollow,
  getContactList,
  getCustomerList,
  getEmployeeList,
  getFollowDetail,
} from '@/api/customer/customer';
import { getDictOptions } from '@/api/dic';
import { formatNowDateTime, pickCameraImageFile, uploadDictImageToUrl } from '@/utils/followPunchUpload';

defineOptions({
  name: 'AddFollowUp',
});

const emit = defineEmits(['submit-success']);
const isEdit = ref(1);
const followId = ref('');
// 弹框显隐状态
const dialogVisible = ref(false);

// 表单引用
const formRef = ref(null);

// 表单数据
const formData = ref({
  customer_id: '',
  main_visitor: '',
  visitor_identity: '',
  follow_type: '',
  follow_content: '',
  win_rate: undefined as number | undefined,
  departureTime: '',
  arrivalTime: '',
  leaveTime: '',
  departure_photo: '',
  arrival_photo: '',
  leave_photo: '',
});

// 关联客户选项
const customerOptions = ref<Array<{ label: string; value: string }>>([]);

// 拜访人身份选项
const visitorIdentityOptions = ref([]);
const visitorcontactOptions = ref([]);
// 跟进类型选项
const followTypeOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingFollowType = ref(false);
// 成交几率选项
const dealProbabilityOptions = ref([
  { label: '10%', value: 10 },
  { label: '20%', value: 20 },
  { label: '30%', value: 30 },
  { label: '40%', value: 40 },
  { label: '50%', value: 50 },
  { label: '60%', value: 60 },
  { label: '70%', value: 70 },
  { label: '80%', value: 80 },
  { label: '90%', value: 90 },
  { label: '100%', value: 100 },
]);
// 表单验证规则
const formRules: FormRules = {
  customer_id: [{ required: true, message: '请选择关联客户', type: 'error' }],
  main_visitor: [{ required: true, message: '请输入主要拜访人', type: 'error' }],
  visitor_identity: [{ required: true, message: '请选择拜访人后自动带出的拜访人身份', type: 'error' }],
  follow_type: [{ required: true, message: '请选择跟进类型', type: 'error' }],
  follow_content: [{ required: true, message: '请输入跟进信息', type: 'error' }],
};
// 提交表单
const handleSubmit = async ({ validateResult, firstError }: SubmitContext) => {
  if (validateResult === true) {
    try {
      let res;
      // 构建请求数据
      const requestData: any = {
        customer_id: formData.value.customer_id,
        main_visitor: formData.value.main_visitor,
        visitor_identity: formData.value.visitor_identity,
        follow_type: formData.value.follow_type,
        follow_content: formData.value.follow_content,
        departure_time: formData.value.departureTime,
        arrival_time: formData.value.arrivalTime,
        leave_time: formData.value.leaveTime,
        departure_photo: formData.value.departure_photo,
        arrival_photo: formData.value.arrival_photo,
        leave_photo: formData.value.leave_photo,
        win_rate: formData.value.win_rate,
      };
      if (isEdit.value === 2) {
        // 编辑跟进
        res = await editFollow({
          id: followId.value,
          ...requestData,
        });
      } else {
        // 新增跟进
        res = await addFollowUp(requestData);
      }
      if (res.code === 0 || res.code === 200) {
        emit('submit-success');
        handleClose();
      }
    } catch (error) {
      console.error('提交跟进信息失败:', error);
      MessagePlugin.error('提交跟进信息失败，请重试');
    }
  } else {
    MessagePlugin.warning(firstError || '请完善表单信息');
  }
};
const handleClose = () => {
  dialogVisible.value = false;
};

// 获取主要负责人列表
const fetchMainResponsibleList = async () => {
  try {
    const res = await getEmployeeList({
      limit: 1000, // 获取所有员工
    });
    if (res.code === 0 || res.code === 200) {
      const list = res.data || [];
      visitorIdentityOptions.value = list.map((item: any) => ({
        label: item.real_name || '',
        value: item.id || '',
      }));
    } else {
      MessagePlugin.error(res.msg || '获取主要负责人失败');
      visitorIdentityOptions.value = [];
    }
  } catch (error) {
    console.error('获取主要负责人失败:', error);
    MessagePlugin.error('获取主要负责人失败');
    visitorIdentityOptions.value = [];
  }
};
// 加载跟进类型字典
const loadFollowTypeOptions = async () => {
  if (loadingFollowType.value || followTypeOptions.value.length > 0) {
    return;
  }
  loadingFollowType.value = true;
  try {
    const res = await getDictOptions('follow_type');
    if (res.code === 0 || res.code === 200) {
      const list = res.data || [];
      followTypeOptions.value = list;
    }
  } catch (error: any) {
    console.error('获取跟进类型失败:', error);
    MessagePlugin.error('获取跟进类型失败，请重试');
  } finally {
    loadingFollowType.value = false;
  }
};
// 获取联系人列表
const fetchContactList = async (customerId: string) => {
  if (!customerId) {
    visitorcontactOptions.value = [];
    return;
  }
  try {
    const res = await getContactList(customerId);
    if (res.code === 0 || res.code === 200) {
      const list = res.data.list || [];
      visitorcontactOptions.value = list.map((item: any) => ({
        label: item.contact_name || '',
        value: item.id || '',
        role: item.role,
        customer_id: String(item.customer_id || ''),
      }));
    } else {
      MessagePlugin.error(res.msg || '获取联系人列表失败');
      visitorcontactOptions.value = [];
    }
  } catch (error) {
    console.error('获取联系人列表失败:', error);
    MessagePlugin.error('获取联系人列表失败');
    visitorcontactOptions.value = [];
  }
};

// 获取关联客户列表
const contactCustomerList = async () => {
  try {
    const res = await getCustomerList({ limit: 1000 });
    if (res.code === 0 || res.code === 200) {
      const list = res.data.list || [];
      customerOptions.value = list.map((item: any) => ({
        label: item.customer_name || '',
        value: `${item.id}` || '',
      }));
    } else {
      MessagePlugin.error(res.msg || '获取关联客户失败');
      customerOptions.value = [];
    }
  } catch (error) {
    console.error('获取关联客户失败:', error);
    MessagePlugin.error('获取关联客户失败');
    customerOptions.value = [];
  }
};
// 出发打卡（时间 + 可选拍照 URL）
const handleDepartPunch = async () => {
  formData.value.departureTime = formatNowDateTime();
  const file = await pickCameraImageFile();
  if (file) {
    const url = await uploadDictImageToUrl(file);
    if (url) formData.value.departure_photo = url;
  }
  MessagePlugin.success('出发打卡成功');
};

// 到达打卡
const handleArrivePunch = async () => {
  formData.value.arrivalTime = formatNowDateTime();
  const file = await pickCameraImageFile();
  if (file) {
    const url = await uploadDictImageToUrl(file);
    if (url) formData.value.arrival_photo = url;
  }
  MessagePlugin.success('到达打卡成功');
};

// 离开打卡拍照
const handleLeavePunch = async () => {
  formData.value.leaveTime = formatNowDateTime();
  const file = await pickCameraImageFile();
  if (file) {
    const url = await uploadDictImageToUrl(file);
    if (url) formData.value.leave_photo = url;
  }
  MessagePlugin.success('离开打卡成功');
};
// 加载跟进详情（编辑）
const loadFollowDetail = async (followId: string) => {
  try {
    const res = await getFollowDetail(followId);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      // 映射接口字段到表单
      formData.value.customer_id = data.customer_id ? String(data.customer_id) : '';
      formData.value.main_visitor = data.main_visitor ? Number(data.main_visitor) : '';
      formData.value.visitor_identity = data.visitor_identity || '';
      formData.value.follow_type = data.follow_type || '';
      formData.value.follow_content = data.follow_content || '';
      formData.value.win_rate =
        data.win_rate !== undefined && data.win_rate !== null ? Number(data.win_rate) : undefined;
      formData.value.departureTime = data.departure_time || '';
      formData.value.arrivalTime = data.arrival_time || '';
      formData.value.leaveTime = data.leave_time || '';
      formData.value.departure_photo = data.departure_photo || '';
      formData.value.arrival_photo = data.arrival_photo || '';
      formData.value.leave_photo = data.leave_photo || '';

      // 关联客户变更后加载联系人列表
      if (formData.value.customer_id) {
        await fetchContactList(formData.value.customer_id);
      }
    } else {
      MessagePlugin.error(res.msg || '获取跟进详情失败');
    }
  } catch (error: any) {
    console.error('获取跟进详情失败:', error);
    MessagePlugin.error('获取跟进详情失败，请重试');
  }
};

// 显示弹框
const show = (data: any, type: number) => {
  isEdit.value = type; // 1:新增 2:编辑

  fetchContactList(data.customer_id);
  if (type === 2) {
    // 编辑
    followId.value = data.id || '';
    loadFollowDetail(String(data.id));
  } else {
    formData.value.customer_id = data.customer_id ? String(data.customer_id) : '';
    formData.value.visitor_identity = data.role ? String(data.role) : '';
    formData.value.main_visitor = data.id ? data.id : '';
  }

  // 加载客户列表、主要负责人、跟进类型
  contactCustomerList();
  fetchMainResponsibleList();
  loadFollowTypeOptions();
  dialogVisible.value = true;
};

defineExpose({
  show,
});
</script>
<style lang="less" scoped>
.form-item-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  flex: 1;

  .form-badge {
    position: relative;
    flex-shrink: 0;
  }

  .form-item-hint {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
    white-space: nowrap;
  }
}

.follow-up-info-wrapper {
  width: 100%;

  :deep(.t-textarea) {
    width: 100%;
  }
}

.clock-in-section {
  width: 100%;

  .clock-in-buttons {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;

    .t-button {
      flex: 1;
    }
  }

  .clock-in-details {
    padding: 12px;
    background: var(--td-bg-color-container);
    border-radius: 4px;
    border: 1px solid var(--td-component-border);

    .clock-in-info-text {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      color: var(--td-text-color-primary);
      margin-bottom: 8px;

      span {
        white-space: nowrap;
      }
    }

    .clock-in-hint {
      font-size: 12px;
      color: var(--td-text-color-placeholder);
      margin-top: 8px;
    }
  }
}

:deep(.t-form-item--required .t-form-item__label::before) {
  content: '*';
  color: var(--td-error-color);
  margin-right: 4px;
}

.punch-in-section {
  .punch-buttons {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;

    .t-button {
      :deep(.t-icon) {
        margin-right: 4px;
      }
    }
  }

  .punch-info {
    font-size: 14px;
    color: var(--td-text-color-secondary);
    line-height: 1.5;

    .punch-tip {
      color: var(--td-text-color-placeholder);
      margin-left: 8px;
    }
  }

  .punch-previews {
    margin-top: 8px;
    font-size: 12px;
    color: var(--td-text-color-secondary);
    line-height: 1.8;
  }
}
</style>
