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
        <t-button theme="primary" :loading="loadingData" @click="handleSearch">
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
          <t-button theme="default" variant="outline" @click="handleExport">
            <template #icon><t-icon name="upload" /></template>
            导出
          </t-button>
        </div>
      </div>
      <t-table
        :data="tableData"
        :columns="tableColumns"
        :loading="loadingData"
        row-key="rowKey"
        size="medium"
        bordered
        stripe
      >
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

import { getCustomerTransactionTop10 } from '@/api/statistics';
import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

import { effectiveMonthRange, monthRangeParams, statisticsScope } from '../../statisticsRequest';

defineOptions({
  name: 'CustomerTransactionTop10',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, BarChart, CanvasRenderer]);

const statModeOptions = [{ label: '按月统计', value: 'month' }];

const COLOR_DEAL = '#5eadf5';
const COLOR_COLLECT = '#52c41a';

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
const loadingData = ref(false);

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const { width: winWidth } = useWindowSize();

function formatMoney(n: number) {
  return `¥ ${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface TableRow {
  rowKey: string;
  rank: number;
  name: string;
  dealTotal: number;
  collectTotal: number;
  contractCount: number;
}

const tableData = ref<TableRow[]>([]);

const summaryLine = computed(() => {
  const deal = tableData.value.reduce((s, r) => s + r.dealTotal, 0);
  const col = tableData.value.reduce((s, r) => s + r.collectTotal, 0);
  return `成交总额: ${formatMoney(deal)}, 回款总额: ${formatMoney(col)}`;
});

const tableColumns: PrimaryTableCol[] = [
  { colKey: 'rank', title: '排名', width: 72, align: 'center' },
  { colKey: 'name', title: '客户名称', minWidth: 140, cell: 'custName' },
  { colKey: 'dealTotal', title: '成交总额', align: 'right', cell: 'deal' },
  { colKey: 'collectTotal', title: '回款总额', align: 'right', cell: 'collect' },
  { colKey: 'contractCount', title: '合同数', align: 'right', width: 88 },
];

function chartOption(): EChartsCoreOption {
  const labels = tableData.value.map((r) => r.name || '—');
  const deals = tableData.value.map((r) => r.dealTotal);
  const cols = tableData.value.map((r) => r.collectTotal);
  const maxVal = Math.max(1, ...deals, ...cols);
  const axisMax = Math.ceil(maxVal * 1.1);
  const interval = Math.max(axisMax / 5, 1);

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
      max: axisMax,
      interval,
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e6eb' } },
      axisLabel: {
        fontSize: 11,
        formatter: (v: number) => (v >= 10_000 ? `${v / 10_000}万` : String(v)),
      },
    },
    yAxis: {
      type: 'category',
      data: labels,
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
        data: deals,
      },
      {
        name: '回款总额',
        type: 'bar',
        barMaxWidth: 14,
        itemStyle: { color: COLOR_COLLECT, borderRadius: [0, 4, 4, 0] },
        data: cols,
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

async function fetchData() {
  loadingData.value = true;
  try {
    const range = effectiveMonthRange(filters.value.monthRange, defaultMonthRange);
    const res = await getCustomerTransactionTop10({
      ...statisticsScope(filters.value.deptId, filters.value.userId),
      ...monthRangeParams(range),
    });
    if (res.code !== 0 && res.code !== 200) {
      MessagePlugin.error((res as any).msg || '加载失败');
      return;
    }
    const list = (res as any).data?.list || [];
    tableData.value = list.map((r: any, i: number) => ({
      rowKey: String(r.row_key ?? `t-${i}`),
      rank: i + 1,
      name: r.customer_name ?? '',
      dealTotal: Number(r.amount) || 0,
      collectTotal: Number(r.collection_amount) || 0,
      contractCount: Number(r.contract_count) || 0,
    }));
    await nextTick();
    renderChart();
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
  void fetchData();
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

function handleExport() {
  const header = ['排名', '客户名称', '成交总额', '回款总额', '合同数'];
  const lines = [
    header.join(','),
    ...tableData.value.map((row) =>
      [row.rank, row.name, row.dealTotal, row.collectTotal, row.contractCount].join(','),
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
  void Promise.all([loadDeptOptions(), loadUserOptions()]).then(() => {
    void fetchData();
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
