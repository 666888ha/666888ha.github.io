<template>
  <div class="contract-container">
    <!-- 顶部标题和操作按钮 -->
    <div class="contract-header">
      <div class="header-title">合同记录</div>
      <div class="header-actions">
        <t-button theme="primary" @click="clickOper(1)">
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
        :sort="sortConfig"
        @select-change="handleSelectChange"
        @sort-change="handleSortChange"
      >
        <!-- 报价单号列 -->
        <template #contract_no="{ row }">
          <t-link theme="primary" @click="clickOper(2, row)">
            {{ row.contract_no }}
          </t-link>
        </template>
        <!-- 审批状态列 -->
        <template #approval_status="{ row }">
          <div class="status-cell">
            <span
              class="status-dot"
              :class="{
                'status-dot--pending': row.approval_status === 0,
                'status-dot--approved': row.approval_status === 1,
                'status-dot--rejected': row.approval_status === 2,
              }"
            ></span>
            <span class="status-text">
              {{ row.approval_status === 0 ? '待审批' : row.approval_status === 1 ? '已通过' : '已拒绝' }}
            </span>
          </div>
        </template>

        <!-- 发货状态列 -->
        <template #delivery_status="{ row }">
          <div v-if="row.delivery_status" class="status-cell">
            <span
              class="status-dot"
              :class="{
                'status-dot--shipped': row.delivery_status === 1,
              }"
            ></span>
            <span class="status-text">{{ row.delivery_status === 1 ? '已发货' : '未发货' }}</span>
          </div>
          <span v-else>-</span>
        </template>

        <!-- 合同总金额列 -->
        <template #contract_amount="{ row }"> ¥ {{ formatAmount(row.contract_amount) }} </template>

        <!-- 已回款金额列 -->
        <template #amountReceived="{ row }">
          <span v-if="row.amountReceived !== null && row.amountReceived !== undefined">
            ¥ {{ formatAmount(row.amountReceived) }}
          </span>
          <span v-else>-</span>
        </template>

        <!-- 已开票金额列 -->
        <template #amountInvoiced="{ row }">
          <span v-if="row.amountInvoiced !== null && row.amountInvoiced !== undefined">
            ¥ {{ formatAmount(row.amountInvoiced) }}
          </span>
          <span v-else>-</span>
        </template>

        <!-- 利润率列 -->
        <template #profitMargin="{ row }">
          <span v-if="row.profitMargin">{{ row.profitMargin }}%</span>
          <span v-else>-</span>
        </template>

        <!-- 操作列 -->
        <template #operation="{ row }">
          <div class="operation-cell">
            <!-- 高频操作：编辑和删除 -->
            <t-link v-if="row.approval_status === 2" theme="primary" class="operation-link" @click="clickOper(3, row)">
              编辑
            </t-link>
            <t-link v-if="row.approval_status === 1" theme="primary" class="operation-link" @click="clickOper(6, row)">
              验收
            </t-link>
            <t-link v-if="row.approval_status === 2" theme="danger" class="operation-link" @click="clickOper(5, row)">
              删除
            </t-link>
          </div>
        </template>
      </t-table>
    </t-card>
    <!-- 底部操作和分页 -->
    <div class="footer-wrapper">
      <div class="footer-left"></div>
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
import type { PrimaryTableCol, TableSort } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { deleteContract, getContractListByCustomer } from '@/api/contract';

