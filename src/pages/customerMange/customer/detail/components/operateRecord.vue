<template>
  <div class="operate-record-container">
    <!-- 顶部标题和操作按钮 -->
    <div class="operate-record-header">
      <div class="header-title">操作日志</div>
      <div class="header-right">
        <t-date-range-picker
          v-model="searchForm.timeRange"
          placeholder="时间范围"
          style="width: 220px; margin-right: 20px"
          clearable
          @change="handleTimeRangeChange"
        />
        <t-button theme="primary" @click="handleExport">
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
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { getCustomerOperationLog } from '@/api/customer/customer';

defineOptions({
  name: 'OperateRecord',
});

const route = useRoute();

// 搜索表单
const searchForm = ref({
  timeRange: [],
  keyword: '',
});

// 表格数据
interface OperationLogData {
  id: number | string;
  operationTime: string;
  operator: string;
  operationType: string;
  fieldName: string;
  oldFieldValue: string;
  newFieldValue: string;
  remarks: string;
}

const tableData = ref<OperationLogData[]>([]);

// 表格列配置
const tableColumns: PrimaryTableCol[] = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'operation_time', title: '操作时间', width: 160 },
  { colKey: 'operator_name', title: '操作人员', width: 120 },
  { colKey: 'operation_type', title: '操作类型', width: 120 },
  { colKey: 'fieldName', title: '字段名', width: 120 },
  { colKey: 'old_value', title: '旧字段值', width: 200 },
  { colKey: 'new_value', title: '新字段值', width: 200 },
  { colKey: 'remarks', title: '备注', width: 150 },
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
  total: 0,
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
  try {
    // 从路由获取客户ID
    const customerId = route.query.id as string;
    if (!customerId) {
      MessagePlugin.warning('缺少客户ID参数');
      tableLoading.value = false;
      return;
    }

    // 构建请求参数
    const params: any = {
      customer_id: customerId,
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };

    // 处理时间范围
    if (
      searchForm.value.timeRange &&
      Array.isArray(searchForm.value.timeRange) &&
      searchForm.value.timeRange.length === 2
    ) {
      const [startTime, endTime] = searchForm.value.timeRange;
      if (startTime) {
        const start = startTime instanceof Date ? startTime.toISOString().split('T')[0] : startTime;
        params.start_time = start;
      }
      if (endTime) {
        const end = endTime instanceof Date ? endTime.toISOString().split('T')[0] : endTime;
        params.end_time = end;
      }
    }

    const res = await getCustomerOperationLog(params);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      const list = data.list || [];

      // 映射接口返回的数据到表格数据格式
      tableData.value = list;

      // 更新分页信息
      pagination.value.total = data.count || data.total || 0;
    } else {
      MessagePlugin.error((res as any).msg || res.message || '获取操作日志失败');
      tableData.value = [];
      pagination.value.total = 0;
    }
  } catch (error: any) {
    console.error('获取操作日志失败:', error);
    MessagePlugin.error('获取操作日志失败，请重试');
    tableData.value = [];
    pagination.value.total = 0;
  } finally {
    tableLoading.value = false;
  }
};

// 时间范围变化
const handleTimeRangeChange = () => {
  // 重置到第一页
  pagination.value.current = 1;
  // 重新加载数据
  loadTableData();
};

// 导出
const handleExport = () => {
  MessagePlugin.info('导出功能开发中');
  // TODO: 实现导出功能
};

// 初始化
onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.operate-record-container {
  .operate-record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }

    .header-right {
      display: flex;
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
</style>
