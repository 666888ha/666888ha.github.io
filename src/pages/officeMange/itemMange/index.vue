<template>
  <div class="office-item-page-container">
    <!-- 筛选区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <!-- 物品编码 -->
        <div class="filter-item">
          <label class="filter-label">物品编码</label>
          <t-input v-model="searchForm.goods_code" placeholder="请输入物品编码" clearable />
        </div>

        <!-- 物品名称 -->
        <div class="filter-item">
          <label class="filter-label">物品名称</label>
          <t-input v-model="searchForm.goods_name" placeholder="请输入物品名称" clearable />
        </div>

        <!-- 物品分类 -->
        <div class="filter-item">
          <label class="filter-label">物品分类</label>
          <t-select v-model="searchForm.goods_cate" placeholder="请选择物品分类" :options="categoryOptions" clearable />
        </div>

        <!-- 存放位置 -->
        <div class="filter-item">
          <label class="filter-label">存放位置</label>
          <t-input v-model="searchForm.goods_location" placeholder="请输入存放位置" clearable />
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

    <!-- 物品列表 -->
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
        <!-- 物品编码 -->
        <template #goods_code="{ row }">
          {{ row.goods_code || '-' }}
        </template>

        <!-- 物品名称 -->
        <template #goods_name="{ row }">
          {{ row.goods_name || '-' }}
        </template>

        <!-- 物品分类 -->
        <template #goods_cate="{ row }">
          {{ row.goods_cate || '-' }}
        </template>

        <!-- 物品属性 -->
        <template #goods_attr="{ row }">
          {{ row.goods_attr || '-' }}
        </template>

        <!-- 存放位置 -->
        <template #goods_location="{ row }">
          {{ row.goods_location || '-' }}
        </template>

        <!-- 库存数量 -->
        <template #stock_num="{ row }">
          {{ row.stock_num || '0' }}
        </template>

        <!-- 操作 -->
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="clickOper(5, row)">查看</t-link>
            <t-link theme="primary" @click="clickOper(7, row)">借出</t-link>
          </t-space>
        </template>

        <template #empty>
          <div style="text-align: center; padding: 40px 0; color: #999">暂无数据</div>
        </template>
      </t-table>
    </t-card>

    <!-- 借出弹框 -->
    <borrow-dialog ref="borrowDialogRef" @success="handleBorrowSuccess" />

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
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { getOfficeGoodsList } from '@/api/office';

defineOptions({
  name: 'OfficeItemMange',
});

const BorrowDialog = defineAsyncComponent(() => import('./components/borrowDialog.vue'));

const router = useRouter();

// 搜索表单（使用新的字段名）
const searchForm = ref({
  goods_code: '', // 物品编码
  goods_name: '', // 物品名称
  goods_cate: '', // 物品分类
  goods_location: '', // 物品存放位置
});

// 物品分类选项
const categoryOptions = ref([
  { label: '全部', value: '' },
  { label: '办公', value: '办公' },
  { label: '电子', value: '电子' },
  { label: '家具', value: '家具' },
]);

// 表格数据（先用模拟数据，后续可接入接口）
const tableData = ref<any[]>([]);
const tableLoading = ref(false);

// 分页
const pagination = ref({
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

// 借出弹框引用
const borrowDialogRef = ref(null);

// 表格列（使用新的字段名）
const tableColumns: PrimaryTableCol[] = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'goods_code', title: '物品编码', width: 150 },
  { colKey: 'goods_name', title: '物品名称', width: 180, ellipsis: true },
  { colKey: 'goods_cate', title: '物品分类', width: 120 },
  { colKey: 'goods_attr', title: '物品属性', width: 120 },
  { colKey: 'goods_location', title: '存放位置', width: 160 },
  { colKey: 'stock_num', title: '库存数量', width: 100 },
  { colKey: 'operation', title: '操作', width: 160, fixed: 'right' },
];

const rowKey = 'id';

// 加载列表
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    const params: any = {
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };

    // 添加搜索条件（使用新的字段名）
    if (searchForm.value.goods_code) {
      params.goods_code = searchForm.value.goods_code.trim();
    }
    if (searchForm.value.goods_name) {
      params.goods_name = searchForm.value.goods_name.trim();
    }
    if (searchForm.value.goods_cate) {
      params.goods_cate = searchForm.value.goods_cate;
    }
    if (searchForm.value.goods_location) {
      params.goods_location = searchForm.value.goods_location.trim();
    }

    const res = await getOfficeGoodsList(params);
    if (res.code === 0 || res.code === 200) {
      tableData.value = res.data?.list || [];
      pagination.value.total = res.data?.count || res.data?.total || 0;
    } else {
      MessagePlugin.error(res.msg || '获取物品列表失败');
      tableData.value = [];
      pagination.value.total = 0;
    }
  } catch (error: any) {
    console.error('获取物品列表失败:', error);
    MessagePlugin.error('获取物品列表失败，请重试');
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
  searchForm.value.goods_code = '';
  searchForm.value.goods_name = '';
  searchForm.value.goods_cate = '';
  searchForm.value.goods_location = '';
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

// 操作按钮
const clickOper = (type: number, row?: any) => {
  switch (type) {
    case 1:
      router.push({ name: 'addItemMange' });
      break;
    case 2:
      MessagePlugin.info('导出功能开发中');
      break;
    case 3:
      MessagePlugin.info('排序功能开发中');
      break;
    case 4:
      MessagePlugin.info('自定义列表功能开发中');
      break;
    case 5:
      MessagePlugin.info(`查看物品【${row?.goods_name || ''}】详情功能开发中`);
      break;
    case 6:
      if (row?.id) {
        router.push({ name: 'editItemMange', query: { id: row.id } });
      } else {
        MessagePlugin.warning('缺少物品ID，无法编辑');
      }
      break;
    case 7:
      // 借出
      if (row?.id) {
        if (borrowDialogRef.value) {
          borrowDialogRef.value.show(row.id, row.goods_name);
        }
      } else {
        MessagePlugin.warning('缺少物品ID，无法借出');
      }
      break;
    default:
      break;
  }
};

// 借出成功回调
const handleBorrowSuccess = () => {
  loadTableData(); // 刷新列表
};

onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.office-item-page-container {
  padding: 20px;
  background: #fff;
}

.page-header {
  margin-bottom: 12px;

  .page-title {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #1f1f1f;
  }
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
</style>
