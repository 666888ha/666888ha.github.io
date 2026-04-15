<template>
  <div class="ownership-container">
    <!-- 顶部标题 -->
    <div class="ownership-header">
      <div class="header-title">归属记录</div>
      <div class="header-right">
        <t-date-range-picker
          v-model="searchForm.timeRange"
          placeholder="时间范围"
          style="width: 220px; margin-right: 20px"
          clearable
        />
        <t-button theme="primary">
          <template #icon>
            <t-icon name="download" />
          </template>
          导出
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
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { getOwnerChangeLog } from '@/api/customer/customer';

defineOptions({
  name: 'OwnershipRecords',
});
const route = useRoute();

// 搜索表单
const searchForm = ref({
  timeRange: [],
  keyword: '',
});
// 表格数据
const tableData = ref<any[]>([]);

// 表格列配置
const tableColumns: PrimaryTableCol[] = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'new_owner_name', title: '目前归属', width: 120 },
  { colKey: 'old_owner_name', title: '原来归属', width: 120 },
  { colKey: 'customer_type', title: '客户类型', width: 120 },
  { colKey: 'customer_status', title: '客户状态', width: 120 },
  { colKey: 'industry', title: '所属行业', width: 120 },
  { colKey: 'protect_start_time', title: '保护起始', width: 160 },
  { colKey: 'protect_end_time', title: '保护截止', width: 160 },
  { colKey: 'change_type', title: '操作方式', width: 120 },
  { colKey: 'operator_name', title: '操作人', width: 120 },
  { colKey: 'change_time', title: '操作时间', width: 160 },
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
  total: 0,
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
  const customerId = route.query.id as string | undefined;
  if (!customerId) {
    MessagePlugin.error('缺少客户ID');
    return;
  }
  tableLoading.value = true;
  try {
    const params: any = {
      customer_id: customerId,
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };
    // 时间范围
    const range = searchForm.value.timeRange;
    if (Array.isArray(range) && range.length === 2) {
      if (range[0]) params.start_time = range[0];
      if (range[1]) params.end_time = range[1];
    }

    const res = await getOwnerChangeLog(params);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      const list = data.list || [];
      tableData.value = list;
      pagination.value.total = data.count || data.total || 0;
    } else {
      MessagePlugin.error(res.msg || '获取归属记录失败');
      tableData.value = [];
      pagination.value.total = 0;
    }
  } catch (error: any) {
    console.error('获取归属记录失败:', error);
    MessagePlugin.error(error?.response?.data?.msg || error?.message || '获取归属记录失败，请重试');
    tableData.value = [];
    pagination.value.total = 0;
  } finally {
    tableLoading.value = false;
  }
};

onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.ownership-container {
  .ownership-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--td-text-color-primary);
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
</style>
