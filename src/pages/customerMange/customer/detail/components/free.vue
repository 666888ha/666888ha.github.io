<template>
  <div class="expense-container">
    <!-- 顶部标题和操作按钮 -->
    <div class="expense-header">
      <div class="header-title">费用记录</div>
      <div class="header-actions">
        <t-button theme="primary" @click="clickOper(1)">
          <template #icon>
            <t-icon name="add" />
          </template>
          添加
        </t-button>
        <t-button theme="primary" variant="outline" @click="clickOper(2)">
          <template #icon>
            <t-icon name="delete" />
          </template>
          删除
        </t-button>
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
        <!-- 费用金额列 -->
        <template #expenseAmount="{ row }"> ¥ {{ formatAmount(row.expenseAmount) }} </template>

        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="clickOper(3, row)">
              <t-icon name="chevron-right" size="14px" />
              详情
            </t-link>
            <t-link theme="primary" @click="clickOper(4, row)">
              <t-icon name="delete" size="14px" />
              删除
            </t-link>
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
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

defineOptions({
  name: 'ExpenseRecord',
});

// 格式化金额
const formatAmount = (amount: number) => {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// 表格数据
const tableData = ref([
  {
    id: 1,
    expenseName: '招待费用',
    expenseAmount: 10000.0,
    expenseType: '招待费',
    occurrenceTime: '2025-3-21',
    reimbursementStatus: '未报销',
    responsiblePerson: '赵小刚',
  },
  {
    id: 2,
    expenseName: '招待费用',
    expenseAmount: 10000.0,
    expenseType: '招待费',
    occurrenceTime: '2025-3-21',
    reimbursementStatus: '未报销',
    responsiblePerson: '赵小刚',
  },
  {
    id: 3,
    expenseName: '招待费用',
    expenseAmount: 10000.0,
    expenseType: '招待费',
    occurrenceTime: '2025-3-21',
    reimbursementStatus: '未报销',
    responsiblePerson: '赵小刚',
  },
  {
    id: 4,
    expenseName: '招待费用',
    expenseAmount: 10000.0,
    expenseType: '招待费',
    occurrenceTime: '2025-3-21',
    reimbursementStatus: '未报销',
    responsiblePerson: '赵小刚',
  },
  {
    id: 5,
    expenseName: '招待费用',
    expenseAmount: 10000.0,
    expenseType: '招待费',
    occurrenceTime: '2025-3-21',
    reimbursementStatus: '未报销',
    responsiblePerson: '赵小刚',
  },
  {
    id: 6,
    expenseName: '招待费用',
    expenseAmount: 10000.0,
    expenseType: '招待费',
    occurrenceTime: '2025-3-21',
    reimbursementStatus: '未报销',
    responsiblePerson: '赵小刚',
  },
  {
    id: 7,
    expenseName: '招待费用',
    expenseAmount: 10000.0,
    expenseType: '招待费',
    occurrenceTime: '2025-3-21',
    reimbursementStatus: '未报销',
    responsiblePerson: '赵小刚',
  },
  {
    id: 8,
    expenseName: '招待费用',
    expenseAmount: 10000.0,
    expenseType: '招待费',
    occurrenceTime: '2025-3-21',
    reimbursementStatus: '未报销',
    responsiblePerson: '赵小刚',
  },
  {
    id: 9,
    expenseName: '招待费用',
    expenseAmount: 10000.0,
    expenseType: '招待费',
    occurrenceTime: '2025-3-21',
    reimbursementStatus: '未报销',
    responsiblePerson: '赵小刚',
  },
]);

// 表格列配置
const tableColumns: PrimaryTableCol[] = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'expenseName', title: '费用名称', width: 150 },
  { colKey: 'expenseAmount', title: '费用金额', width: 150 },
  { colKey: 'expenseType', title: '费用类型', width: 120 },
  { colKey: 'occurrenceTime', title: '发生时间', width: 120 },
  { colKey: 'reimbursementStatus', title: '报销状态', width: 120 },
  { colKey: 'responsiblePerson', title: '负责人员', width: 120 },
  { colKey: 'operation', title: '操作', width: 150, fixed: 'right' },
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

// 操作处理
const clickOper = (type: number, row?: any) => {
  switch (type) {
    case 1: // 添加
      break;
    case 2: // 批量删除
      if (selectedRowKeys.value.length === 0) {
        MessagePlugin.warning('请先选择要删除的费用记录');
        return;
      }
      DialogPlugin.confirm({
        header: '确认删除',
        body: `确定要删除选中的 ${selectedRowKeys.value.length} 条费用记录吗？`,
        confirmBtn: '确定',
        cancelBtn: '取消',
        onConfirm: () => {
          tableData.value = tableData.value.filter((item) => !selectedRowKeys.value.includes(item.id));
          selectedRowKeys.value = [];
          MessagePlugin.success('删除成功');
        },
      });
      break;
    case 3: // 详情
      MessagePlugin.info(`查看费用详情: ${row?.expenseName}`);
      break;
    case 4: // 删除
      if (row) {
        DialogPlugin.confirm({
          header: '确认删除',
          body: '确定要删除这条费用记录吗？',
          confirmBtn: '确定',
          cancelBtn: '取消',
          onConfirm: () => {
            const index = tableData.value.findIndex((item) => item.id === row.id);
            if (index > -1) {
              tableData.value.splice(index, 1);
              MessagePlugin.success('删除成功');
            }
          },
        });
      }
      break;
  }
};
</script>
<style lang="less" scoped>
.expense-container {
  .expense-header {
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

// 操作链接样式
:deep(.t-link) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 16px;

  &:last-child {
    margin-right: 0;
  }
}

:deep(.t-space) {
  .t-link {
    margin-right: 0;
  }
}
</style>
