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
          <t-select
            v-model="searchForm.customer_type"
            placeholder="请选择客户类型"
            :options="typeOptions"
            :loading="loadingCustomerType"
            clearable
          />
        </div>
        <!-- 所属行业下拉 -->
        <div class="filter-item">
          <label class="filter-label">所属行业</label>
          <t-select
            v-model="searchForm.industry"
            placeholder="请选择所属行业"
            :options="industryOptions"
            :loading="loadingIndustry"
            clearable
          />
        </div>
        <!-- 客户价值等级下拉 -->
        <div class="filter-item">
          <label class="filter-label">客户价值等级</label>
          <t-select v-model="searchForm.value_level" placeholder="请选择内容状态" :options="levelOptions" />
        </div>

        <!-- 最后跟进日期选择 -->
        <div class="filter-item">
          <label class="filter-label">最后跟进</label>
          <t-date-picker v-model="searchForm.last_follow_time" placeholder="请选择日期" style="width: 100%" />
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
        <!-- 公海客户不需要导入导出（仅客户列表保留） -->
        <!--
        <t-button theme="default" variant="outline" @click="clickOper(1)">
          <template #icon>
            <t-icon name="upload" />
          </template>
          导入
        </t-button>
        <t-button theme="default" variant="outline" @click="clickOper(2)">
          <template #icon>
            <t-icon name="download" />
          </template>
          导出
        </t-button>
        -->
        <t-button theme="default" variant="outline" @click="clickOper(3)">
          <template #icon>
            <t-icon name="usergroup" />
          </template>
          领取客户
        </t-button>
        <!-- <t-button theme="default" variant="outline" @click="clickOper(4)">
          <template #icon>
            <t-icon name="git-merge" />
          </template>
          合并客户
        </t-button> -->
        <!-- <t-button theme="default" variant="outline" @click="clickOper(5)">
          <template #icon>
            <t-icon name="usergroup" />
          </template>
          批量编辑
        </t-button> -->
        <t-button theme="default" variant="outline" @click="clickOper(13)">
          <template #icon>
            <t-icon name="usergroup" />
          </template>
          移入垃圾客户
        </t-button>
      </div>
      <div class="operation-right">
        <t-button variant="outline" @click="clickOper(6)">
          <template #icon>
            <t-icon name="help-circle" />
          </template>
          公海规则说明
        </t-button>
        <t-tooltip content="列表">
          <t-button theme="default" variant="outline" @click="clickOper(7)">
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
        @page-change="handlePageChange"
      >
        <template #customer_name="{ row }">
          <div class="customer-name-container">
            <t-tooltip :content="row.customer_name" placement="top">
              <t-link theme="primary" class="customer-name-link" @click="clickOper(12, row)">
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

        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="clickOper(9, row)">跟进</t-link>
            <t-link theme="primary" @click="clickOper(10, row)">编辑</t-link>
            <t-link theme="danger" @click="clickOper(11, row)">删除</t-link>
          </t-space>
        </template>
        <!-- 最后跟进时间 -->
        <template #last_follow_time="{ row }">
          {{ formatFollowTime(row.last_follow_time || row.last_follow) }}
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
    <!-- 公海客户不需要导入导出 -->
    <!-- <baseImport ref="listImport" /> -->
    <!-- <baseExport ref="listExport" /> -->
    <!-- 自定义列弹框 -->
    <custom-column-dialog
      ref="customColumnDialogRef"
      :all-columns-config="allColumnsConfig"
      :table-columns="tableColumns"
      :required-columns="requiredColumns"
      custom-key-name="highSeaCustomerKey"
      @confirm="handleColumnConfirm"
    />
    <!-- 公海规则说明弹框 -->
    <rules-description-dialog ref="rulesDescriptionDialogRef" />
    <!-- 合并客户弹框 -->
    <mergeCustomerDialog ref="mergeCustomerDialogRef" />
    <!-- 批量编辑弹框 -->
    <batchEditDialog ref="batchEditDialogRef" />
    <moveToWaste ref="moveWaste" @success="handleMoveToPublicSeaSuccess" />
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { CustomerListItem } from '@/api/customer/customer';
import { batchReceive, deleteCustomer, getCustomerList } from '@/api/customer/customer';
import { getDictOptions } from '@/api/dic';
import {
  getCustomerJieduanTheme,
  getListRowCustomerJieduanLabel,
  mapDictOptionsToSelect,
} from '@/utils/customerJieduanDict';
import { parseTime } from '@/utils/ruoyi';

defineOptions({
  name: 'HighSeasCustomerList',
});
const CustomColumnDialog = defineAsyncComponent(() => import('@/components/BaseCustomColumn/index.vue'));
// const baseImport = defineAsyncComponent(() => import('@/components/baseImport/index.vue'));
// const baseExport = defineAsyncComponent(() => import('@/components/baseExport/index.vue'));
const RulesDescriptionDialog = defineAsyncComponent(() => import('./components/rulesDescriptionDialog.vue'));
const mergeCustomerDialog = defineAsyncComponent(() => import('../components/mergeCustomerDialog.vue'));
const batchEditDialog = defineAsyncComponent(() => import('../components/batchEditDialog.vue'));
const moveToWaste = defineAsyncComponent(() => import('./components/moveToWasteDialog.vue'));

