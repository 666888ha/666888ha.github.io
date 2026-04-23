<template>
  <div class="customer-container">
    <!-- 搜索区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <!-- 关键词搜索（报价单号/客户名称） -->
        <div class="filter-item">
          <label class="filter-label">关键词</label>
          <t-input v-model="searchForm.keyword" placeholder="报价单号/客户名称" clearable />
        </div>
        <!-- 审批状态 -->
        <div class="filter-item">
          <label class="filter-label">审批状态</label>
          <t-select
            v-model="searchForm.approvalStatus"
            placeholder="请选择审批状态"
            :options="approvalStatusOptions"
            clearable
          />
        </div>
        <!-- 成交几率 -->
        <div class="filter-item">
          <label class="filter-label">成交几率</label>
          <t-select
            v-model="searchForm.winRate"
            placeholder="请选择成交几率"
            :options="dealProbabilityOptions"
            clearable
          />
        </div>
        <!-- 报价日期 -->
        <div class="filter-item">
          <label class="filter-label">报价日期</label>
          <t-date-range-picker v-model="searchForm.dateRange" placeholder="请选择报价日期" clearable />
        </div>
      </div>
      <div class="filter-right">
        <!-- 操作按钮 -->
        <t-button theme="primary" @click="handleSearch">查询</t-button>
        <t-button theme="default" @click="handleReset">重置</t-button>
      </div>
    </div>
    <!-- 操作按钮和表格控制 -->
    <div class="operation-bar">
      <div class="operation-left">
        <t-button theme="default" variant="outline" @click="triggerExportQuotationApprove">
          <template #icon>
            <t-icon name="download" />
          </template>
          导出
        </t-button>
      </div>
      <div class="operation-right">
        <t-checkbox>跟进模式</t-checkbox>
        <t-tooltip content="当对列表客户写跟进时,会自动将刚刚写过跟进的客户排到最后。" :show-arrow="false">
          <t-icon name="help-circle" />
        </t-tooltip>
        <t-tooltip content="列表">
          <t-button theme="default" variant="outline" @click="clickOper(1)">
            <template #icon>
              <t-icon name="view-list" />
            </template>
            列表
          </t-button>
        </t-tooltip>
      </div>
    </div>

    <!-- 数据表格 -->
    <t-card :bordered="false" class="table-card">
      <t-table
        :data="tableData"
        :columns="tableColumns"
        :row-key="rowKey"
        :selected-row-keys="selectedRowKeys"
        :loading="tableLoading"
        :hover="true"
        select-on-row-click
        @select-change="handleSelectChange"
      >
        <!-- 报价单号 -->
        <template #quotation_no="{ row }">
          <t-link theme="primary" @click="clickOper(2, row)">
            {{ row.quotation_no }}
          </t-link>
        </template>

        <!-- 客户名称（与客户列表一致：单行省略 + 悬停展示全称） -->
        <template #customer_name="{ row }">
          <div class="customer-name-container">
            <t-tooltip :content="row.customer_name || ''" placement="top">
              <t-link theme="primary" class="customer-name-link" @click="clickOper(3, row)">
                {{ row.customer_name }}
              </t-link>
            </t-tooltip>
          </div>
        </template>

        <!-- 创建时间 -->
        <template #create_time="{ row }">
          {{ formatDate(row.create_time) }}
        </template>

        <!-- 成交几率 -->
        <template #win_rate="{ row }">
          {{ row.win_rate !== undefined && row.win_rate !== null ? `${row.win_rate}%` : '-' }}
        </template>

        <!-- 报价金额 -->
        <template #quotation_amount="{ row }"> ¥ {{ formatAmount(row.quotation_amount) }} </template>

        <!-- 审批状态 -->
        <template #approval_status="{ row }">
          <span class="status-dot" :class="[`status-${row.approval_status}`]"></span>
          {{ getApprovalStatusText(row.approval_status) }}
        </template>

        <!-- 操作列 -->
        <template #operation="{ row }">
          <div class="operation-cell">
            <t-link v-if="!row.approval_status" theme="primary" class="operation-link" @click="clickOper(4, row)">
              审批
            </t-link>
            <t-link theme="primary" class="operation-link" @click="clickOper(2, row)"> 详情 </t-link>
          </div>
        </template>
      </t-table>
    </t-card>

    <!-- 底部操作和分页 -->
    <div class="footer-wrapper">
      <div class="footer-left">
        <t-button theme="default" variant="outline"
          ><t-checkbox v-model="selectAll" @change="handleSelectAll">全选</t-checkbox>
        </t-button>
        <t-button theme="default" variant="outline">
          <t-checkbox v-model="inverse" @change="handleInvertSelection">反选</t-checkbox>
        </t-button>
      </div>
      <div class="footer-right">
        <t-pagination
          v-model="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :show-page-size="pagination.showPageSize"
          :page-size-options="pagination.pageSizeOptions"
          :total-content="false"
          @current-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </div>
    </div>
    <!-- 导入导出 -->
    <baseImport ref="listImport" />
    <baseExport ref="listExport" />
    <!-- 自定义列弹框 -->
    <custom-column-dialog
      ref="customColumnDialogRef"
      :all-columns-config="allColumnsConfig"
      :table-columns="tableColumns"
      :required-columns="requiredColumns"
      custom-key-name="quotationListKey"
      @confirm="handleColumnConfirm"
    />
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { exportApprovalTodoList, postApprovalTodoList } from '@/api/approve/index';
import { getApprovalStatusText } from '@/utils/ruoyi';

