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

import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

defineOptions({
  name: 'BusinessAdditionSummary',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, LineChart, BarChart, CanvasRenderer]);

type SummaryTab = 'time' | 'creator' | 'owner';

const SERIES_META = [
  { key: 'clue', name: '线索', color: '#7eb8e8' },
  { key: 'opportunity', name: '商机', color: '#2ec7a6' },
  { key: 'customer', name: '客户', color: '#f5d547' },
  { key: 'order', name: '订单', color: '#3d5a9a' },
] as const;

const MOCK_NUM = 200;

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
    `新增客户：${MOCK_NUM}, 新增跟进：${MOCK_NUM}, 新增报价：${MOCK_NUM}, 新增合同：${MOCK_NUM}`,
);

/** 折线图：12 个月 */
function buildTimeChartData(year: number) {
  const months = Array.from({ length: 12 }, (_, i) => `${year}年${i + 1}月`);
  const wave = (seed: number) =>
    months.map((_, i) => Math.round(80 + Math.sin((i + seed) * 0.45) * 70 + (i % 3) * 15));
  return {
    categories: months,
    series: SERIES_META.map((m, idx) => ({
      name: m.name,
      type: 'line' as const,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2 },
      itemStyle: { color: m.color },
      data: wave(idx + 1),
    })),
  };
}

const STAFF_NAMES = ['赵小刚', '李小红', '王小明', '刘芳', '陈强'];

function buildBarChartData() {
  return {
    categories: STAFF_NAMES,
    series: SERIES_META.map((m) => ({
      name: m.name,
      type: 'bar' as const,
      barMaxWidth: 18,
      itemStyle: { color: m.color },
      data: STAFF_NAMES.map(() => MOCK_NUM),
    })),
  };
}

function buildTimeTable(year: number) {
  return Array.from({ length: 12 }, (_, i) => ({
    rowKey: `t-${i}`,
    time: `${year}-${String(i + 1).padStart(2, '0')}`,
    newCustomer: MOCK_NUM,
    newFollow: MOCK_NUM,
    newQuote: MOCK_NUM,
    newContract: MOCK_NUM,
  }));
}

function buildStaffTable() {
  return STAFF_NAMES.map((name, i) => ({
    rowKey: `s-${i}`,
    name,
    dept: '销售一部',
    newCustomer: MOCK_NUM,
    newFollow: MOCK_NUM,
    newQuote: MOCK_NUM,
    newContract: MOCK_NUM,
  }));
}

const timeTableData = ref(buildTimeTable(dayjs().year()));
const staffTableData = ref(buildStaffTable());

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

function getChartYear() {
  const r = filters.value.monthRange;
  if (r?.length && r[0]) return dayjs(r[0], 'YYYY-MM').year();
  return dayjs().year();
}

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);

  const year = getChartYear();
  const grid = {
    left: '3%',
    right: '4%',
    bottom: '14%',
    top: '8%',
    containLabel: true,
  };

  if (activeTab.value === 'time') {
    const { categories, series } = buildTimeChartData(year);
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
          max: 300,
          splitNumber: 6,
        },
        series,
      },
      true,
    );
  } else {
    const { categories, series } = buildBarChartData();
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
          max: 300,
          splitNumber: 6,
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
  nextTick(() => renderChart());
}

function handleSearch() {
  const y = getChartYear();
  timeTableData.value = buildTimeTable(y);
  staffTableData.value = buildStaffTable();
  nextTick(() => renderChart());
}

function handleReset() {
  filters.value = {
    statMode: 'month',
    monthRange: defaultMonthRange(),
    deptId: undefined,
    userId: undefined,
  };
  const y = dayjs().year();
  timeTableData.value = buildTimeTable(y);
  staffTableData.value = buildStaffTable();
  nextTick(() => renderChart());
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
