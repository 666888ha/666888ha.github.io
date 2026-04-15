<template>
  <div class="transaction-top10-page">
    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
        <t-select v-model="filters.statMode" class="filter-select-mode" :options="statModeOptions" />
        <t-date-range-picker
          v-model="filters.monthRange"
          class="filter-range"
          mode="month"
          value-type="YYYY-MM"
          clearable
          :allow-input="true"
          placeholder="时间范围"
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

    <t-card :bordered="false" class="chart-card">
      <div ref="chartRef" class="chart-el" />
    </t-card>

    <t-card :bordered="false" class="table-card">
      <div class="summary-toolbar">
        <div class="summary-text">{{ summaryLine }}</div>
        <div class="toolbar-right">
          <t-button theme="default" variant="outline" @click="handleSort">
            <template #icon><t-icon name="order-descending" /></template>
            排序
          </t-button>
          <t-button theme="default" variant="outline" @click="handleExport">
            <template #icon><t-icon name="upload" /></template>
            导出
          </t-button>
        </div>
      </div>
      <t-table :data="tableData" :columns="tableColumns" row-key="rowKey" size="medium" bordered stripe>
        <template #custName="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.name }}</t-link>
        </template>
        <template #deal="{ row }">
          {{ formatMoney(row.dealTotal) }}
        </template>
        <template #collect="{ row }">
          {{ formatMoney(row.collectTotal) }}
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
import type { EChartsCoreOption } from 'echarts/core';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

defineOptions({
  name: 'CustomerTransactionTop10',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, BarChart, CanvasRenderer]);

const statModeOptions = [{ label: '按月统计', value: 'month' }];

const COLOR_DEAL = '#5eadf5';
const COLOR_COLLECT = '#52c41a';

const CUSTOMER_LABELS = Array.from({ length: 10 }, (_, i) => `客户名称${i + 1}`);

/** 示意：客户名称1 成交 2520000、回款 1700000 */
const CHART_DEAL = [2_520_000, 2_380_000, 2_240_000, 2_100_000, 1_960_000, 1_820_000, 1_680_000, 1_540_000, 1_400_000, 1_260_000];
const CHART_COLLECT = [1_700_000, 1_580_000, 1_480_000, 1_360_000, 1_260_000, 1_140_000, 1_040_000, 940_000, 860_000, 780_000];

const MOCK_SUMMARY_DEAL = 1_000_000;
const MOCK_SUMMARY_COLLECT = 1_000_000;
const MOCK_TABLE_DEAL = 1_000_000;
const MOCK_TABLE_COLLECT = 1_000_000;

function defaultMonthRange(): string[] {
  const y = dayjs().year();
  return [`${y}-01`, `${y}-12`];
}

const filters = ref({
  statMode: 'month',
  monthRange: defaultMonthRange(),
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
  return `¥ ${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const summaryLine = computed(
  () =>
    `成交总额: ${formatMoney(MOCK_SUMMARY_DEAL)}, 回款总额: ${formatMoney(MOCK_SUMMARY_COLLECT)}`,
);

interface TableRow {
  rowKey: string;
  rank: number;
  name: string;
  dealTotal: number;
  collectTotal: number;
}

const tableData = ref<TableRow[]>(buildTableRows());

function buildTableRows(): TableRow[] {
  return CUSTOMER_LABELS.map((label, i) => ({
    rowKey: `t-${i}`,
    rank: i + 1,
    name: '客户名称',
    dealTotal: MOCK_TABLE_DEAL,
    collectTotal: MOCK_TABLE_COLLECT,
  }));
}

const tableColumns: PrimaryTableCol[] = [
  { colKey: 'rank', title: '排名', width: 72, align: 'center' },
  { colKey: 'name', title: '客户名称', minWidth: 140, cell: 'custName' },
  { colKey: 'dealTotal', title: '成交总额', align: 'right', cell: 'deal' },
  { colKey: 'collectTotal', title: '回款总额', align: 'right', cell: 'collect' },
];

function chartOption(): EChartsCoreOption {
  return {
    color: [COLOR_DEAL, COLOR_COLLECT],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['成交总额', '回款总额'],
      bottom: 8,
      left: 'center',
    },
    grid: {
      left: '3%',
      right: '6%',
      top: '4%',
      bottom: '14%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 3_000_000,
      interval: 600_000,
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e6eb' } },
      axisLabel: {
        fontSize: 11,
        formatter: (v: number) => (v >= 10_000 ? `${v / 10_000}万` : String(v)),
      },
    },
    yAxis: {
      type: 'category',
      data: CUSTOMER_LABELS,
      inverse: true,
      axisTick: { show: false },
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        name: '成交总额',
        type: 'bar',
        barMaxWidth: 14,
        itemStyle: { color: COLOR_DEAL, borderRadius: [0, 4, 4, 0] },
        data: CHART_DEAL,
      },
      {
        name: '回款总额',
        type: 'bar',
        barMaxWidth: 14,
        itemStyle: { color: COLOR_COLLECT, borderRadius: [0, 4, 4, 0] },
        data: CHART_COLLECT,
      },
    ],
  };
}

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);
  chartInstance.setOption(chartOption(), true);
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

function handleSearch() {
  tableData.value = buildTableRows();
  nextTick(() => renderChart());
}

function handleReset() {
  filters.value = {
    statMode: 'month',
    monthRange: defaultMonthRange(),
    deptId: undefined,
    userId: undefined,
  };
  handleSearch();
}

function handleSort() {
  MessagePlugin.info('已按默认顺序排序');
}

function handleExport() {
  const header = ['排名', '客户名称', '成交总额', '回款总额'];
  const lines = [
    header.join(','),
    ...tableData.value.map((row) =>
      [row.rank, row.name, formatMoney(row.dealTotal), formatMoney(row.collectTotal)].join(','),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `客户成交TOP10_${dayjs().format('YYYY-MM-DD')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  MessagePlugin.success('导出成功');
}

watch(winWidth, () => chartInstance?.resize());

onMounted(() => {
  nextTick(() => renderChart());
  void Promise.all([loadDeptOptions(), loadUserOptions()]).then(() => {
    nextTick(() => chartInstance?.resize());
  });
});

onUnmounted(() => disposeChart());
</script>

<style scoped lang="less">
.transaction-top10-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--td-bg-color-page);
  min-height: 100%;
}

.filter-card,
.chart-card,
.table-card {
  background: #fff;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.filter-select-mode {
  width: 140px;
}

.filter-range {
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

.chart-el {
  width: 100%;
  height: 520px;
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
  line-height: 1.65;
  flex: 1;
  min-width: 200px;
}

.toolbar-right {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.table-card {
  :deep(.t-table) {
    th {
      background: var(--td-bg-color-secondarycontainer);
    }
  }
}
</style>
