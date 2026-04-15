<template>
  <div class="sales-forecast-page">
    <!-- 筛选 -->
    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
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

    <!-- 图表 -->
    <t-card :bordered="false" class="chart-card">
      <div ref="chartRef" class="forecast-chart" />
    </t-card>

    <!-- 汇总 + 表格 -->
    <t-card :bordered="false" class="table-card">
      <div class="summary-toolbar">
        <div class="summary-text">
          报价数量: {{ summary.quoteCount }}, 预计销售金额: {{ formatMoney(summary.estimated) }}, 实际销售金额:
          {{ formatMoney(summary.actual) }}
        </div>
        <div class="summary-actions">
          <t-tooltip content="统计当月以及后11个月的销售预测情况" placement="top">
            <t-icon name="help-circle" class="help-icon" />
          </t-tooltip>
          <t-button theme="default" variant="outline" @click="handleExport">
            <template #icon><t-icon name="upload" /></template>
            导出
          </t-button>
        </div>
      </div>
      <t-table :data="tableData" :columns="columns" row-key="monthKey" :pagination="false" size="medium" bordered>
        <template #month="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.monthLabel }}</t-link>
        </template>
        <template #quoteCount="{ row }">
          {{ row.quoteCount }}
        </template>
        <template #estimated="{ row }">
          {{ formatMoney(row.estimated) }}
        </template>
        <template #actual="{ row }">
          {{ formatMoney(row.actual) }}
        </template>
      </t-table>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import { BarChart } from 'echarts/charts';
import { GraphicComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

defineOptions({
  name: 'SalesForecastAnalysis',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, GraphicComponent, BarChart, CanvasRenderer]);

interface ForecastRow {
  monthKey: string;
  monthLabel: string;
  quoteCount: number;
  estimated: number;
  actual: number;
}

const filters = ref<{ deptId: string | number | undefined; userId: string | number | undefined }>({
  deptId: undefined,
  userId: undefined,
});

const deptOptions = ref<{ label: string; value: string | number }[]>([]);
const userOptions = ref<{ label: string; value: string | number }[]>([]);
const loadingDept = ref(false);
const loadingUser = ref(false);

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const { width: winWidth } = useWindowSize();

/** 当月起连续 12 个月（当月 + 后 11 个月） */
function getRollingMonthLabels(base = new Date()): { key: string; label: string }[] {
  const list: { key: string; label: string }[] = [];
  const y = base.getFullYear();
  const m = base.getMonth();
  for (let i = 0; i < 12; i++) {
    const d = new Date(y, m + i, 1);
    const yy = d.getFullYear();
    const mm = d.getMonth() + 1;
    list.push({
      key: `${yy}-${String(mm).padStart(2, '0')}`,
      label: `${yy}年${mm}月`,
    });
  }
  return list;
}

/** 示意曲线：中间高、两侧低（与参考图趋势一致） */
function buildMockSeries(months: number) {
  const factors = [0.52, 0.78, 1.15, 1.72, 2.05, 2.42, 2.58, 2.35, 1.88, 1.42, 0.95, 0.62].slice(0, months);
  const estimated = factors.map((f) => Math.round(f * 1_000_000));
  const probability = factors.map((f) => Math.round(f * 0.72 * 1_000_000));
  return { estimated, probability };
}

const monthMeta = ref(getRollingMonthLabels());
const tableData = ref<ForecastRow[]>([]);

function rebuildTableAndChartData() {
  const months = monthMeta.value;
  const { estimated, probability } = buildMockSeries(months.length);
  tableData.value = months.map((m, i) => ({
    monthKey: m.key,
    monthLabel: m.key,
    quoteCount: 1000,
    estimated: estimated[i] ?? 0,
    actual: probability[i] ?? 0,
  }));
  nextTick(() => renderChart());
}

const summary = computed(() => {
  const rows = tableData.value;
  if (!rows.length) {
    return { quoteCount: 0, estimated: 0, actual: 0 };
  }
  return {
    quoteCount: rows.reduce((s, r) => s + r.quoteCount, 0),
    estimated: rows.reduce((s, r) => s + r.estimated, 0),
    actual: rows.reduce((s, r) => s + r.actual, 0),
  };
});

const columns: PrimaryTableCol[] = [
  { colKey: 'month', title: '时间', width: 120, cell: 'month' },
  { colKey: 'quoteCount', title: '报价数量', width: 120, align: 'right', cell: 'quoteCount' },
  { colKey: 'estimated', title: '预计销售金额', cell: 'estimated' },
  { colKey: 'actual', title: '实际销售金额', cell: 'actual' },
];

function formatMoney(n: number) {
  return `¥ ${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) {
    chartInstance = echarts.init(el);
  }
  const months = monthMeta.value.map((m) => m.label);
  const { estimated, probability } = buildMockSeries(months.length);

  chartInstance.setOption(
    {
      color: ['#165dff', '#00a870'],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v: number) => v.toLocaleString('zh-CN'),
      },
      legend: {
        data: ['预计销售金额', '概率金额'],
        bottom: 8,
        left: 'center',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: 56,
        top: 72,
        containLabel: true,
      },
      graphic: [],
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { interval: 0, rotate: months.length > 8 ? 30 : 0 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 3_000_000,
        interval: 500_000,
        axisLabel: {
          formatter: (val: number) => val.toLocaleString('zh-CN'),
        },
      },
      series: [
        {
          name: '预计销售金额',
          type: 'bar',
          barMaxWidth: 28,
          data: estimated,
        },
        {
          name: '概率金额',
          type: 'bar',
          barMaxWidth: 28,
          data: probability,
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
  monthMeta.value = getRollingMonthLabels();
  rebuildTableAndChartData();
}

function handleReset() {
  filters.value = { deptId: undefined, userId: undefined };
  monthMeta.value = getRollingMonthLabels();
  rebuildTableAndChartData();
}

function handleExport() {
  const header = ['时间', '报价数量', '预计销售金额', '实际销售金额'];
  const lines = [
    header.join(','),
    ...tableData.value.map((r) => [r.monthLabel, r.quoteCount, r.estimated.toFixed(2), r.actual.toFixed(2)].join(',')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `销售预测_${monthMeta.value[0]?.key || 'export'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  MessagePlugin.success('导出成功');
}

watch(winWidth, () => {
  chartInstance?.resize();
});

onMounted(async () => {
  await Promise.all([loadDeptOptions(), loadUserOptions()]);
  rebuildTableAndChartData();
});

onUnmounted(() => {
  disposeChart();
});
</script>
<style scoped lang="less">
.sales-forecast-page {
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

.forecast-chart {
  width: 100%;
  height: 420px;
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
}

.summary-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.help-icon {
  font-size: 20px;
  color: var(--td-text-color-placeholder);
  cursor: default;
}

.table-card {
  :deep(.t-table) {
    th {
      background: var(--td-bg-color-secondarycontainer);
    }
  }
}
</style>
