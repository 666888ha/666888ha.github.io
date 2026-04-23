<template>
  <div class="customer-container">
    <!-- 搜索区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <!-- 关键词输入 -->
        <div class="filter-item">
          <label class="filter-label">关键词</label>
          <t-input v-model="searchForm.keyword" placeholder="请输入内容" />
        </div>
        <div class="filter-item">
          <label class="filter-label">审批类型</label>
          <t-select
            v-model="searchForm.approval_status"
            placeholder="请选择审批类型"
            :options="typeOptions"
            :loading="loadingCustomerType"
            clearable
          />
        </div>
        <!-- 最后跟进日期选择 -->
        <div class="filter-item">
          <label class="filter-label">提交时间</label>
          <t-date-picker v-model="searchForm.approval_time" placeholder="请选择日期" style="width: 100%" />
        </div>
        <div class="filter-item">
          <label class="filter-label">审批时间</label>
          <t-date-picker v-model="searchForm.approval_time" placeholder="请选择日期" style="width: 100%" />
        </div>
        <!-- 客户价值等级下拉 -->
        <div class="filter-item">
          <label class="filter-label">创建人员</label>
          <t-select v-model="searchForm.owner" placeholder="请选择内容状态" :options="levelOptions" />
        </div>
      </div>
      <div class="filter-right">
        <!-- 操作按钮 -->
        <t-button theme="primary" @click="handleSearch">查询</t-button>
        <t-button theme="default" @click="handleReset">重置</t-button>
        <t-button theme="default" text @click="handleAdvancedFilter">
          <span style="color: #165dff">Y. 高级筛选</span>
        </t-button>
      </div>
    </div>
    <!-- 操作按钮和表格控制 -->
    <div class="operation-bar">
      <div class="operation-left">
        <t-button theme="default" variant="outline" @click="clickOper(1)">
          <template #icon>
            <t-icon name="download" />
          </template>
          导出
        </t-button>
      </div>
      <div class="operation-right">
        <t-tooltip content="列表">
          <t-button theme="default" variant="outline" @click="clickOper(2)">
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
        <!-- 客户名称（与客户列表一致：单行省略 + 悬停展示全称） -->
        <template #customer_name="{ row }">
          <div class="customer-name-container">
            <t-tooltip :content="row.customer_name || ''" placement="top">
              <t-link theme="primary" class="customer-name-link" @click="clickOper(4, row)">
                {{ row.customer_name }}
              </t-link>
            </t-tooltip>
          </div>
        </template>

        <!-- 客户状态 -->
        <template #customer_jieduan="{ row }">
          <t-tag :theme="getStatusTheme(row.customer_jieduan)" variant="light" size="small">{{
            getStatusName(row.customer_jieduan)
          }}</t-tag>
        </template>
        <!-- 审批状态 -->
        <template #approvalStatus="{ row }">
          <span class="status-dot" :class="[`status-${row.approval_status}`]"></span>
          {{ getApprovalStatusText(row.approval_status) }}
        </template>
        <!-- 客户价值等级（星级） -->
        <template #value_level="{ row }">
          <t-rate :value="row.value_level" :count="5" disabled allow-half />
        </template>

        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="clickOper(5, row)">审批</t-link>
            <t-link theme="primary" @click="clickOper(6, row)">详情</t-link>
          </t-space>
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
    <baseExport ref="listExport" />
    <!-- 自定义列弹框 -->
    <custom-column-dialog
      ref="customColumnDialogRef"
      :all-columns-config="allColumnsConfig"
      :table-columns="tableColumns"
      :required-columns="requiredColumns"
      custom-key-name="approveCustomerKey"
      @confirm="handleColumnConfirm"
    />
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { exportApprovalTodoList, getApprovalTodoList } from '@/api/approve/index';
import type { CustomerListItem } from '@/api/customer/customer';
import { batchReceiveGarbage, deleteCustomer } from '@/api/customer/customer';
import { getDictOptions } from '@/api/dic';
import { getApprovalStatusText } from '@/utils/ruoyi';

