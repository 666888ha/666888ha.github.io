<template>
  <div class="sales-forecast-report-page">
    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
        <t-date-picker
          v-model="filters.month"
          class="filter-month"
          mode="month"
          value-type="YYYY-MM"
          clearable
          :allow-input="true"
          placeholder="请选择月份（按预计签单日期 / 报价日期筛）"
        />
        <t-select
          v-model="filters.deptId"
          class="filter-select"
          placeholder="选择部门"
          clearable
          :options="deptOptions"
          :loading="loadingDept"
        />
        <t-select
          v-model="filters.userId"
          class="filter-select filter-select-user"
          placeholder="选择人员"
          clearable
          filterable
          :options="userOptions"
          :loading="loadingUser"
        >
          <template #suffix-icon>
            <t-icon name="user" class="user-suffix-icon" />
          </template>
        </t-select>
        <t-button theme="primary" @click="handleSearch">
          <template #icon><t-icon name="search" /></template>
          查询
        </t-button>
        <t-button theme="default" variant="outline" @click="handleReset">
          <template #icon><t-icon name="refresh" /></template>
          重置
        </t-button>
      </div>
    </t-card>

    <t-card :bordered="false" class="table-card">
      <div class="table-toolbar">
        <div class="hint-text">
          销售金额=报价单金额；概率金额=销售金额×成交几率%；实际销售金额=本报价关联的已审合同金额合计（与「销售预测分析」口径一致）。
        </div>
        <t-button theme="default" variant="outline" @click="handleExport">
          <template #icon><t-icon name="upload" /></template>
          导出
        </t-button>
      </div>
      <t-table
        :data="tableData"
        :columns="columns"
        row-key="rowKey"
        size="medium"
        bordered
        stripe
        :loading="loadingData"
      >
        <template #quotationTitle="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.quotationTitle }}</t-link>
        </template>
        <template #customerName="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.customerName }}</t-link>
        </template>
        <template #salesAmt="{ row }">
          {{ formatMoney(row.salesAmount) }}
        </template>
        <template #winRate="{ row }">
          {{ formatPercent(row.winRate) }}
        </template>
        <template #probAmt="{ row }">
          {{ formatMoney(row.probabilityAmount) }}
        </template>
        <template #signedAmt="{ row }">
          {{ formatMoney(row.actualSignedAmount) }}
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import { getQuotationList } from '@/api/quotation';
import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

defineOptions({
  name: 'SalesForecastReport',
});

interface TableRow {
  rowKey: string;
  quotationTitle: string;
  customerName: string;
  signDate: string;
  salesAmount: number;
  salesStage: string;
  winRate: number;
  probabilityAmount: number;
  actualSignedAmount: number;
  ownerName: string;
}

function defaultMonth(): string {
  return dayjs().format('YYYY-MM');
}

const filters = ref({
  month: '' as string,
  deptId: undefined as string | number | undefined,
  userId: undefined as string | number | undefined,
});

const deptOptions = ref<{ label: string; value: string | number }[]>([]);
const userOptions = ref<{ label: string; value: string | number }[]>([]);
const loadingDept = ref(false);
const loadingUser = ref(false);
const loadingData = ref(false);

const columns: PrimaryTableCol[] = [
  { colKey: 'quotationTitle', title: '报价单', width: 140, cell: 'quotationTitle' },
  { colKey: 'customerName', title: '对应客户', width: 160, cell: 'customerName' },
  { colKey: 'signDate', title: '预计签单日期', width: 120 },
  { colKey: 'salesAmount', title: '销售金额', minWidth: 120, align: 'right', cell: 'salesAmt' },
  { colKey: 'salesStage', title: '销售阶段', width: 100 },
  { colKey: 'winRate', title: '成交机率', width: 96, align: 'center', cell: 'winRate' },
  { colKey: 'probabilityAmount', title: '概率金额', minWidth: 120, align: 'right', cell: 'probAmt' },
  { colKey: 'actualSignedAmount', title: '实际销售金额', minWidth: 120, align: 'right', cell: 'signedAmt' },
  { colKey: 'ownerName', title: '负责人', width: 100 },
];

function parseWinRate(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const s = String(v).replace(/%/g, '').trim();
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
}

function stageText(code: string | undefined): string {
  if (code == null || code === '') return '—';
  return String(code);
}

const tableData = ref<TableRow[]>([]);

