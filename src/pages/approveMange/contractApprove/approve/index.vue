<template>
  <div>
    <!-- 审批进度 -->
    <t-card :bordered="false" class="approve-card">
      <div class="approve-steps-wrapper">
        <t-steps theme="default" layout="horizontal" :current="currentStep">
          <t-step-item title="提交审批" :content="submitTime" />
          <t-step-item title="1级审批" :content="`审批人：${firstApprover}`" />
          <t-step-item title="审批完成" :content="`审批人：${finalApprover}`" />
        </t-steps>
      </div>
    </t-card>

    <!-- 合同信息 + 操作按钮 -->
    <t-card :bordered="false" class="info-card">
      <div class="info-header">
        <div class="info-title">
          <h2>{{ contractDetail.contract_title || '-' }}</h2>
          <span class="status-text">({{ approvalStatusText }})</span>
        </div>
        <div class="info-actions">
          <t-button theme="primary" @click="handleApprove">
            <template #icon>
              <t-icon name="check" />
            </template>
            审批通过
          </t-button>
          <t-button variant="outline" theme="default" @click="handleReject">
            <template #icon>
              <t-icon name="close" />
            </template>
            审批否决
          </t-button>
          <t-button variant="outline" theme="default" @click="handleTransfer">
            <template #icon>
              <t-icon name="refresh" />
            </template>
            转他人审批
          </t-button>
          <t-button variant="outline" theme="default" @click="handleEdit">
            <template #icon>
              <t-icon name="edit" />
            </template>
            编辑合同
          </t-button>
        </div>
      </div>
    </t-card>

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

    <!-- 审批否决弹框 -->
    <approve-fail-dialog ref="approveFailDialogRef" @success="handleApprovalSuccess" />
    <!-- 审批通过弹框 -->
    <approve-success-dialog ref="approveSuccessDialogRef" @success="handleApprovalSuccess" />
    <!-- 转他人审批弹框 -->
    <transfer-approval-dialog ref="transferApprovalDialogRef" @success="handleApprovalSuccess" />
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { getContractDetail } from '@/api/contract';
import { amountToChinese } from '@/utils/ruoyi';

defineOptions({
  name: 'ContractApprove',
});

const ApproveFailDialog = defineAsyncComponent(() => import('../components/approveFailDialog.vue'));
const ApproveSuccessDialog = defineAsyncComponent(() => import('../components/approveSuccessDialog.vue'));
const TransferApprovalDialog = defineAsyncComponent(() => import('../components/transferApprovalDialog.vue'));
const BaseDescItem = defineAsyncComponent(() => import('@/components/BaseDescItem/index.vue'));
const BaseDesc = defineAsyncComponent(() => import('@/components/BaseDesc/index.vue'));

const route = useRoute();
const router = useRouter();

// 合同详情
const contractDetail = ref<Record<string, any>>({});

// 审批否决弹框引用
const approveFailDialogRef = ref(null);
// 审批通过弹框引用
const approveSuccessDialogRef = ref(null);
// 转他人审批弹框引用
const transferApprovalDialogRef = ref<InstanceType<typeof TransferApprovalDialog> | null>(null);

// 当前步骤（0: 提交审批, 1: 1级审批, 2: 2级审批, 3: 审批完成）
const currentStep = computed(() => {
  const status = contractDetail.value.approval_status;
  if (status === 0) return 0; // 待审批
  if (status === 1) return 1; // 1级审批中
  if (status === 2) return 2; // 2级审批中
  if (status === 3) return 3; // 审批完成
  return 0;
});

// 提交时间
const submitTime = computed(() => contractDetail.value.create_time || '—');

// 审批人（这些字段需要根据实际接口返回调整）
const firstApprover = computed(() => contractDetail.value.first_approver_name || '—');
const secondApprover = computed(() => contractDetail.value.second_approver_name || '—');
const finalApprover = computed(() => contractDetail.value.approval_user_name || '—');

// 审批状态文本
const approvalStatusText = computed(() => {
  const status = contractDetail.value.approval_status;
  if (status === 0) return '待审批(待1级审批)';
  if (status === 1) return '待审批(待2级审批)';
  if (status === 2) return '审批中';
  if (status === 3) return '审批通过';
  if (status === 4) return '审批否决';
  return '未知状态';
});

// 通知他人
const notifyUsers = computed(() => {
  // 这里需要根据实际接口返回的数据来显示
  return contractDetail.value.notify_users || '-';
});