defineOptions({
  name: 'HighSeasCustomerList',
});
const CustomColumnDialog = defineAsyncComponent(() => import('@/components/BaseCustomColumn/index.vue'));
const baseExport = defineAsyncComponent(() => import('@/components/baseExport/index.vue'));

const router = useRouter();
const customColumnDialogRef = ref(null);
const rulesDescriptionDialogRef = ref(null);
const batchEditDialogRef = ref(null);
const listExport = ref(null);
const moveSea = ref(null);

// 搜索表单
const searchForm = ref({
  keyword: '',
  customer_jieduan: '',
  customer_type: '',
  industry: '',
  value_level: '',
  last_follow_time: '',
});

// 客户状态选项
const statusOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingCustomerStatus = ref(false);

// 加载客户状态字典选项
const loadCustomerStatusOptions = async () => {
  // 如果正在加载或已有数据，则不再请求
  if (loadingCustomerStatus.value || statusOptions.value.length > 0) {
    return;
  }

  loadingCustomerStatus.value = true;
  try {
    const response = await getDictOptions('customer_jieduan', false);
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      statusOptions.value = data;
    }
  } catch (error: any) {
    MessagePlugin.error('获取客户状态字典失败，请重试');
  } finally {
    loadingCustomerStatus.value = false;
  }
};

// 客户类型选项
const typeOptions = ref<Array<{ label: string; value: string }>>([]);
const loadingCustomerType = ref(false);

// 加载客户类型字典选项
const loadCustomerTypeOptions = async () => {
  // 如果正在加载或已有数据，则不再请求
  if (loadingCustomerType.value || typeOptions.value.length > 0) {
    return;
  }

  loadingCustomerType.value = true;
  try {
    const response = await getDictOptions('customer_type');
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      // 转换为选项格式
      typeOptions.value = data
        .map((item: any) => ({
          label: item.label || item.dictLabel || item.name || '',
          value: String(item.value || item.dictValue || item.code || ''),
        }))
        .filter((item: any) => item.label && item.value); // 过滤掉空值
    }
  } catch (error: any) {
    console.error('获取客户类型字典失败:', error);
    MessagePlugin.error('获取客户类型字典失败，请重试');
  } finally {
    loadingCustomerType.value = false;
  }
};

// 所属行业选项
const industryOptions = ref<Array<{ label: string; value: string }>>([]);
const loadingIndustry = ref(false);

// 加载所属行业字典选项
const loadIndustryOptions = async () => {
  // 如果正在加载或已有数据，则不再请求
  if (loadingIndustry.value || industryOptions.value.length > 0) {
    return;
  }

  loadingIndustry.value = true;
  try {
    const response = await getDictOptions('industry');
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      // 转换为选项格式
      industryOptions.value = data
        .map((item: any) => ({
          label: item.label || item.dictLabel || item.name || '',
          value: String(item.value || item.dictValue || item.code || ''),
        }))
        .filter((item: any) => item.label && item.value); // 过滤掉空值
    }
  } catch (error: any) {
    console.error('获取所属行业字典失败:', error);
    MessagePlugin.error('获取所属行业字典失败，请重试');
  } finally {
    loadingIndustry.value = false;
  }
};
// 客户价值等级选项
const levelOptions = ref([
  { label: '1星', value: 1 },
  { label: '2星', value: 2 },
  { label: '3星', value: 3 },
  { label: '4星', value: 4 },
  { label: '5星', value: 5 },
]);

