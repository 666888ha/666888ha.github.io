<template>
  <div class="customer-detail-container">
    <!-- 顶部客户信息区域 -->
    <t-card :bordered="false" class="header-card">
      <div class="customer-header">
        <div class="header-left">
          <div class="company-name">
            <h2>{{ customerInfo.companyName }}</h2>
            <t-dropdown :options="customerTypeOptions" trigger="click" @click="handleCustomerTypeChange">
              <t-button variant="text" theme="primary">
                {{ customerInfo.customerType }}
                <t-icon name="chevron-down" />
              </t-button>
            </t-dropdown>
          </div>
          <div class="basic-info">
            <span>客户归属: {{ customerInfo.owner }}</span>
            <span>首联系人: {{ customerInfo.primaryContact }}</span>
            <span>登记时间: {{ customerInfo.registrationTime }}</span>
          </div>
        </div>
        <div class="header-right">
          <t-button variant="text" theme="default" @click="handlePrev">
            <t-icon name="chevron-left" />
          </t-button>
          <t-button variant="text" theme="default" @click="handleNext">
            <t-icon name="chevron-right" />
          </t-button>
        </div>
      </div>
    </t-card>

    <!-- 操作按钮区域 -->
    <div class="action-buttons">
      <t-button theme="primary" variant="outline" @click="clickOper(1)">
        <template #icon>
          <t-icon name="edit" />
        </template>
        写新跟进
      </t-button>
      <t-button theme="default" variant="outline" @click="clickOper(2)">
        <template #icon>
          <t-icon name="swap" />
        </template>
        转移客户
      </t-button>
      <t-button theme="default" variant="outline" @click="clickOper(3)">
        <template #icon>
          <t-icon name="usergroup" />
        </template>
        {{ getPublicSeaButtonText() }}
      </t-button>
      <t-button theme="default" variant="outline" @click="clickOper(4)">
        <template #icon>
          <t-icon name="file-add" />
        </template>
        添加协作
      </t-button>
      <t-button theme="default" variant="outline" @click="clickOper(5)">
        <template #icon>
          <t-icon name="edit-1" />
        </template>
        编辑客户
      </t-button>
      <t-button theme="default" variant="outline" @click="clickOper(6)">
        <template #icon>
          <t-icon name="delete" />
        </template>
        删除客户
      </t-button>
    </div>

    <!-- 工作流进度条 -->
    <div class="workflow-section">
      <div class="workflow-steps">
        <div
          v-for="(step, index) in workflowSteps"
          :key="index"
          class="workflow-step"
          :class="{ active: step.active, completed: step.completed }"
        >
          <div class="step-circle">{{ index + 1 }}</div>
          <div class="step-label">{{ step.label }}</div>
        </div>
      </div>
    </div>

    <!-- 标签页内容 -->
    <t-tabs v-model="activeTab" class="detail-tabs">
      <t-tab-panel value="basic" label="基本信息" :destroy-on-hide="false">
        <base-details ref="baseDetailsRef" @switch-tab="handleSwitchTab" />
      </t-tab-panel>
      <t-tab-panel value="materialDetails" label="资料详情">
        <material-details ref="materialDetailsRef" />
      </t-tab-panel>
      <t-tab-panel value="contacts" label="相关联系人">
        <contact />
      </t-tab-panel>
      <t-tab-panel value="related" label="相关客户">
        <related-customers />
      </t-tab-panel>
      <t-tab-panel value="followUp" label="跟进记录">
        <follow-up-record />
      </t-tab-panel>
      <t-tab-panel value="workOrder" label="工单记录">
        <work-order-record />
      </t-tab-panel>
      <t-tab-panel value="quotation" label="报价记录">
        <quotate-record />
      </t-tab-panel>
      <t-tab-panel value="contract" label="合同记录">
        <contract />
      </t-tab-panel>
      <t-tab-panel value="invoice" label="发票记录">
        <invoice-recode />
      </t-tab-panel>
      <t-tab-panel value="expense" label="费用记录">
        <free />
      </t-tab-panel>
      <t-tab-panel value="ownership" label="归属记录">
        <onership-records />
      </t-tab-panel>
      <t-tab-panel value="operation" label="操作日志">
        <operate-record />
      </t-tab-panel>
    </t-tabs>
    <!-- 转移客户 -->
    <transformCustomer ref="transformsCustomer" @success="handleTransferSuccess" />
    <!-- 移入/移出公海 -->
    <moveToPublicSea
      ref="moveSea"
      :is-multiple="false"
      :customer-status="customerDetailData?.customer_status"
      :owner-user-id="customerDetailData?.owner_user_id"
      @success="handlePublicSeaSuccess"
    />
    <!-- 添加协作 -->
    <collaboration ref="collaborations" />
  </div>
