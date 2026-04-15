<template>
  <div class="contract-container">
    <!-- 顶部标签页 -->
    <t-tabs v-model="activeTab" class="contract-tabs" @change="handleTabChange">
      <t-tab-panel value="all" label="全部合同"> </t-tab-panel>
      <t-tab-panel value="self" label="我的合同"> </t-tab-panel>
      <t-tab-panel value="subordinate" label="下属合同"> </t-tab-panel>
      <t-tab-panel value="collaborate" label="共享合同"> </t-tab-panel>
    </t-tabs>

    <!-- 搜索区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <!-- 搜索关键词 -->
        <div class="filter-item">
          <label class="filter-label">搜索关键词</label>
          <t-input v-model="searchForm.keyword" placeholder="合同编号/主题/客户名称" clearable />
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
        <!-- 执行状态 -->
        <div class="filter-item">
          <label class="filter-label">执行状态</label>
          <t-select
            v-model="searchForm.executionStatus"
            placeholder="请选择执行状态"
            :options="executionStatusOptions"
            clearable
          />
        </div>
        <!-- 签单日期 -->
        <div class="filter-item">
          <label class="filter-label">签单日期</label>
          <t-date-range-picker v-model="searchForm.signDateRange" placeholder="请选择签单日期" clearable />
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
        <t-button theme="default" text @click="handleAdvancedFilter">
          <span style="color: #165dff">▼ 高级搜索</span>
        </t-button>
      </div>
    </div>

    <!-- 操作按钮和表格控制 -->
    <div class="operation-bar">
      <div class="operation-left">
        <t-button theme="primary" @click="clickOper(1)">
          <template #icon>
            <t-icon name="add" />
          </template>
          添加
        </t-button>
        <t-button theme="default" variant="outline" @click="clickOper(2)">
          <template #icon>
            <t-icon name="upload" />
          </template>
          导入
        </t-button>
        <t-button theme="default" variant="outline" @click="clickOper(3)">
          <template #icon>
            <t-icon name="download" />
          </template>
          导出
        </t-button>
      </div>
      <div class="operation-right">
        <t-tooltip content="帮助">
          <t-icon name="help-circle" style="cursor: pointer; margin-right: 8px" />
        </t-tooltip>
        <t-tooltip content="排序">
          <t-button theme="default" variant="outline" @click="clickOper(4)">
            <template #icon>
              <t-icon name="swap" />
            </template>
            排序
          </t-button>
        </t-tooltip>
        <t-tooltip content="列表">
          <t-button theme="default" variant="outline" @click="clickOper(5)">
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

        <!-- 合同时间 -->
        <template #sign_date="{ row }">
          {{ formatDate(row.sign_date) }}
        </template>

        <!-- 合同主题（与客户列表一致：单行省略 + 悬停展示全部） -->
        <template #contract_title="{ row }">
          <div class="customer-name-container">
            <t-tooltip :content="String(row.contract_title || '-')" placement="top">
              <t-link theme="primary" class="customer-name-link" @click="clickOper(6, row)">
                {{ row.contract_title || '-' }}
              </t-link>
            </t-tooltip>
          </div>
        </template>

        <!-- 客户名称 -->
        <template #customer_name="{ row }">
          <div class="customer-name-container">
            <t-tooltip :content="String(row.customer_name || '-')" placement="top">
              <t-link theme="primary" class="customer-name-link" @click="clickOper(7, row)">
                {{ row.customer_name || '-' }}
              </t-link>
            </t-tooltip>
          </div>
        </template>

        <!-- 审批状态 -->
        <template #approval_status="{ row }">
          <span class="status-dot" :class="[`status-${row.approval_status}`]"></span>
          {{ getApprovalStatusText(row.approval_status) }}
        </template>

        <!-- 发货状态 -->
        <template #delivery_status="{ row }">
          <span v-if="row.delivery_status" class="status-dot status-delivered"></span>
          {{ getDeliveryStatusText(row.delivery_status) }}
        </template>

        <!-- 合同总金额 -->
        <template #contract_amount="{ row }"> ¥{{ formatAmount(row.contract_amount) }} </template>

        <!-- 已回款金额 -->
        <template #received_amount="{ row }">
          <span v-if="row.received_amount !== undefined && row.received_amount !== null">
            ¥{{ formatAmount(row.received_amount) }}
          </span>
          <span v-else>-</span>
        </template>

        <!-- 已开票金额 -->
        <template #invoiced_amount="{ row }">
          <span v-if="row.invoiced_amount !== undefined && row.invoiced_amount !== null">
            ¥{{ formatAmount(row.invoiced_amount) }}
          </span>
          <span v-else>-</span>
        </template>

        <!-- 订单毛利率 -->
        <template #profit_margin="{ row }">
          <span v-if="row.profit_margin !== undefined && row.profit_margin !== null"> {{ row.profit_margin }}% </span>
          <span v-else>-</span>
        </template>

        <!-- 操作列 -->
        <template #operation="{ row }">
          <div class="operation-cell">
            <t-link theme="primary" class="operation-link" @click="clickOper(8, row)">验收</t-link>
            <t-link v-if="row.approval_status === 0" theme="primary" class="operation-link" @click="clickOper(9, row)"
              >编辑</t-link
            >
            <!-- 根据wordur字段动态显示生成合同或下载合同 -->
            <template v-if="row.approval_status === 1">
              <t-link v-if="!row.wordurl" theme="primary" class="operation-link" @click="clickOper(11, row)"
                >生成合同</t-link
              >
              <t-link v-else theme="primary" class="operation-link" @click="clickOper(12, row)">下载合同</t-link>
            </template>

            <t-link v-if="row.approval_status === 0" theme="primary" class="operation-link" @click="clickOper(10, row)"
              >删除</t-link
            >
          </div>
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
  </div>

  <!-- 高级搜索弹框 -->
  <t-dialog v-model:visible="advancedSearchVisible" header="高级搜索" width="50%" :footer="null">
    <div class="advanced-search-container">
      <div class="search-form-grid">
        <div class="form-item">
          <label class="form-label">输入搜索关键词</label>
          <t-input v-model="advancedSearchForm.keyword" placeholder="请输入关键词" />
        </div>

        <div class="form-item">
          <label class="form-label">审批状态</label>
          <t-select
            v-model="advancedSearchForm.approvalStatus"
            placeholder="请选择审批状态"
            :options="approvalStatusOptions"
            clearable
          />
        </div>

        <div class="form-item">
          <label class="form-label">执行状态</label>
          <t-select
            v-model="advancedSearchForm.executionStatus"
            placeholder="请选择执行状态"
            :options="executionStatusOptions"
            clearable
          />
        </div>

        <div class="form-item">
          <label class="form-label">签单日期</label>
          <t-date-range-picker v-model="advancedSearchForm.signDateRange" placeholder="请选择签单日期" />
        </div>

        <div class="form-item">
          <label class="form-label">合同类型</label>
          <t-select
            v-model="advancedSearchForm.contractType"
            placeholder="请选择合同类型"
            :options="contractTypeOptions"
            clearable
          />
        </div>

        <div class="form-item">
          <label class="form-label">回款状态</label>
          <t-select
            v-model="advancedSearchForm.paymentMethod"
            placeholder="请选择回款状态"
            :options="paymentMethodOptions"
            clearable
          />
        </div>

        <div class="form-item">
          <label class="form-label">开票状态</label>
          <t-select
            v-model="advancedSearchForm.paymentMethod"
            placeholder="请选择开票状态"
            :options="paymentMethodOptions"
            clearable
          />
        </div>

        <div class="form-item">
          <label class="form-label">开始日期</label>
          <t-date-range-picker v-model="advancedSearchForm.startDateRange" placeholder="请选择开始日期" />
        </div>

        <div class="form-item">
          <label class="form-label">到期日期</label>
          <t-date-range-picker v-model="advancedSearchForm.endDateRange" placeholder="请选择到期日期" />
        </div>

        <div class="form-item">
          <label class="form-label">最后跟进</label>
          <t-date-range-picker v-model="advancedSearchForm.lastProgressDateRange" placeholder="请选择最后跟进日期" />
        </div>

        <div class="form-item">
          <label class="form-label">下次跟进</label>
          <t-input v-model="advancedSearchForm.nextProgressDate" placeholder="请选择下次跟进日期" />
        </div>

        <div class="form-item">
          <label class="form-label">归属人员</label>
          <t-select v-model="advancedSearchForm.ownerUserId" placeholder="请选择归属人员" clearable />
        </div>
      </div>

      <div class="search-actions">
        <t-button theme="default" variant="outline" @click="resetAdvancedSearch">重置</t-button>
        <t-button theme="primary" @click="handleAdvancedSearch">搜索</t-button>
      </div>
    </div>
  </t-dialog>
  <custom-column-dialog
    ref="customColumnDialogRef"
    :all-columns-config="allColumnsConfig"
    :table-columns="tableColumns"
    :required-columns="requiredColumns"
    custom-key-name="contractListKey"
    @confirm="handleColumnConfirm"
  />
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { contractAcceptance, deleteContract, generateContractWord, getContractList } from '@/api/contract';
import { getApprovalStatusText } from '@/utils/ruoyi';