// 获取状态主题
const getStatusTheme = (status: string | number): 'primary' | 'warning' | 'success' | 'default' | 'danger' => {
  const themeMap: Record<string, 'primary' | 'warning' | 'success' | 'default' | 'danger'> = {
    customer_jieduan1: 'primary', // 了解产品
    customer_jieduan2: 'warning', // 正在跟进
    customer_jieduan3: 'primary', // 正在试用
    customer_jieduan4: 'warning', // 准备购买
    customer_jieduan5: 'success', // 准备付款
    customer_jieduan6: 'success', // 已经购买
    customer_jieduan7: 'default', // 暂时搁置
  };
  return themeMap[String(status)] || 'default';
};
const getStatusName = (status: string | number): string => {
  const nameMap: Record<string, string> = {
    customer_jieduan1: '了解产品',
    customer_jieduan2: '正在跟进',
    customer_jieduan3: '正在试用',
    customer_jieduan4: '准备购买',
    customer_jieduan5: '准备付款',
    customer_jieduan6: '已经购买',
    customer_jieduan7: '暂时搁置',
  };
  return nameMap[status] || '未知状态';
};
// 所有可用的列定义（完整配置）
const allColumnsConfig: Record<string, PrimaryTableCol> = {
  rowSelect: {
    colKey: 'row-select',
    type: 'multiple',
    width: 50,
    fixed: 'left',
  },
  customer_name: {
    title: '客户名称',
    align: 'left',
    width: 200,
    colKey: 'customer_name',
    ellipsis: true,
    cell: 'customer_name',
  },
  operation: {
    title: '操作',
    align: 'left',
    width: 180,
    colKey: 'operation',
    fixed: 'right',
  },
  systemNumber: {
    title: '系统编号',
    align: 'left',
    width: 150,
    colKey: 'systemNumber',
  },
  customer_type: {
    title: '客户类型',
    align: 'center',
    width: 120,
    colKey: 'customer_type',
  },
  customer_jieduan: {
    title: '客户状态',
    align: 'center',
    width: 120,
    colKey: 'customer_jieduan',
  },
  value_level: {
    title: '客户价值等级',
    align: 'center',
    width: 150,
    colKey: 'value_level',
  },
  main_contact_name: {
    title: '首联系人',
    align: 'left',
    width: 120,
    colKey: 'main_contact_name',
  },
  main_contact_mobile: {
    title: '手机号码',
    align: 'left',
    width: 140,
    colKey: 'main_contact_mobile',
  },
  last_follow_time: {
    title: '最后跟进',
    align: 'left',
    width: 140,
    colKey: 'last_follow_time',
  },
  daysNotFollowed: {
    title: '未跟进天数',
    align: 'left',
    width: 140,
    colKey: 'daysNotFollowed',
  },
  industry: {
    title: '所属行业',
    align: 'left',
    width: 150,
    colKey: 'industry',
  },
  channel: {
    title: '客户来源',
    align: 'left',
    width: 120,
    colKey: 'channel',
  },
  region_name: {
    title: '所在地区',
    align: 'left',
    width: 150,
    colKey: 'region_name',
  },
  approval_status: {
    title: '审批状态',
    align: 'left',
    width: 120,
    colKey: 'approvalStatus',
  },
};
const requiredColumns = ['customer_name', 'operation'];

// 默认列配置
const defaultColumns: PrimaryTableCol[] = [
  allColumnsConfig.rowSelect,
  allColumnsConfig.customer_name,
  allColumnsConfig.customer_jieduan,
  allColumnsConfig.value_level,
  allColumnsConfig.main_contact_name,
  allColumnsConfig.main_contact_mobile,
  allColumnsConfig.last_follow_time,
  allColumnsConfig.daysNotFollowed,
  allColumnsConfig.approval_status,
  allColumnsConfig.operation,
];

// 表格列定义（从 localStorage 读取或使用默认配置）
const initTableColumns = (): PrimaryTableCol[] => {
  const savedConfig = localStorage.getItem('approveCustomerKey');
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 根据 colKey 从 allColumnsConfig 中获取实际的列配置
        const columns: PrimaryTableCol[] = [];
        // 始终在最前面添加复选框列
        columns.push(allColumnsConfig.rowSelect);

        parsed.forEach((column: any) => {
          const colKey = column.colKey;
          // 跳过 row-select，因为已经添加了
          if (colKey === 'row-select') {
            return;
          }
          if (allColumnsConfig[colKey]) {
            columns.push(allColumnsConfig[colKey]);
          }
        });
        // 确保至少包含必需的列
        if (columns.length > 0) {
          return columns;
        }
      }
    } catch (error) {
      console.error('解析 localStorage 中的列配置失败:', error);
    }
  }
  // 如果没有保存的配置或解析失败，使用默认配置
  return defaultColumns;
};

