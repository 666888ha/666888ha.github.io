<template>
  <div class="borrowing-record-admin-container">
    <!-- 筛选区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <!-- 搜索关键词 -->
        <div class="filter-item">
          <label class="filter-label">搜索关键词</label>
          <t-input v-model="searchForm.keyword" placeholder="请输入搜索关键词" clearable />
        </div>

        <!-- 物品分类 -->
        <div class="filter-item">
          <label class="filter-label">物品分类</label>
          <t-select v-model="searchForm.category" placeholder="请选择物品分类" :options="categoryOptions" clearable />
        </div>

        <!-- 物品状态 -->
        <div class="filter-item">
          <label class="filter-label">物品状态</label>
          <t-select v-model="searchForm.status" placeholder="请选择物品状态" :options="statusOptions" clearable />
        </div>

        <!-- 存放位置 -->
        <div class="filter-item">
          <label class="filter-label">存放位置</label>
          <t-input v-model="searchForm.location" placeholder="请输入存放位置" clearable />
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

    <!-- 出入库记录列表 -->
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
        <!-- 单据信息 -->
        <template #record_no="{ row }">
          <!-- <t-link theme="primary" @click="clickOperate(1, row)"> -->
          {{ formatRecordNo(row.operate_time, row.id) }}
          <!-- </t-link> -->
        </template>

        <!-- 物品类型 -->
        <template #goods_name="{ row }">
          {{ row.goods_name || '-' }}
        </template>

        <!-- 数量 -->
        <template #change_num="{ row }">
          {{ Math.abs(row.change_num) || 0 }}
        </template>

        <!-- 操作类型 -->
        <template #record_type="{ row }">
          {{ getRecordTypeText(row.record_type) }}
        </template>

        <!-- 操作人 -->
        <template #operator_real_name="{ row }">
          {{ row.operator_real_name || '-' }}
        </template>

        <!-- 操作日期 -->
        <template #operate_time="{ row }">
          {{ formatDate(row.operate_time) }}
        </template>

        <!-- 状态 -->
        <template #status="{ row }">
          <t-tag :theme="getStatusTheme(row)" variant="light" size="small">
            {{ getStatusText(row) }}
          </t-tag>
        </template>

        <!-- 操作 -->
        <template #operation="{ row }">
          <t-space>
            <!-- <t-link theme="primary" @click="clickOperate(2, row)">查看</t-link> -->
            <t-link theme="primary" @click="clickOperate(3, row)">撤销</t-link>
            <t-link v-if="row.record_type === 2" theme="primary" @click="clickOperate(4, row)">归还</t-link>
            <t-link v-if="row.record_type === 2" theme="primary" @click="clickOperate(5, row)">续借</t-link>
          </t-space>
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
    <return-goods-dialog v-model:visible="returnVisible" :row="currentReturnRow" @success="loadTableData" />
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol, TablePaginationConfig } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import { getOfficeGoodsRecordList, returnOfficeGoods } from '@/api/office';

import ReturnGoodsDialog from './components/returnGoodsDialog.vue';

defineOptions({
  name: 'BorrowingRecordAdmin',
});
const returnVisible = ref(false);
const currentReturnRow = ref<any>(null);

// 搜索表单
const searchForm = ref({
  keyword: '',
  category: '',
  status: '',
  location: '',
});

// 物品分类选项
const categoryOptions = ref([
  { label: '全部', value: '' },
  { label: '办公', value: '办公' },
  { label: '电子', value: '电子' },
  { label: '家具', value: '家具' },
]);

// 物品状态选项
const statusOptions = ref([
  { label: '全部', value: '' },
  { label: '审核中', value: 'pending' },
  { label: '已完成', value: 'success' },
  { label: '使用中', value: 'useing' },
]);

