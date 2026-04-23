<template>
  <div class="business-addition-page">
    <t-card :bordered="false" class="tabs-card">
      <t-tabs v-model="activeTab" class="summary-tabs" @change="handleTabChange">
        <t-tab-panel value="time" label="按创建时间汇总" />
        <t-tab-panel value="creator" label="按创建人员汇总" />
        <t-tab-panel value="owner" label="按负责人汇总" />
      </t-tabs>
    </t-card>

    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
        <t-select v-model="filters.statMode" class="filter-select-sm" :options="statModeOptions" />
        <t-date-range-picker
          v-model="filters.monthRange"
          class="filter-range"
          mode="month"
          value-type="YYYY-MM"
          clearable
          :allow-input="true"
          placeholder="请选择月份范围"
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
      <div class="chart-summary">{{ summaryLine }}</div>
      <div ref="chartRef" class="chart-el" />
    </t-card>

    <t-card :bordered="false" class="table-card">
      <div class="summary-toolbar">
        <div class="summary-text">{{ summaryLine }}</div>
        <div class="toolbar-right">
          <t-button v-if="activeTab !== 'time'" theme="default" variant="outline" @click="handleSort">
            <template #icon><t-icon name="order-descending" /></template>
            排序
          </t-button>
          <t-button theme="default" variant="outline" @click="handleExport">
            <template #icon><t-icon name="upload" /></template>
            导出
          </t-button>
        </div>
      </div>
      <t-table :data="tableRows" :columns="tableColumns" row-key="rowKey" size="medium" bordered>
        <template v-if="activeTab === 'time'" #time="{ row }">
          {{ row.time }}
        </template>
        <template v-else #name="{ row }">
          {{ row.name }}
        </template>
        <template v-if="activeTab !== 'time'" #dept="{ row }">
          {{ row.dept }}
        </template>
        <template #newCustomer="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.newCustomer }}</t-link>
        </template>
        <template #newFollow="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.newFollow }}</t-link>
        </template>
        <template #newQuote="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.newQuote }}</t-link>
        </template>
        <template #newContract="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.newContract }}</t-link>
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import dayjs from 'dayjs';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getBusinessAdditionSummary } from '@/api/statistics';
import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

import { monthRangeParams, statisticsScope } from '../statisticsRequest';

defineOptions({
  name: 'BusinessAdditionSummary',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, LineChart, BarChart, CanvasRenderer]);

type SummaryTab = 'time' | 'creator' | 'owner';

const SERIES_META = [
  { field: 'newCustomer', name: '新增客户', color: '#7eb8e8' },
  { field: 'newFollow', name: '新增跟进', color: '#2ec7a6' },
  { field: 'newQuote', name: '新增报价', color: '#f5d547' },
  { field: 'newContract', name: '新增合同', color: '#3d5a9a' },
] as const;

const summaryTotals = ref({ newCustomer: 0, newFollow: 0, newQuote: 0, newContract: 0 });
const loadingData = ref(false);

const statModeOptions = [{ label: '按月统计', value: 'month' }];

const defaultMonthRange = (): string[] => {
  const y = dayjs().year();
  return [`${y}-01`, `${y}-12`];
};

const activeTab = ref<SummaryTab>('time');