const router = useRouter();
const customColumnDialogRef = ref(null);
const rulesDescriptionDialogRef = ref(null);
const mergeCustomerDialogRef = ref(null);
const batchEditDialogRef = ref(null);
// const listImport = ref(null);
// const listExport = ref(null);
const moveWaste = ref(null);

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

// 格式化最后跟进时间
const formatFollowTime = (time: string | number | null | undefined): string => {
  if (!time) {
    return '-';
  }
  // 格式化时间为 YYYY-MM-DD HH:mm:ss
  const formatted = parseTime(time, '{y}-{m}-{d} {h}:{i}:{s}');
  return formatted || '-';
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
    width: 180,
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
  allColumnsConfig.operation,
];

// 表格列定义（从 localStorage 读取或使用默认配置）
const initTableColumns = (): PrimaryTableCol[] => {
  const savedConfig = localStorage.getItem('highSeaCustomerKey');
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
  let selectedCustomers = [];
  switch (type) {
    case 1: // 导入（已隐藏）
    case 2: // 导出（已隐藏）
      break;
    case 3: // 领取客户
      if (selectedRowKeys.value.length === 0) {
        MessagePlugin.warning('请先选择要领取的客户');
        return;
      }
      showClaimCustomerDialog();
      break;
    case 4: // 合并客户
      if (selectedRowKeys.value.length !== 2) {
        MessagePlugin.warning('请选择两个客户进行合并');
        return;
      }
      // 获取选中的客户数据
      selectedCustomers = tableData.value.filter((item) => selectedRowKeys.value.includes(item.id));
      if (mergeCustomerDialogRef.value) {
        mergeCustomerDialogRef.value.show(selectedCustomers);
      }
      break;
    case 5: // 批量编辑
      if (selectedRowKeys.value.length === 0) {
        MessagePlugin.warning('请先选择要批量编辑的客户');
        return;
      }
      if (batchEditDialogRef.value) {
        batchEditDialogRef.value.show();
      }
      break;
    case 6: // 公海规则说明
      if (rulesDescriptionDialogRef.value) {
        rulesDescriptionDialogRef.value.show();
      }
      break;
    case 7: // 列表
      if (customColumnDialogRef.value) {
        customColumnDialogRef.value.show();
      }
      break;
    case 9: // 跟进
      router.push({
        path: '/customerMange/customer/followUpCustomer',
        query: { id: row.id },
      });
      break;
    case 10: // 编辑
      router.push({
        path: '/customerMange/customer/edit',
        query: { id: row.id },
      });
      break;
    case 11: // 删除
      handleDeleteCustomer(row);
      break;
    case 12: // 详情
      router.push({
        path: '/customerMange/customer/detail',
        query: { id: row.id },
      });
      break;
    case 13: {
      // 移入垃圾客户
      if (selectedRowKeys.value.length === 0) {
        MessagePlugin.warning('请先选择要移入垃圾的客户');
        return;
      }
      // 深拷贝数组，避免引用问题
      const idsToMove = [...selectedRowKeys.value];
      console.log('移入公海 - 传递的客户ID:', idsToMove);
      moveWaste.value.show(idsToMove);
      break;
    }
  }
};
// 移入垃圾客户成功回调
const handleMoveToPublicSeaSuccess = () => {
  // 清空选中项
  selectedRowKeys.value = [];
  // 重新加载列表数据
  loadTableData();
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

// 加载表格数据
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    // 构建请求参数
    const params: any = {
      type: 'public', // 公海客户，
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };

    // 添加搜索条件
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
    console.error('获取客户列表失败:', error);
    MessagePlugin.error(error.message || '获取客户列表失败，请重试');
    tableData.value = [];
  } finally {
    tableLoading.value = false;
  }
};

// 显示领取客户确认弹框
const showClaimCustomerDialog = () => {
  const confirmDialog = DialogPlugin.confirm({
    header: '确认提示',
    body: () =>
      h('div', { class: 'claim-customer-dialog-content' }, [
        h('div', { class: 'dialog-icon-wrapper' }, [
          h('div', { class: 'dialog-icon' }, [h('span', { class: 'icon-question' }, '?')]),
        ]),
        h('div', { class: 'dialog-text-content' }, [
          h('div', { class: 'main-question' }, '是否确认领取所选择的客户?'),
          h('div', { class: 'info-text' }, '领取后*天后未跟进/成交,客户将自动放回公海'),
        ]),
      ]),
    confirmBtn: '确定',
    cancelBtn: '取消',
    width: 480,
    onConfirm: async () => {
      try {
        const response = await batchReceive(selectedRowKeys.value);
        if (response.code === 0 || response.code === 200) {
          MessagePlugin.success('领取成功');
          selectedRowKeys.value = [];
          confirmDialog.hide();
          // 重新加载列表数据
          loadTableData();
        } else {
          MessagePlugin.error(response.message || response.msg || '领取失败');
        }
      } catch (error: any) {
        console.error('领取客户失败:', error);
        MessagePlugin.error(error.message || '领取失败，请重试');
      }
    },
    onCancel: () => {
      confirmDialog.hide();
    },
  });
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