// 表格数据
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
  { colKey: 'record_no', title: '单据信息', width: 180 },
  { colKey: 'goods_name', title: '物品类型', width: 180, ellipsis: true },
  { colKey: 'change_num', title: '数量', width: 100, align: 'center' },
  { colKey: 'record_type', title: '操作类型', width: 120 },
  { colKey: 'operator_real_name', title: '操作人', width: 120 },
  { colKey: 'operate_time', title: '操作日期', width: 180 },
  { colKey: 'status', title: '状态', width: 120 },
  { colKey: 'operation', title: '操作', width: 200, fixed: 'right' },
];

const rowKey = 'id';

// 格式化单据编号（根据操作时间生成）
const formatRecordNo = (operateTime: number, id: number) => {
  if (!operateTime) return String(id);
  const date = new Date(operateTime * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// 格式化日期
const formatDate = (timestamp: number) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取操作类型文本
const getRecordTypeText = (type: number) => {
  if (type === 1) return '入库';
  if (type === 2) return '出库';
  if (type === 3) return '归还';
  return '-';
};

// 获取状态文本（根据业务逻辑判断，这里需要根据实际需求调整）
const getStatusText = (row: any) => {
  // 如果是出库记录（record_type === 2），可能是申领中或逾期
  // 如果是归还记录（record_type === 3），是已归还
  // 如果是入库记录（record_type === 1），可能是正常状态
  if (row.record_type === 3) {
    return '已归还';
  }
  if (row.record_type === 2) {
    // 这里需要根据实际业务逻辑判断是否逾期
    // 暂时根据操作时间判断，如果超过30天可能是逾期
    const now = Math.floor(Date.now() / 1000);
    const daysDiff = (now - row.operate_time) / (24 * 60 * 60);
    if (daysDiff > 30) {
      return '逾期';
    }
    return '申领中';
  }
  return '正常';
};

// 获取状态主题色
const getStatusTheme = (row: any) => {
  const status = getStatusText(row);
  if (status === '逾期') return 'danger';
  if (status === '申领中') return 'warning';
  if (status === '已归还') return 'success';
  return 'default';
};

// 加载列表数据
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    const params: any = {
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };

    // 添加搜索条件
    if (searchForm.value.keyword) {
      params.keyword = searchForm.value.keyword.trim();
    }
    if (searchForm.value.category) {
      params.category = searchForm.value.category;
    }
    if (searchForm.value.status) {
      params.status = searchForm.value.status;
    }
    if (searchForm.value.location) {
      params.location = searchForm.value.location.trim();
    }

    const res = await getOfficeGoodsRecordList(params);
    if (res.code === 0 || res.code === 200) {
      tableData.value = res.data?.list || [];
      pagination.value.total = res.data?.count || 0;
    } else {
      MessagePlugin.error(res.msg || '获取出入库记录失败');
      tableData.value = [];
      pagination.value.total = 0;
    }
  } catch (error: any) {
    console.error('获取出入库记录失败:', error);
    MessagePlugin.error('获取出入库记录失败，请重试');
    tableData.value = [];
    pagination.value.total = 0;
  } finally {
    tableLoading.value = false;
  }
};

// 查询
const handleSearch = () => {
  pagination.value.current = 1;
  loadTableData();
};

// 重置
const handleReset = () => {
  searchForm.value.keyword = '';
  searchForm.value.category = '';
  searchForm.value.status = '';
  searchForm.value.location = '';
  pagination.value.current = 1;
  loadTableData();
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
const clickOperate = (type: number, row: any) => {
  switch (type) {
    case 1:
    case 2:
      // MessagePlugin.info(`查看记录【${row.goods_name || ''}】详情功能开发中`);
      break;
    case 3:
      MessagePlugin.info(`撤销物品【${row.goods_name || ''}】功能开发中`);
      break;
    case 4:
      currentReturnRow.value = row;
      returnVisible.value = true;
      break;
    case 5:
      MessagePlugin.info(`续借物品【${row.goods_name || ''}】功能开发中`);
      break;
    default:
      break;
  }
};

onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.borrowing-record-admin-container {
  padding: 20px;
  background: #fff;
}

.filter-bar {
  margin-bottom: 32px;
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-content: center;

  .filter-left {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
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
</style>