</template>
<script setup lang="ts">
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { deleteCustomer, getCustomerDetail, getCustomerList } from '@/api/customer/customer';
import { getDictOptions } from '@/api/dic';

import baseDetails from './components/baseDetails.vue';
import Contact from './components/contact.vue';
import Contract from './components/contract.vue';
import FollowUpRecord from './components/followUpRecord.vue';
import Free from './components/free.vue';
import InvoiceRecode from './components/invoiceRecode.vue';
import materialDetails from './components/materialDetails.vue';
// import NewFollowUpDialog from './components/newFollowUpDialog.vue';
import OnershipRecords from './components/onershipRecords.vue';
import OperateRecord from './components/operateRecord.vue';
import QuotateRecord from './components/quotateRecord.vue';
import RelatedCustomers from './components/relatedCustomers.vue';
import WorkOrderRecord from './components/workOrderRecord.vue';

defineOptions({
  name: 'CustomerDetail',
});
const transformCustomer = defineAsyncComponent(() => import('../../components/transferCustomersDialog.vue'));
const moveToPublicSea = defineAsyncComponent(() => import('../../components/openSeaDialog.vue'));
const collaboration = defineAsyncComponent(() => import('../components/addCollaborateDialog.vue'));
const moveSea = ref(null);
const transformsCustomer = ref(null);
const collaborations = ref(null);
const baseDetailsRef = ref<any>(null);
const materialDetailsRef = ref<any>(null);
const currentId = ref();
const route = useRoute();
const router = useRouter();
// 表格数据
const tableData = ref([]);
// 当前激活的标签页
const activeTab = ref('basic');
// 客户信息
const customerInfo = ref({
  companyName: '',
  customerType: '',
  owner: '',
  primaryContact: '',
  registrationTime: '',
});

// 客户详情数据
const customerDetailData = ref<any>(null);

// 客户类型选项
const customerTypeOptions = ref([]);

// 工作流步骤
const workflowSteps = ref([
  { label: '锁单', active: true, completed: true },
  { label: '跟进', active: false, completed: false },
  { label: '报价', active: false, completed: false },
  { label: '合同', active: false, completed: false },
]);

// 客户类型变更
const handleCustomerTypeChange = (data: any) => {
  customerInfo.value.customerType = data.content;
  // 这里可以添加调用API更新客户类型的逻辑
};

// 计算属性：当前在列表中的索引
const currentIndex = computed(() => {
  const index = tableData.value.findIndex((item) => item.id === Number(currentId.value));
  return index === -1 ? 0 : index;
});

// 计算属性：是否是第一个
const isFirst = computed(() => currentIndex.value === 0);

// 计算属性：是否是最后一个
const isLast = computed(() => currentIndex.value === tableData.value.length - 1);
// 切换到上一个
const handlePrev = () => {
  if (isFirst.value) {
    MessagePlugin.info('已经是第一个客户了');
    return;
  }
  const newIndex = currentIndex.value - 1;
  router.push({
    path: '/customerMange/customer/detail',
    query: { id: tableData.value[newIndex].id },
  });
};

