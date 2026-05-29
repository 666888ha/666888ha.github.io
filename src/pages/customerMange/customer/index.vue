<template>
  <div class="customer-container">
    <!-- 顶部标签页 -->
    <t-tabs v-model="activeTab" class="customer-tabs" @change="handleTabChange">
      <t-tab-panel value="all" label="全部客户"> </t-tab-panel>
      <t-tab-panel value="self" label="我的客户"> </t-tab-panel>
      <t-tab-panel value="subordinate" label="下属客户"> </t-tab-panel>
      <t-tab-panel value="collaborate" label="我协作的"> </t-tab-panel>
    </t-tabs>
    <!-- 搜索区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <!-- 关键词输入 -->
        <div class="filter-item">
          <label class="filter-label">关键词</label>
          <t-input v-model="searchForm.keyword" placeholder="请输入内容" />
        </div>
        <!-- 客户状态下拉 -->
        <div class="filter-item">
          <label class="filter-label">客户状态</label>
          <t-select
            v-model="searchForm.customer_jieduan"
            placeholder="请选择客户状态"
            :options="statusOptions"
            :loading="loadingCustomerStatus"
            clearable
          />
        </div>
        <!-- 客户类型下拉 -->
        <div class="filter-item">
          <label class="filter-label">客户类型</label>
          <t-select v-model="searchForm.customer_type" placeholder="请选择客户类型" :options="typeOptions" clearable />
        </div>

        <!-- 所属行业下拉 -->
        <div class="filter-item">
          <label class="filter-label">所属行业</label>
          <t-select v-model="searchForm.industry" placeholder="请选择所属行业" :options="industryOptions" clearable />
        </div>

        <!-- 客户价值等级下拉 -->
        <div class="filter-item">
          <label class="filter-label">客户价值等级</label>
          <t-select
            v-model="searchForm.value_level"
            placeholder="请选择客户价值等级"
            :options="levelOptions"
            clearable
          />
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
        <t-button theme="default" variant="outline" @click="clickOper(4)">
          <template #icon>
            <t-icon name="usergroup" />
          </template>
          移入公海
        </t-button>
      </div>
      <div class="operation-right">
        <t-tooltip content="当对列表客户写跟进时,会自动将刚刚写过跟进的客户排到最后。" :show-arrow="false">
          <t-icon name="help-circle" />
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
        <!-- 客户名称 -->
        <template #customer_name="{ row }">
          <div class="customer-name-container">
            <t-tooltip :content="row.customer_name" placement="top">
              <t-link theme="primary" class="customer-name-link" @click="clickOper(10, row)">
                {{ row.customer_name }}
              </t-link>
            </t-tooltip>
          </div>
        </template>

        <!-- 客户状态 -->
        <template #customer_jieduan="{ row }">
          <t-tag :theme="getCustomerJieduanTheme(row.customer_jieduan)" variant="light" size="small">{{
            getListRowCustomerJieduanLabel(row, statusOptions)
          }}</t-tag>
        </template>

        <!-- 客户价值等级（星级） -->
        <template #value_level="{ row }">
          <t-rate :value="row.value_level" :count="5" disabled allow-half />
        </template>

        <!-- 最后跟进时间 -->
        <template #last_follow_time="{ row }">
          {{ formatFollowTime(row.last_follow_time || row.last_follow) }}
        </template>

        <!-- 审批状态 -->
        <template #approval_status="{ row }">
          <span class="status-dot" :class="[`status-${row.approval_status}`]"></span>
          {{ getApprovalStatusText(row.approval_status) }}
        </template>
        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="clickOper(7, row)">跟进</t-link>
            <t-link v-if="row.approval_status === 0" theme="primary" @click="clickOper(8, row)">编辑</t-link>
            <t-link theme="danger" @click="clickOper(9, row)">删除</t-link>
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
    <!-- 导入客户（CSV） -->
    <t-dialog
      v-model:visible="importVisible"
      header="导入客户（CSV）"
      width="560px"
      :confirm-btn="{ content: '开始导入', loading: importSubmitting }"
      @confirm="handleImportConfirm"
    >
      <div class="import-dialog-body">
        <p class="import-tip">
          请使用 UTF-8 编码的 CSV（Excel 可选「CSV UTF-8（逗号分隔）」另存）。表头需与模板一致，单次最多约 3000 行。
        </p>
        <t-space>
          <t-button theme="primary" variant="outline" :loading="importTemplateLoading" @click="handleDownloadImportTemplate">
            下载导入模板
          </t-button>
        </t-space>
        <t-upload
          v-model:files="importFiles"
          class="import-upload"
          accept=".csv,.txt"
          :max="1"
          :auto-upload="false"
        />
      </div>
    </t-dialog>
    <!-- 移入公海 -->
    <moveToPublicSea ref="moveSea" :is-multiple="isMultiple" @success="handleMoveToPublicSeaSuccess" />
    <!-- 自定义列弹框 -->
    <custom-column-dialog
      ref="customColumnDialogRef"
      :all-columns-config="allColumnsConfig"
      :table-columns="tableColumns"
      :required-columns="requiredColumns"
      custom-key-name="customerListKey"
      @confirm="handleColumnConfirm"
    />
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { CustomerListItem } from '@/api/customer/customer';
import {
  deleteCustomer,
  downloadCustomerImportTemplate,
  exportCustomerList,
  getCustomerList,
  importCustomerCsv,
} from '@/api/customer/customer';
import { getDictOptions } from '@/api/dic';
import {
  getCustomerJieduanTheme,
  getListRowCustomerJieduanLabel,
  mapDictOptionsToSelect,
} from '@/utils/customerJieduanDict';
import { getApprovalStatusText, parseTime } from '@/utils/ruoyi';

