<template>
  <div class="payment-plan-page">
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
      <div class="chart-inner">
        <div ref="chartRef" class="chart-el" />
      </div>
    </t-card>

    <t-card :bordered="false" class="table-card">
      <div class="summary-toolbar">
        <div class="summary-text">{{ summaryLine }}</div>
        <t-button theme="default" variant="outline" @click="handleExport">
          <template #icon><t-icon name="upload" /></template>
          导出
        </t-button>
      </div>
      <t-table
        :data="tableRows"
        :columns="tableColumns"
        row-key="rowKey"
        size="medium"
        bordered
        stripe
        :loading="loadingData"
      >
        <template #time="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.time }}</t-link>
        </template>
        <template #target="{ row }">
          <t-link theme="primary" @click.prevent>{{ formatMoney(row.target) }}</t-link>
        </template>
        <template #done="{ row }">
          <t-link theme="primary" @click.prevent>{{ formatMoney(row.done) }}</t-link>
        </template>
        <template #rate="{ row }">
          {{ row.rate }}
        </template>
        <template #undone="{ row }">
          <t-link theme="primary" @click.prevent>{{ formatMoney(row.undone) }}</t-link>
        </template>
        <template #invoiced="{ row }">
          <t-link theme="primary" @click.prevent>{{ formatMoney(row.invoiced) }}</t-link>
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

import { getPaymentPlanSummary } from '@/api/statistics';
import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

import { statisticsScope } from '../statisticsRequest';

defineOptions({
  name: 'PaymentCollectionPlanSummary',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, BarChart, CanvasRenderer]);

const BLUE = '#5eadf5';
const GREEN = '#2ec7a6';

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const currentYear = dayjs().year();
const yearOptions = Array.from({ length: 12 }, (_, i) => {
  const y = currentYear - 5 + i;
  return { label: `${y}年`, value: y };
});

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

const summaryTotals = ref({ plan: 0, done: 0, invoiced: 0 });
const loadingData = ref(false);

const summaryLine = computed(() => {
  const s = summaryTotals.value;
  const undone = Math.max(0, s.plan - s.done);
  const rate = s.plan > 0 ? `${((s.done / s.plan) * 100).toFixed(2)}%` : '0%';
  return `计划金额合计：${formatMoney(s.plan)}，实际回款：${formatMoney(s.done)}，完成率：${rate}，未完成：${formatMoney(undone)}，已开票：${formatMoney(s.invoiced)}`;
});

interface TableRow {
  rowKey: string;
  time: string;
  target: number;
  done: number;
  rate: string;
  undone: number;
  invoiced: number;
}

const tableRows = ref<TableRow[]>([]);

async function fetchPaymentPlan() {
  loadingData.value = true;
  try {
    const res = await getPaymentPlanSummary({
      ...statisticsScope(filters.value.deptId, filters.value.userId),
      year: filters.value.year,
    });
    if (res.code !== 0 && res.code !== 200) {
      MessagePlugin.error(res.msg || '加载失败');
      return;
    }
    const d = res.data || {};
    const list = (d.list || []) as any[];
    tableRows.value = list.map((r, i) => ({
      rowKey: String(r.row_key ?? `p-${i}`),
      time: r.time,
      target: Number(r.target) || 0,
      done: Number(r.done) || 0,
      rate: String(r.rate ?? '0%'),
      undone: Number(r.undone) || 0,
      invoiced: Number(r.invoiced) || 0,
    }));
    const sum = d.summary || {};
    summaryTotals.value = {
      plan: Number(sum.plan_total) || 0,
      done: Number(sum.done_total) || 0,
      invoiced: list.reduce((acc, r) => acc + (Number(r.invoiced) || 0), 0),
    };
    await nextTick();
    renderChart();
  } catch (e: any) {
    MessagePlugin.error(e?.message || '网络错误');
  } finally {
    loadingData.value = false;
  }
}

const tableColumns: PrimaryTableCol[] = [
  { colKey: 'time', title: '时间', width: 110, cell: 'time' },
  { colKey: 'target', title: '目标金额', cell: 'target' },
  { colKey: 'done', title: '已完成金额', cell: 'done' },
  { colKey: 'rate', title: '完成率', width: 100, align: 'center', cell: 'rate' },
  { colKey: 'undone', title: '未完成金额', cell: 'undone' },
  { colKey: 'invoiced', title: '已开票金额', cell: 'invoiced' },
];

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);

  chartInstance.setOption(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v: number | string) => (typeof v === 'number' ? formatMoney(v) : String(v)),
      },
      legend: {
        bottom: 8,
        data: ['计划金额', '完成金额'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '14%',
        top: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: MONTH_LABELS,
        axisTick: { alignWithLabel: true },
        axisLabel: { fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        scale: true,
        splitLine: {
          lineStyle: { type: 'dashed', color: '#e5e6eb' },
        },
        axisLabel: {
          fontSize: 11,
          formatter: (v: number) => (v >= 10_000 ? `${v / 10_000}万` : String(v)),
        },
      },
      series: [
        {
          name: '计划金额',
          type: 'bar',
          barMaxWidth: 22,
          itemStyle: { color: BLUE },
          data: tableRows.value.map((r) => r.target),
        },
        {
          name: '完成金额',
          type: 'bar',
          barMaxWidth: 22,
          itemStyle: { color: GREEN },
          data: tableRows.value.map((r) => r.done),
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

function handleSearch() {
  void fetchPaymentPlan();
}

function handleReset() {
  filters.value = {
    year: currentYear,
    deptId: undefined,
    userId: undefined,
  };
  void fetchPaymentPlan();
}

function handleExport() {
  const header = tableColumns.map((c) => c.title as string);
  const keys = tableColumns.map((c) => c.colKey as string);
  const lines = [
    header.join(','),
    ...tableRows.value.map((row) =>
      keys
        .map((k) => {
          const v = row[k as keyof TableRow];
          if (k === 'target' || k === 'done' || k === 'undone' || k === 'invoiced')
            return typeof v === 'number' ? formatMoney(v) : String(v ?? '');
          return String(v ?? '');
        })
        .join(','),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `回款计划汇总_${dayjs().format('YYYY-MM-DD')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  MessagePlugin.success('导出成功');
}

watch(
  () => filters.value.year,
  () => {
    void fetchPaymentPlan();
  },
);

watch(winWidth, () => {
  chartInstance?.resize();
});

onMounted(() => {
  void Promise.all([loadDeptOptions(), loadUserOptions()]).then(() =>
    void fetchPaymentPlan().then(() => nextTick(() => chartInstance?.resize())),
  );
});

onUnmounted(() => {
  disposeChart();
});
</script>
<style scoped lang="less">
.payment-plan-page {
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

.chart-inner {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chart-notes {
  font-size: 13px;
  line-height: 1.6;
  color: var(--td-text-color-secondary);
  padding: 0 4px;

  p {
    margin: 0;
  }

  .label {
    color: var(--td-text-color-primary);
    font-weight: 500;
  }

  .sep {
    margin: 0 6px;
    color: var(--td-text-color-placeholder);
  }

  .hint {
    color: var(--td-text-color-secondary);
  }
}

.chart-el {
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
  line-height: 1.65;
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