defineOptions({
  name: 'ContractList',
});
const CustomColumnDialog = defineAsyncComponent(() => import('@/components/BaseCustomColumn/index.vue'));
const customColumnDialogRef = ref(null);
const router = useRouter();

// 标签页
const activeTab = ref('all');

// 标签页切换
const handleTabChange = (value: string | number) => {
  activeTab.value = String(value);
  // 重新加载数据
  loadTableData();
};

// 搜索表单
const searchForm = ref({
  keyword: '', // 合同编号/主题/客户名称关键词
  approvalStatus: '', // 审批状态
  executionStatus: '', // 执行状态
  signDateRange: [], // 签单日期范围
  paymentMethod: '', // 付款方式
});

// 审批状态选项（按照API文档：0待审批 / 1通过 / 2驳回，同时支持更多状态）
const approvalStatusOptions = ref([
  { label: '待审批', value: 0 },
  { label: '已通过', value: 1 },
  { label: '被否决', value: 2 },
  { label: '已撤销', value: 3 },
  { label: '被驳回', value: 4 },
]);

// 执行状态选项（根据实际业务定义）
const executionStatusOptions = ref([
  { label: '未执行', value: 0 },
  { label: '执行中', value: 1 },
  { label: '已完成', value: 2 },
  { label: '已终止', value: 3 },
]);

