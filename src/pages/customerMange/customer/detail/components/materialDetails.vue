<template>
  <div class="material-details">
    <!-- 基本信息 -->
    <t-card :bordered="false" class="info-card">
      <div class="section-header">
        <span class="section-title">基本信息</span>
        <div class="header-actions">
          <t-button theme="primary" variant="outline" @click="handleEdit">
            <template #icon>
              <t-icon name="edit" />
            </template>
            编辑
          </t-button>
        </div>
      </div>
      <base-desc label-width="150px">
        <t-row type="flex">
          <base-desc-item label="客户名称">{{ customerData.customerName }}</base-desc-item>
          <base-desc-item label="助记名称">{{ customerData.mnemonicName || '-' }}</base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="客户类型">{{ customerData.customerType }}</base-desc-item>
          <base-desc-item label="所属行业">{{ customerData.industry }}</base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="客户星级">
            <t-rate :value="customerData.valueLevel" :count="5" disabled allow-half
          /></base-desc-item>
          <base-desc-item label="客户来源"> {{ customerData.customerSource }} </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="客户状态">{{ customerData.customerStatus }}</base-desc-item>
          <base-desc-item label="客户归属">
            {{ customerData.customerOwner }}
            <span v-if="customerData.isLocked" class="locked-info">
              (已锁定,到期时间{{ customerData.protectionExpiry }})
            </span>
          </base-desc-item>
        </t-row>
      </base-desc>
    </t-card>

    <!-- 附加信息 -->
    <t-card :bordered="false" class="info-card">
      <div class="section-header">
        <span class="section-title">附加信息</span>
      </div>
      <base-desc label-width="150px">
        <t-row type="flex">
          <base-desc-item label="所在地区">{{ customerData.region }}</base-desc-item>
          <base-desc-item label="详细地址">{{ customerData.address }}</base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="企业规模">{{ customerData.registeredCapital }}</base-desc-item>
          <base-desc-item label="相关客户">
            <t-link theme="primary" @click="handleViewParentCustomer">
              {{ customerData.parentCustomer }}
            </t-link>
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="备注信息">{{ customerData.remark || '-' }}</base-desc-item>
        </t-row>
      </base-desc>
    </t-card>

    <!-- 财务信息 -->
    <t-card :bordered="false" class="info-card">
      <div class="section-header">
        <span class="section-title">财务信息</span>
      </div>
      <base-desc label-width="150px">
        <t-row type="flex">
          <base-desc-item label="已成交金额">{{ formatMoney(financialData.transactionAmount) }}</base-desc-item>
          <base-desc-item label="已回款金额">{{ formatMoney(financialData.amountReceived) }}</base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="已开票金额">{{ formatMoney(financialData.invoicedAmount) }}</base-desc-item>
          <base-desc-item label="未开票金额">{{ formatMoney(financialData.uninvoicedAmount) }}</base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="潜在交易金额">{{
            formatMoney(financialData.potentialTransactionAmount)
          }}</base-desc-item>
          <base-desc-item label="费用总金额">{{ formatMoney(financialData.totalExpenses) }}</base-desc-item>
        </t-row>
      </base-desc>
    </t-card>

    <!-- 系统信息 -->
    <t-card :bordered="false" class="info-card">
      <div class="section-header">
        <span class="section-title">系统信息</span>
      </div>
      <base-desc label-width="150px">
        <t-row type="flex">
          <base-desc-item label="系统编号">{{ systemData.systemId }}</base-desc-item>
          <base-desc-item label="协作人员">
            <span v-for="(person, index) in systemData.collaborators" :key="index">
              {{ person }}<span v-if="index < systemData.collaborators.length - 1">, </span>
            </span>
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="所属部门">{{ systemData.department }}</base-desc-item>
          <base-desc-item label="创建人员">{{ systemData.creator }}</base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="前归属人">{{ systemData.previousOwner }}</base-desc-item>
          <base-desc-item label="前所属部门">{{ systemData.previousDepartment }}</base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="创建时间">{{ systemData.creationTime }}</base-desc-item>
          <base-desc-item label="更新时间">{{ systemData.updateTime }}</base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="最后跟进">{{ systemData.lastFollowUp }}</base-desc-item>
          <base-desc-item label="下次跟进">{{ systemData.nextFollowUp }}</base-desc-item>
        </t-row>
      </base-desc>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, ref } from 'vue';