// 切换到下一个
const handleNext = () => {
  if (isLast.value) {
    MessagePlugin.warning('已经是最后一个客户了');
    return;
  }
  const newIndex = currentIndex.value + 1;
  router.push({
    path: '/customerMange/customer/detail',
    query: { id: tableData.value[newIndex].id },
  });
};
// 根据value值获取对应的content
const getCustomerTypeContent = (value: string) => {
  if (!value) return '';
  const option = customerTypeOptions.value.find((item: any) => item.value === value);
  return option?.content || value;
};
// 加载表格数据
const loadTableData = async () => {
  try {
    // 构建请求参数
    const params: any = {
      page: 1,
      limit: 1000,
    };
    const response = await getCustomerList(params);
    if (response.code === 0 || response.code === 200) {
      const data = response.data || {};
      const list = data.list || [];
      // 转换数据格式
      tableData.value = list;
    } else {
      tableData.value = [];
    }
  } catch (error: any) {
    tableData.value = [];
  }
};
const clickOper = (type: number, row) => {
  switch (type) {
    case 1: // 写新跟进
      router.push({ path: '/customerMange/customer/followUpCustomer', query: { id: currentId.value } });
      break;
    case 2: // 转移客户
      transformsCustomer.value.show(currentId.value);
      break;
    case 3: {
      // 移入/移出公海
      const customerStatus = customerDetailData.value?.customer_status || 1;
      const ownerUserId = customerDetailData.value?.owner_user_id;
      moveSea.value.show(currentId.value, customerStatus, ownerUserId);
      break;
    }
    case 4: // 添加协作
      collaborations.value.show(currentId.value);
      break;
    case 5: // 编辑客户
      router.push({
        path: '/customerMange/customer/edit',
        query: { id: currentId.value },
      });
      break;
    case 6: // 删除客户
      onDialogPluginConfirm();
      break;
  }
};
// 删除客户
const onDialogPluginConfirm = () => {
  const customerId = currentId.value;
  const customerName = customerDetailData.value?.customer_name || customerInfo.value?.companyName || '该客户';

  const dialog = DialogPlugin.confirm({
    header: '确认删除',
    body: `确定要删除客户"${customerName}"吗？删除后无法恢复。`,
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const response = await deleteCustomer(customerId);
        if (response.code === 0 || response.code === 200) {
          MessagePlugin.success('删除成功');
          dialog.hide();
          // 删除成功后跳转到客户列表页面
          router.push('/customerMange/customer');
        } else {
          MessagePlugin.error(response.message || response.msg || '删除失败');
        }
      } catch (error: any) {
        console.error('删除客户失败:', error);
        MessagePlugin.error(error.message || '删除失败，请重试');
      }
    },
  });
};

// 监听标签页切换，当切换回基本信息时重新设置数据
watch(
  () => activeTab.value,
  async (newTab) => {
    if ((newTab === 'materialDetails' || newTab === 'basic') && customerDetailData.value) {
      // 切换回基本信息时，重新设置数据
      // 使用 setTimeout 确保组件已经重新渲染完成
      await nextTick();
      setTimeout(() => {
        if (baseDetailsRef.value) {
          baseDetailsRef.value.setCustomerData(customerDetailData.value);
        }
        if (materialDetailsRef.value) {
          materialDetailsRef.value.setCustomerData(customerDetailData.value);
        }
      }, 100);
    }
  },
);
const handleSwitchTab = (tab: string) => {
  activeTab.value = tab;
};
// 初始化：根据 id 加载客户信息，并根据路由参数设置初始标签页
onMounted(() => {
  const { id: queryId, tab } = route.query;
  currentId.value = queryId;
  loadTableData();
  if (currentId.value) {
    // 根据 id 加载客户详细信息
    loadCustomerDetail(currentId.value as string);
    // 如果路由上带了 tab 参数，则切换到对应标签页
    if (typeof tab === 'string' && tab) {
      activeTab.value = tab;
    }
  } else {
    MessagePlugin.warning('缺少客户ID参数');
    router.push('/customerMange/customer');
  }
});
// 加载客户类型字典选项
const loadCustomerTypeOptions = async () => {
  // 如果正在加载或已有数据，则不再请求
  if (customerTypeOptions.value.length > 0) {
    return;
  }
  try {
    const response = await getDictOptions('customer_type');
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      // 转换为选项格式
      customerTypeOptions.value = data.map((item: any) => ({
        content: item.label || '',
        value: String(item.value || ''),
      }));
      console.log('customerTypeOptions', customerTypeOptions.value);
    }
  } catch (error: any) {
    console.error('获取客户类型字典失败:', error);
    MessagePlugin.error('获取客户类型字典失败，请重试');
    // 如果接口失败，使用默认选项
    customerTypeOptions.value = [
      { content: '终端客户', value: 'end' },
      { content: '经销商客户', value: 'dealer' },
      { content: '其他客户', value: 'other' },
    ];
  }
};
// 加载客户详情
const loadCustomerDetail = async (id: string) => {
  try {
    const response = await getCustomerDetail(id);
    if (response.code === 0 || response.code === 200) {
      const data = response.data || {};
      customerDetailData.value = data;
      // 确保客户类型选项已加载
      if (customerTypeOptions.value.length === 0) {
        await loadCustomerTypeOptions();
      }
      // 更新客户信息显示
      customerInfo.value = {
        companyName: data.customer_name || '',
        customerType: getCustomerTypeContent(data.customer_type || ''),
        owner: data.owner_name || '',
        primaryContact:
          data.contacts && data.contacts.length > 0
            ? data.contacts.find((c: any) => c.is_main === 1)?.contact_name || data.contacts[0]?.contact_name || ''
            : '',
        registrationTime: data.create_time || '',
      };

      // 传递数据给子组件（使用 nextTick 确保组件已挂载）
      await nextTick();
      if (baseDetailsRef.value) {
        baseDetailsRef.value.setCustomerData(data);
      }
    } else {
      MessagePlugin.error(response.msg || '获取客户详情失败');
      router.push('/customerMange/customer');
    }
  } catch (error: any) {
    console.error('加载客户详情失败:', error);
    MessagePlugin.error(error.message || '获取客户详情失败，请重试');
    router.push('/customerMange/customer');
  }
};