defineOptions({
  name: 'CustomerList',
});
const CustomColumnDialog = defineAsyncComponent(() => import('@/components/BaseCustomColumn/index.vue'));
const moveToPublicSea = defineAsyncComponent(() => import('../components/openSeaDialog.vue'));

const router = useRouter();
const moveSea = ref(null);
const importVisible = ref(false);
const importSubmitting = ref(false);
const importTemplateLoading = ref(false);
const importFiles = ref<any[]>([]);
const customColumnDialogRef = ref(null);
// 标签页
const activeTab = ref('all');
const isMultiple = ref(true);
// 搜索表单
const searchForm = ref({
  keyword: '',
  customer_jieduan: '',
  customer_type: '',
  industry: '',
  value_level: '',
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
    const response = await getDictOptions('customer_jieduan');
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      statusOptions.value = mapDictOptionsToSelect(data);
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
    // 如果接口失败，使用默认选项
    typeOptions.value = [
      { label: '终端客户', value: 'end' },
      { label: '经销商客户', value: 'dealer' },
      { label: '其他客户', value: 'other' },
    ];
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
  sys_no: {
    title: '系统编号',
    align: 'left',
    width: 160,
    colKey: 'sys_no',
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
    width: 180,
    colKey: 'last_follow_time',
    cell: 'last_follow_time',
  },
  unfollow_days_text: {
    title: '未跟进天数',
    align: 'left',
    width: 140,
    colKey: 'unfollow_days_text',
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
    align: 'center',
    width: 120,
    colKey: 'approval_status',
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
  allColumnsConfig.unfollow_days_text,
  allColumnsConfig.operation,
];

// 表格列定义（从 localStorage 读取或使用默认配置）
const initTableColumns = (): PrimaryTableCol[] => {
  const savedConfig = localStorage.getItem('customerListKey');
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

// 表格数据
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

// 格式化最后跟进时间
const formatFollowTime = (time: string | number | null | undefined): string => {
  if (!time) {
    return '-';
  }
  // 格式化时间为 YYYY-MM-DD HH:mm:ss
  const formatted = parseTime(time, '{y}-{m}-{d} {h}:{i}:{s}');
  return formatted || '-';
};

// 更多操作
const moreActions = [
  { content: '添加协作', value: 'batchDelete' },
  { content: '重点关注', value: 'batchExport' },
];

// 标签页切换
const handleTabChange = (value: string | number) => {
  activeTab.value = String(value);
  // 重新加载数据
  loadTableData();
};

// 查询操作
const handleSearch = () => {
  // 重置到第一页
  pagination.value.current = 1;
  loadTableData();
};

// 重置操作
const handleReset = () => {
  // 清空筛选表单
  searchForm.value.keyword = '';
  searchForm.value.customer_jieduan = '';
  searchForm.value.customer_type = '';
  searchForm.value.industry = '';
  searchForm.value.value_level = '';
  // 重置到第一页
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
    case 1: // 新增
      router.push({
        path: '/customerMange/customer/add',
      });
      break;
    case 2: // 导入
      importFiles.value = [];
      importVisible.value = true;
      break;
    case 3: // 导出
      triggerExportCustomers();
      break;
    case 4: {
      // 移入公海
      if (selectedRowKeys.value.length === 0) {
        MessagePlugin.warning('请先选择要移入公海的客户');
        return;
      }
      // 深拷贝数组，避免引用问题
      const idsToMove = [...selectedRowKeys.value];
      console.log('移入公海 - 传递的客户ID:', idsToMove);
      moveSea.value.show(idsToMove);
      break;
    }

    case 5: // 列表
      if (customColumnDialogRef.value) {
        customColumnDialogRef.value.show();
      }
      break;
    case 7: // 跟进
      router.push({
        path: '/customerMange/customer/followUpCustomer',
        query: { id: row.id },
      });
      break;
    case 8: // 编辑
      router.push({
        path: '/customerMange/customer/edit',
        query: { id: row.id },
      });
      break;
    case 9: // 删除
      handleDeleteCustomer(row);
      break;
    case 10: // 详情
      router.push({
        path: '/customerMange/customer/detail',
        query: { id: row.id },
      });
      break;
  }
};

// 处理自定义列确认
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

/** 若后端返回 JSON 错误，Blob 需按文本解析 */
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

async function handleDownloadImportTemplate() {
  importTemplateLoading.value = true;
  try {
    const blob = await downloadCustomerImportTemplate();
    await saveBlobAsDownload(blob, '客户导入模板.csv');
    MessagePlugin.success('模板已下载');
  } catch (e: any) {
    MessagePlugin.error(e?.message || '模板下载失败');
  } finally {
    importTemplateLoading.value = false;
  }
}

function buildListQueryParams(): Record<string, any> {
  const params: Record<string, any> = {
    type: activeTab.value,
    page: pagination.value.current,
    limit: pagination.value.pageSize,
  };
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
  return params;
}

async function triggerExportCustomers() {
  tableLoading.value = true;
  try {
    const params = buildListQueryParams();
    delete params.page;
    delete params.limit;
    if (selectedRowKeys.value.length > 0) {
      params.ids = selectedRowKeys.value.join(',');
    }
    const blob = await exportCustomerList(params as any);
    await saveBlobAsDownload(blob, `客户列表导出_${Date.now()}.csv`);
    MessagePlugin.success('导出已开始下载');
  } catch (e: any) {
    MessagePlugin.error(e?.message || '导出失败');
  } finally {
    tableLoading.value = false;
  }
}

async function handleImportConfirm() {
  const f = importFiles.value?.[0]?.raw as File | undefined;
  if (!f) {
    MessagePlugin.warning('请先选择 CSV 文件');
    return Promise.reject(new Error('no file'));
  }
  importSubmitting.value = true;
  try {
    const res: any = await importCustomerCsv(f);
    if (res.code !== 0 && res.code !== 200) {
      MessagePlugin.error(res.msg || res.message || '导入失败');
      return;
    }
    const d = res.data || {};
    const fail = d.failed ?? 0;
    MessagePlugin.success(
      `导入完成：新增 ${d.inserted ?? 0} 条，更新 ${d.updated ?? 0} 条${fail > 0 ? `，失败 ${fail} 条` : ''}`,
    );
    if (Array.isArray(d.errors) && d.errors.length > 0) {
      console.warn('导入错误明细', d.errors);
    }
    importVisible.value = false;
    importFiles.value = [];
    loadTableData();
  } catch (e: any) {
    MessagePlugin.error(e?.message || '导入失败');
    return Promise.reject(e);
  } finally {
    importSubmitting.value = false;
  }
}

// 加载表格数据
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    const params: any = buildListQueryParams();

    const response = await getCustomerList(params);

    if (response.code === 0 || response.code === 200) {
      const data = response.data || {};
      const list = data.list || [];

      // 转换数据格式
      tableData.value = list;

      // 更新分页信息
      pagination.value = {
        ...pagination.value,
        total: data.total || 0,
      };
    } else {
      MessagePlugin.error(response.message || '获取客户列表失败');
      tableData.value = [];
    }
  } catch (error: any) {
    MessagePlugin.error('获取客户列表失败，请重试');
    tableData.value = [];
  } finally {
    tableLoading.value = false;
  }
};
// 移入公海成功回调
const handleMoveToPublicSeaSuccess = () => {
  // 清空选中项
  selectedRowKeys.value = [];
  // 重新加载列表数据
  loadTableData();
};
// 删除客户
const handleDeleteCustomer = (row: CustomerListItem) => {
  const customerId = row.id;
  const customerName = row.customer_name || row.customerName || '该客户';
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
          // 重新加载列表数据
          loadTableData();
        } else {
          MessagePlugin.error(response.message || '删除失败');
        }
      } catch (error: any) {
        console.error('删除客户失败:', error);
        MessagePlugin.error(error.message || '删除失败，请重试');
      }
    },
  });
};

// 初始化
onMounted(() => {
  // 加载客户状态选项
  loadCustomerStatusOptions();
  // 加载客户类型选项
  loadCustomerTypeOptions();
  // 加载行业选项
  loadIndustryOptions();
  // 加载表格数据
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

.import-dialog-body {
  .import-tip {
    margin: 0 0 12px;
    color: var(--td-text-color-secondary);
    font-size: 13px;
    line-height: 1.5;
  }
  .import-upload {
    margin-top: 16px;
  }
}
</style>
