<template>
  <div class="borrowing-application">
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
          <t-link v-if="row.audit_status === 0" theme="primary" @click="openAuditDialog(row)">审核</t-link>
          <span v-else>-</span>
        </template>
        <template #audit_status="{ row }">
          <t-tag :theme="getAuditTheme(row.audit_status)" variant="light" size="small">
            {{ getAuditText(row.audit_status) }}
          </t-tag>
        </template>
        <template #empty>
          <div style="text-align: center; padding: 40px 0; color: #999">暂无数据</div>
        </template>
      </t-table>
    </t-card>

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

    <!-- 审核弹框 -->
    <t-dialog
      v-model:visible="auditVisible"
      header="审核"
      width="520px"
      :close-on-overlay-click="false"
      :confirm-loading="auditSubmitting"
      @confirm="handleAuditConfirm"
      @close="handleAuditClose"
    >
      <template #body>
        <t-form ref="auditFormRef" :data="auditForm" :rules="auditRules" label-width="90px" label-align="right">
          <t-form-item label="审核状态" name="audit_status" required-mark>
            <t-radio-group v-model="auditForm.audit_status">
              <t-radio :value="1">通过</t-radio>
              <t-radio :value="2">不通过</t-radio>
            </t-radio-group>
          </t-form-item>

          <t-form-item label="备注" name="audit_remark" :required-mark="auditForm.audit_status === 2">
            <t-textarea
              v-model="auditForm.audit_remark"
              placeholder="请输入"
              :autosize="{ minRows: 4, maxRows: 8 }"
              :maxlength="500"
              show-word-limit
            />
          </t-form-item>
        </t-form>
      </template>
    </t-dialog>
  </div>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule, PrimaryTableCol, TablePaginationConfig } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, reactive, ref } from 'vue';

import { auditOfficeGoods, getOfficeGoodsAuditBorrowList } from '@/api/office';

defineOptions({
  name: 'BorrowingApplication',
});

const rowKey = 'id';

const tableLoading = ref(false);
const tableData = ref<any[]>([]);

const pagination = ref<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showPageSize: true,
  totalContent: false,
  pageSizeOptions: [10, 20, 50, 100],
});

const tableColumns: PrimaryTableCol[] = [
  { colKey: 'operator_real_name', title: '申请人', width: 120 },

  { colKey: 'goods_code', title: '物品编号', width: 140, ellipsis: true },
  { colKey: 'goods_name', title: '物品名称', width: 180, ellipsis: true },
  { colKey: 'goods_cate', title: '物品分类', width: 140, ellipsis: true },
  { colKey: 'goods_attr', title: '物品属性', width: 140, ellipsis: true },
  { colKey: 'apply_num', title: '申请数量', width: 100, align: 'center' },
  { colKey: 'operate_time', title: '申请时间', width: 180 },
  { colKey: 'audit_status', title: '审核状态', width: 110, align: 'center' },
  { colKey: 'remark', title: '备注', minWidth: 220, ellipsis: true },
  { colKey: 'operation', title: '操作', width: 100, fixed: 'right' },
];

const formatDateTime = (timestamp: number) => {
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
    const res = await getOfficeGoodsAuditBorrowList(params);

    if (res.code === 0 || res.code === 200) {
      tableData.value = res.data?.list || [];
      pagination.value.total = res.data?.count || 0;
    } else {
      MessagePlugin.error(res.msg || '获取领用申请审批列表失败');
      tableData.value = [];
      pagination.value.total = 0;
    }
  } catch (e) {
    console.error(e);
    MessagePlugin.error('获取领用申请审批列表失败，请重试');
    tableData.value = [];
    pagination.value.total = 0;
  } finally {
    tableLoading.value = false;
  }
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

// ===== 审核弹框逻辑 =====
const auditVisible = ref(false);
const auditSubmitting = ref(false);
const auditFormRef = ref<FormInstanceFunctions>();

const auditRules: Record<string, FormRule[]> = {
  audit_remark: [
    {
      validator: (val: string) => {
        // 不通过：必填；通过：不校验
        if (auditForm.audit_status !== 2) return true;
        return !!String(val || '').trim();
      },
      message: '选择“不通过”时，请填写备注',
      type: 'error',
      trigger: 'blur',
    },
  ],
};
const auditForm = reactive<{
  record_id: string | number | null;
  audit_status: 1 | 2;
  audit_remark: string;
}>({
  record_id: null,
  audit_status: 1,
  audit_remark: '',
});

const openAuditDialog = (row: any) => {
  auditForm.record_id = row.id; // 按接口要求传 goods_id
  auditForm.audit_status = 1;
  auditForm.audit_remark = '';
  auditVisible.value = true;
};

const handleAuditClose = () => {
  auditVisible.value = false;
  auditSubmitting.value = false;
};

const handleAuditConfirm = async () => {
  if (!auditForm.record_id) {
    MessagePlugin.error('缺少 record_id');
    return;
  }
  auditSubmitting.value = true;
  try {
    const res = await auditOfficeGoods({
      record_id: auditForm.record_id,
      audit_status: auditForm.audit_status, // 1=通过 2=拒绝
      audit_remark: auditForm.audit_remark.trim(),
    });

    if (res.code === 0 || res.code === 200) {
      MessagePlugin.success(res.msg || '审核成功');
      handleAuditClose();
      loadTableData();
    } else {
      MessagePlugin.error(res.msg || res.message || '审核失败');
    }
  } catch (e: any) {
    console.error(e);
    MessagePlugin.error(e?.message || '审核失败，请重试');
  } finally {
    auditSubmitting.value = false;
  }
};
const getAuditText = (status: number) => {
  if (status === 0) return '待审核';
  if (status === 1) return '通过';
  if (status === 2) return '拒绝';
  return '-';
};

const getAuditTheme = (status: number) => {
  if (status === 0) return 'warning';
  if (status === 1) return 'success';
  if (status === 2) return 'danger';
  return 'default';
};
onMounted(() => {
  loadTableData();
});
</script>
<style scoped lang="less">
.borrowing-application {
  padding: 12px 0;
}

.footer-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--td-comp-margin-lg);
}
</style>