defineOptions({
  name: 'Contract',
});
const router = useRouter();
const route = useRoute();
// 格式化金额
const formatAmount = (amount: number | undefined | null) => {
  // 检查是否为undefined或null
  if (amount === undefined || amount === null) {
    return '¥0.00';
  }
  // 确保是数字类型
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  // 检查是否为有效数字
  if (Number.isNaN(num)) {
    return '¥0.00';
  }
  return `¥${num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// 表格数据
const tableData = ref([]);

// 排序配置
const sortConfig = ref<TableSort>({
  sortBy: '',
  descending: false,
});
// 表格数据接口
interface ContractData {
  id: number;
  customer_id: number; // 客户ID
  contract_no: string; // 合同编号
  contract_title: string; // 合同主题
  customer_name: string; // 客户名称
  contract_amount: number; // 合同总金额
  approval_status: number; // 审批状态 (0待审批 / 1通过 / 2驳回)
  sign_date: string; // 签单日期
  payment_method?: string; // 付款方式
  delivery_status?: number; // 发货状态
  received_amount?: number; // 已回款金额
  invoiced_amount?: number; // 已开票金额
  profit_margin?: number; // 订单毛利率
}
// 表格列配置（所有列都支持排序）
const tableColumns: PrimaryTableCol[] = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'contract_no', title: '合同编号', width: 150, sorter: true },
  { colKey: 'create_time', title: '合同时间', width: 120, sorter: true },
  { colKey: 'contract_title', title: '合同主题', width: 150, sorter: true },
  { colKey: 'customer_Name', title: '客户名称', width: 200, sorter: true },
  { colKey: 'payment_method', title: '付款方式', width: 120, sorter: true },
  { colKey: 'approval_status', title: '审批状态', width: 120, sorter: true },
  { colKey: 'delivery_status', title: '发货状态', width: 120, sorter: true },
  { colKey: 'contract_amount', title: '合同总金额', width: 140, sorter: true },
  { colKey: 'amountReceived', title: '已回款金额', width: 140, sorter: true },
  { colKey: 'amountInvoiced', title: '已开票金额', width: 140, sorter: true },
  { colKey: 'profitMargin', title: '利润率', width: 100, sorter: true },
  { colKey: 'operation', title: '操作', width: 180, fixed: 'right' },
];

// 行主键
const rowKey = 'id';

// 表格加载状态
const tableLoading = ref(false);

const selectedRowKeys = ref<(string | number)[]>([]);

// 选择变化
const handleSelectChange = (value: (string | number)[]) => {
  selectedRowKeys.value = value;
};

// 排序变化
const handleSortChange = (sort: TableSort) => {
  sortConfig.value = sort;
  // TODO: 根据排序加载数据
  loadTableData();
};
// 分页
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showPageSize: true,
  totalContent: false,
  pageSizeOptions: [10, 20, 50, 100],
});

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
// 操作处理
const clickOper = (type: number, row?: any) => {
  switch (type) {
    case 1: // 导出
      MessagePlugin.info('导出功能开发中');
      break;
    case 6: // 验收
      router.push({
        path: '/customerMange/customer/detail',
        query: { id: row.customer_id },
      });
      break;
    case 3: // 编辑
      router.push({
        path: '/contractMange/edit',
        query: { id: row.id },
      });
      break;
    case 5: // 删除
      if (row) {
        handleDeleteContract(row);
      }
      break;
  }
};
// 删除合同
const handleDeleteContract = (row: ContractData) => {
  const confirmDia = DialogPlugin.confirm({
    header: '提示',
    body: '此操作将永久删除该合同记录，是否继续？',
    theme: 'warning',
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const res = await deleteContract(row.id);
        if (res && (res.code === 0 || res.code === 200)) {
          MessagePlugin.success(res.msg || '删除成功');
          await loadTableData();
        } else {
          MessagePlugin.error(res?.msg || res?.message || '删除失败');
        }
      } catch (error: any) {
        console.error('删除合同失败:', error);
        MessagePlugin.error(error?.response?.data?.msg || error?.message || '删除失败');
      } finally {
        confirmDia.hide();
      }
    },
    onCancel: () => {
      MessagePlugin.info('已取消删除');
      confirmDia.hide();
    },
  });
};
// 加载表格数据
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    // 从路由获取客户ID
    const customerId = route.query.id as string;
    if (!customerId) {
      tableLoading.value = false;
      return;
    }
    const params: any = {
      customer_id: customerId,
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };
    const res = await getContractListByCustomer(params);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || [];
      tableData.value = Array.isArray(data.list) ? data.list : [];
      // 更新分页信息
      pagination.value = {
        ...pagination.value,
        total: data.count || 0,
      };
    } else {
      MessagePlugin.error((res as any).msg || res.message || '获取合同列表失败');
      tableData.value = [];
    }
  } catch (error: any) {
    console.error('获取合同列表失败:', error);
    MessagePlugin.error('获取合同列表失败，请重试');
    tableData.value = [];
  } finally {
    tableLoading.value = false;
  }
};
// 初始化
onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.contract-container {
  .contract-header {
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

    &--approved {
      background: #52c41a; // 绿色 - 已通过
    }

    &--not-submitted {
      background: #d9d9d9; // 灰色 - 未提交
    }

    &--pending {
      background: #1890ff; // 蓝色 - 待审批
    }

    &--rejected {
      background: #ff4d4f; // 红色 - 被否决
    }

    &--revoked {
      background: #fa8c16; // 橙色 - 已撤销/被驳回
    }

    &--shipped {
      background: #52c41a; // 绿色 - 已发货
    }
  }

  .status-text {
    font-size: 14px;
    color: var(--td-text-color-primary);
  }
}

// 操作单元格样式
.operation-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;

  .operation-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    flex-shrink: 0;

    &.more-link {
      cursor: pointer;
    }
  }
}
</style>
