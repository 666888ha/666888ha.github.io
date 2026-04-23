<template>
  <div class="quotation-container">
    <!-- 顶部标题和操作按钮 -->
    <div class="quotation-header">
      <div class="header-title">报价记录</div>
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
        <!-- 报价单号列 -->
        <template #quotationNumber="{ row }">
          <t-link theme="primary" @click="handleQuotationClick(row)">
            {{ row.quotation_no }}
          </t-link>
        </template>

        <!-- 报价文件列 -->
        <template #quotationFile="{ row }">
          <t-link theme="primary" @click="handleFileClick(row)">
            {{ row.quotation_file }}
          </t-link>
        </template>

        <!-- 成交几率列 -->
        <template #successRate="{ row }"> {{ row.win_rate }}% </template>

        <!-- 报价金额列 -->
        <template #quotationAmount="{ row }"> {{ formatAmount(row.quotation_amount) }} </template>

        <!-- 审批状态列 -->
        <template #approvalStatus="{ row }">
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

        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-space>
            <t-link v-if="row.approval_status === 1" theme="primary" @click="clickOper(2, row)">转合同</t-link>
            <t-link theme="primary" @click="clickOper(6, row)">查看审批</t-link>
            <t-link v-if="row.approval_status === 2" theme="primary" @click="clickOper(3, row)">编辑</t-link>
            <t-link v-if="row.approval_status === 2" theme="danger" @click="clickOper(5, row)">删除</t-link>
          </t-space>
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
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { deleteCustomerQuotation, getQuotationListByCustomer } from '@/api/quotation';

defineOptions({
  name: 'QuotateRecord',
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

// 表格列配置
const tableColumns: PrimaryTableCol[] = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'quotationNumber', title: '报价单号', width: 150 },
  { colKey: 'quotation_date', title: '报价日期', width: 120 },
  { colKey: 'quotationFile', title: '报价文件', width: 150 },
  { colKey: 'successRate', title: '成交几率', width: 100 },
  { colKey: 'quotationAmount', title: '报价金额', width: 150 },
  { colKey: 'daysUntilContract', title: '未转合同天数', width: 130 },
  { colKey: 'approvalStatus', title: '审批状态', width: 120 },
  { colKey: 'operation', title: '操作', width: 280, fixed: 'right' },
];
// 表格数据（按照API返回的字段）
interface QuotationData {
  id: number;
  quotation_no: string; // 报价单号
  customer_name: string; // 客户名称
  quotation_amount: number; // 报价金额
  approval_status: number; // 审批状态 (0待审批 / 1通过 / 2驳回)
  create_time: string; // 创建时间
  win_rate?: number; // 成交几率 (0-100)
}
// 行主键
const rowKey = 'id';

// 表格加载状态
const tableLoading = ref(false);

const selectedRowKeys = ref<(string | number)[]>([]);

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
};

// 报价单号点击
const handleQuotationClick = (row: any) => {
  router.push({
    name: 'QuotationDetail',
    query: { quotationId: row.id },
  });
};

// 文件点击
const handleFileClick = (row: any) => {
  MessagePlugin.info(`下载文件: ${row.quotation_no}`);
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
      tableLoading.value = false;
      return;
    }
    const params: any = {
      customer_id: customerId,
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };
    const res = await getQuotationListByCustomer(params);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || [];
      tableData.value = Array.isArray(data.list) ? data.list : [];
      // 更新分页信息
      pagination.value = {
        ...pagination.value,
        total: data.count || 0,
      };
    } else {
      MessagePlugin.error((res as any).msg || res.message || '获取报价列表失败');
      tableData.value = [];
    }
  } catch (error: any) {
    console.error('获取报价列表失败:', error);
    MessagePlugin.error('获取报价列表失败，请重试');
    tableData.value = [];
  } finally {
    tableLoading.value = false;
  }
};

// 操作处理
const clickOper = (type: number, row?: any) => {
  switch (type) {
    case 2: // 转合同
      router.push({
        path: '/contractMange/quationContract',
        query: { quotationId: row.id },
      });
      break;
    case 3: // 编辑
      router.push({
        path: '/quotation/confirmQuotation',
        query: { quotationId: row.id },
      });
      break;
    case 4: // 置顶/不置顶
      if (row) {
        row.isPinned = !row.isPinned;
        MessagePlugin.success(row.isPinned ? '已置顶' : '已取消置顶');
      }
      break;
    case 5: // 删除
      handleDeleteQuotation(row);
      break;
    case 6: // 审批详情
      router.push({
        path: '/approveMange/quotationApprove/detail',
        query: { id: row.id },
      });
      break;
  }
};

// 删除报价
const handleDeleteQuotation = (row: QuotationData) => {
  const confirmDia = DialogPlugin.confirm({
    header: '提示',
    body: '此操作将永久删除该报价记录, 是否继续?',
    theme: 'warning',
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const res = await deleteCustomerQuotation(row.id);
        if (res.code === 0 || res.code === 200) {
          MessagePlugin.success('删除成功!');
          confirmDia.hide();
          loadTableData();
        } else {
          MessagePlugin.error(res.msg || res.message || '删除失败');
          confirmDia.hide();
        }
      } catch (error: any) {
        console.error('删除报价失败:', error);
        MessagePlugin.error(error?.response?.data?.msg || error?.message || '删除失败');
        confirmDia.hide();
      }
    },
    onCancel: () => {
      MessagePlugin.info('已取消删除');
      confirmDia.hide();
    },
  });
};
// 初始化
onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.quotation-container {
  .quotation-header {
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

    &--pending {
      background: #1890ff; // 蓝色 - 待审批
    }

    &--approved {
      background: #52c41a; // 绿色 - 已通过
    }
    &--rejected {
      background: #f5222d; // 红色 - 已驳回
    }
  }

  .status-text {
    font-size: 14px;
    color: var(--td-text-color-primary);
  }
}

// 操作链接样式
:deep(.t-link) {
  margin-right: 12px;

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
