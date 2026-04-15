<template>
  <div>
    <!-- 基本信息 -->
    <t-card :bordered="false" class="info-card">
      <div class="section-header">
        <h3>基本信息</h3>
      </div>
      <base-desc label-width="150px">
        <t-row type="flex">
          <base-desc-item label="合同主题">
            {{ contractDetail.contract_title || '-' }}
          </base-desc-item>
          <base-desc-item label="客户名称">
            <t-link
              v-if="contractDetail.customer_id"
              theme="primary"
              variant="text"
              @click="handleViewCustomer(contractDetail.customer_id)"
            >
              {{ contractDetail.customer_name || '-' }}
            </t-link>
            <span v-else>{{ contractDetail.customer_name || '-' }}</span>
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="报价单">
            <t-link
              v-if="contractDetail.quotation_id && contractDetail.quotation_id !== '0'"
              theme="primary"
              variant="text"
              @click="handleViewQuotation(contractDetail.quotation_id)"
            >
              报价单
            </t-link>
            <span v-else>-</span>
          </base-desc-item>
          <base-desc-item label="产品记录">
            <t-link
              v-if="contractDetail.products && contractDetail.products.length > 0"
              theme="primary"
              variant="text"
              @click="scrollToProducts"
            >
              {{ contractDetail.products?.length || 0 }}条
            </t-link>
            <span v-else>0条</span>
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="合同类型">
            {{ contractDetail.contract_type || '-' }}
          </base-desc-item>
          <base-desc-item label="签订时间">
            {{ formatDate(contractDetail.sign_date) || '-' }}
          </base-desc-item>
        </t-row>

        <t-row type="flex">
          <base-desc-item label="交货时间">
            {{ formatDate(contractDetail.delivery_date) || '-' }}
          </base-desc-item>
          <base-desc-item label="交货地点">
            {{ contractDetail.delivery_address || '-' }}
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="供方委托代理人">
            {{ contractDetail.our_signer || '-' }}
          </base-desc-item>
          <base-desc-item label="需方委托代理人">
            {{ contractDetail.customer_signer || '-' }}
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="归属人员">
            {{ contractDetail.owner_user_name || '-' }}
          </base-desc-item>
          <base-desc-item label="税率">
            {{ contractDetail.tax_rate || '13%' }}
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="不含税金额合计">
            {{ formatAmount(taxFreeAmount) }}
          </base-desc-item>
          <base-desc-item label="税额合计">
            {{ formatAmount(taxAmount) }}
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="含税金额合计">
            {{ formatAmount(totalAmount) }}
          </base-desc-item>
          <base-desc-item label="含税金额合计">
            {{ amountToChinese(totalAmount) }}
          </base-desc-item>
        </t-row>
        <base-desc-item label="付款方式">
          <div class="payment-plan-table">
            <table class="plan-table">
              <thead>
                <tr>
                  <th width="80">期次</th>
                  <th width="180">回款日期</th>
                  <th width="150">回款占比</th>
                  <th width="180">回款金额(元)</th>
                  <th width="150">回款阶段</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(stage, index) in contractDetail.payment_plan" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>
                    {{ stage.date ? formatDate(stage.date) : '-' }}
                  </td>
                  <td>
                    <div class="percentage-input">{{ stage.percentage || 0 }}</div>
                  </td>
                  <td>
                    {{ stage.amount ? formatAmount(stage.amount) : '-' }}
                  </td>
                  <td>
                    {{ stage.stage_name || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </base-desc-item>
      </base-desc>
    </t-card>

    <!-- 审批信息 -->
    <t-card :bordered="false" class="info-card">
      <div class="section-header">
        <h3>审批信息</h3>
      </div>
      <base-desc label-width="150px">
        <t-row type="flex">
          <base-desc-item label="提交人员">
            {{ contractDetail.owner_user_name || '-' }}
          </base-desc-item>
          <base-desc-item label="提交时间">
            {{ formatDateTime(contractDetail.create_time) || '-' }}
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="1级审批">
            {{ firstApprover || '-' }}
          </base-desc-item>
          <base-desc-item label="审批状态">
            {{ approvalStatusText }}
          </base-desc-item>
        </t-row>
        <base-desc-item label="通知他人">
          {{ notifyUsers || '-' }}
        </base-desc-item>
      </base-desc>
    </t-card>

    <!-- 系统信息 -->
    <t-card :bordered="false" class="info-card">
      <div class="section-header">
        <h3>系统信息</h3>
      </div>
      <base-desc label-width="150px">
        <t-row type="flex">
          <base-desc-item label="系统编号">
            {{ contractDetail.contract_no || '-' }}
          </base-desc-item>
          <base-desc-item label="协作人员">
            {{ collaborateUsers || '-' }}
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="所属部门">
            {{ contractDetail.department_name || '-' }}
          </base-desc-item>
          <base-desc-item label="创建人员">
            {{ contractDetail.create_user_name || '-' }}
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="前归属人">
            {{ contractDetail.previous_owner_name || '-' }}
          </base-desc-item>
          <base-desc-item label="前所属部门">
            {{ contractDetail.previous_department_name || '-' }}
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="创建时间">
            {{ formatDateTime(contractDetail.create_time) || '-' }}
          </base-desc-item>
          <base-desc-item label="更新时间">
            {{ formatDateTime(contractDetail.update_time) || '-' }}
          </base-desc-item>
        </t-row>
      </base-desc>
    </t-card>

    <!-- 产品报价 -->
    <t-card :bordered="false" class="info-card">
      <div class="section-header">
        <h3>产品报价</h3>
      </div>
      <div class="product-summary">
        <span>报价记录数量: {{ contractDetail.products?.length || 0 }}条</span>
        <span>产品总数量: {{ totalQuantity }}个</span>
        <span>合计小写: {{ formatAmount(totalAmount) }}</span>
        <span>合计大写: {{ amountToChinese(totalAmount) }}</span>
      </div>
      <t-table
        :data="productTableData"
        :columns="productColumns"
        :row-key="rowKey"
        :loading="productLoading"
        :hover="true"
        class="product-table"
      >
        <template #product_name="{ row }">
          {{ row.product_name || '-' }}
        </template>
        <template #brand="{ row }">
          {{ row.brand || '-' }}
        </template>
        <template #model="{ row }">
          {{ row.model || '-' }}
        </template>
        <template #remark="{ row }">
          {{ row.remark || '-' }}
        </template>
        <template #quantity="{ row }">
          {{ row.quantity || 0 }}
        </template>
        <template #unit="{ row }">
          {{ row.unit || '-' }}
        </template>
        <template #unit_price="{ row }">
          {{ formatAmount(row.unit_price) }}
        </template>
        <template #total_price="{ row }">
          {{ formatAmount(row.total_price) }}
        </template>
        <template #empty>
          <div style="text-align: center; padding: 40px 0; color: #999">暂无产品数据</div>
        </template>
      </t-table>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import { useRouter } from 'vue-router';

import { amountToChinese } from '@/utils/ruoyi';

defineOptions({
  name: 'BaseDetailBasic',
});

// 定义 props
const props = defineProps<{
  contractDetail: Record<string, any>;
  firstApprover?: string;
  secondApprover?: string;
  approvalStatusText?: string;
  notifyUsers?: string;
  collaborateUsers?: string;
}>();
// 定义 emits
const emit = defineEmits(['delete-product']);
const BaseDescItem = defineAsyncComponent(() => import('@/components/BaseDescItem/index.vue'));
const BaseDesc = defineAsyncComponent(() => import('@/components/BaseDesc/index.vue'));

const router = useRouter();

// 产品表格数据
const productTableData = computed(() => {
  return props.contractDetail.products || [];
});

// 产品总数量
const totalQuantity = computed(() => {
  if (!props.contractDetail.products || props.contractDetail.products.length === 0) return 0;
  return props.contractDetail.products.reduce((sum: number, item: any) => {
    return sum + Number.parseFloat(item.quantity || 0);
  }, 0);
});

// 产品总金额
const totalAmount = computed(() => {
  if (!props.contractDetail.products || props.contractDetail.products.length === 0) {
    const amount = props.contractDetail.contract_amount || 0;
    // 处理千分位格式的字符串
    const cleanAmount = typeof amount === 'string' ? amount.replace(/,/g, '') : amount;
    return typeof cleanAmount === 'string' ? Number.parseFloat(cleanAmount) : cleanAmount;
  }
  return props.contractDetail.products.reduce((sum: number, item: any) => {
    const price = item.total_price || 0;
    // 处理千分位格式的字符串
    const cleanPrice = typeof price === 'string' ? price.replace(/,/g, '') : price;
    return sum + Number.parseFloat(cleanPrice);
  }, 0);
});

// 税率（默认13%）
const taxRate = computed(() => {
  const rate = props.contractDetail.tax_rate;
  if (rate && !isNaN(Number(rate))) {
    // 如果税率是百分比格式（如13），转换为小数（0.13）
    return Number(rate) > 1 ? Number(rate) / 100 : Number(rate);
  }
  return 0.13; // 默认13%
});

// 不含税金额
const taxFreeAmount = computed(() => {
  const amount = props.contractDetail.contract_amount || 0;
  // 处理千分位格式的字符串
  const cleanAmount = typeof amount === 'string' ? amount.replace(/,/g, '') : amount;
  const num = typeof cleanAmount === 'string' ? Number.parseFloat(cleanAmount) : cleanAmount;
  return num / (1 + taxRate.value);
});

// 税额
const taxAmount = computed(() => {
  const amount = props.contractDetail.contract_amount || 0;
  // 处理千分位格式的字符串
  const cleanAmount = typeof amount === 'string' ? amount.replace(/,/g, '') : amount;
  const num = typeof cleanAmount === 'string' ? Number.parseFloat(cleanAmount) : cleanAmount;
  return num - taxFreeAmount.value;
});

// 产品表格列配置
const productColumns = [
  { colKey: 'product_name', title: '产品名称', width: 200, ellipsis: true },
  { colKey: 'brand', title: '品牌', width: 120 },
  { colKey: 'model', title: '型号', width: 120 },
  { colKey: 'remark', title: '备注描述', width: 200, ellipsis: true },
  { colKey: 'quantity', title: '数量', width: 100, align: 'center' },
  { colKey: 'unit', title: '单位', width: 80, align: 'center' },
  { colKey: 'unit_price', title: '报价单价', width: 120, align: 'right' },
  { colKey: 'total_price', title: '报价总价', width: 120, align: 'right' },
];

const rowKey = 'id';
const productLoading = computed(() => false);

// 格式化日期
const formatDate = (date: string | null | undefined) => {
  if (!date) return '';
  return date;
};

// 格式化日期时间
const formatDateTime = (dateTime: string | null | undefined) => {
  if (!dateTime) return '';
  return dateTime;
};

// 格式化金额
const formatAmount = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined || amount === '') return '¥0.00';
  // 处理千分位格式的字符串
  const cleanAmount = typeof amount === 'string' ? amount.replace(/,/g, '') : amount;
  const num = typeof cleanAmount === 'string' ? Number.parseFloat(cleanAmount) : cleanAmount;
  if (isNaN(num)) return '¥0.00';
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// 查看客户
const handleViewCustomer = (customerId: string | number) => {
  router.push({
    path: '/customerMange/customer/detail',
    query: { id: customerId },
  });
};

// 查看报价单
const handleViewQuotation = (quotationId: string | number) => {
  router.push({
    path: '/quotation/quotationDetail',
    query: { quotationId },
  });
};

// 滚动到产品报价区域
const scrollToProducts = () => {
  const productsSection = document.querySelector('.product-table');
  if (productsSection) {
    productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
</script>
<style lang="less" scoped>
.info-card {
  margin-bottom: 15px;
  :deep(.t-card__body) {
    padding: 16px 24px;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #1f1f1f;
  }
}

.product-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  color: #333;

  span {
    white-space: nowrap;
  }
}

.product-table {
  margin-top: 16px;
}
.payment-plan-table td {
  text-align: center;
}
</style>