// 付款方式选项（根据实际业务定义）
const paymentMethodOptions = ref([
  { label: '现金', value: 'cash' },
  { label: '银行转账', value: 'transfer' },
  { label: '支票', value: 'check' },
  { label: '其他', value: 'other' },
]);
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
    width: 200,
    colKey: 'contract_title',
    ellipsis: true,
    cell: 'contract_title',
  },
  win_rate: {
    title: '客户名称',
    align: 'left',
    minWidth: 220,
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
const requiredColumns = ['contract_no', 'operation'];
// 表格数据接口
interface ContractData {
  id: number;
  customer_id: number; // 客户ID
  contract_no: string; // 合同编号
  contract_title: string; // 合同主题
  customer_name: string; // 客户名称
  contract_amount: number; // 合同总金额
  approval_status: number; // 审批状态 (0待审批 / 1通过 / 2驳回)
  sign_date: string; // 签单日期
  delivery_status?: number; // 发货状态
  received_amount?: number; // 已回款金额
  invoiced_amount?: number; // 已开票金额
  profit_margin?: number; // 订单毛利率
  wordur?: string; // 合同文档URL
}

// 表格数据
const tableData = ref<ContractData[]>([]);

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

// 获取发货状态文本
const getDeliveryStatusText = (status: number | undefined | null) => {
  if (status === 1) return '已发货';
  if (status === 0) return '未发货';
  return '-';
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
  searchForm.value.executionStatus = '';
  searchForm.value.signDateRange = [];
  searchForm.value.paymentMethod = '';
  pagination.value.current = 1;
  loadTableData();
};

// 高级搜索
const advancedSearchVisible = ref(false);
const advancedSearchForm = ref({
  keyword: '',
  contractType: '',
  approvalStatus: '',
  executionStatus: '',
  paymentMethod: '',
  signDateRange: [],
  startDateRange: [],
  endDateRange: [],
  lastProgressDateRange: [],
  nextProgressDate: '',
  ownerUserId: '',
});

// 合同类型选项
const contractTypeOptions = ref([
  { label: '销售合同', value: '销售合同' },
  { label: '采购合同', value: '采购合同' },
  { label: '服务合同', value: '服务合同' },
  { label: '其他', value: '其他' },
]);

// 高级筛选
const handleAdvancedFilter = () => {
  advancedSearchVisible.value = true;
};

// 高级搜索
const handleAdvancedSearch = () => {
  // 构建搜索参数
  const params = {
    ...advancedSearchForm.value,
  };

  // 合并到主搜索表单
  searchForm.value.keyword = params.keyword;
  searchForm.value.approvalStatus = params.approvalStatus;
  searchForm.value.executionStatus = params.executionStatus;
  searchForm.value.paymentMethod = params.paymentMethod;
  searchForm.value.signDateRange = params.signDateRange;

  // 执行搜索
  handleSearch();

  // 关闭弹框
  advancedSearchVisible.value = false;
};

// 重置高级搜索
const resetAdvancedSearch = () => {
  advancedSearchForm.value = {
    keyword: '',
    contractType: '',
    approvalStatus: '',
    executionStatus: '',
    paymentMethod: '',
    signDateRange: [],
    startDateRange: [],
    endDateRange: [],
    lastProgressDateRange: [],
    nextProgressDate: '',
    ownerUserId: '',
  };
};

// 操作
const clickOper = async (type: number, row?: ContractData) => {
  switch (type) {
    case 1: // 添加
      router.push({
        path: '/contractMange/add',
      });
      break;
    case 2: // 导入
      MessagePlugin.info('导入功能开发中');
      break;
    case 3: // 导出
      MessagePlugin.info('导出功能开发中');
      break;
    case 4: // 排序
      MessagePlugin.info('排序功能开发中');
      break;
    case 5: // 列表
      if (customColumnDialogRef.value) {
        customColumnDialogRef.value.show();
      }
      break;
    case 6: // 合同主题（详情）
      router.push({
        // status 0 待审批1已通过2被否决
        path: '/contractMange/detail',
        query: { id: row.id, status: row.approval_status },
      });
      break;
    case 7: // 客户名称（客户详情）
      if (row?.customer_id) {
        router.push({
          path: '/customerMange/customer/detail',
          query: { id: row.customer_id },
        });
      }
      break;
    case 8: // 验收
      if (row) {
        handleContractAcceptance(row);
      }
      break;
    case 9: // 编辑
      router.push({
        path: '/contractMange/edit',
        query: { id: row.id },
      });
      break;
    case 10: // 删除
      if (row) {
        handleDeleteContract(row);
      }
      break;
    case 11: // 生成合同
      if (row) {
        handleGenerateContract(row);
      }
      break;
    case 12: // 下载合同
      if (row) {
        handleDownloadContract(row);
      }
      break;
  }
};

// 删除合同
const handleDeleteContract = (row: ContractData) => {
  const confirmDia = DialogPlugin.confirm({
    header: '提示',
    body: '此操作将永久删除该合同记录，是否继续？',
    theme: 'warning',
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const res = await deleteContract(row.id);
        if (res && (res.code === 0 || res.code === 200)) {
          MessagePlugin.success(res.msg || '删除成功');
          await loadTableData();
        } else {
          MessagePlugin.error(res?.msg || res?.message || '删除失败');
        }
      } catch (error: any) {
        console.error('删除合同失败:', error);
        MessagePlugin.error(error?.response?.data?.msg || error?.message || '删除失败');
      } finally {
        confirmDia.hide();
      }
    },
    onCancel: () => {
      MessagePlugin.info('已取消删除');
      confirmDia.hide();
    },
  });
};

