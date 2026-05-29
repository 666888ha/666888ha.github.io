<template>
  <div class="customer-container">
    <!-- 高级筛选 -->
    <advance-search @filter-change="handleFilterChange" />
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
            <t-icon name="swap" />
          </template>
          转移客户
        </t-button>
        <t-button theme="default" variant="outline" @click="clickOper(5)">
          <template #icon>
            <t-icon name="usergroup" />
          </template>
          移入公海
        </t-button>
        <t-button theme="default" variant="outline" @click="clickOper(6)">
          <template #icon>
            <t-icon name="git-merge" />
          </template>
          合并客户
        </t-button>
      </div>
      <div class="operation-right">
        <t-checkbox>跟进模式</t-checkbox>
        <t-tooltip content="当对列表客户写跟进时,会自动将刚刚写过跟进的客户排到最后。" :show-arrow="false">
          <t-icon name="help-circle" />
        </t-tooltip>
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
        <!-- 客户名称 -->
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
            getListRowCustomerJieduanLabel(row)
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
    <!-- 移入公海 -->
    <moveToPublicSea ref="moveSea" :is-multiple="isMultiple" @success="handleMoveToPublicSeaSuccess" />
    <!-- 自定义列弹框 -->
    <custom-column-dialog
      ref="customColumnDialogRef"
      :all-columns-config="allColumnsConfig"
      :table-columns="tableColumns"
      :required-columns="requiredColumns"
      custom-key-name="advanceSearchListKey"
      @confirm="handleColumnConfirm"
    />
    <!-- 合并客户弹框 -->
    <mergeCustomerDialog ref="mergeCustomerDialogRef" />
    <!-- 转移客户 -->
    <transformCustomer ref="transformsCustomer" />
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { CustomerListItem } from '@/api/customer/customer';
import { deleteCustomer, getCustomerList } from '@/api/customer/customer';
import { getCustomerJieduanTheme, getListRowCustomerJieduanLabel } from '@/utils/customerJieduanDict';

defineOptions({
  name: 'CustomerList',
});
const CustomColumnDialog = defineAsyncComponent(() => import('@/components/BaseCustomColumn/index.vue'));
const baseImport = defineAsyncComponent(() => import('@/components/baseImport/index.vue'));
const baseExport = defineAsyncComponent(() => import('@/components/baseExport/index.vue'));
const moveToPublicSea = defineAsyncComponent(() => import('../components/openSeaDialog.vue'));
const mergeCustomerDialog = defineAsyncComponent(() => import('../components/mergeCustomerDialog.vue'));
const transformCustomer = defineAsyncComponent(() => import('../components/transferCustomersDialog.vue'));
const advanceSearch = defineAsyncComponent(() => import('./search.vue'));
const router = useRouter();
const moveSea = ref(null);
const listImport = ref(null);
const listExport = ref(null);
const customColumnDialogRef = ref(null);
const mergeCustomerDialogRef = ref(null);
const transformsCustomer = ref(null);
const isMultiple = ref(true);

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
  const savedConfig = localStorage.getItem('advanceSearchListKey');
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

// 更多操作
const moreActions = [
  { content: '添加协作', value: 'batchDelete' },
  { content: '重点关注', value: 'batchExport' },
];

// 移入公海成功回调
const handleMoveToPublicSeaSuccess = () => {
  // 清空选中项
  selectedRowKeys.value = [];
  // 重新加载列表数据
  loadTableData();
};

// 操作
const clickOper = (type: number, row) => {
  let selectedCustomers = [];
  switch (type) {
    case 1: // 新增
      router.push({
        path: '/customerMange/customer/add',
      });
      break;
    case 2: // 导入
      listImport.value.show();
      break;
    case 3: // 导出
      listExport.value.openExportProgress();
      break;
    case 4: // 转移客户
      if (selectedRowKeys.value.length === 0) {
        MessagePlugin.warning('请先选择要转移的客户');
        return;
      }
      transformsCustomer.value.show();
      break;
    case 5: {
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
    case 6: // 合并客户
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
// 删除客户
const handleDeleteCustomer = (row: CustomerListItem) => {
  const customerId = row.id;
  const customerName = row.customer_name || '该客户';
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
// 筛选参数
const filterParams = ref({});

// 处理筛选变化
const handleFilterChange = (params: any) => {
  params.customer_tags = params.customer_tags.join(',');
  params.owner_user_id = params.owner_user_id.join(',');
  params.customer_type = params.customer_type === 'all' ? '' : params.customer_type;
  params.channel = params.channel === 'all' ? '' : params.channel;
  params.industry = params.industry === 'all' ? '' : params.industry;
  filterParams.value = params;
  // 重置到第一页
  pagination.value.current = 1;
  // 加载数据
  loadTableData();
};

// 加载表格数据
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    // 构建请求参数
    const params: any = {
      ...filterParams.value,
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };

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
