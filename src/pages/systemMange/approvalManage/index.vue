<template>
  <div class="approval-manage-container">
    <div class="operation-bar">
      <div class="operation-left">
        <t-button theme="primary" :loading="saving" :disabled="!canEdit" @click="handleSave">保存设置</t-button>
        <span v-if="!canEdit" class="readonly-tip">当前账号无修改权限（仅超级管理员可保存）</span>
      </div>
    </div>

    <t-loading size="small" :loading="pageLoading">
      <t-card :bordered="false" class="table-card" title="审批规则配置">
        <t-table :data="tableRows" :columns="columns" row-key="id" :pagination="false" table-layout="fixed">
          <template #setting="{ row }">
            <div v-if="row.id === 'customer'" class="setting-cell">
              <t-radio-group
                v-model="form.customer_need_approval"
                :options="yesNoOptions"
                variant="default-filled"
                :disabled="!canEdit"
              />
            </div>
            <div v-else-if="row.id === 'follow'" class="setting-cell">
              <t-radio-group
                v-model="form.follow_need_approval"
                :options="yesNoOptions"
                variant="default-filled"
                :disabled="!canEdit"
              />
            </div>
            <div v-else-if="row.id === 'quotation'" class="setting-cell setting-stack">
              <t-radio-group
                v-model="form.quotation_need_approval"
                :options="yesNoOptions"
                variant="default-filled"
                :disabled="!canEdit"
              />
              <!-- 展示与后台：need_approval=0 时按「低于该金额(元)阈值」自动通过，保存时「否」且阈值为 0 会校验失败 -->
              <div class="amount-row">
                <span class="amount-label">报价金额低于</span>
                <t-input-number
                  v-model="form.quotation_auto_pass_below_wan"
                  :min="0"
                  :precision="2"
                  theme="column"
                  placeholder="0.00"
                  class="amount-input"
                  :disabled="!canEdit"
                />
                <span class="amount-label">万元时自动审批通过</span>
              </div>
            </div>
            <div v-else-if="row.id === 'contract'" class="setting-cell setting-stack">
              <t-radio-group
                v-model="form.contract_need_approval"
                :options="yesNoOptions"
                variant="default-filled"
                :disabled="!canEdit"
              />
              <div class="amount-row">
                <span class="amount-label">合同金额低于</span>
                <t-input-number
                  v-model="form.contract_auto_pass_below_wan"
                  :min="0"
                  :decimal-places="2"
                  :large-number="false"
                  theme="column"
                  placeholder="0.00"
                  class="amount-input"
                  :disabled="!canEdit"
                />
                <span class="amount-label">万元时自动审批通过</span>
              </div>
            </div>
          </template>
        </t-table>
      </t-card>
    </t-loading>
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, reactive, ref } from 'vue';

import type { ApprovalPolicyData } from '@/api/system/approvalPolicy';
import { getApprovalPolicy, saveApprovalPolicy } from '@/api/system/approvalPolicy';

defineOptions({
  name: 'SystemApprovalManage',
});

/** 1=是 需审批 0=否 走「低于阈值万元自动通过」 */
type YesNo = 0 | 1;

interface ApprovalForm {
  customer_need_approval: YesNo;
  follow_need_approval: YesNo;
  quotation_need_approval: YesNo;
  /** 万元，保存时 ×10000 为元与后端一致 */
  quotation_auto_pass_below_wan: number;
  contract_need_approval: YesNo;
  contract_auto_pass_below_wan: number;
}

const defaultForm = (): ApprovalForm => ({
  customer_need_approval: 1,
  follow_need_approval: 1,
  quotation_need_approval: 1,
  quotation_auto_pass_below_wan: 0,
  contract_need_approval: 1,
  contract_auto_pass_below_wan: 0,
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

const pageLoading = ref(false);
const saving = ref(false);
const canEdit = ref(false);

function yuanToWan(yuan: string | number): number {
  const n = typeof yuan === 'string' ? parseFloat(yuan) : Number(yuan);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n / 10000) * 100) / 100;
}

function wanToYuan(wan: number): number {
  if (!Number.isFinite(wan) || wan < 0) return 0;
  return Math.round(wan * 10000 * 100) / 100;
}

function applyPolicyData(d: ApprovalPolicyData) {
  canEdit.value = !!d.can_edit;
  form.customer_need_approval = (d.customer_need_approval ? 1 : 0) as YesNo;
  form.follow_need_approval = (d.follow_need_approval ? 1 : 0) as YesNo;
  form.quotation_need_approval = (d.quotation_need_approval ? 1 : 0) as YesNo;
  form.contract_need_approval = (d.contract_need_approval ? 1 : 0) as YesNo;
  form.quotation_auto_pass_below_wan = yuanToWan(d.quotation_auto_pass_below_amount);
  form.contract_auto_pass_below_wan = yuanToWan(d.contract_auto_pass_below_amount);
}

const loadSettings = async () => {
  pageLoading.value = true;
  try {
    const res = await getApprovalPolicy();
    if (res.code === 0 || res.code === 200) {
      const d = res.data as ApprovalPolicyData | undefined;
      if (d) {
        applyPolicyData(d);
      } else {
        Object.assign(form, defaultForm());
        canEdit.value = false;
      }
    } else {
      MessagePlugin.error(res.msg || res.message || '获取审批策略失败');
    }
  } catch (e: any) {
    MessagePlugin.error(e?.response?.data?.msg || e?.message || '获取审批策略失败');
  } finally {
    pageLoading.value = false;
  }
};

const handleSave = async () => {
  if (!canEdit.value) {
    MessagePlugin.warning('无保存权限');
    return;
  }
  const qYuan = wanToYuan(form.quotation_auto_pass_below_wan);
  const cYuan = wanToYuan(form.contract_auto_pass_below_wan);
  if (form.quotation_need_approval === 0 && qYuan <= 0) {
    MessagePlugin.warning('报价选择「否」时，免审阈值（万元）换算后须大于 0');
    return;
  }
  if (form.contract_need_approval === 0 && cYuan <= 0) {
    MessagePlugin.warning('合同选择「否」时，免审阈值（万元）换算后须大于 0');
    return;
  }

  saving.value = true;
  try {
    const res = await saveApprovalPolicy({
      customer_need_approval: form.customer_need_approval,
      follow_need_approval: form.follow_need_approval,
      quotation_need_approval: form.quotation_need_approval,
      quotation_auto_pass_below_amount: qYuan,
      contract_need_approval: form.contract_need_approval,
      contract_auto_pass_below_amount: cYuan,
    });
    if (res.code === 0 || res.code === 200) {
      MessagePlugin.success(res.msg || '保存成功');
      await loadSettings();
    } else {
      MessagePlugin.error(res.msg || res.message || '保存失败');
    }
  } catch (e: any) {
    MessagePlugin.error(e?.response?.data?.msg || e?.message || '保存失败，请重试');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  void loadSettings();
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

.operation-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.readonly-tip {
  font-size: 13px;
  color: var(--td-text-color-secondary);
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
