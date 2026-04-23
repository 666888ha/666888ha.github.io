<template>
  <t-dialog
    v-model:visible="visible"
    :header="dialogTitle"
    width="720px"
    :confirm-btn="null"
    :cancel-btn="null"
    :close-on-overlay-click="false"
    @close="onClose"
  >
    <t-loading size="small" :loading="loading" show-overlay>
      <div class="mt-body">
      <div class="mt-toolbar">
        <span class="mt-label">年度</span>
        <t-select v-model="year" class="mt-year" :options="yearOptions" @change="onYearChange" />
        <span v-if="yearTotal !== ''" class="mt-total">年度合计：{{ yearTotal }} 元</span>
      </div>
      <p class="mt-tip">各月目标金额（元）；保存仅超级管理员可用，与后端权限一致。</p>
      <div class="mt-grid">
        <div v-for="m in 12" :key="m" class="mt-cell">
          <div class="mt-month">{{ m }} 月</div>
          <t-input-number
            v-model="amounts[m - 1]"
            :min="0"
            :precision="2"
            theme="column"
            class="mt-input"
            placeholder="0"
          />
        </div>
      </div>
      </div>
    </t-loading>
    <template #footer>
      <t-space>
        <t-button theme="default" @click="visible = false">取消</t-button>
        <t-button theme="primary" :loading="saving" @click="handleSave">保存</t-button>
      </t-space>
    </template>
  </t-dialog>
</template>

<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref } from 'vue';

import type { EmployeeMonthlyTargetGetData, SystemEmployeeItem } from '@/api/system/user';
import { getEmployeeMonthlyTarget, saveEmployeeMonthlyTarget } from '@/api/system/user';

defineOptions({ name: 'MonthlyTargetDialog' });

const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const currentRow = ref<SystemEmployeeItem | null>(null);
const year = ref(new Date().getFullYear());
const amounts = ref<number[]>(Array.from({ length: 12 }, () => 0));
const yearTotal = ref('');
const displayName = ref('');

const dialogTitle = computed(() => {
  const name = displayName.value || currentRow.value?.real_name || currentRow.value?.username || '';
  return name ? `业绩目标 — ${name}` : '业绩目标';
});

const yearOptions = computed(() => {
  const y = new Date().getFullYear();
  const list: { label: string; value: number }[] = [];
  for (let i = y - 3; i <= y + 3; i++) {
    list.push({ label: `${i} 年`, value: i });
  }
  return list;
});

function onYearChange() {
  void loadTargets();
}

function resetAmounts() {
  amounts.value = Array.from({ length: 12 }, () => 0);
  yearTotal.value = '';
}

async function loadTargets() {
  if (!currentRow.value) return;
  const employeeId = Number(currentRow.value.id);
  if (!Number.isFinite(employeeId) || employeeId <= 0) {
    MessagePlugin.warning('无效的员工 ID');
    return;
  }
  loading.value = true;
  try {
    const res = await getEmployeeMonthlyTarget({
      employee_id: employeeId,
      year: Number(year.value),
    });
    if (res.code !== 0 && res.code !== 200) {
      MessagePlugin.error(res.msg || res.message || '获取业绩目标失败');
      resetAmounts();
      return;
    }
    const d = res.data as EmployeeMonthlyTargetGetData | undefined;
    if (!d || !Array.isArray(d.months)) {
      resetAmounts();
      return;
    }
    displayName.value = d.real_name || '';
    yearTotal.value = d.year_total || '';
    const byMonth: Record<number, number> = {};
    d.months.forEach((item) => {
      byMonth[Number(item.month)] = parseFloat(String(item.target_amount)) || 0;
    });
    for (let i = 1; i <= 12; i++) {
      amounts.value[i - 1] = byMonth[i] ?? 0;
    }
  } catch (e: any) {
    const msg = e?.response?.data?.msg || e?.message || '获取业绩目标失败';
    MessagePlugin.error(msg);
    resetAmounts();
  } finally {
    loading.value = false;
  }
}

function show(row: SystemEmployeeItem) {
  currentRow.value = row;
  displayName.value = row.real_name || '';
  year.value = new Date().getFullYear();
  visible.value = true;
  resetAmounts();
  void loadTargets();
}

function onClose() {
  currentRow.value = null;
  displayName.value = '';
}

async function handleSave() {
  if (!currentRow.value) return;
  const employeeId = Number(currentRow.value.id);
  if (!Number.isFinite(employeeId) || employeeId <= 0) {
    MessagePlugin.warning('无效的员工 ID');
    return;
  }
  const list = amounts.value.map((v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0));
  if (list.some((v) => v < 0)) {
    MessagePlugin.warning('目标金额不能为负数');
    return;
  }
  saving.value = true;
  try {
    const res = await saveEmployeeMonthlyTarget({
      employee_id: employeeId,
      year: Number(year.value),
      amounts: list,
    });
    if (res.code === 0 || res.code === 200) {
      MessagePlugin.success(res.msg || '保存成功');
      await loadTargets();
    } else {
      MessagePlugin.error(res.msg || res.message || '保存失败');
    }
  } catch (e: any) {
    const msg = e?.response?.data?.msg || e?.message || '保存失败';
    MessagePlugin.error(msg);
  } finally {
    saving.value = false;
  }
}

defineExpose({ show });
</script>

<style scoped lang="less">
.mt-body {
  min-height: 120px;
}

.mt-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.mt-label {
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

.mt-year {
  width: 140px;
}

.mt-total {
  margin-left: auto;
  font-weight: 600;
  color: var(--td-brand-color);
}

.mt-tip {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  margin: 0 0 16px;
}

.mt-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px 16px;
}

@media (max-width: 640px) {
  .mt-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.mt-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mt-month {
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.mt-input {
  width: 100%;
}
</style>
