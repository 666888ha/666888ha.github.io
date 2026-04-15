<template>
  <div class="return-the-items">
    <t-card :bordered="false" class="table-card">
      <t-table :data="tableData" :columns="tableColumns" :row-key="rowKey" :loading="tableLoading" :hover="true">
        <template #operator_real_name="{ row }">
          {{ row.operator_real_name || row.operator_name || '-' }}
        </template>

        <template #operate_time="{ row }">
          {{ formatDateTime(row.operate_time) }}
        </template>

        <template #goods_code="{ row }">
          {{ (row.goods_code || '').trim() || '-' }}
        </template>

        <template #goods_cate="{ row }">
          {{ row.goods_cate || '-' }}
        </template>

        <template #goods_attr="{ row }">
          {{ row.goods_attr || '-' }}
        </template>

        <template #apply_num="{ row }">
          {{ Math.abs(row.change_num) || 0 }}
        </template>

        <template #remark="{ row }">
          {{ row.remark || '-' }}
        </template>
        <template #operation="{ row }">
          <t-space size="small">
            <t-button
              v-if="row.audit_status === 0"
              theme="success"
              variant="outline"
              size="small"
              :disabled="actionLoading"
              @click="handleReturnOk(row)"
            >
              完好归还
            </t-button>

            <t-button
              v-if="row.audit_status === 0"
              theme="danger"
              variant="outline"
              size="small"
              :disabled="actionLoading"
              @click="handleMarkAbnormal(row)"
            >
              标记异常/报废
            </t-button>

            <span v-else>-</span>
          </t-space>
        </template>
        <template #empty>
          <div style="text-align: center; padding: 40px 0; color: #999">暂无数据</div>
        </template>
      </t-table>
    </t-card>

    <!-- 审核弹框 -->
    <t-dialog
      v-model:visible="auditVisible"
      :header="auditForm.audit_status === 1 ? '完好归还' : '标记异常/报废'"
      :width="500"
      :show-close="false"
    >
      <div style="padding: 0 24px">
        <t-input
          v-model="auditForm.audit_remark"
          type="textarea"
          placeholder="请输入备注信息"
          :autosize="{ minRows: 4, maxRows: 8 }"
          :maxlength="500"
          show-word-limit
        />
      </div>
      <template #footer>
        <div style="display: flex; gap: 12px; justify-content: flex-end">
          <t-button theme="default" @click="auditVisible = false"> 取消 </t-button>
          <t-button theme="primary" :loading="actionLoading" @click="handleAuditConfirm"> 确定 </t-button>
        </div>
      </template>
    </t-dialog>

    <div class="footer-wrapper">
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
import type { PrimaryTableCol, TablePaginationConfig } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import { auditOfficeGoods, getOfficeGoodsAuditReturnList } from '@/api/office';

defineOptions({
  name: 'ReturnTheItems',
});

interface ReturnRow {
  id: number;
  goods_id: number;
  change_num: number;
  operator_name?: string;
  operator_real_name?: string;
  remark?: string;
  operate_time?: number; // 秒级时间戳
  goods_code?: string;
  goods_name?: string;
  goods_cate?: string;
  goods_attr?: string;
  audit_status?: number; // 0待审核 1通过 2拒绝（按你返回示例）
}

const rowKey = 'id';

const tableLoading = ref(false);
const tableData = ref<ReturnRow[]>([]);

const pagination = ref<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showPageSize: true,
  totalContent: false,
  pageSizeOptions: [10, 20, 50, 100],
});

const tableColumns: PrimaryTableCol[] = [
  { colKey: 'operator_real_name', title: '归还人', width: 120 },
  { colKey: 'operate_time', title: '归还时间', width: 180 },

  { colKey: 'goods_code', title: '物品编号', width: 140, ellipsis: true },
  { colKey: 'goods_name', title: '物品名称', width: 180, ellipsis: true },
  { colKey: 'goods_cate', title: '物品分类', width: 140, ellipsis: true },
  { colKey: 'goods_attr', title: '物品属性', width: 140, ellipsis: true },

  { colKey: 'apply_num', title: '申请数量', width: 100, align: 'center' },
  { colKey: 'remark', title: '备注', minWidth: 220, ellipsis: true },
  { colKey: 'operation', title: '操作', width: 220, fixed: 'right' },
];

const formatDateTime = (timestamp?: number) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
};

const loadTableData = async () => {
  tableLoading.value = true;
  try {
    const params = {
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };
    const res = await getOfficeGoodsAuditReturnList(params);

    if (res.code === 0 || res.code === 200) {
      tableData.value = res.data?.list || [];
      pagination.value.total = res.data?.count || 0;
    } else {
      MessagePlugin.error(res.msg || '获取资产归还列表失败');
      tableData.value = [];
      pagination.value.total = 0;
    }
  } catch (e) {
    console.error(e);
    MessagePlugin.error('获取资产归还列表失败，请重试');
    tableData.value = [];
    pagination.value.total = 0;
  } finally {
    tableLoading.value = false;
  }
};
const actionLoading = ref(false);
const auditVisible = ref(false);
const auditForm = ref({
  record_id: '',
  audit_status: 1,
  audit_remark: '',
});

const openAuditDialog = (row: ReturnRow, status: 1 | 2) => {
  auditForm.value = {
    record_id: row.id,
    audit_status: status,
    audit_remark: '',
  };
  auditVisible.value = true;
};

const handleAuditConfirm = async () => {
  actionLoading.value = true;
  try {
    const res = await auditOfficeGoods({
      record_id: auditForm.value.record_id,
      audit_status: auditForm.value.audit_status,
      audit_remark: auditForm.value.audit_remark.trim(),
    });
    if (res.code === 0 || res.code === 200) {
      MessagePlugin.success(res.msg || '操作成功');
      auditVisible.value = false;
      loadTableData();
    } else {
      MessagePlugin.error(res.msg || res.message || '操作失败');
    }
  } catch (e: any) {
    console.error(e);
    MessagePlugin.error(e?.message || '操作失败，请重试');
  } finally {
    actionLoading.value = false;
  }
};

const handleReturnOk = (row: ReturnRow) => {
  openAuditDialog(row, 1);
};

const handleMarkAbnormal = (row: ReturnRow) => {
  openAuditDialog(row, 2);
};

const handlePageChange = (current: number) => {
  pagination.value.current = current;
  loadTableData();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  pagination.value.current = 1;
  loadTableData();
};

onMounted(() => {
  loadTableData();
});
</script>
<style scoped lang="less">
.return-the-items {
  padding: 12px 0;
}

.footer-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--td-comp-margin-lg);
}
</style>
