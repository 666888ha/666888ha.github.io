<template>
  <div class="follow-up-customer-container">
    <t-card :bordered="false" class="form-card">
      <t-form ref="formRef" :data="formData" :rules="formRules" :label-width="120" @submit="handleSubmit">
        <t-row :gutter="[24, 24]" style="margin-bottom: 20px">
          <!-- 关联客户 -->
          <t-col :span="12">
            <t-form-item label="关联客户" name="customer_id" required-mark>
              <t-select
                v-model="formData.customer_id"
                placeholder="请选择关联客户"
                clearable
                filterable
                :disabled="isEdit"
                style="width: 100%"
                @change="handleCustomerChange"
              >
                <t-option v-for="item in customerOptions" :key="item.value" :value="item.value" :label="item.label" />
              </t-select>
            </t-form-item>
          </t-col>

          <!-- 拜访人（联系人） -->
          <t-col :span="12">
            <t-form-item label="拜访人" name="main_visitor">
              <t-select
                v-model="formData.main_visitor"
                placeholder="请选择拜访人"
                clearable
                @change="handleVisitorChange"
              >
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
              <t-input v-model="formData.visitor_identity" placeholder="拜访人身份" />
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
                  <span class="punch-tip"> 点击插卡打卡与拍照详情 仅可拍照,不可从本地上传</span>
                </div>
              </div>
            </t-form-item>
          </t-col>
        </t-row>

        <!-- 表单操作按钮 -->
        <t-form-item class="form-actions">
          <t-space>
            <t-button theme="primary" type="submit"> 提交 </t-button>
            <t-button theme="default" variant="outline" type="button" @click="handleReset"> 重置 </t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-card>
  </div>
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

defineOptions({
  name: 'FollowUpCustomer',
});

const props = defineProps<{
  // 跟进记录ID，编辑时由上层传入
  queryId?: string;
  type?: string; // 1新增2,编辑3客户列表跟进
  // 可选：提交成功后的回调（弹框内使用时关闭弹框）
  onSuccess?: () => void;
}>();

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstanceFunctions>();
const isEdit = ref(false);
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
        win_rate: formData.value.win_rate,
      };
      if (props.type === '2') {
        // 编辑跟进
        res = await editFollow({
          id: props.queryId,
          ...requestData,
        });
      } else {
        // 新增跟进
        res = await addFollowUp(requestData);
      }
      if (res.code === 0 || res.code === 200) {
        MessagePlugin.success(props.type === '2' ? '跟进信息编辑成功' : '跟进信息提交成功');
        // 提交成功：若有自定义成功回调（弹框场景），优先执行回调；否则返回上一页
        if (props.onSuccess) {
          props.onSuccess();
        } else {
          router.back();
        }
      } else {
        MessagePlugin.error(res.msg || (props.type === '2' ? '跟进信息编辑失败' : '跟进信息提交失败'));
      }
    } catch (error) {
      console.error('提交跟进信息失败:', error);
      MessagePlugin.error('提交跟进信息失败，请重试');
    }
  } else {
    MessagePlugin.warning(firstError || '请完善表单信息');
  }
};

// 重置表单
const handleReset = () => {
  if (isEdit.value) {
    // 编辑模式：保留关联客户等基础信息，只清空可编辑字段
    formData.value.main_visitor = '';
    formData.value.visitor_identity = '';
    formData.value.follow_type = '';
    formData.value.follow_content = '';
    formData.value.win_rate = undefined;
    formData.value.departureTime = '';
    formData.value.arrivalTime = '';
    formData.value.leaveTime = '';
  } else {
    formData.value = {
      customer_id: '',
      main_visitor: '',
      visitor_identity: '',
      follow_type: '',
      follow_content: '',
      win_rate: undefined,
      departureTime: '',
      arrivalTime: '',
      leaveTime: '',
    };
  }
  MessagePlugin.info('表单已重置');
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

// 处理关联客户变化
const handleCustomerChange = (value: string | number) => {
  // 清空拜访人及拜访人身份的选择
  formData.value.main_visitor = '';
  formData.value.visitor_identity = '';
  // 如果选择了客户，获取联系人列表
  if (value) {
    fetchContactList(String(value));
  } else {
    // 如果清空了选择，清空联系人列表
    visitorcontactOptions.value = [];
  }
};

// 处理拜访人选择变化：根据联系人信息和 customer_id 自动带出拜访人身份（role）
const handleVisitorChange = (value: string | number) => {
  if (!value) {
    formData.value.visitor_identity = '';
    return;
  }
  const currentCustomerId = String(formData.value.customer_id || '');
  const target = (visitorcontactOptions.value as any[]).find(
    (item) => String(item.value) === String(value) && String(item.customer_id || '') === currentCustomerId,
  );
  formData.value.visitor_identity = target?.role || '';
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
// 出发打卡
const handleDepartPunch = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  formData.value.departureTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  MessagePlugin.success('出发打卡成功');
};

// 到达打卡
const handleArrivePunch = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  formData.value.arrivalTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  MessagePlugin.success('到达打卡成功');
};

// 离开打卡拍照
const handleLeavePunch = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  formData.value.leaveTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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

// 初始化：加载基础数据；编辑详情在下面的 watch 中根据 props 触发
onMounted(() => {
  const { id } = route.query;
  // 加载客户列表、主要负责人、跟进类型
  contactCustomerList();
  fetchMainResponsibleList();
  loadFollowTypeOptions();

  // 仅新增场景使用路由上的 id 预选关联客户
  if (props.type !== '2') {
    if (props.type === '3') {
      isEdit.value = true;
    }
    if (id) {
      formData.value.customer_id = String(id);
      fetchContactList(String(id));
    }
  }
});

// 监听外部传入的编辑类型和跟进ID（用于弹框内编辑场景）
watch(
  () => [props.type, props.queryId],
  ([newType, newQueryId]) => {
    if (newType === '2' && newQueryId) {
      // 编辑模式：根据外部传入的跟进ID加载详情
      isEdit.value = true;
      loadFollowDetail(String(newQueryId));
    }
  },
);
</script>
<style lang="less" scoped>
.follow-up-customer-container {
  padding: 40px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0px 2px 3px 0px rgba(0, 0, 0, 0.1);
}

.form-card {
  :deep(.t-card__body) {
    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl);
  }
}

.input-with-dropdown-wrapper {
  position: relative;
  width: 100%;

  .dropdown-icon {
    cursor: pointer;
    color: var(--td-text-color-placeholder);

    &:hover {
      color: var(--td-brand-color);
    }
  }
}

.input-with-add-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;

  :deep(.t-input),
  :deep(.t-select) {
    flex: 1;
  }

  .add-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--td-bg-color-container-select);
    border: 1px solid var(--td-component-border);
    flex-shrink: 0;

    .t-icon {
      color: var(--td-text-color-secondary);
    }

    &:hover {
      background: var(--td-bg-color-container-hover);
      border-color: var(--td-brand-color);

      .t-icon {
        color: var(--td-brand-color);
      }
    }
  }
}

.form-tip {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  margin-top: 4px;
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
}

.form-actions {
  margin-top: var(--td-comp-margin-xxl);
  padding-top: 20px;
  border-top: 1px dashed var(--td-component-border);
}
</style>