function formatMoney(n: number) {
  return `¥ ${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(n: number) {
  return `${n}%`;
}

async function fetchReport() {
  loadingData.value = true;
  try {
    const m = filters.value.month;
    if (!m) {
      MessagePlugin.warning('请选择月份');
      tableData.value = [];
      return;
    }
    const start = `${m}-01`;
    const end = dayjs(start).endOf('month').format('YYYY-MM-DD');
    const res = await getQuotationList({
      type: 'all',
      start_date: start,
      end_date: end,
      page: 1,
      limit: 2000,
      ...(filters.value.userId != null && filters.value.userId !== ''
        ? { create_user_id: filters.value.userId }
        : {}),
      ...(filters.value.deptId != null && filters.value.deptId !== '' ? { dept_id: filters.value.deptId } : {}),
    });
    if (res.code !== 0 && res.code !== 200) {
      MessagePlugin.error((res as any).msg || '加载失败');
      return;
    }
    const list = ((res.data as any)?.list || []) as any[];
    tableData.value = list.map((item, i) => {
      const rate =
        item.win_rate_value != null && item.win_rate_value !== ''
          ? Number(item.win_rate_value)
          : parseWinRate(item.win_rate);
      const amt = Number(item.quotation_amount) || 0;
      const probFromApi = item.probability_amount;
      const prob =
        probFromApi != null && probFromApi !== ''
          ? Number(probFromApi)
          : Math.round(((amt * rate) / 100) * 100) / 100;
      const signed = Number(item.signed_contract_amount) || 0;
      return {
        rowKey: String(item.id ?? item.quotation_id ?? `r-${i}`),
        quotationTitle: item.quotation_no || '—',
        customerName: item.customer_name || '—',
        signDate: item.quotation_date || '—',
        salesAmount: amt,
        salesStage: (item.customer_jieduan_text || item.customer_jieduan_name || stageText(item.customer_jieduan_code)) as string,
        winRate: rate,
        probabilityAmount: prob,
        actualSignedAmount: signed,
        ownerName: item.owner_user_name || item.create_user_name || '—',
      };
    });
  } catch (e: any) {
    MessagePlugin.error(e?.message || '网络错误');
  } finally {
    loadingData.value = false;
  }
}

async function loadDeptOptions() {
  loadingDept.value = true;
  try {
    const res = await getSystemDeptOptions();
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      deptOptions.value = Object.entries(data).map(([id, name]) => ({
        label: name as string,
        value: Number(id) || id,
      }));
    }
  } catch (e) {
    console.error(e);
  } finally {
    loadingDept.value = false;
  }
}

async function loadUserOptions() {
  loadingUser.value = true;
  try {
    const res = await getEmployeeList({ limit: 500 });
    if (res.code === 0 || res.code === 200) {
      const list = res.data || [];
      userOptions.value = list.map((emp: any) => ({
        label: emp.real_name || emp.username || String(emp.id),
        value: emp.id,
      }));
    }
  } catch (e) {
    console.error(e);
  } finally {
    loadingUser.value = false;
  }
}

function handleSearch() {
  void fetchReport();
}

function handleReset() {
  filters.value = {
    month: defaultMonth(),
    deptId: undefined,
    userId: undefined,
  };
  void fetchReport();
}

function handleExport() {
  const header = [
    '报价单',
    '对应客户',
    '预计签单日期',
    '销售金额',
    '销售阶段',
    '成交机率',
    '概率金额',
    '实际销售金额',
    '负责人',
  ];
  const lines = [
    header.join(','),
    ...tableData.value.map((r) =>
      [
        r.quotationTitle,
        r.customerName,
        r.signDate,
        r.salesAmount.toFixed(2),
        r.salesStage,
        `${r.winRate}%`,
        r.probabilityAmount.toFixed(2),
        r.actualSignedAmount.toFixed(2),
        r.ownerName,
      ].join(','),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `销售预测报表_${filters.value.month || dayjs().format('YYYY-MM')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  MessagePlugin.success('导出成功');
}

onMounted(async () => {
  filters.value.month = defaultMonth();
  await Promise.all([loadDeptOptions(), loadUserOptions()]);
  void fetchReport();
});
</script>

<style scoped lang="less">
.sales-forecast-report-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--td-bg-color-page);
  min-height: 100%;
}

.filter-card,
.table-card {
  background: #fff;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.filter-month {
  width: 280px;
}

.filter-select {
  width: 200px;
}

.filter-select-user {
  width: 220px;
}

.user-suffix-icon {
  color: var(--td-text-color-placeholder);
  margin-right: 4px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.hint-text {
  font-size: 13px;
  color: var(--td-text-color-secondary);
  line-height: 1.55;
  flex: 1;
  min-width: 200px;
}

.table-card {
  :deep(.t-table) {
    th {
      background: var(--td-bg-color-secondarycontainer);
    }
  }
}
</style>