defineOptions({
  name: 'ContactsList',
});

const customColumnDialogRef = ref(null);
const CustomColumnDialog = defineAsyncComponent(() => import('@/components/BaseCustomColumn/index.vue'));
const baseImport = defineAsyncComponent(() => import('@/components/baseImport/index.vue'));
const baseExport = defineAsyncComponent(() => import('@/components/baseExport/index.vue'));
const router = useRouter();
const listImport = ref(null);
const listExport = ref(null);
// 搜索表单
const searchForm = ref({
  keyword: '', // 报价单号/客户名称关键词
  approvalStatus: '', // 审批状态
  winRate: '', // 成交几率
  dateRange: [], // 报价日期范围
  customerId: '', // 客户ID（可选）
});

// 审批状态选项（按照API文档：0待审批 / 1通过 / 2驳回）
const approvalStatusOptions = ref([
  { label: '待审批', value: 0 },
  { label: '通过', value: 1 },
  { label: '驳回', value: 2 },
]);

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

const requiredColumns = ['quotation_no', 'operation'];
// 所有可用的列定义（完整配置）
const allColumnsConfig: Record<string, PrimaryTableCol> = {
  rowSelect: {
    colKey: 'row-select',
    type: 'multiple',
    width: 50,
    fixed: 'left',
  },
  quotation_no: {
    title: '报价单号',
    align: 'left',
    width: 160,
    colKey: 'quotation_no',
    ellipsis: true,
    cell: 'quotation_no',
  },
  customer_name: {
    title: '客户名称',
    align: 'left',
    width: 200,
    colKey: 'customer_name',
    ellipsis: true,
    cell: 'customer_name',
  },
  create_time: {
    title: '创建时间',
    align: 'left',
    width: 160,
    colKey: 'create_time',
    cell: 'create_time',
    sorter: (a: QuotationData, b: QuotationData) => {
      return new Date(a.create_time || '').getTime() - new Date(b.create_time || '').getTime();
    },
  },
  win_rate: {
    title: '成交几率',
    align: 'center',
    width: 120,
    colKey: 'win_rate',
    cell: 'win_rate',
    sorter: (a: QuotationData, b: QuotationData) => {
      return (a.win_rate || 0) - (b.win_rate || 0);
    },
  },
  quotation_file: {
    title: '报价文件',
    align: 'left',
    width: 150,
    colKey: 'quotation_file',
    ellipsis: true,
    cell: 'quotation_file',
  },
  quotation_amount: {
    title: '报价金额',
    align: 'right',
    width: 150,
    colKey: 'quotation_amount',
    cell: 'quotation_amount',
    sorter: (a, b) => {
      return (a.quotation_amount || 0) - (b.quotation_amount || 0);
    },
  },
  approval_status: {
    title: '审批状态',
    align: 'left',
    width: 120,
    colKey: 'approval_status',
    cell: 'approval_status',
  },
  operation: {
    title: '操作',
    align: 'left',
    width: 220,
    colKey: 'operation',
    fixed: 'right',
    cell: 'operation',
  },
};

// 表格列定义（默认显示）
const tableColumns = ref<PrimaryTableCol[]>([
  allColumnsConfig.rowSelect,
  allColumnsConfig.quotation_no,
  allColumnsConfig.customer_name,
  allColumnsConfig.create_time,
  allColumnsConfig.win_rate,
  allColumnsConfig.quotation_amount,
  allColumnsConfig.approval_status,
  allColumnsConfig.operation,
]);