// 合同验收
const handleContractAcceptance = (row: ContractData) => {
  const confirmDia = DialogPlugin.confirm({
    header: '合同验收',
    body: `确定要验收合同"${row.contract_title || row.contract_no}"吗？`,
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const res = await contractAcceptance(row.id);
        if (res && (res.code === 0 || res.code === 200)) {
          MessagePlugin.success(res.msg || '验收成功');
          await loadTableData();
        } else {
          MessagePlugin.error(res?.msg || res?.message || '验收失败');
        }
      } catch (error: any) {
        console.error('合同验收失败:', error);
        MessagePlugin.error(error?.response?.data?.msg || error?.message || '验收失败');
      } finally {
        confirmDia.hide();
      }
    },
    onCancel: () => {
      MessagePlugin.info('已取消验收');
      confirmDia.hide();
    },
  });
};

// 生成合同
const handleGenerateContract = (row: ContractData) => {
  const confirmDia = DialogPlugin.confirm({
    header: '生成合同',
    body: `确定要生成合同"${row.contract_title || row.contract_no}"吗？`,
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        // 调用生成合同接口
        const response = await fetch(`/api/contract/word/generate?contract_id=${row.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          // 假设接口返回文件流，直接下载
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${row.contract_title || row.contract_no}.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          MessagePlugin.success('合同生成成功');
          // 重新加载数据，更新wordur字段
          await loadTableData();
        } else {
          MessagePlugin.error('合同生成失败');
        }
      } catch (error: any) {
        console.error('生成合同失败:', error);
        MessagePlugin.error(error.message || '生成合同失败，请重试');
      } finally {
        confirmDia.hide();
      }
    },
    onCancel: () => {
      MessagePlugin.info('已取消生成合同');
      confirmDia.hide();
    },
  });
};

// 下载合同
const handleDownloadContract = (row: ContractData) => {
  if (row.wordur) {
    try {
      // 创建下载链接
      const a = document.createElement('a');
      a.href = row.wordur;
      a.download = `${row.contract_title || row.contract_no}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      MessagePlugin.success('合同下载成功');
    } catch (error: any) {
      console.error('下载合同失败:', error);
      MessagePlugin.error(error.message || '下载合同失败，请重试');
    }
  } else {
    MessagePlugin.error('合同文档不存在');
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
      type: activeTab.value,
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };

    // 根据标签页设置 owner_user_id
    if (activeTab.value === 'my') {
      // 我的合同 - 需要获取当前用户ID，这里暂时不传，由后端处理
      // params.owner_user_id = currentUserId;
    } else if (activeTab.value === 'subordinate') {
      // 下属合同 - 需要特殊处理
      // params.subordinate = true;
    } else if (activeTab.value === 'shared') {
      // 共享合同 - 需要特殊处理
      // params.shared = true;
    }

    // 关键词（合同编号/主题/客户名称）
    if (searchForm.value.keyword) {
      params.keyword = searchForm.value.keyword.trim();
    }

    // 审批状态
    if (
      searchForm.value.approvalStatus !== '' &&
      searchForm.value.approvalStatus !== null &&
      searchForm.value.approvalStatus !== undefined
    ) {
      params.approval_status = searchForm.value.approvalStatus;
    }

    // 执行状态（如果API支持）
    if (
      searchForm.value.executionStatus !== '' &&
      searchForm.value.executionStatus !== null &&
      searchForm.value.executionStatus !== undefined
    ) {
      // params.execution_status = searchForm.value.executionStatus;
    }

    // 付款方式（如果API支持）
    if (searchForm.value.paymentMethod) {
      // params.payment_method = searchForm.value.paymentMethod;
    }

    // 签单日期范围
    if (searchForm.value.signDateRange && searchForm.value.signDateRange.length === 2) {
      const [startDate, endDate] = searchForm.value.signDateRange;
      if (startDate && endDate) {
        // 格式化日期为 Y-m-d 格式
        const formatDateStr = (date: string | Date) => {
          const d = typeof date === 'string' ? new Date(date) : date;
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        params.start_date = formatDateStr(startDate);
        params.end_date = formatDateStr(endDate);
      }
    }

    // 调用接口
    const response = await getContractList(params);

    if (response.code === 0 || response.code === 200) {
      const data = response.data || {};
      tableData.value = data.list || [];
      pagination.value.total = data.count || 0;
    } else {
      MessagePlugin.error(response.msg || response.message || '获取合同列表失败');
      tableData.value = [];
      pagination.value.total = 0;
    }
  } catch (error: any) {
    console.error('加载合同列表失败:', error);
    MessagePlugin.error('加载合同列表失败，请重试');
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
.contract-container {
  padding: var(--td-comp-paddingTB-lg) var(--td-comp-paddingLR-lg);
  background: #fff;
  padding: 20px;
}

.contract-tabs {
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
    gap: 8px;
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
  }
}

/* 高级搜索弹框样式 */
.advanced-search-container {
  .search-form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 30px;
  }

  .form-item {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .form-label {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    :deep(.t-input),
    :deep(.t-select),
    :deep(.t-date-picker) {
      width: 100%;
    }
  }

  .search-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
  }
}
</style>
