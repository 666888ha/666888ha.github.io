<template>
  <div class="conversion-rate-ranking-page">
    <t-card :bordered="false" class="tabs-card">
      <t-tabs v-model="activeTab" class="rank-tabs" @change="handleTabChange">
        <t-tab-panel value="individual" label="个人排名" />
        <t-tab-panel value="department" label="部门排名" />
      </t-tabs>
    </t-card>

    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
        <t-select
          v-model="filters.metric"
          class="filter-select-metric"
          :options="metricOptions"
          placeholder="指标"
        />
        <t-select v-model="filters.year" class="filter-select-year" :options="yearOptions" />
        <t-date-range-picker
          v-model="filters.dateRange"
          class="filter-range"
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
          v-if="activeTab === 'individual'"
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
      <t-table
        :data="tableRows"
        :columns="tableColumns"
        row-key="rowKey"
        size="medium"
        bordered
        stripe
        :row-class-name="rowClassName"
      >
        <template #rank="{ row }">
          {{ row.rank }}
        </template>
        <template v-if="activeTab === 'individual'" #empName="{ row }">
          {{ row.name }}
        </template>
        <template v-if="activeTab === 'individual'" #empDept="{ row }">
          {{ row.dept }}
        </template>
        <template v-if="activeTab === 'department'" #deptName="{ row }">
          {{ row.name }}
        </template>
        <template #newLeads="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.newLeads }}</t-link>
        </template>
        <template #converted="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.convertedCustomers }}</t-link>
        </template>
        <template #rate="{ row }">
          {{ formatRateDisplay(row.conversionRate) }}
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
import type { PrimaryTableCol, RowClassNameParams } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

defineOptions({
  name: 'ConversionRateRanking',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, BarChart, CanvasRenderer]);

type RankTab = 'individual' | 'department';

const COLOR_LEADS = '#5eadf5';
const COLOR_CONVERTED = '#52c41a';

const MOCK_SUMMARY_NEW = 100;
const MOCK_SUMMARY_CONVERTED = 200;
const MOCK_SUMMARY_RATE = 100;

const MOCK_TABLE_NEW = 200;
const MOCK_TABLE_CONVERTED = 200;
const MOCK_TABLE_RATE = 100;

const metricOptions = [{ label: '转化率', value: 'conversion' }];

const EMPLOYEE_NAMES = [
  '赵小刚',
  '李小红',
  '王小明',
  '周小伟',
  '孙小军',
  '吴小丽',
  '郑小强',
  '钱小敏',
  '冯小涛',
];

/** 与示意一致：王小明 新增线索 233、已转客户 142 */
const CHART_IND_LEADS = [265, 250, 233, 240, 228, 215, 200, 188, 175];
const CHART_IND_CONV = [165, 155, 142, 148, 138, 128, 118, 108, 98];

const DEPT_LABELS = Array.from({ length: 10 }, (_, i) => `部门名称${i + 1}`);
/** 部门名称2：新增线索 252、已转客户 170 */
const CHART_DEPT_LEADS = [275, 252, 235, 220, 205, 190, 175, 160, 145, 130];
const CHART_DEPT_CONV = [185, 170, 155, 142, 130, 118, 105, 95, 85, 75];

const currentYear = dayjs().year();
const yearOptions = Array.from({ length: 12 }, (_, i) => {
  const y = currentYear - 5 + i;
  return { label: `${y}年`, value: y };
});

const activeTab = ref<RankTab>('individual');