// 表格数据（按照API返回的字段）
interface QuotationData {
  id: number;
  quotation_no: string; // 报价单号
  customer_name: string; // 客户名称
  quotation_amount: number; // 报价金额
  approval_status: number; // 审批状态 (0待审批 / 1通过 / 2驳回)
  create_time: string; // 创建时间
  win_rate?: number; // 成交几率 (0-100)
}
// 表格数据（筛选后的数据）
const tableData = ref<QuotationData[]>([]);

// 选中的行
const selectedRowKeys = ref<(string | number)[]>([]);
const selectAll = ref(false);
const inverse = ref(false);

// 分页
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showPageSize: true,
  totalContent: false,
  pageSizeOptions: [10, 20, 50, 100],
});

// 加载状态
const tableLoading = ref(false);

// 行键
const rowKey = 'id';

// 格式化日期
const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return '';
  return dateStr;
};

// 格式化金额
const formatAmount = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0.00';
  }
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// 查询操作
const handleSearch = () => {
  pagination.value.current = 1; // 重置到第一页
  loadTableData();
};

// 重置操作
const handleReset = () => {
  // 清空筛选表单
  searchForm.value.keyword = '';
  searchForm.value.approvalStatus = '';
  searchForm.value.winRate = '';
  searchForm.value.dateRange = [];
  searchForm.value.customerId = '';
  pagination.value.current = 1;
  loadTableData();
};

// 操作
const clickOper = async (type: number, row) => {
  switch (type) {
    case 1: // 列表
      if (customColumnDialogRef.value) {
        customColumnDialogRef.value.show();
      }
      break;
    case 2: // 报价单详情 / 操作列详情
      router.push({
        path: '/approveMange/quotationApprove/detail',
        query: { id: row.id },
      });
      break;
    case 3: // 客户详情
      router.push({
        path: '/customerMange/customer/detail',
        query: { id: row.customer_id },
      });
      break;
    case 4: // 审批
      router.push({
        path: '/approveMange/quotationApprove/approve',
        query: { id: row.id },
      });
      break;
  }
};

// 选择变化
const handleSelectChange = (value: (string | number)[]) => {
  selectedRowKeys.value = value;
  selectAll.value = value.length === tableData.value.length && tableData.value.length > 0;
};

// 全选
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedRowKeys.value = tableData.value.map((item) => item.id);
  } else {
    selectedRowKeys.value = [];
  }
};

// 反选
const handleInvertSelection = () => {
  const allIds = tableData.value.map((item) => item.id);
  selectedRowKeys.value = allIds.filter((id) => !selectedRowKeys.value.includes(id));
  selectAll.value = selectedRowKeys.value.length === tableData.value.length;
};

// 分页变化
const handlePageChange = (current: number, pageInfo: any) => {
  pagination.value.current = current;
  pagination.value.pageSize = pageInfo.pageSize;
  loadTableData();
};

// 每页条数变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  pagination.value.current = 1;
  loadTableData();
};
const handleColumnConfirm = (newColumns: any[]) => {
  // 更新表格列
  tableColumns.value = newColumns;
};
function formatYmd(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildQuotationApproveListParams(withPaging: boolean): Record<string, any> {
  const params: Record<string, any> = {
    approval_type: 'quotation',
  };
  if (withPaging) {
    params.page = pagination.value.current;
    params.limit = pagination.value.pageSize;
  }
  if (searchForm.value.keyword) {
    params.keyword = searchForm.value.keyword.trim();
  }
  if (
    searchForm.value.approvalStatus !== '' &&
    searchForm.value.approvalStatus !== null &&
    searchForm.value.approvalStatus !== undefined
  ) {
    params.approval_status = searchForm.value.approvalStatus;
  }
  if (
    searchForm.value.winRate !== '' &&
    searchForm.value.winRate !== null &&
    searchForm.value.winRate !== undefined
  ) {
    params.win_rate = Number.parseInt(String(searchForm.value.winRate));
  }
  if (searchForm.value.customerId) {
    params.customer_id = Number.parseInt(String(searchForm.value.customerId));
  }
  if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
    const [startDate, endDate] = searchForm.value.dateRange;
    if (startDate && endDate) {
      params.start_date = formatYmd(startDate);
      params.end_date = formatYmd(endDate);
    }
  }
  return params;
}

