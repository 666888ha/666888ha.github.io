<template>
  <t-dialog
    v-model:visible="visible"
    header="选择报价单"
    width="80%"
    :close-on-overlay-click="false"
    @close="handleClose"
  >
    <div class="quotation-select-container">
      <!-- 筛选区域 -->
      <div class="filter-bar">
        <div class="filter-item">
          <label class="filter-label">关键词</label>
          <t-input
            v-model="searchForm.keyword"
            placeholder="报价单号 / 客户名称"
            clearable
            style="width: 260px"
            @enter="handleSearch"
          />
        </div>
        <div class="filter-actions">
          <t-button theme="primary" @click="handleSearch">查询</t-button>
          <t-button theme="default" @click="handleReset">重置</t-button>
        </div>
      </div>

      <!-- 报价单列表 -->
      <t-table
        :data="tableData"
        :columns="columns"
        row-key="id"
        :hover="true"
        :loading="tableLoading"
        :selected-row-keys="selectedRowKeys"
        @select-change="handleSelectChange"
      >
        <!-- 审批状态展示 -->
        <template #approvalStatus="{ row }">
          <span class="status-dot" :class="[`status-${row.approval_status}`]"></span>
          {{ getApprovalStatusText(row.approval_status) }}
        </template>

        <!-- 报价金额 -->
        <template #quotationAmount="{ row }"> ¥ {{ formatAmount(row.quotation_amount) }} </template>
      </t-table>

      <!-- 分页 -->
      <div class="footer-wrapper">
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

    <template #footer>
      <t-button theme="default" @click="handleClose">取消</t-button>
      <t-button theme="primary" @click="handleConfirm">确认</t-button>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import { getQuotationList } from '@/api/quotation';
import { getApprovalStatusText } from '@/utils/ruoyi';

defineOptions({
  name: 'QuotationSelectDialog',
});

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  confirm: [quotation: any];
}>();

const visible = computed({
  get: () => props.visible,
  set: (value) => {
    emit('update:visible', value);
  },
});

// 搜索表单
const searchForm = ref({
  keyword: '',
});

// 表格数据
const tableData = ref<any[]>([]);

// 选中行
const selectedRowKeys = ref<(string | number)[]>([]);
const selectedRow = ref<any | null>(null);

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

// 表格列
const columns: PrimaryTableCol[] = [
  {
    colKey: 'row-select',
    type: 'single',
    width: 50,
    fixed: 'left',
  },
  {
    title: '报价单号',
    colKey: 'quotation_no',
    width: 160,
  },
  {
    title: '客户名称',
    colKey: 'customer_name',
    width: 220,
  },
  {
    title: '报价金额',
    colKey: 'quotation_amount',
    width: 140,
    cell: 'quotationAmount',
  },
  {
    title: '审批状态',
    colKey: 'approval_status',
    width: 120,
    cell: 'approvalStatus',
  },
  {
    title: '报价日期',
    colKey: 'create_time',
    width: 180,
  },
];

// 金额格式化
const formatAmount = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return '0.00';
  }
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// 查询
const handleSearch = () => {
  pagination.value.current = 1;
  loadTableData();
};

// 重置
const handleReset = () => {
  searchForm.value.keyword = '';
  pagination.value.current = 1;
  loadTableData();
};

// 选择变化
const handleSelectChange = (value: (string | number)[]) => {
  selectedRowKeys.value = value;
  if (value && value.length > 0) {
    const id = value[0];
    selectedRow.value = tableData.value.find((item) => item.id === id) || null;
  } else {
    selectedRow.value = null;
  }
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
    const params: any = {
      page: pagination.value.current,
      limit: pagination.value.pageSize,
      // 默认只展示已通过审批的报价单
      approval_status: 1,
    };

    if (searchForm.value.keyword) {
      params.keyword = searchForm.value.keyword.trim();
    }

    const res = await getQuotationList(params);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      tableData.value = data.list || [];
      pagination.value.total = data.count || 0;
    } else {
      MessagePlugin.error(res.msg || res.message || '获取报价列表失败');
      tableData.value = [];
      pagination.value.total = 0;
    }
  } catch (error: any) {
    console.error('加载报价列表失败:', error);
    MessagePlugin.error(error?.response?.data?.msg || error?.message || '加载报价列表失败，请重试');
    tableData.value = [];
    pagination.value.total = 0;
  } finally {
    tableLoading.value = false;
  }
};

// 关闭弹框
const handleClose = () => {
  visible.value = false;
};

// 确认选择
const handleConfirm = () => {
  if (!selectedRow.value) {
    MessagePlugin.warning('请选择一个报价单');
    return;
  }
  emit('confirm', selectedRow.value);
  visible.value = false;
};

onMounted(() => {
  loadTableData();
});
</script>
<style scoped lang="less">
.quotation-select-container {
  padding: 12px 0;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .filter-label {
    font-size: 14px;
    color: var(--td-text-color-secondary);
    white-space: nowrap;
  }
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.footer-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
