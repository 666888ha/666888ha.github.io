<template>
  <div class="goal-completion-page">
    <t-card :bordered="false" class="tabs-card">
      <t-tabs v-model="activeTab" class="goal-tabs" @change="handleTabChange">
        <t-tab-panel value="deal" label="成交金额" />
        <t-tab-panel value="collection" label="回款金额" />
        <t-tab-panel value="customer" label="新增客户" />
        <t-tab-panel value="follow" label="跟进次数" />
      </t-tabs>
    </t-card>

    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
        <t-select v-model="filters.year" class="filter-select-year" :options="yearOptions" />
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

    <t-card :bordered="false" class="chart-card">
      <div ref="chartRef" class="chart-el" />
    </t-card>

    <t-card :bordered="false" class="table-card">
      <div class="summary-toolbar">
        <div class="summary-text">{{ summaryLine }}</div>
        <t-button theme="default" variant="outline" @click="handleExport">
          <template #icon><t-icon name="upload" /></template>
          导出
        </t-button>
      </div>
      <t-table :data="tableRows" :columns="tableColumns" row-key="rowKey" size="medium" bordered stripe>
        <template #time="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.time }}</t-link>
        </template>
        <template v-if="activeTab === 'deal'" #targetMoney="{ row }">
          {{ formatMoney(row.target) }}
        </template>
        <template v-if="activeTab === 'deal'" #actualMoney="{ row }">
          {{ formatMoney(row.actual) }}
        </template>
        <template v-if="activeTab === 'deal'" #contracts="{ row }">
          {{ row.contracts }}
        </template>
        <template v-if="activeTab === 'deal'" #rate="{ row }">
          {{ row.rate }}
        </template>
        <template v-if="activeTab === 'deal'" #avgPrice="{ row }">
          {{ formatMoney(row.avgPrice) }}
        </template>
        <template v-if="activeTab === 'collection'" #targetMoneyCol="{ row }">
          {{ formatMoney(row.target) }}
        </template>
        <template v-if="activeTab === 'collection'" #collectionMoney="{ row }">
          {{ formatMoney(row.actual) }}
        </template>
        <template v-if="activeTab === 'collection'" #rateCol="{ row }">
          {{ row.rate }}
        </template>
        <template v-if="activeTab === 'customer' || activeTab === 'follow'" #targetQty="{ row }">
          {{ formatQty(row.target) }}
        </template>
        <template v-if="activeTab === 'customer' || activeTab === 'follow'" #doneQty="{ row }">
          {{ formatQty(row.actual) }}
        </template>
        <template v-if="activeTab === 'customer' || activeTab === 'follow'" #rateQty="{ row }">
          {{ row.rate }}
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import dayjs from 'dayjs';
import { BarChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

defineOptions({
  name: 'PerformanceGoalCompletion',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, BarChart, CanvasRenderer]);

type GoalTab = 'deal' | 'collection' | 'customer' | 'follow';

const BLUE = '#5eadf5';
const GREEN = '#2ec7a6';

const MOCK_TARGET_MONEY = 1_000_000;
const MOCK_ACTUAL_MONEY = 1_200_000;
const MOCK_RATE_PCT = '120%';
const MOCK_CONTRACTS = 200;
const MOCK_AVG_PRICE = 100_000;
const MOCK_QTY = 10_000;
const MOCK_RATE_QTY = '100%';

/** 成交金额：6 月示意 152万 / 215万 */
const DEAL_TARGET_MONTHLY = [
  980_000, 990_000, 1_050_000, 1_100_000, 1_200_000, 1_520_000, 1_300_000, 1_280_000, 1_250_000, 1_220_000,
  1_180_000, 1_150_000,
];
const DEAL_ACTUAL_MONTHLY = [
  1_100_000, 1_150_000, 1_200_000, 1_400_000, 1_600_000, 2_150_000, 1_800_000, 1_700_000, 1_650_000, 1_600_000,
  1_550_000, 1_500_000,
];

const currentYear = dayjs().year();
const yearOptions = Array.from({ length: 12 }, (_, i) => {
  const y = currentYear - 5 + i;
  return { label: `${y}年`, value: y };
});

const activeTab = ref<GoalTab>('deal');

const filters = ref({
  year: currentYear,
  deptId: undefined as string | number | undefined,
  userId: undefined as string | number | undefined,
});

const deptOptions = ref<{ label: string; value: string | number }[]>([]);
const userOptions = ref<{ label: string; value: string | number }[]>([]);
const loadingDept = ref(false);
const loadingUser = ref(false);

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const { width: winWidth } = useWindowSize();

function formatMoney(n: number) {
  return `￥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatQty(n: number) {
  return n.toLocaleString('zh-CN');
}

function monthLabels(year: number) {
  return Array.from({ length: 12 }, (_, i) => `${year}年${i + 1}月`);
}

function buildMoneySeries() {
  return { target: [...DEAL_TARGET_MONTHLY], actual: [...DEAL_ACTUAL_MONTHLY] };
}

function buildCollectionSeries() {
  const { target, actual } = buildMoneySeries();
  return {
    target,
    actual: actual.map((v, i) => Math.round(v * 0.92 + i * 8000)),
  };
}

/** 图表 Y 轴 0～3000，与示意图一致；表格仍为汇总 mock 10000 */
function buildQtySeries() {
  const target = Array.from({ length: 12 }, (_, i) => 800 + i * 100 + (i % 4) * 40);
  const actual = Array.from({ length: 12 }, (_, i) => 950 + i * 110 + (i % 3) * 55);
  return { target, actual };
}

const summaryLine = computed(() => {
  switch (activeTab.value) {
    case 'deal':
      return `目标金额：${formatMoney(MOCK_TARGET_MONEY)}，成交金额：${formatMoney(MOCK_ACTUAL_MONEY)}，完成率：${MOCK_RATE_PCT}`;
    case 'collection':
      return `目标金额：${formatMoney(MOCK_TARGET_MONEY)}，回款金额：${formatMoney(MOCK_ACTUAL_MONEY)}，完成率：${MOCK_RATE_PCT}`;
    case 'customer':
    case 'follow':
      return `目标数量：${formatQty(MOCK_QTY)}，完成数量：${formatQty(MOCK_QTY)}，完成率：${MOCK_RATE_QTY}`;
    default:
      return '';
  }
});

interface DealTableRow {
  rowKey: string;
  time: string;
  target: number;
  actual: number;
  contracts: number;
  rate: string;
  avgPrice: number;
}

interface CollectionTableRow {
  rowKey: string;
  time: string;
  target: number;
  actual: number;
  rate: string;
}

interface QtyTableRow {
  rowKey: string;
  time: string;
  target: number;
  actual: number;
  rate: string;
}

function buildDealRows(year: number): DealTableRow[] {
  return Array.from({ length: 12 }, (_, i) => ({
    rowKey: `d-${i}`,
    time: `${year}-${String(i + 1).padStart(2, '0')}`,
    target: MOCK_TARGET_MONEY,
    actual: MOCK_ACTUAL_MONEY,
    contracts: MOCK_CONTRACTS,
    rate: MOCK_RATE_PCT,
    avgPrice: MOCK_AVG_PRICE,
  }));
}

function buildCollectionRows(year: number): CollectionTableRow[] {
  return Array.from({ length: 12 }, (_, i) => ({
    rowKey: `c-${i}`,
    time: `${year}-${String(i + 1).padStart(2, '0')}`,
    target: MOCK_TARGET_MONEY,
    actual: MOCK_ACTUAL_MONEY,
    rate: MOCK_RATE_PCT,
  }));
}

function buildQtyRows(year: number): QtyTableRow[] {
  return Array.from({ length: 12 }, (_, i) => ({
    rowKey: `q-${i}`,
    time: `${year}-${String(i + 1).padStart(2, '0')}`,
    target: MOCK_QTY,
    actual: MOCK_QTY,
    rate: MOCK_RATE_QTY,
  }));
}

const dealRows = ref<DealTableRow[]>(buildDealRows(currentYear));
const collectionRows = ref<CollectionTableRow[]>(buildCollectionRows(currentYear));
const qtyRows = ref<QtyTableRow[]>(buildQtyRows(currentYear));

const tableRows = computed(() => {
  switch (activeTab.value) {
    case 'deal':
      return dealRows.value;
    case 'collection':
      return collectionRows.value;
    case 'customer':
    case 'follow':
      return qtyRows.value;
    default:
      return [];
  }
});

const tableColumns = computed<PrimaryTableCol[]>(() => {
  if (activeTab.value === 'deal') {
    return [
      { colKey: 'time', title: '时间', width: 110, cell: 'time' },
      { colKey: 'target', title: '目标金额', cell: 'targetMoney' },
      { colKey: 'actual', title: '成交金额', cell: 'actualMoney' },
      { colKey: 'contracts', title: '成交合同', width: 100, align: 'right', cell: 'contracts' },
      { colKey: 'rate', title: '完成率', width: 100, align: 'center', cell: 'rate' },
      { colKey: 'avgPrice', title: '平均客单价', cell: 'avgPrice' },
    ];
  }
  if (activeTab.value === 'collection') {
    return [
      { colKey: 'time', title: '时间', width: 110, cell: 'time' },
      { colKey: 'target', title: '目标金额', cell: 'targetMoneyCol' },
      { colKey: 'actual', title: '回款金额', cell: 'collectionMoney' },
      { colKey: 'rate', title: '完成率', width: 120, align: 'center', cell: 'rateCol' },
    ];
  }
  return [
    { colKey: 'time', title: '时间', width: 110, cell: 'time' },
    { colKey: 'target', title: '目标数量', align: 'right', cell: 'targetQty' },
    { colKey: 'actual', title: '完成数量', align: 'right', cell: 'doneQty' },
    { colKey: 'rate', title: '完成率', width: 120, align: 'center', cell: 'rateQty' },
  ];
});

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);

  const year = filters.value.year;
  const xData = monthLabels(year);
  const tab = activeTab.value;

  let targetName = '目标金额';
  let actualName = '成交金额';
  let yMax = 3_000_000;
  let yInterval = 500_000;
  let targetData: number[] = [];
  let actualData: number[] = [];

  if (tab === 'deal') {
    const s = buildMoneySeries();
    targetData = s.target;
    actualData = s.actual;
  } else if (tab === 'collection') {
    const s = buildCollectionSeries();
    targetData = s.target;
    actualData = s.actual;
    actualName = '回款金额';
  } else {
    targetName = '目标数量';
    actualName = '完成数量';
    yMax = 3000;
    yInterval = 500;
    const s = buildQtySeries();
    targetData = s.target;
    actualData = s.actual;
  }

  const isMoney = tab === 'deal' || tab === 'collection';

  chartInstance.setOption(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v: number | string) => {
          if (typeof v !== 'number') return String(v);
          if (isMoney) return formatMoney(v);
          return formatQty(v);
        },
      },
      legend: {
        bottom: 8,
        data: [targetName, actualName],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '14%',
        top: '6%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisTick: { alignWithLabel: true },
        axisLabel: { rotate: 28, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: yMax,
        interval: yInterval,
        splitLine: {
          lineStyle: { type: 'dashed', color: '#e5e6eb' },
        },
        axisLabel: {
          fontSize: 11,
          formatter: (v: number) => {
            if (isMoney && v >= 10_000) return `${v / 10_000}万`;
            return String(v);
          },
        },
      },
      series: [
        {
          name: targetName,
          type: 'bar',
          barMaxWidth: 22,
          itemStyle: { color: BLUE },
          data: targetData,
        },
        {
          name: actualName,
          type: 'bar',
          barMaxWidth: 22,
          itemStyle: { color: GREEN },
          data: actualData,
        },
      ],
    },
    true,
  );
}

function disposeChart() {
  chartInstance?.dispose();
  chartInstance = null;
}

async function loadDeptOptions() {
  loadingDept.value = true;
  try {
    const res = await getSystemDeptOptions();
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      deptOptions.value = Object.entries(data).map(([id, n]) => ({
        label: n as string,
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

function refreshTableData() {
  const y = filters.value.year;
  dealRows.value = buildDealRows(y);
  collectionRows.value = buildCollectionRows(y);
  qtyRows.value = buildQtyRows(y);
}

function handleTabChange() {
  nextTick(() => renderChart());
}

function handleSearch() {
  refreshTableData();
  nextTick(() => renderChart());
}

function handleReset() {
  filters.value = {
    year: currentYear,
    deptId: undefined,
    userId: undefined,
  };
  refreshTableData();
  nextTick(() => renderChart());
}

function handleExport() {
  const cols = tableColumns.value;
  const header = cols.map((c) => c.title as string);
  const keys = cols.map((c) => c.colKey as string);
  const rows = tableRows.value as Record<string, unknown>[];
  const lines = [
    header.join(','),
    ...rows.map((row) =>
      keys
        .map((k) => {
          const v = row[k];
          if (typeof v === 'number' && (activeTab.value === 'deal' || activeTab.value === 'collection')) {
            if (k === 'target' || k === 'actual' || k === 'avgPrice') return formatMoney(v);
          }
          return String(v ?? '');
        })
        .join(','),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `业绩目标完成度_${dayjs().format('YYYY-MM-DD')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  MessagePlugin.success('导出成功');
}

watch(
  () => filters.value.year,
  () => {
    refreshTableData();
    nextTick(() => renderChart());
  },
);

watch(winWidth, () => {
  chartInstance?.resize();
});

onMounted(() => {
  nextTick(() => renderChart());
  void Promise.all([loadDeptOptions(), loadUserOptions()]).then(() => {
    nextTick(() => chartInstance?.resize());
  });
});

onUnmounted(() => {
  disposeChart();
});
</script>

<style scoped lang="less">
.goal-completion-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--td-bg-color-page);
  min-height: 100%;
}

.tabs-card,
.filter-card,
.chart-card,
.table-card {
  background: #fff;
}

.goal-tabs {
  :deep(.t-tabs__nav-wrap) {
    padding: 0 4px;
  }
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.filter-select-year {
  width: 120px;
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

.chart-el {
  width: 100%;
  height: 460px;
}

.summary-toolbar {
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
