<template>
  <div class="invoice-container">
    <!-- 顶部标题和操作按钮 -->
    <div class="contact-header">
      <div class="header-title">发票记录</div>
      <div class="header-actions">
        <t-button theme="primary" variant="outline">
          <template #icon>
            <t-icon name="download" />
          </template>
          导出
          <t-icon name="chevron-down" size="14px" />
        </t-button>
        <t-button theme="primary" variant="outline" @click="clickOper(4)">
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
        <!-- 开票金额列 -->
        <template #invoiceAmount="{ row }"> ¥ {{ formatAmount(row.invoiceAmount) }} </template>

        <!-- 合同名称列 -->
        <template #contractName="{ row }">
          <t-link theme="primary" @click="handleContractClick(row)">
            {{ row.contractName }}
          </t-link>
        </template>

        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="clickOper(2, row)">
              <t-icon name="chevron-right-circle" size="14px" />
              详情
            </t-link>
            <t-link theme="primary" @click="clickOper(3, row)">
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
  name: 'InvoiceRecode',
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
    invoiceDate: '2025-3-21',
    invoiceAmount: 10000.0,
    invoiceType: '增值税专用发票',
    invoiceHandler: '赵小刚',
    entryTime: '2025-3-21 10:23',
    contractName: '合同标题',
  },
  {
    id: 2,
    invoiceDate: '2025-3-21',
    invoiceAmount: 10000.0,
    invoiceType: '增值税专用发票',
    invoiceHandler: '赵小刚',
    entryTime: '2025-3-21 10:23',
    contractName: '合同标题',
  },
  {
    id: 3,
    invoiceDate: '2025-3-21',
    invoiceAmount: 10000.0,
    invoiceType: '增值税专用发票',
    invoiceHandler: '赵小刚',
    entryTime: '2025-3-21 10:23',
    contractName: '合同标题',
  },
  {
    id: 4,
    invoiceDate: '2025-3-21',
    invoiceAmount: 10000.0,
    invoiceType: '增值税专用发票',
    invoiceHandler: '赵小刚',
    entryTime: '2025-3-21 10:23',
    contractName: '合同标题',
  },
  {
    id: 5,
    invoiceDate: '2025-3-21',
    invoiceAmount: 10000.0,
    invoiceType: '增值税专用发票',
    invoiceHandler: '赵小刚',
    entryTime: '2025-3-21 10:23',
    contractName: '合同标题',
  },
  {
    id: 6,
    invoiceDate: '2025-3-21',
    invoiceAmount: 10000.0,
    invoiceType: '增值税专用发票',
    invoiceHandler: '赵小刚',
    entryTime: '2025-3-21 10:23',
    contractName: '合同标题',
  },
  {
    id: 7,
    invoiceDate: '2025-3-21',
    invoiceAmount: 10000.0,
    invoiceType: '增值税专用发票',
    invoiceHandler: '赵小刚',
    entryTime: '2025-3-21 10:23',
    contractName: '合同标题',
  },
  {
    id: 8,
    invoiceDate: '2025-3-21',
    invoiceAmount: 10000.0,
    invoiceType: '增值税专用发票',
    invoiceHandler: '赵小刚',
    entryTime: '2025-3-21 10:23',
    contractName: '合同标题',
  },
  {
    id: 9,
    invoiceDate: '2025-3-21',
    invoiceAmount: 10000.0,
    invoiceType: '增值税专用发票',
    invoiceHandler: '赵小刚',
    entryTime: '2025-3-21 10:23',
    contractName: '合同标题',
  },
  {
    id: 10,
    invoiceDate: '2025-3-21',
    invoiceAmount: 10000.0,
    invoiceType: '增值税专用发票',
    invoiceHandler: '赵小刚',
    entryTime: '2025-3-21 10:23',
    contractName: '合同标题',
  },
  {
    id: 11,
    invoiceDate: '2025-3-21',
    invoiceAmount: 10000.0,
    invoiceType: '增值税专用发票',
    invoiceHandler: '赵小刚',
    entryTime: '2025-3-21 10:23',
    contractName: '合同标题',
  },
]);

// 表格列配置
const tableColumns: PrimaryTableCol[] = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'invoiceDate', title: '开票日期', width: 120 },
  { colKey: 'invoiceAmount', title: '开票金额', width: 150 },
  { colKey: 'invoiceType', title: '发票类型', width: 180 },
  { colKey: 'invoiceHandler', title: '发票经手人', width: 130 },
  { colKey: 'entryTime', title: '录入时间', width: 160 },
  { colKey: 'contractName', title: '合同名称', width: 150 },
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

// 下拉选项
const smsOptions = [
  { content: '选中数据发送', value: 'send' },
  { content: '批量发送', value: 'batch' },
];

const exportOptions = [
  { content: '选中数据导出', value: 'excel' },
  { content: '批量导出', value: 'csv' },
];

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
    case 2: // 详情
      MessagePlugin.info(`查看发票详情: ${row?.id}`);
      break;
    case 3: // 删除
      if (row) {
        DialogPlugin.confirm({
          header: '确认删除',
          body: '确定要删除这条发票记录吗？',
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
.invoice-container {
  .contact-header {
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

      .action-with-badge {
        position: relative;
      }
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
