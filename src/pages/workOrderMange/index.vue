<template>
  <div class="work-order-page-container">
    <!-- 顶部标签页 -->
    <t-tabs v-model="activeTab" class="work-order-tabs" @change="handleTabChange">
      <t-tab-panel value="all" label="全部工单"> </t-tab-panel>
      <t-tab-panel value="mine" label="我的工单"> </t-tab-panel>
    </t-tabs>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <!-- 搜索关键词 -->
        <div class="filter-item">
          <label class="filter-label">搜索关键词</label>
          <t-input v-model="searchForm.keyword" placeholder="请输入内容" clearable />
        </div>
        <!-- 工单状态 -->
        <div class="filter-item">
          <label class="filter-label">工单状态</label>
          <t-select v-model="searchForm.status" placeholder="请选择工单状态" :options="statusOptions" clearable />
        </div>
        <!-- 工单类型 -->
        <div class="filter-item">
          <label class="filter-label">工单类型</label>
          <t-select v-model="searchForm.type" placeholder="请选择工单类型" :options="typeOptions" clearable />
        </div>
      </div>
      <div class="filter-right">
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

    <!-- 操作栏 -->
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

    <!-- 工单列表 -->
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
        @page-size-change="handlePageSizeChange"
      >
        <!-- 工单编号 -->
        <template #work_order_no="{ row }">
          {{ row.work_order_no || '-' }}
        </template>

        <!-- 工单标题 -->
        <template #work_order_title="{ row }">
          {{ row.work_order_title || '-' }}
        </template>

        <!-- 工单类型 -->
        <template #work_order_type="{ row }">
          {{ row.work_order_type || '-' }}
        </template>

        <!-- 处理人员 -->
        <template #handler_name="{ row }">
          {{ row.handler_name || '-' }}
        </template>

        <!-- 发起时间 -->
        <template #start_time="{ row }">
          {{ row.start_time || '-' }}
        </template>

        <!-- 完成时间 -->
        <template #end_time="{ row }">
          {{ row.end_time || '-' }}
        </template>

        <!-- 工单状态 -->
        <template #status="{ row }">
          <div class="status-cell">
            <span
              class="status-dot"
              :class="{
                'status-finished': row.status === '已完结',
                'status-processing': row.status === '待处理' || row.status === '处理中',
                'status-failed': row.status === '被驳回',
              }"
            ></span>
            <span>{{ row.status || '-' }}</span>
          </div>
        </template>

        <!-- 客户名称 -->
        <template #customer_name="{ row }">
          {{ row.customer_name || '-' }}
        </template>

        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-link theme="primary" @click="handleViewDetail(row)">详情</t-link>
        </template>

        <template #empty>
          <div style="text-align: center; padding: 40px 0; color: #999">暂无数据</div>
        </template>
      </t-table>
    </t-card>

    <!-- 底部分页 -->
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
</template>
<script setup lang="ts">
import type { PrimaryTableCol, TablePaginationConfig } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

defineOptions({
  name: 'WorkOrderMange',
});

const router = useRouter();

// 顶部标签页
const activeTab = ref<'all' | 'mine'>('all');

// 搜索表单
const searchForm = ref({
  keyword: '',
  status: '',
  type: '',
});

// 工单状态选项
const statusOptions = ref([
  { label: '全部', value: '' },
  { label: '待处理', value: '待处理' },
  { label: '处理中', value: '处理中' },
  { label: '已完结', value: '已完结' },
  { label: '被驳回', value: '被驳回' },
]);

// 工单类型选项
const typeOptions = ref([
  { label: '普通工单', value: '普通工单' },
  { label: '紧急工单', value: '紧急工单' },
  { label: '售后工单', value: '售后工单' },
]);

// 表格数据（先用模拟数据，后续可接入接口）
const tableData = ref<any[]>([]);
const tableLoading = ref(false);

// 分页
const pagination = ref<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showPageSize: true,
  totalContent: false,
  pageSizeOptions: [10, 20, 50, 100],
});

// 选中
const selectedRowKeys = ref<(string | number)[]>([]);
const selectAll = ref(false);
const inverse = ref(false);

// 表格列
const tableColumns: PrimaryTableCol[] = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'work_order_no', title: '工单编号', width: 180 },
  { colKey: 'work_order_title', title: '工单标题', width: 150 },
  { colKey: 'work_order_type', title: '工单类型', width: 120 },
  { colKey: 'handler_name', title: '处理人员', width: 120 },
  { colKey: 'start_time', title: '发起时间', width: 180 },
  { colKey: 'end_time', title: '完成时间', width: 180 },
  { colKey: 'status', title: '工单状态', width: 120 },
  { colKey: 'customer_name', title: '客户名称', width: 180 },
  { colKey: 'operation', title: '操作', width: 100, fixed: 'right' },
];

const rowKey = 'id';

// 加载列表（模拟）
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    // 这里后续可以替换为真实接口调用
    const mockList: any[] = [];
    for (let i = 0; i < pagination.value.pageSize; i++) {
      const index = (pagination.value.current - 1) * pagination.value.pageSize + i + 1;
      mockList.push({
        id: index,
        work_order_no: 'GD20250324010001',
        work_order_title: '工单标题',
        work_order_type: '普通工单',
        handler_name: '赵小刚',
        start_time: '2025-04-01 17:27',
        end_time: '2025-12-08 18:42',
        status: i % 3 === 0 ? '待处理' : i % 3 === 1 ? '被驳回' : '已完结',
        customer_name: '安徽某某科技有限公司',
      });
    }
    tableData.value = mockList;
    pagination.value.total = 120; // 模拟总数
  } finally {
    tableLoading.value = false;
  }
};

// 标签页切换
const handleTabChange = () => {
  pagination.value.current = 1;
  loadTableData();
};

// 查询
const handleSearch = () => {
  pagination.value.current = 1;
  loadTableData();
};

// 重置
const handleReset = () => {
  searchForm.value.keyword = '';
  searchForm.value.status = '';
  searchForm.value.type = '';
  pagination.value.current = 1;
  loadTableData();
};

// 操作栏按钮
const clickOper = (type: number) => {
  switch (type) {
    case 1:
      MessagePlugin.info('导出功能开发中');
      break;
    case 2:
      MessagePlugin.info('排序功能开发中');
      break;
    case 3:
      MessagePlugin.info('自定义列功能开发中');
      break;
    default:
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

// 查看详情
const handleViewDetail = (row: any) => {
  MessagePlugin.info(`查看工单【${row.work_order_no}】详情功能开发中`);
  // 后续如有详情路由，可在此跳转
  // router.push({ path: '/workOrderMange/workOrderDetail', query: { id: row.id } });
};

onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.work-order-page-container {
  padding: 20px;
  background: #fff;
}

.work-order-tabs {
  margin-bottom: 16px;
}

.filter-bar {
  margin-bottom: 32px;
  margin-top: 16px;
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
    gap: var(--td-comp-margin-md);
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

.status-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-start;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #999;

    &.status-finished {
      background-color: #00a870;
    }

    &.status-processing {
      background-color: #2ba3ff;
    }

    &.status-failed {
      background-color: #ff4d4f;
    }
  }
}
</style>