// 获取公海按钮文本
const getPublicSeaButtonText = () => {
  const status = customerDetailData.value?.customer_status || 1;
  // 客户状态：1-正常，2-公海，3-垃圾
  return status === 2 ? '移出公海' : '移入公海';
};

// 处理转移客户成功
const handleTransferSuccess = () => {
  // 重新加载客户详情
  if (currentId.value) {
    loadCustomerDetail(currentId.value as string);
  }
};

// 处理移入/移出公海成功
const handlePublicSeaSuccess = () => {
  // 重新加载客户详情
  if (currentId.value) {
    loadCustomerDetail(currentId.value as string);
  }
};
</script>
<style lang="less" scoped>
.customer-detail-container {
  padding: 20px;
  background: #fff;
  min-height: 100vh;
}

.header-card {
  margin-bottom: 16px;

  :deep(.t-card__body) {
    padding: 20px 24px;
  }
}

.customer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .header-left {
    flex: 1;

    .company-name {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--td-text-color-primary);
      }

      .t-button {
        padding: 4px 8px;
        font-size: 14px;
      }
    }

    .basic-info {
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: var(--td-text-color-secondary);

      span {
        white-space: nowrap;
      }
    }
  }

  .header-right {
    display: flex;
    gap: 8px;

    .t-button {
      width: 32px;
      height: 32px;
      padding: 0;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  .t-button {
    :deep(.t-icon) {
      margin-right: 4px;
    }
  }
}

.workflow-section {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--td-bg-color-container);
  border-radius: 4px;

  .workflow-steps {
    display: flex;
    justify-content: space-between;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 16px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--td-component-border);
      z-index: 0;
    }

    .workflow-step {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex: 1;

      .step-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--td-bg-color-component);
        border: 2px solid var(--td-component-border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: var(--td-text-color-placeholder);
        transition: all 0.3s;
      }

      .step-label {
        font-size: 14px;
        color: var(--td-text-color-placeholder);
        transition: color 0.3s;
      }

      &.active,
      &.completed {
        .step-circle {
          background: var(--td-brand-color);
          border-color: var(--td-brand-color);
          color: #fff;
        }

        .step-label {
          color: var(--td-text-color-primary);
        }
      }
    }
  }
}

.detail-tabs {
  :deep(.t-tabs__content) {
    padding-top: 20px;
  }
}

.empty-content {
  padding: 40px;
  text-align: center;
  color: var(--td-text-color-placeholder);
}
</style>
