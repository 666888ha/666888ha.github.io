<template>
  <div class="approval-manage-container">
    <div class="operation-bar">
      <div class="operation-left">
        <t-button theme="primary" :loading="saving" @click="handleSave">保存设置</t-button>
      </div>
    </div>

    <t-card :bordered="false" class="table-card" title="审批规则配置">
      <t-table :data="tableRows" :columns="columns" row-key="id" :pagination="false" table-layout="fixed">
        <template #setting="{ row }">
          <div v-if="row.id === 'customer'" class="setting-cell">
            <t-radio-group v-model="form.customer_need_approval" :options="yesNoOptions" variant="default-filled" />
          </div>
          <div v-else-if="row.id === 'follow'" class="setting-cell">
            <t-radio-group v-model="form.follow_need_approval" :options="yesNoOptions" variant="default-filled" />
          </div>
          <div v-else-if="row.id === 'quotation'" class="setting-cell setting-stack">
            <t-radio-group v-model="form.quotation_need_approval" :options="yesNoOptions" variant="default-filled" />
            <div v-if="form.quotation_need_approval === 1" class="amount-row">
              <span class="amount-label">报价金额低于</span>
              <t-input-number
                v-model="form.quotation_auto_below_amount"
                :min="0"
                :precision="2"
                theme="column"
                placeholder="0.00"
                class="amount-input"
              />
              <span class="amount-label">万元时自动审批通过</span>
            </div>
          </div>
          <div v-else-if="row.id === 'contract'" class="setting-cell setting-stack">
            <t-radio-group v-model="form.contract_need_approval" :options="yesNoOptions" variant="default-filled" />
            <div v-if="form.contract_need_approval === 1" class="amount-row">
              <span class="amount-label">合同金额低于</span>
              <t-input-number
                v-model="form.contract_auto_below_amount"
                :min="0"
                :precision="2"
                theme="column"
                placeholder="0.00"
                class="amount-input"
              />
              <span class="amount-label">万元时自动审批通过</span>
            </div>
          </div>
        </template>
      </t-table>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, reactive, ref } from 'vue';

defineOptions({
  name: 'SystemApprovalManage',
});

const STORAGE_KEY = 'senpu_crm_approval_workflow_settings';

/** 1=是 0=否，与后端对接时可沿用 */
type YesNo = 0 | 1;

interface ApprovalForm {
  customer_need_approval: YesNo;
  follow_need_approval: YesNo;
  quotation_need_approval: YesNo;
  quotation_auto_below_amount: number | undefined;
  contract_need_approval: YesNo;
  contract_auto_below_amount: number | undefined;
}

const defaultForm = (): ApprovalForm => ({
  customer_need_approval: 1,
  follow_need_approval: 1,
  quotation_need_approval: 1,
  quotation_auto_below_amount: undefined,
  contract_need_approval: 1,
  contract_auto_below_amount: undefined,
});

const form = reactive<ApprovalForm>(defaultForm());

const yesNoOptions = [
  { label: '是', value: 1 },
  { label: '否', value: 0 },
];

const tableRows = [
  { id: 'customer', item: '客户是否需要审批' },
  { id: 'follow', item: '跟进是否需要审批' },
  { id: 'quotation', item: '报价是否需要审批' },
  { id: 'contract', item: '合同是否需要审批' },
];

const columns: PrimaryTableCol[] = [
  { colKey: 'item', title: '配置项', width: 240, ellipsis: true },
  { colKey: 'setting', title: '设置', cell: 'setting' },
];

const saving = ref(false);

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as Partial<ApprovalForm>;
    Object.assign(form, defaultForm(), data);
  } catch {
    /* ignore */
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...form }));
    MessagePlugin.success('保存成功');
  } catch {
    MessagePlugin.error('保存失败，请重试');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadSettings();
});
</script>
<style scoped lang="less">
.approval-manage-container {
  padding: 20px;
  background: #fff;
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--td-comp-margin-lg);
}

.table-card {
  :deep(.t-card__body) {
    padding: var(--td-comp-paddingTB-lg) var(--td-comp-paddingLR-lg);
  }

  :deep(.t-table) {
    .t-table__cell {
      padding: var(--td-comp-paddingTB-md) var(--td-comp-paddingLR-md);
      vertical-align: middle;
    }
  }
}

.setting-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.setting-stack {
  flex-direction: column;
  align-items: flex-start;
}

.amount-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-left: 0;
}

.amount-label {
  font-size: 14px;
  color: var(--td-text-color-secondary);
  white-space: nowrap;
}

.amount-input {
  width: 140px;
}
</style>