// 协作人员
const collaborateUsers = computed(() => {
  // 这里需要根据实际接口返回的数据来显示
  return contractDetail.value.collaborate_users || '-';
});
// 税率（默认13%）
const taxRate = computed(() => {
  const rate = contractDetail.value.tax_rate;
  if (rate && !isNaN(Number(rate))) {
    // 如果税率是百分比格式（如13），转换为小数（0.13）
    return Number(rate) > 1 ? Number(rate) / 100 : Number(rate);
  }
  return 0.13; // 默认13%
});
// 不含税金额
const taxFreeAmount = computed(() => {
  const amount = contractDetail.value.contract_amount || 0;
  // 处理千分位格式的字符串
  const cleanAmount = typeof amount === 'string' ? amount.replace(/,/g, '') : amount;
  const num = typeof cleanAmount === 'string' ? Number.parseFloat(cleanAmount) : cleanAmount;
  return num / (1 + taxRate.value);
});
// 税额
const taxAmount = computed(() => {
  const amount = contractDetail.value.contract_amount || 0;
  // 处理千分位格式的字符串
  const cleanAmount = typeof amount === 'string' ? amount.replace(/,/g, '') : amount;
  const num = typeof cleanAmount === 'string' ? Number.parseFloat(cleanAmount) : cleanAmount;
  return num - taxFreeAmount.value;
});
// 产品表格数据
const productTableData = computed(() => {
  return contractDetail.value.products || [];
});

// 产品总数量
const totalQuantity = computed(() => {
  if (!contractDetail.value.products || contractDetail.value.products.length === 0) return 0;
  return contractDetail.value.products.reduce((sum: number, item: any) => {
    return sum + Number.parseFloat(item.quantity || 0);
  }, 0);
});

// 产品总金额
const totalAmount = computed(() => {
  if (!contractDetail.value.products || contractDetail.value.products.length === 0) {
    return contractDetail.value.contract_amount || 0;
  }
  return contractDetail.value.products.reduce((sum: number, item: any) => {
    return sum + Number.parseFloat(item.total_price || 0);
  }, 0);
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
const productLoading = ref(false);

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
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (isNaN(num)) return '¥0.00';
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// 审批通过
const handleApprove = () => {
  const id = route.query.id;
  if (!id) {
    MessagePlugin.error('缺少合同ID，无法进行审批');
    return;
  }
  if (approveSuccessDialogRef.value) {
    approveSuccessDialogRef.value.show(id);
  }
};

// 审批否决
const handleReject = () => {
  const id = route.query.id;
  if (!id) {
    MessagePlugin.error('缺少合同ID，无法进行审批');
    return;
  }
  if (approveFailDialogRef.value) {
    approveFailDialogRef.value.show(id);
  }
};

// 转他人审批
const handleTransfer = () => {
  const id = route.query.id;
  if (!id) {
    MessagePlugin.error('缺少合同ID，无法进行转交');
    return;
  }
  if (transferApprovalDialogRef.value) {
    transferApprovalDialogRef.value.show(id);
  }
};

// 编辑合同
const handleEdit = () => {
  const id = route.query.id;
  if (!id) {
    MessagePlugin.error('缺少合同ID，无法编辑');
    return;
  }
  router.push({
    path: '/contractMange/edit',
    query: { id },
  });
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
    query: { id: quotationId },
  });
};

// 滚动到产品报价区域
const scrollToProducts = () => {
  const productsSection = document.querySelector('.product-table');
  if (productsSection) {
    productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// 审批成功回调
const handleApprovalSuccess = () => {
  // 刷新当前页面数据，或者返回列表页
  router.push('/approveMange/contractApprove');
};

// 加载合同详情
const loadContractDetail = async () => {
  const id = route.query.id as string | undefined;
  if (!id) {
    MessagePlugin.error('缺少合同ID');
    return;
  }
  productLoading.value = true;
  try {
    const res = await getContractDetail(id);
    if (res.code === 0 || res.code === 200) {
      contractDetail.value = res.data || {};
    } else {
      MessagePlugin.error(res.msg || '获取合同详情失败');
    }
  } catch (error: any) {
    console.error('获取合同详情失败:', error);
    MessagePlugin.error('获取合同详情失败，请重试');
  } finally {
    productLoading.value = false;
  }
};

onMounted(() => {
  loadContractDetail();
});
</script>
<style lang="less" scoped>
.approve-card {
  margin-bottom: 16px;
  :deep(.t-card__body) {
    padding: 24px 32px;
  }
}

.approve-steps-wrapper {
  .t-steps {
    width: 100%;
  }
}

.info-card {
  margin-bottom: 15px;
  :deep(.t-card__body) {
    padding: 16px 24px;
  }
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.info-title {
  display: flex;
  align-items: center;
  gap: 8px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #ff4d4f;
  }

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #1f1f1f;
  }

  .status-text {
    font-size: 12px;
    color: #ff4d4f;
  }
}

.info-actions {
  display: flex;
  gap: 8px;
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