const tableColumns = ref<PrimaryTableCol[]>(initTableColumns());
const tableData = ref<CustomerListItem[]>([]);

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
// 查询操作
// 搜索
const handleSearch = () => {
  pagination.value.current = 1;
  loadTableData();
};

// 重置
const handleReset = () => {
  searchForm.value = {
    keyword: '',
    customer_jieduan: '',
    customer_type: '',
    industry: '',
    value_level: '',
    last_follow_time: '',
  };
  pagination.value.current = 1;
  loadTableData();
};

// 高级筛选
const handleAdvancedFilter = () => {
  router.push({
    path: '/customerMange/advancedFilter',
  });
};
// 操作
const clickOper = (type: number, row) => {
  switch (type) {
    case 1: // 导出
      triggerExportCustomerApprove();
      break;

    case 2: // 列表
      if (customColumnDialogRef.value) {
        customColumnDialogRef.value.show();
      }
      break;

    case 4: // 详情
      router.push({
        path: '/customerMange/customer/detail',
        query: { id: row.id },
      });
      break;
    case 5: // 审批
      router.push({
        path: '/approveMange/customerApprove/approve',
        query: { id: row.id },
      });
      break;
    case 6: // 详情
      router.push({
        path: '/approveMange/customerApprove/detail',
        query: { id: row.id },
      });
      break;
  }
};

const handleColumnConfirm = (newColumns: any[]) => {
  // 更新表格列
  tableColumns.value = newColumns;
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

function buildCustomerApproveListParams(withPaging: boolean): Record<string, any> {
  const params: Record<string, any> = {
    approval_type: 'customer',
  };
  if (withPaging) {
    params.page = pagination.value.current;
    params.limit = pagination.value.pageSize;
  }
  if (searchForm.value.keyword) {
    params.keyword = searchForm.value.keyword.trim();
  }
  if (searchForm.value.customer_jieduan) {
    params.customer_jieduan = searchForm.value.customer_jieduan;
  }
  if (searchForm.value.customer_type) {
    params.customer_type = searchForm.value.customer_type;
  }
  if (searchForm.value.industry) {
    params.industry = searchForm.value.industry;
  }
  if (searchForm.value.value_level) {
    params.value_level = searchForm.value.value_level;
  }
  if (searchForm.value.last_follow_time) {
    params.last_follow_time = searchForm.value.last_follow_time;
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

async function triggerExportCustomerApprove() {
  tableLoading.value = true;
  try {
    const params = buildCustomerApproveListParams(false);
    if (selectedRowKeys.value.length > 0) {
      params.ids = selectedRowKeys.value.join(',');
    }
    const blob = await exportApprovalTodoList(params);
    await saveBlobAsDownload(blob, `客户审批列表_${Date.now()}.csv`);
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
    const params = buildCustomerApproveListParams(true);
    const response = await getApprovalTodoList(params);

    if (response.code === 0 || response.code === 200) {
      const data = response.data || {};
      const list = data.list || [];

      // 转换数据格式，兼容新旧字段名
      tableData.value = list;

      // 更新分页信息
      pagination.value = {
        ...pagination.value,
        total: data.count || 0,
      };
    } else {
      MessagePlugin.error(response.message || '获取客户列表失败');
      tableData.value = [];
    }
  } catch (error: any) {
    console.error('获取客户列表失败:', error);
    MessagePlugin.error(error.message || '获取客户列表失败，请重试');
    tableData.value = [];
  } finally {
    tableLoading.value = false;
  }
};

// 初始化
onMounted(() => {
  // 加载客户状态字典选项
  loadCustomerStatusOptions();
  loadCustomerTypeOptions();
  loadIndustryOptions();
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
