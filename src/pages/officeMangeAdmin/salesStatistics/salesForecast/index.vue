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
          报价数量: {{ summary.quoteCount }}，销售金额: {{ formatMoney(summary.salesAmount) }}，成交几率(加权):
          {{ formatPct(summary.winRateWeightedPct) }}，概率金额: {{ formatMoney(summary.probabilityAmount) }}，实际销售金额:
          {{ formatMoney(summary.actual) }}
        </div>
        <div class="summary-actions">
          <t-tooltip
            content="按月统计报价：销售金额为报价单金额合计；概率金额=各单金额×该单成交几率(win_rate)之和；成交几率(加权)=概率金额÷销售金额。"
            placement="top"
          >
            <t-icon name="help-circle" class="help-icon" />
          </t-tooltip>
          <t-button theme="default" variant="outline" @click="handleExport">
            <template #icon><t-icon name="upload" /></template>
            导出
          </t-button>
        </div>
      </div>
      <t-table
        :data="tableData"
        :columns="columns"
        row-key="monthKey"
        :pagination="false"
        size="medium"
        bordered
        :loading="loadingData"
      >
        <template #month="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.monthLabel }}</t-link>
        </template>
        <template #quoteCount="{ row }">
          {{ row.quoteCount }}
        </template>
        <template #salesAmt="{ row }">
          {{ formatMoney(row.estimated) }}
        </template>
        <template #winRate="{ row }">
          {{ formatPct(row.winRateWeightedPct) }}
        </template>
        <template #probAmt="{ row }">
          {{ formatMoney(row.probabilityAmount) }}
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

import { getSalesForecast } from '@/api/statistics';
import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';
import dayjs from 'dayjs';

defineOptions({
  name: 'SalesForecastAnalysis',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, GraphicComponent, BarChart, CanvasRenderer]);

interface ForecastRow {
  monthKey: string;
  monthLabel: string;
  quoteCount: number;
  estimated: number;
  /** 金额加权平均成交几率（%），与报价单 win_rate 一致口径 */
  winRateWeightedPct: number;
  /** 概率金额（图表第二柱） */
  probabilityAmount: number;
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

const monthMeta = ref(getRollingMonthLabels());
const tableData = ref<ForecastRow[]>([]);
const loadingData = ref(false);

const summaryStats = ref({
  quoteCount: 0,
  salesAmount: 0,
  winRateWeightedPct: 0,
  probabilityAmount: 0,
  actual: 0,
});

function scopeParams() {
  return {
    dept_id: filters.value.deptId,
    user_id: filters.value.userId,
  };
}

async function rebuildTableAndChartData() {
  loadingData.value = true;
  try {
    const baseMonth = dayjs().format('YYYY-MM');
    const res = await getSalesForecast({ ...scopeParams(), base_month: baseMonth });
    if (res.code !== 0 && res.code !== 200) {
      MessagePlugin.error(res.msg || '加载失败');
      return;
    }
    const d = res.data || {};
    const list = d.list || [];
    monthMeta.value = list.map((r: any) => ({
      key: r.month_key,
      label: r.month_label || r.month_key,
    }));
    tableData.value = list.map((r: any) => {
      const est = Number(r.estimated) || 0;
      const prob = Number(r.probability_amount) || 0;
      const w =
        r.win_rate_weighted_pct !== undefined && r.win_rate_weighted_pct !== null
          ? Number(r.win_rate_weighted_pct)
          : est > 0
            ? Math.round((prob / est) * 10000) / 100
            : 0;
      return {
        monthKey: r.month_key,
        monthLabel: r.month_label || r.month_key,
        quoteCount: Number(r.quote_count) || 0,
        estimated: est,
        winRateWeightedPct: w,
        probabilityAmount: prob,
        actual: Number(r.actual) || 0,
      };
    });
    const sm = d.summary || {};
    const rows = tableData.value;
    const sumEst = rows.reduce((s, r) => s + r.estimated, 0);
    const sumProb = rows.reduce((s, r) => s + r.probabilityAmount, 0);
    summaryStats.value = {
      quoteCount: Number(sm.quote_count) || rows.reduce((s, r) => s + r.quoteCount, 0),
      salesAmount: Number(sm.estimated) || sumEst,
      probabilityAmount: sm.probability_amount != null && sm.probability_amount !== '' ? Number(sm.probability_amount) : sumProb,
      winRateWeightedPct:
        sm.win_rate_weighted_pct != null && sm.win_rate_weighted_pct !== ''
          ? Number(sm.win_rate_weighted_pct)
          : sumEst > 0
            ? Math.round((sumProb / sumEst) * 10000) / 100
            : 0,
      actual: Number(sm.actual) || rows.reduce((s, r) => s + r.actual, 0),
    };
    await nextTick();
    renderChart();
  } catch (e: any) {
    MessagePlugin.error(e?.message || '网络错误');
  } finally {
    loadingData.value = false;
  }
}

const summary = computed(() => summaryStats.value);

const columns: PrimaryTableCol[] = [
  { colKey: 'month', title: '时间', width: 120, cell: 'month' },
  { colKey: 'quoteCount', title: '报价数量', width: 100, align: 'right', cell: 'quoteCount' },
  { colKey: 'estimated', title: '销售金额', minWidth: 120, align: 'right', cell: 'salesAmt' },
  { colKey: 'winRateWeightedPct', title: '成交几率(加权)', width: 120, align: 'right', cell: 'winRate' },
  { colKey: 'probabilityAmount', title: '概率金额', minWidth: 120, align: 'right', cell: 'probAmt' },
  { colKey: 'actual', title: '实际销售金额', minWidth: 120, align: 'right', cell: 'actual' },
];

function formatMoney(n: number) {
  return `¥ ${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPct(n: number) {
  return `${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) {
    chartInstance = echarts.init(el);
  }
  const months = monthMeta.value.map((m) => m.label);
  const estimated = tableData.value.map((r) => r.estimated);
  const probability = tableData.value.map((r) => r.probabilityAmount);

  chartInstance.setOption(
    {
      color: ['#165dff', '#00a870'],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v: number) => v.toLocaleString('zh-CN'),
      },
      legend: {
        data: ['销售金额', '概率金额'],
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
        scale: true,
        axisLabel: {
          formatter: (val: number) => val.toLocaleString('zh-CN'),
        },
      },
      series: [
        {
          name: '销售金额',
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
  const header = ['时间', '报价数量', '销售金额', '成交几率加权%', '概率金额', '实际销售金额'];
  const lines = [
    header.join(','),
    ...tableData.value.map((r) =>
      [
        r.monthLabel,
        r.quoteCount,
        r.estimated.toFixed(2),
        r.winRateWeightedPct.toFixed(2),
        r.probabilityAmount.toFixed(2),
        r.actual.toFixed(2),
      ].join(','),
    ),
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