import { useRouter } from 'vue-router';

defineOptions({
  name: 'MaterialDetails',
});

const router = useRouter();

const BaseDescItem = defineAsyncComponent(() => import('@/components/BaseDescItem/index.vue'));
const BaseDesc = defineAsyncComponent(() => import('@/components/BaseDesc/index.vue'));

// 附加信息
const additionalData = ref({
  region: '广东省深圳市',
  detailedAddress: '罗湖区泥岗东路',
  companySize: '10-20人',
  parentCustomer: '深圳市亿恩科技有限公司',
  subordinateCustomers: '10',
  remarks: '',
});

// 财务信息
const financialData = ref({
  transactionAmount: 10000.0,
  amountReceived: 10000.0,
  invoicedAmount: 10000.0,
  uninvoicedAmount: 10000.0,
  potentialTransactionAmount: 10000.0,
  totalExpenses: 10000.0,
});

// 系统信息
const systemData = ref({
  systemId: 'KH20250324010001',
  collaborators: ['李小明', '陈小红', '曾小芳'],
  department: '销售一部',
  creator: '赵小刚',
  previousOwner: '赵小刚',
  previousDepartment: '销售一部',
  creationTime: '2025-03-15 17:27',
  updateTime: '2025-03-15 17:27',
  lastFollowUp: '2025-03-15 17:27',
  nextFollowUp: '2025-03-15 17:27',
});

// 格式化金额
const formatMoney = (amount: number) => {
  return `¥ ${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// 编辑
const handleEdit = () => {
  router.push({
    path: '/customerMange/customer/edit',
    query: { id: router.currentRoute.value.query.id },
  });
};

// 查看上级客户
const handleViewParentCustomer = () => {
  MessagePlugin.info('查看上级客户详情');
};
// 客户数据
const customerData = ref({
  customerName: '',
  systemNumber: '',
  customerType: '',
  industry: '',
  valueLevel: 0,
  customerSource: '',
  customerStatus: '',
  customerOwner: '',
  region: '',
  address: '',
  registeredCapital: '',
  companyScale: '',
  remark: '',
  isLocked: false,
  protectionExpiry: '',
});
// 设置客户数据（从父组件调用）
const setCustomerData = (data: any) => {
  // 更新客户数据
  customerData.value = {
    customerName: data.customer_name || '',
    systemNumber: data.id ? String(data.id) : '',
    customerType: data.customer_type || '',
    industry: data.industry || '',
    valueLevel: data.value_level || 0,
    customerSource: data.channel || '',
    customerStatus: getStatusText(data.customer_status),
    customerOwner: data.owner_name || '',
    region: data.region_name || '',
    address: data.address || '',
    registeredCapital: data.registered_capital || '',
    companyScale: data.company_scale || '',
    remark: data.remark || '',
    isLocked: false,
    protectionExpiry: '',
  };
};
// 获取状态文本
const getStatusText = (status: number | string) => {
  const statusMap: Record<number, string> = {
    1: '正常',
    2: '公海',
    3: '垃圾',
  };
  const statusNum = typeof status === 'string' ? Number(status) : status;
  return statusMap[statusNum] || '未知';
};
// 暴露方法给父组件
defineExpose({
  setCustomerData,
});
</script>
<style lang="less" scoped>
.material-details {
  .info-card {
    margin-bottom: 20px;

    :deep(.t-card__body) {
      padding: 20px 24px;
    }
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 600;
    color: var(--td-text-color-primary);

    .section-title {
      flex: 1;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .locked-info {
    color: var(--td-warning-color);
    margin-left: 4px;
    font-size: 14px;
  }
}
</style>