const filters = ref({
  statMode: 'month',
  monthRange: [] as string[],
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

const summaryLine = computed(
  () =>
    `新增客户：${summaryTotals.value.newCustomer}, 新增跟进：${summaryTotals.value.newFollow}, 新增报价：${summaryTotals.value.newQuote}, 新增合同：${summaryTotals.value.newContract}`,
);

function labelMonth(time: string) {
  const parts = time.split('-');
  const y = parts[0];
  const m = parts[1];
  return `${y}年${Number(m)}月`;
}

function buildTimeChartFromRows() {
  const rows = timeTableData.value;
  const categories = rows.map((r) => labelMonth(r.time));
  const series = SERIES_META.map((m) => ({
    name: m.name,
    type: 'line' as const,
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { width: 2 },
    itemStyle: { color: m.color },
    data: rows.map((r) => Number((r as any)[m.field]) || 0),
  }));
  return { categories, series };
}

function buildBarFromStaff() {
  const rows = staffTableData.value;
  const categories = rows.map((r) => r.name);
  const series = SERIES_META.map((m) => ({
    name: m.name,
    type: 'bar' as const,
    barMaxWidth: 18,
    itemStyle: { color: m.color },
    data: rows.map((r) => Number((r as any)[m.field]) || 0),
  }));
  return { categories, series };
}

const timeTableData = ref<
  { rowKey: string; time: string; newCustomer: number; newFollow: number; newQuote: number; newContract: number }[]
>([]);
const staffTableData = ref<
  { rowKey: string; name: string; dept: string; newCustomer: number; newFollow: number; newQuote: number; newContract: number }[]
>([]);

async function fetchBusinessAddition() {
  loadingData.value = true;
  try {
    const range =
      filters.value.monthRange?.length === 2 ? filters.value.monthRange : defaultMonthRange();
    const res = await getBusinessAdditionSummary({
      ...statisticsScope(filters.value.deptId, filters.value.userId),
      ...monthRangeParams(range),
      tab: activeTab.value,
    });
    if (res.code !== 0 && res.code !== 200) {
      MessagePlugin.error(res.msg || '加载失败');
      return;
    }
    const d = res.data || {};
    if (activeTab.value === 'time') {
      const list = d.list || [];
      timeTableData.value = list.map((r: any, i: number) => ({
        rowKey: String(r.row_key ?? `t-${i}`),
        time: r.time,
        newCustomer: Number(r.new_customer) || 0,
        newFollow: Number(r.new_follow) || 0,
        newQuote: Number(r.new_quote) || 0,
        newContract: Number(r.new_contract) || 0,
      }));
      const s = d.summary || {};
      summaryTotals.value = {
        newCustomer: Number(s.new_customer) || 0,
        newFollow: Number(s.new_follow) || 0,
        newQuote: Number(s.new_quote) || 0,
        newContract: Number(s.new_contract) || 0,
      };
    } else {
      const list = d.list || [];
      staffTableData.value = list.map((r: any, i: number) => ({
        rowKey: String(r.row_key ?? `s-${i}`),
        name: r.name,
        dept: r.dept || '',
        newCustomer: Number(r.new_customer) || 0,
        newFollow: Number(r.new_follow) || 0,
        newQuote: Number(r.new_quote) || 0,
        newContract: Number(r.new_contract) || 0,
      }));
      summaryTotals.value = staffTableData.value.reduce(
        (acc, r) => ({
          newCustomer: acc.newCustomer + r.newCustomer,
          newFollow: acc.newFollow + r.newFollow,
          newQuote: acc.newQuote + r.newQuote,
          newContract: acc.newContract + r.newContract,
        }),
        { newCustomer: 0, newFollow: 0, newQuote: 0, newContract: 0 },
      );
    }
    await nextTick();
    renderChart();
  } catch (e: any) {
    MessagePlugin.error(e?.message || '网络错误');
  } finally {
    loadingData.value = false;
  }
}

const tableRows = computed(() => {
  if (activeTab.value === 'time') return timeTableData.value;
  return staffTableData.value;
});

const tableColumns = computed<PrimaryTableCol[]>(() => {
  if (activeTab.value === 'time') {
    return [
      { colKey: 'time', title: '时间', width: 120, cell: 'time' },
      { colKey: 'newCustomer', title: '新增客户', align: 'right', cell: 'newCustomer' },
      { colKey: 'newFollow', title: '新增跟进', align: 'right', cell: 'newFollow' },
      { colKey: 'newQuote', title: '新增报价', align: 'right', cell: 'newQuote' },
      { colKey: 'newContract', title: '新增合同', align: 'right', cell: 'newContract' },
    ];
  }
  return [
    { colKey: 'name', title: '员工姓名', width: 120, cell: 'name' },
    { colKey: 'dept', title: '所在部门', width: 140, cell: 'dept' },
    { colKey: 'newCustomer', title: '新增客户', align: 'right', cell: 'newCustomer' },
    { colKey: 'newFollow', title: '新增跟进', align: 'right', cell: 'newFollow' },
    { colKey: 'newQuote', title: '新增报价', align: 'right', cell: 'newQuote' },
    { colKey: 'newContract', title: '新增合同', align: 'right', cell: 'newContract' },
  ];
});

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);

  const grid = {
    left: '3%',
    right: '4%',
    bottom: '14%',
    top: '8%',
    containLabel: true,
  };

  if (activeTab.value === 'time') {
    const { categories, series } = buildTimeChartFromRows();
    chartInstance.setOption(
      {
        tooltip: { trigger: 'axis' },
        legend: {
          bottom: 0,
          data: SERIES_META.map((m) => m.name),
        },
        grid,
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: categories,
          axisLabel: { rotate: 28, fontSize: 11 },
        },
        yAxis: {
          type: 'value',
          min: 0,
          scale: true,
        },
        series,
      },
      true,
    );
  } else {
    const { categories, series } = buildBarFromStaff();
    chartInstance.setOption(
      {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: {
          bottom: 0,
          data: SERIES_META.map((m) => m.name),
        },
        grid,
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: { interval: 0, fontSize: 12 },
        },
        yAxis: {
          type: 'value',
          min: 0,
          scale: true,
        },
        series,
      },
      true,
    );
  }
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

function handleTabChange() {
  void fetchBusinessAddition();
}

function handleSearch() {
  void fetchBusinessAddition();
}

function handleReset() {
  filters.value = {
    statMode: 'month',
    monthRange: defaultMonthRange(),
    deptId: undefined,
    userId: undefined,
  };
  void fetchBusinessAddition();
}

function handleSort() {
  MessagePlugin.info('已按默认顺序排序');
}

function handleExport() {
  const cols = tableColumns.value;
  const header = cols.map((c) => c.title as string);
  const keys = cols.map((c) => c.colKey as string);
  const lines = [
    header.join(','),
    ...tableRows.value.map((row: Record<string, unknown>) =>
      keys.map((k) => String(row[k] ?? '')).join(','),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `业务新增汇总_${dayjs().format('YYYY-MM-DD')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  MessagePlugin.success('导出成功');
}

watch(winWidth, () => {
  chartInstance?.resize();
});

onMounted(() => {
  filters.value.monthRange = defaultMonthRange();
  void Promise.all([loadDeptOptions(), loadUserOptions()]).then(() => {
    void fetchBusinessAddition().then(() => nextTick(() => chartInstance?.resize()));
  });
});

onUnmounted(() => {
  disposeChart();
});
</script>

<style scoped lang="less">
.business-addition-page {
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

.summary-tabs {
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

.filter-select-sm {
  width: 140px;
}

.filter-range {
  width: 260px;
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

.chart-summary {
  text-align: center;
  font-size: 14px;
  color: var(--td-text-color-primary);
  margin-bottom: 12px;
  line-height: 1.6;
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
  line-height: 1.6;
  flex: 1;
  min-width: 200px;
}

.toolbar-right {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.table-card {
  :deep(.t-table) {
    th {
      background: var(--td-bg-color-secondarycontainer);
    }
  }
}
</style>