async function saveBlobAsDownload(blob: Blob, filename: string) {
  if (blob.type && (blob.type.includes('application/json') || blob.type.includes('text/json'))) {
    const text = await blob.text();
    try {
      const j = JSON.parse(text);
      throw new Error((j as any)?.msg || (j as any)?.message || '导出失败');
    } catch (e: any) {
      if (e?.message === '导出失败' || e?.message?.includes('失败')) {
        throw e;
      }
      throw new Error(text.slice(0, 200));
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function triggerExportQuotationApprove() {
  tableLoading.value = true;
  try {
    const params = buildQuotationApproveListParams(false);
    if (selectedRowKeys.value.length > 0) {
      params.ids = selectedRowKeys.value.join(',');
    }
    const blob = await exportApprovalTodoList(params);
    await saveBlobAsDownload(blob, `报价审批列表_${Date.now()}.csv`);
    MessagePlugin.success('导出已开始下载');
  } catch (e: any) {
    MessagePlugin.error(e?.message || '导出失败');
  } finally {
    tableLoading.value = false;
  }
}

// 加载表格数据
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    const params = buildQuotationApproveListParams(true);
    const response = await postApprovalTodoList(params);

    if (response.code === 0 || response.code === 200) {
      const data = response.data || {};
      tableData.value = data.list || [];
      pagination.value.total = data.count || 0;
    } else {
      MessagePlugin.error(response.msg || response.message || '获取报价列表失败');
      tableData.value = [];
      pagination.value.total = 0;
    }
  } catch (error: any) {
    console.error('加载报价列表失败:', error);
    MessagePlugin.error('加载报价列表失败，请重试');
    tableData.value = [];
    pagination.value.total = 0;
  } finally {
    tableLoading.value = false;
  }
};

// 初始化
onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.customer-container {
  padding: var(--td-comp-paddingTB-lg) var(--td-comp-paddingLR-lg);
  background: #fff;
  padding: 20px;
}

.customer-tabs {
  margin-bottom: var(--td-comp-margin-lg);
  border-bottom: 1px solid #e7e7e7;

  :deep(.t-tabs__nav-item) {
    color: #999;
    font-size: 14px;
    padding: 12px 16px;
    transition: all 0.3s;

    &.t-is-active {
      color: #0052d9;
      font-weight: 500;

      .t-tabs__nav-item-wrapper::after {
        background-color: #0052d9;
      }
    }

    &:not(.t-is-active):hover {
      color: #333;
    }
  }

  :deep(.t-tabs__nav-scroll) {
    padding: 0;
  }
}

.search-card {
  margin-bottom: var(--td-comp-margin-lg);

  :deep(.t-card__body) {
    padding: var(--td-comp-paddingTB-lg) var(--td-comp-paddingLR-lg);
  }
}

.form-actions {
  display: flex;
  gap: var(--td-comp-margin-md);
  margin-top: var(--td-comp-margin-md);
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--td-comp-margin-lg);

  .operation-left {
    display: flex;
    gap: var(--td-comp-margin-md);
  }

  .operation-right {
    display: flex;
    gap: var(--td-comp-margin-xs);
    align-items: center;
  }
}

.table-card {
  :deep(.t-table) {
    .t-table__cell {
      padding: var(--td-comp-paddingTB-md) var(--td-comp-paddingLR-md);
    }
  }
}

.footer-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--td-comp-margin-lg);
  background: #fff;
  .footer-left {
    display: flex;
    align-items: center;
    gap: var(--td-comp-margin-md);
  }

  .footer-right {
    display: flex;
    align-items: center;
  }
}
.filter-bar {
  margin-bottom: 32px;
  margin-top: 32px;
  display: flex;
  justify-content: space-between;
  align-content: center;
  .filter-left {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    flex: 1;
    margin-right: 20px;

    .filter-item {
      display: flex;
      align-items: center;
      column-gap: 10px;
      .filter-label {
        min-width: 100px;
        text-align: right;
        flex-shrink: 0;
      }
    }
  }
  .filter-right {
    display: flex;
    flex-wrap: wrap;
  }
}

// 操作列样式
.operation-cell {
  display: flex;
  align-items: center;
  gap: 12px;

  .operation-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;

    &.more-link {
      color: var(--td-text-color-primary);
    }
  }
}
</style>
<style lang="less">
// 领取客户弹框样式（全局样式，因为 DialogPlugin 生成的弹框不在组件内）
.t-dialog__body {
  .claim-customer-dialog-content {
    display: flex;
    gap: 16px;
    padding: 8px 0;

    .dialog-icon-wrapper {
      flex-shrink: 0;

      .dialog-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #fa8c16;
        display: flex;
        align-items: center;
        justify-content: center;

        .icon-question {
          color: #fff;
          font-size: 24px;
          font-weight: 600;
          line-height: 1;
        }
      }
    }

    .dialog-text-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 4px;

      .main-question {
        font-size: 14px;
        color: var(--td-text-color-primary);
        font-weight: 500;
        line-height: 1.5;
      }
      .info-text {
        font-size: 12px;
        color: var(--td-text-color-placeholder);
        line-height: 1.5;
      }
    }
  }
}
</style>