const filters = ref({
  metric: 'conversion' as string,
  year: currentYear,
  dateRange: [] as string[],
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
    `新增：${MOCK_SUMMARY_NEW}, 已转客户：${MOCK_SUMMARY_CONVERTED}, 转化率：${MOCK_SUMMARY_RATE}%`,
);

function formatRateDisplay(rate: number) {
  return `${rate}%`;
}

interface IndividualRow {
  rowKey: string;
  rank: number;
  name: string;
  dept: string;
  newLeads: number;
  convertedCustomers: number;
  conversionRate: number;
}

interface DepartmentRow {
  rowKey: string;
  rank: number;
  name: string;
  newLeads: number;
  convertedCustomers: number;
  conversionRate: number;
}

function buildIndividualRows(): IndividualRow[] {
  return EMPLOYEE_NAMES.map((_, i) => ({
    rowKey: `e-${i}`,
    rank: i + 1,
    name: '赵小刚',
    dept: '销售一部',
    newLeads: MOCK_TABLE_NEW,
    convertedCustomers: MOCK_TABLE_CONVERTED,
    conversionRate: MOCK_TABLE_RATE,
  }));
}

function buildDepartmentRows(): DepartmentRow[] {
  return DEPT_LABELS.map((_, i) => ({
    rowKey: `d-${i}`,
    rank: i + 1,
    name: '销售一部',
    newLeads: MOCK_TABLE_NEW,
    convertedCustomers: MOCK_TABLE_CONVERTED,
    conversionRate: MOCK_TABLE_RATE,
  }));
}

const individualRows = ref<IndividualRow[]>(buildIndividualRows());
const departmentRows = ref<DepartmentRow[]>(buildDepartmentRows());

const tableRows = computed(() =>
  activeTab.value === 'individual' ? individualRows.value : departmentRows.value,
);

const tableColumns = computed<PrimaryTableCol[]>(() => {
  if (activeTab.value === 'individual') {
    return [
      { colKey: 'rank', title: '排名', width: 72, align: 'center', cell: 'rank' },
      { colKey: 'name', title: '员工姓名', width: 120, cell: 'empName' },
      { colKey: 'dept', title: '所在部门', width: 140, cell: 'empDept' },
      { colKey: 'newLeads', title: '新增', align: 'right', width: 100, cell: 'newLeads' },
      {
        colKey: 'convertedCustomers',
        title: '已转客户',
        align: 'right',
        width: 110,
        cell: 'converted',
      },
      { colKey: 'conversionRate', title: '转化率', align: 'right', width: 100, cell: 'rate' },
    ];
  }
  return [
    { colKey: 'rank', title: '排名', width: 72, align: 'center', cell: 'rank' },
    { colKey: 'name', title: '部门名称', minWidth: 140, cell: 'deptName' },
    { colKey: 'newLeads', title: '新增', align: 'right', width: 100, cell: 'newLeads' },
    {
      colKey: 'convertedCustomers',
      title: '已转客户',
      align: 'right',
      width: 110,
      cell: 'converted',
    },
    { colKey: 'conversionRate', title: '转化率', align: 'right', width: 100, cell: 'rate' },
  ];
});

function rowClassName({ rowIndex }: RowClassNameParams<unknown>) {
  if (activeTab.value === 'individual' && rowIndex === 0) return 'rank-top-row';
  return '';
}

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);

  const isInd = activeTab.value === 'individual';
  const categories = isInd ? EMPLOYEE_NAMES : DEPT_LABELS;
  const leadsData = isInd ? [...CHART_IND_LEADS] : [...CHART_DEPT_LEADS];
  const convData = isInd ? [...CHART_IND_CONV] : [...CHART_DEPT_CONV];

  chartInstance.setOption(
    {
      color: [COLOR_LEADS, COLOR_CONVERTED],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['新增线索', '已转客户'],
        top: 0,
        left: 'center',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: isInd ? '12%' : '10%',
        top: '14%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisTick: { alignWithLabel: true },
        axisLabel: { rotate: isInd ? 24 : 20, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 300,
        interval: 50,
        splitLine: { lineStyle: { type: 'dashed', color: '#e5e6eb' } },
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          name: '新增线索',
          type: 'bar',
          barMaxWidth: 22,
          itemStyle: { color: COLOR_LEADS, borderRadius: [4, 4, 0, 0] },
          data: leadsData,
        },
        {
          name: '已转客户',
          type: 'bar',
          barMaxWidth: 22,
          itemStyle: { color: COLOR_CONVERTED, borderRadius: [4, 4, 0, 0] },
          data: convData,
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

function refreshRows() {
  individualRows.value = buildIndividualRows();
  departmentRows.value = buildDepartmentRows();
}

function handleTabChange() {
  nextTick(() => renderChart());
}

function handleSearch() {
  refreshRows();
  nextTick(() => renderChart());
}

function handleReset() {
  filters.value = {
    metric: 'conversion',
    year: currentYear,
    dateRange: [],
    deptId: undefined,
    userId: undefined,
  };
  refreshRows();
  nextTick(() => renderChart());
}

function handleSort() {
  MessagePlugin.info('已按默认顺序排序');
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
          if (k === 'conversionRate') return `${v ?? ''}%`;
          return String(v ?? '');
        })
        .join(','),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `转化率排名_${dayjs().format('YYYY-MM-DD')}.csv`;
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
.conversion-rate-ranking-page {
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

.rank-tabs {
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

.filter-select-metric {
  width: 140px;
}

.filter-select-year {
  width: 120px;
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

    tr.rank-top-row > td {
      background: #e8f4ff;
    }
  }
}
</style>
