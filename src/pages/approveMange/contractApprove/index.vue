<template>
  <div class="contract-container">
    <!-- 搜索区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <!-- 搜索关键词 -->
        <div class="filter-item">
          <label class="filter-label">搜索关键词</label>
          <t-input v-model="searchForm.keyword" placeholder="请输入内容" clearable />
        </div>
        <!-- 审批类型 -->
        <div class="filter-item">
          <label class="filter-label">审批类型</label>
          <t-select
            v-model="searchForm.approval_status"
            placeholder="请选择审批类型"
            :options="approvalStatusOptions"
            clearable
          />
        </div>
        <!-- 提交时间 -->
        <div class="filter-item">
          <label class="filter-label">提交时间</label>
          <t-date-picker v-model="searchForm.submit_time" placeholder="请选择日期" style="width: 100%" clearable />
        </div>
        <!-- 审批时间 -->
        <div class="filter-item">
          <label class="filter-label">审批时间</label>
          <t-date-picker v-model="searchForm.approval_time" placeholder="请选择日期" style="width: 100%" clearable />
        </div>
        <!-- 创建人员 -->
        <div class="filter-item">
          <label class="filter-label">创建人员</label>
          <t-select
            v-model="searchForm.create_user_id"
            placeholder="请选择创建人员"
            :options="creatorOptions"
            :loading="loadingCreator"
            filterable
            clearable
          >
            <template #empty>
              <div v-if="loadingCreator">加载中...</div>
              <div v-else>暂无数据</div>
            </template>
          </t-select>
        </div>
      </div>
      <div class="filter-right">
        <!-- 操作按钮 -->
        <t-button theme="primary" @click="handleSearch">
          <template #icon>
            <t-icon name="search" />
          </template>
          查询
        </t-button>
        <t-button theme="default" @click="handleReset">
          <template #icon>
            <t-icon name="refresh" />
          </template>
          重置
        </t-button>
      </div>
    </div>

    <!-- 操作按钮和表格控制 -->
    <div class="operation-bar">
      <div class="operation-left">
        <t-button theme="default" variant="outline" @click="clickOper(1)">
          <template #icon>
            <t-icon name="upload" />
          </template>
          导出
        </t-button>
      </div>
      <div class="operation-right">
        <t-tooltip content="排序">
          <t-button theme="default" variant="outline" @click="clickOper(2)">
            <template #icon>
              <t-icon name="swap" />
            </template>
            排序
          </t-button>
        </t-tooltip>
        <t-tooltip content="列表">
          <t-button theme="default" variant="outline" @click="clickOper(3)">
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
        <!-- 合同编号 -->
        <template #contract_no="{ row }">
          {{ row.contract_no || '-' }}
        </template>

        <!-- 合同主题（与客户列表一致：单行省略 + 悬停展示全部） -->
        <template #contract_title="{ row }">
          <div class="customer-name-container">
            <t-tooltip :content="String(row.contract_title || '-')" placement="top">
              <t-link theme="primary" class="customer-name-link" @click="clickOper(4, row)">
                {{ row.contract_title || '-' }}
              </t-link>
            </t-tooltip>
          </div>
        </template>

        <!-- 客户名称 -->
        <template #customer_name="{ row }">
          <div class="customer-name-container">
            <t-tooltip :content="String(row.customer_name || '-')" placement="top">
              <t-link theme="primary" class="customer-name-link" @click="clickOper(5, row)">
                {{ row.customer_name || '-' }}
              </t-link>
            </t-tooltip>
          </div>
        </template>

        <!-- 合同总金额 -->
        <template #contract_amount="{ row }"> ¥{{ formatAmount(row.contract_amount) }} </template>

        <!-- 审批状态 -->
        <template #approval_status="{ row }">
          <span class="status-dot" :class="[`status-${row.approval_status}`]"></span>
          {{ getApprovalStatusText(row.approval_status) }}
        </template>

        <!-- 创建人员 -->
        <template #owner_user_name="{ row }">
          {{ row.owner_user_name || '-' }}
        </template>

        <!-- 提交时间 -->
        <template #create_time="{ row }">
          {{ formatDate(row.create_time) }}
        </template>

        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="clickOper(4, row)"> 详情 </t-link>
            <t-link theme="primary" @click="clickOper(7, row)"> 审批 </t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 底部操作和分页 -->
    <div class="footer-wrapper">
      <div class="footer-left">
        <t-button theme="default" variant="outline">
          <t-checkbox v-model="selectAll" @change="handleSelectAll">全选</t-checkbox>
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
import { defineAsyncComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { postApprovalTodoList } from '@/api/approve/index';
import { getEmployeeList } from '@/api/customer/customer';
import { getApprovalStatusText } from '@/utils/ruoyi';

defineOptions({
  name: 'ContractApprove',
});
const customColumnDialogRef = ref(null);
const CustomColumnDialog = defineAsyncComponent(() => import('@/components/BaseCustomColumn/index.vue'));

const router = useRouter();

// 搜索表单
const searchForm = ref({
  keyword: '', // 搜索关键词
  approval_status: '', // 审批类型
  submit_time: '', // 提交时间
  approval_time: '', // 审批时间
  create_user_id: '', // 创建人员
});

// 审批状态选项
const approvalStatusOptions = ref([
  { label: '等待审批', value: 0 },
  { label: '审批通过', value: 1 },
  { label: '审批否决', value: 2 },
  { label: '驳回审批', value: 3 },
]);

// 创建人员选项
const creatorOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingCreator = ref(false);

// 加载创建人员列表
const loadCreatorOptions = async () => {
  loadingCreator.value = true;
  try {
    const response = await getEmployeeList({
      limit: 1000,
    });
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      creatorOptions.value = data.map((emp: any) => ({
        label: emp.real_name || '',
        value: String(emp.id || ''),
      }));
    }
  } catch (error: any) {
    console.error('获取员工列表失败:', error);
  } finally {
    loadingCreator.value = false;
  }
};
const requiredColumns = ['contract_no', 'operation'];
// 所有可用的列定义（完整配置）
const allColumnsConfig: Record<string, PrimaryTableCol> = {
  rowSelect: {
    colKey: 'row-select',
    type: 'multiple',
    width: 50,
    fixed: 'left',
  },
  contract_no: {
    title: '合同编号',
    align: 'left',
    minWidth: 160,
    colKey: 'contract_no',
    ellipsis: true,
    cell: 'contract_no',
  },
  sign_date: {
    title: '合同时间',
    align: 'left',
    width: 200,
    colKey: 'sign_date',
    ellipsis: true,
    cell: 'sign_date',
  },
  contract_title: {
    title: '合同主题',
    align: 'left',
    width: 160,
    colKey: 'contract_title',
    ellipsis: true,
    cell: 'contract_title',
  },
  win_rate: {
    title: '客户名称',
    align: 'left',
    minWidth: 120,
    colKey: 'customer_name',
    ellipsis: true,
    cell: 'customer_name',
  },
  approval_status: {
    title: '审批状态',
    align: 'left',
    width: 120,
    colKey: 'approval_status',
    cell: 'approval_status',
  },
  quotation_file: {
    title: '发货状态',
    align: 'left',
    width: 150,
    colKey: 'quotation_file',
    ellipsis: true,
    cell: 'delivery_status',
  },
  contract_amount: {
    title: '合同总金额',
    align: 'right',
    width: 150,
    colKey: 'contract_amount',
    cell: 'contract_amount',
    sorter: (a, b) => {
      return (a.contract_amount || 0) - (b.contract_amount || 0);
    },
  },
  received_amount: {
    title: '已回款金额',
    align: 'right',
    width: 150,
    colKey: 'received_amount',
    cell: 'received_amount',
    sorter: (a, b) => {
      return (a.received_amount || 0) - (b.received_amount || 0);
    },
  },
  invoiced_amount: {
    title: '已开票金额',
    align: 'right',
    width: 150,
    colKey: 'invoiced_amount',
    cell: 'invoiced_amount',
    sorter: (a, b) => {
      return (a.invoiced_amount || 0) - (b.invoiced_amount || 0);
    },
  },
  profit_margin: {
    title: '订单毛利率',
    align: 'right',
    width: 150,
    colKey: 'profit_margin',
    cell: 'profit_margin',
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
  allColumnsConfig.contract_no,
  allColumnsConfig.contract_title, // 合同时间
  allColumnsConfig.sign_date, // 合同主题
  allColumnsConfig.win_rate, // 客户名称
  allColumnsConfig.contract_amount,
  allColumnsConfig.received_amount,
  allColumnsConfig.invoiced_amount,
  allColumnsConfig.approval_status,
  allColumnsConfig.operation,
]);

