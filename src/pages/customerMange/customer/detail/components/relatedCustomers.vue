<template>
  <div class="related-customers-container">
    <!-- 顶部标题和操作按钮 -->
    <div class="customers-header">
      <div class="header-title">相关客户</div>
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
        <!-- 客户名称 -->
        <template #customerName="{ row }">
          <t-link theme="primary" @click="handleViewCustomer(row)">
            {{ row.customer_name }}
          </t-link>
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
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { getSubCustomerList } from '@/api/customer/customer';

defineOptions({
  name: 'RelatedCustomers',
});

const router = useRouter();
const route = useRoute();

// 父级客户名称
const parentCustomerName = ref('');

// 表格数据
const tableData = ref<any[]>([]);

// 表格列配置
const tableColumns: PrimaryTableCol[] = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  {
    colKey: 'customer_name',
    title: '客户名称',
    width: 200,
    ellipsis: true,
    cell: 'customerName',
  },
  {
    colKey: 'customer_type',
    title: '客户类型',
    width: 120,
  },
  {
    colKey: 'approval_status',
    title: '客户状态',
    width: 120,
  },
  {
    colKey: 'main_contact_name',
    title: '首联系人',
    width: 120,
  },
  {
    colKey: 'main_contact_mobile',
    title: '手机号码',
    width: 150,
  },
  {
    colKey: 'owner_name',
    title: '客户归属',
    width: 120,
  },
  {
    colKey: 'remark',
    title: '备注',
    width: 150,
  },
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
  const customerId = route.query.id as string | undefined;
  if (!customerId) {
    MessagePlugin.error('缺少客户ID');
    return;
  }
  tableLoading.value = true;
  try {
    const res = await getSubCustomerList(customerId);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      parentCustomerName.value = data.parent_customer_name || '';
      const list = data.list || [];
      // 将接口数据映射到表格字段
      tableData.value = list;
      // 这里暂时不使用分页总数，因为接口目前只返回 count
    } else {
      MessagePlugin.error(res.msg || '获取相关客户列表失败');
      tableData.value = [];
    }
  } catch (error: any) {
    console.error('获取相关客户列表失败:', error);
    MessagePlugin.error(error?.response?.data?.msg || error?.message || '获取相关客户列表失败，请重试');
    tableData.value = [];
  } finally {
    tableLoading.value = false;
  }
};

// 查看客户详情
const handleViewCustomer = (row: any) => {
  if (!row?.id) return;
  router.push({
    path: '/customerMange/customer/detail',
    query: { id: row.id },
  });
};

onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.related-customers-container {
  .customers-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--td-text-color-primary);
      display: flex;
      align-items: center;
      gap: 8px;

      .parent-name {
        font-size: 13px;
        font-weight: 400;
        color: var(--td-text-color-secondary);
      }
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
</style>
