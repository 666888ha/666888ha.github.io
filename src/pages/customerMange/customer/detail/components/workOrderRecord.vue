<template>
  <div class="work-order-container">
    <!-- 顶部标题和操作按钮 -->
    <div class="work-order-header">
      <div class="header-title">工单记录</div>
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
        <!-- 工单状态列 -->
        <template #status="{ row }">
          <div class="status-cell">
            <span
              class="status-dot"
              :class="{
                'status-dot--completed': row.status === '已完结',
                'status-dot--processing': row.status === '处理中',
                'status-dot--rejected': row.status === '被退回',
              }"
            ></span>
            <span class="status-text">{{ row.status }}</span>
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
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { ref } from 'vue';

defineOptions({
  name: 'WorkOrderRecord',
});

// 表格数据
const tableData = ref([
  {
    id: 1,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-04-01 17:27',
    status: '已完结',
  },
  {
    id: 2,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-04-01 17:27',
    status: '处理中',
  },
  {
    id: 3,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-04-01 17:27',
    status: '被退回',
  },
  {
    id: 4,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-12-08 18:40',
    status: '已完结',
  },
  {
    id: 5,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-12-08 18:40',
    status: '已完结',
  },
  {
    id: 6,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-12-08 18:40',
    status: '已完结',
  },
  {
    id: 7,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-12-08 18:40',
    status: '已完结',
  },
  {
    id: 8,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-12-08 18:40',
    status: '已完结',
  },
  {
    id: 9,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-12-08 18:40',
    status: '已完结',
  },
  {
    id: 10,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-12-08 18:40',
    status: '已完结',
  },
  {
    id: 11,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-12-08 18:40',
    status: '已完结',
  },
  {
    id: 12,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-12-08 18:40',
    status: '已完结',
  },
  {
    id: 13,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-12-08 18:40',
    status: '已完结',
  },
  {
    id: 14,
    workOrderId: 'GD20250324010001',
    workOrderTitle: '工单标题',
    initiator: '李小明',
    technicalPersonnel: '赵小刚',
    initiationTime: '2025-04-01 17:27',
    endTime: '2025-12-08 18:40',
    status: '已完结',
  },
]);

// 表格列配置
const tableColumns: PrimaryTableCol[] = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'workOrderId', title: '工单编号', width: 180 },
  { colKey: 'workOrderTitle', title: '工单标题', width: 150 },
  { colKey: 'initiator', title: '发起人员', width: 120 },
  { colKey: 'technicalPersonnel', title: '技术人员', width: 120 },
  { colKey: 'initiationTime', title: '发起时间', width: 180 },
  { colKey: 'endTime', title: '结束时间', width: 180 },
  { colKey: 'status', title: '工单状态', width: 120 },
];

// 行主键
const rowKey = 'id';

// 表格加载状态
const tableLoading = ref(false);

const selectedRowKeys = ref<(string | number)[]>([]);
const selectAll = ref(false);
const inverse = ref(false);

// 分页
const pagination = ref({
  current: 1,
  pageSize: 10,
  showPageSize: true,
  totalContent: false,
  pageSizeOptions: [10, 20, 50, 100],
});

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
  // 模拟API调用
  setTimeout(() => {
    tableLoading.value = false;
  }, 300);
};

</script>
<style lang="less" scoped>
.work-order-container {
  .work-order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .table-card {
    margin-bottom: 16px;
  }

  .footer-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .footer-left {
      display: flex;
      gap: 16px;
      align-items: center;
    }
  }
}

// 状态单元格样式
.status-cell {
  display: flex;
  align-items: center;
  gap: 6px;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;

    &--completed {
      background: #52c41a; // 绿色
    }

    &--processing {
      background: #1890ff; // 蓝色
    }

    &--rejected {
      background: #ff4d4f; // 红色
    }
  }

  .status-text {
    font-size: 14px;
    color: var(--td-text-color-primary);
  }
}
</style>