// 表格数据接口
interface ContractApproveData {
  id: string | number;
  contract_no: string;
  contract_title: string;
  customer_id: string | number;
  customer_name: string;
  contract_amount: string | number;
  approval_status: number;
  owner_user_name: string;
  create_time: string;
  [key: string]: any;
}

// 表格数据
const tableData = ref<ContractApproveData[]>([]);

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
  if (!dateStr) return '-';
  return dateStr;
};

// 格式化金额
const formatAmount = (amount: string | number | undefined | null) => {
  if (amount === undefined || amount === null) {
    return '0.00';
  }
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('zh-CN', {
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
  searchForm.value.approval_status = '';
  searchForm.value.submit_time = '';
  searchForm.value.approval_time = '';
  searchForm.value.create_user_id = '';
  pagination.value.current = 1;
  loadTableData();
};

// 操作
const clickOper = async (type: number, row?: ContractApproveData) => {
  switch (type) {
    case 1: // 导出
      MessagePlugin.info('导出功能开发中');
      break;
    case 2: // 排序
      MessagePlugin.info('排序功能开发中');
      break;
    case 3: // 列表
      if (customColumnDialogRef.value) {
        customColumnDialogRef.value.show();
      }
      break;
    case 4: // 合同主题（详情）
      if (row?.id) {
        router.push({
          path: '/approveMange/contractApprove/approveDetail',
          query: { id: row.id },
        });
      }
      break;
    case 5: // 客户名称（客户详情）
      if (row?.customer_id) {
        router.push({
          path: '/customerMange/customer/detail',
          query: { id: row.customer_id },
        });
      }
      break;
    case 7: // 审批
      if (row?.id) {
        router.push({
          path: '/approveMange/contractApprove/approve',
          query: { id: row.id },
        });
      }
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
// 加载表格数据
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    // 构建请求参数
    const params: any = {
      page: pagination.value.current,
      limit: pagination.value.pageSize,
      approval_type: 'contract', // 审批类型：合同审批
    };

    // 添加搜索条件
    if (searchForm.value.keyword) {
      params.keyword = searchForm.value.keyword.trim();
    }
    if (searchForm.value.approval_status !== '' && searchForm.value.approval_status !== null) {
      params.approval_status = searchForm.value.approval_status;
    }
    if (searchForm.value.submit_time) {
      params.submit_time = searchForm.value.submit_time;
    }
    if (searchForm.value.approval_time) {
      params.approval_time = searchForm.value.approval_time;
    }
    if (searchForm.value.create_user_id) {
      params.create_user_id = searchForm.value.create_user_id;
    }

    // 调用接口（POST请求）
    const response = await postApprovalTodoList(params);

    if (response.code === 0 || response.code === 200) {
      const data = response.data || {};
      const list = data.list || [];

      // 转换数据格式
      tableData.value = list.map((item: any) => ({
        ...item,
        id: item.id || '',
        contract_no: item.contract_no || '',
        contract_title: item.contract_title || '',
        customer_name: item.customer_name || '',
        contract_amount: item.contract_amount || 0,
        approval_status: item.approval_status !== undefined ? Number(item.approval_status) : 0,
        owner_user_name: item.owner_user_name || '',
        create_time: item.create_time || '',
      }));

      // 更新分页信息
      pagination.value = {
        ...pagination.value,
        total: data.count || 0,
      };
    } else {
      MessagePlugin.error(response.msg || response.message || '获取合同审批列表失败');
      tableData.value = [];
      pagination.value.total = 0;
    }
  } catch (error: any) {
    console.error('加载合同审批列表失败:', error);
    MessagePlugin.error('加载合同审批列表失败，请重试');
    tableData.value = [];
    pagination.value.total = 0;
  } finally {
    tableLoading.value = false;
  }
};

// 初始化
onMounted(() => {
  loadCreatorOptions();
  loadTableData();
});
</script>
<style lang="less" scoped>
.contract-container {
  padding: var(--td-comp-paddingTB-lg) var(--td-comp-paddingLR-lg);
  background: #fff;
  padding: 20px;
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
    gap: var(--td-comp-margin-md);
  }

  .footer-right {
    display: flex;
    align-items: center;
  }
}
</style>
