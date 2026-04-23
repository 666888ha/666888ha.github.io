<template>
  <div class="sales-funnel-report-page">
    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
        <t-date-picker
          v-model="filters.month"
          class="filter-month"
          mode="month"
          value-type="YYYY-MM"
          clearable
          :allow-input="true"
          placeholder="统计月份（按客户创建时间落入该月）"
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
        <div class="summary-text">{{ summaryLine }}</div>
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
        <template #customerName="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.customerName }}</t-link>
        </template>
        <template #salesAmt="{ row }">
          {{ formatMoney(row.salesAmount) }}
        </template>
        <template #winRate="{ row }">
          {{ formatPct(row.winRateWeightedPct) }}
        </template>
        <template #probAmt="{ row }">
          {{ formatMoney(row.probabilityAmount) }}
        </template>
        <template #signedAmt="{ row }">
          {{ formatMoney(row.signedContractAmount) }}
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import { getSalesFunnelReport } from '@/api/statistics';
import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

import { statisticsScope } from '../../statisticsRequest';

defineOptions({
  name: 'SalesFunnelReport',
});

interface TableRow {
  rowKey: string;
  customerName: string;
  signDate: string;
  salesAmount: number;
  salesStage: string;
  winRateWeightedPct: number;
  probabilityAmount: number;
  signedContractAmount: number;
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

const summaryStats = ref({
  estimated: 0,
  probability: 0,
  signedContract: 0,
});

const summaryLine = computed(
  () =>
    `销售金额（报价合计）：${formatMoney(summaryStats.value.estimated)}，概率金额：${formatMoney(summaryStats.value.probability)}，实际销售（已审合同）：${formatMoney(summaryStats.value.signedContract)}`,
);

const columns: PrimaryTableCol[] = [
  { colKey: 'customerName', title: '对应客户', minWidth: 140, cell: 'customerName' },
  { colKey: 'signDate', title: '预计签单日期', width: 120 },
  { colKey: 'salesAmount', title: '销售金额', minWidth: 120, align: 'right', cell: 'salesAmt' },
  { colKey: 'salesStage', title: '销售阶段', width: 88 },
  { colKey: 'winRateWeightedPct', title: '成交机率', width: 96, align: 'center', cell: 'winRate' },
  { colKey: 'probabilityAmount', title: '概率金额', minWidth: 120, align: 'right', cell: 'probAmt' },
  { colKey: 'signedContractAmount', title: '实际销售', minWidth: 120, align: 'right', cell: 'signedAmt' },
  { colKey: 'ownerName', title: '负责人员', width: 100 },
];

const tableData = ref<TableRow[]>([]);

function formatMoney(n: number) {
  return `¥ ${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPct(n: number) {
  return `${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function monthParams() {
  const m = filters.value.month || defaultMonth();
  return { month_start: m, month_end: m };
}

async function fetchReport() {
  loadingData.value = true;
  try {
    const m = filters.value.month;
    if (!m) {
      MessagePlugin.warning('请选择统计月份');
      tableData.value = [];
      return;
    }
    const res = await getSalesFunnelReport({
      ...statisticsScope(filters.value.deptId, filters.value.userId),
      ...monthParams(),
    });
    if (res.code !== 0 && res.code !== 200) {
      MessagePlugin.error((res as any).msg || '加载失败');
      return;
    }
    const d = (res.data as any) || {};
    const sm = d.summary || {};
    summaryStats.value = {
      estimated: Number(sm.estimated) || 0,
      probability: Number(sm.probability) || 0,
      signedContract: Number(sm.signed_contract) || 0,
    };
    const list = (d.list || []) as any[];
    tableData.value = list.map((r, i) => ({
      rowKey: String(r.row_key ?? `r-${i}`),
      customerName: r.customer_name ?? '',
      signDate: r.sign_date ?? '—',
      salesAmount: Number(r.sales_amount) || 0,
      salesStage: r.stage ?? '—',
      winRateWeightedPct: Number(r.win_rate_weighted_pct) || 0,
      probabilityAmount: Number(r.probability_amount) || 0,
      signedContractAmount: Number(r.signed_contract_amount) || 0,
      ownerName: r.owner_name ?? '—',
    }));
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
    '对应客户',
    '预计签单日期',
    '销售金额',
    '销售阶段',
    '成交机率',
    '概率金额',
    '实际销售',
    '负责人员',
  ];
  const lines = [
    header.join(','),
    ...tableData.value.map((r) =>
      [
        r.customerName,
        r.signDate,
        r.salesAmount.toFixed(2),
        r.salesStage,
        `${r.winRateWeightedPct}%`,
        r.probabilityAmount.toFixed(2),
        r.signedContractAmount.toFixed(2),
        r.ownerName,
      ].join(','),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `销售漏斗报表_${filters.value.month || dayjs().format('YYYY-MM')}.csv`;
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
.sales-funnel-report-page {
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
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-text {
  font-size: 14px;
  color: var(--td-text-color-primary);
  line-height: 1.6;
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
