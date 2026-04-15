<template>
  <div class="follow-up-record-page">
    <t-card :bordered="false" class="tabs-card">
      <t-tabs v-model="activeTab" class="summary-tabs" @change="handleTabChange">
        <t-tab-panel value="object" label="跟进对象" />
        <t-tab-panel value="type" label="跟进类型" />
      </t-tabs>
    </t-card>

    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
        <t-select v-model="filters.followTime" class="filter-select-follow" :options="followTimeOptions" />
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
      <div class="chart-summary">{{ chartSummaryLine }}</div>
      <div ref="chartRef" class="chart-el" />
    </t-card>

    <t-card :bordered="false" class="table-card">
      <div class="summary-toolbar" :class="{ 'summary-toolbar--actions-only': activeTab === 'object' }">
        <div v-if="activeTab === 'type'" class="summary-text">{{ tableSummaryLine }}</div>
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
      <div class="table-wrap">
        <t-table :data="tableRows" :columns="tableColumns" row-key="rowKey" size="medium" bordered>
          <template #name="{ row }">
            {{ row.name }}
          </template>
          <template #dept="{ row }">
            {{ row.dept }}
          </template>
          <template #cntTotal="{ row }">
            <t-link theme="primary" @click.prevent>{{ row.cntTotal }}</t-link>
          </template>
          <template v-if="activeTab === 'object'" #cntCustomer="{ row }">
            <t-link theme="primary" @click.prevent>{{ row.cntCustomer }}</t-link>
          </template>
          <template v-if="activeTab === 'object'" #cntQuote="{ row }">
            <t-link theme="primary" @click.prevent>{{ row.cntQuote }}</t-link>
          </template>
          <template v-if="activeTab === 'object'" #cntOpportunity="{ row }">
            <t-link theme="primary" @click.prevent>{{ row.cntOpportunity }}</t-link>
          </template>
          <template v-if="activeTab === 'object'" #cntContract="{ row }">
            <t-link theme="primary" @click.prevent>{{ row.cntContract }}</t-link>
          </template>
          <template v-if="activeTab === 'type'" #visit="{ row }">
            <t-link theme="primary" @click.prevent>{{ row.visit }}</t-link>
          </template>
          <template v-if="activeTab === 'type'" #phone="{ row }">
            <t-link theme="primary" @click.prevent>{{ row.phone }}</t-link>
          </template>
          <template v-if="activeTab === 'type'" #wechat="{ row }">
            <t-link theme="primary" @click.prevent>{{ row.wechat }}</t-link>
          </template>
          <template v-if="activeTab === 'type'" #sms="{ row }">
            <t-link theme="primary" @click.prevent>{{ row.sms }}</t-link>
          </template>
          <template v-if="activeTab === 'type'" #email="{ row }">
            <t-link theme="primary" @click.prevent>{{ row.email }}</t-link>
          </template>
          <template v-if="activeTab === 'type'" #qq="{ row }">
            <t-link theme="primary" @click.prevent>{{ row.qq }}</t-link>
          </template>
          <template v-if="activeTab === 'type'" #other="{ row }">
            <t-link theme="primary" @click.prevent>{{ row.other }}</t-link>
          </template>
        </t-table>
      </div>
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
  name: 'FollowUpRecordSummary',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, BarChart, CanvasRenderer]);

type SummaryTab = 'object' | 'type';

/** 跟进对象：图例与柱状图 */
const OBJECT_SERIES = [
  { name: '跟进次数', color: '#7eb8e8' },
  { name: '跟进线索次数', color: '#2ec7a6' },
  { name: '跟进客户次数', color: '#f5d547' },
  { name: '跟进商机次数', color: '#3d5a9a' },
  { name: '跟进订单次数', color: '#b794f6' },
] as const;

/** 跟进类型：图例与柱状图 */
const TYPE_SERIES = [
  { name: '跟进次数', color: '#7eb8e8' },
  { name: '到访', color: '#2ec7a6' },
  { name: '电话', color: '#f5d547' },
  { name: '微信', color: '#3d5a9a' },
  { name: '短信', color: '#8b7fd8' },
  { name: '邮件', color: '#ec746e' },
  { name: 'QQ', color: '#5ab1e8' },
  { name: '其它', color: '#a8a8a8' },
] as const;

const MOCK = 200;

const followTimeOptions = [{ label: '写跟进时间', value: 'write' }];
const statModeOptions = [{ label: '按月统计', value: 'month' }];

const defaultMonthRange = (): string[] => {
  const y = dayjs().year();
  return [`${y}-01`, `${y}-12`];
};

const activeTab = ref<SummaryTab>('object');

const filters = ref({
  followTime: 'write',
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

const STAFF_NAMES = ['赵小刚', '李小红', '王小明', '刘芳', '陈强'];

const chartSummaryLine = computed(() => {
  if (activeTab.value === 'object') {
    return `跟进次数：${MOCK}，跟进线索：${MOCK}，跟进客户：${MOCK}，跟进商机：${MOCK}，跟进订单：${MOCK}`;
  }
  return `跟进次数：${MOCK}，到访：${MOCK}，电话：${MOCK}，微信：${MOCK}，短信：${MOCK}，邮件：${MOCK}，QQ：${MOCK}，其它：${MOCK}`;
});

const tableSummaryLine = computed(
  () => `跟进次数: ${MOCK}, 到访: ${MOCK}, 电话: ${MOCK}, 微信: ${MOCK}, 其它: ${MOCK}`,
);

interface ObjectRow {
  rowKey: string;
  name: string;
  dept: string;
  cntTotal: number;
  cntCustomer: number;
  cntQuote: number;
  cntOpportunity: number;
  cntContract: number;
}

interface TypeRow {
  rowKey: string;
  name: string;
  dept: string;
  cntTotal: number;
  visit: number;
  phone: number;
  wechat: number;
  sms: number;
  email: number;
  qq: number;
  other: number;
}

function buildObjectRows(): ObjectRow[] {
  return STAFF_NAMES.map((name, i) => ({
    rowKey: `o-${i}`,
    name,
    dept: '销售一部',
    cntTotal: MOCK,
    cntCustomer: MOCK,
    cntQuote: MOCK,
    cntOpportunity: MOCK,
    cntContract: MOCK,
  }));
}

function buildTypeRows(): TypeRow[] {
  return STAFF_NAMES.map((name, i) => ({
    rowKey: `t-${i}`,
    name,
    dept: '销售一部',
    cntTotal: MOCK,
    visit: MOCK,
    phone: MOCK,
    wechat: MOCK,
    sms: MOCK,
    email: MOCK,
    qq: MOCK,
    other: MOCK,
  }));
}

const objectTableData = ref<ObjectRow[]>(buildObjectRows());
const typeTableData = ref<TypeRow[]>(buildTypeRows());

const tableRows = computed(() =>
  activeTab.value === 'object' ? objectTableData.value : typeTableData.value,
);

const tableColumns = computed<PrimaryTableCol[]>(() => {
  if (activeTab.value === 'object') {
    return [
      { colKey: 'name', title: '员工姓名', width: 100, cell: 'name' },
      { colKey: 'dept', title: '所在部门', width: 120, cell: 'dept' },
      { colKey: 'cntTotal', title: '跟进次数', align: 'right', minWidth: 100, cell: 'cntTotal' },
      { colKey: 'cntCustomer', title: '客户跟进', align: 'right', minWidth: 100, cell: 'cntCustomer' },
      { colKey: 'cntQuote', title: '跟进报价次数', align: 'right', minWidth: 120, cell: 'cntQuote' },
      { colKey: 'cntOpportunity', title: '跟进商机次数', align: 'right', minWidth: 120, cell: 'cntOpportunity' },
      { colKey: 'cntContract', title: '跟进合同次数', align: 'right', minWidth: 120, cell: 'cntContract' },
    ];
  }
  return [
    { colKey: 'name', title: '员工姓名', width: 100, fixed: 'left', cell: 'name' },
    { colKey: 'dept', title: '所在部门', width: 120, fixed: 'left', cell: 'dept' },
    { colKey: 'cntTotal', title: '跟进次数', align: 'right', minWidth: 100, cell: 'cntTotal' },
    { colKey: 'visit', title: '到访', align: 'right', minWidth: 88, cell: 'visit' },
    { colKey: 'phone', title: '电话', align: 'right', minWidth: 88, cell: 'phone' },
    { colKey: 'wechat', title: '微信', align: 'right', minWidth: 88, cell: 'wechat' },
    { colKey: 'sms', title: '短信', align: 'right', minWidth: 88, cell: 'sms' },
    { colKey: 'email', title: '邮件', align: 'right', minWidth: 88, cell: 'email' },
    { colKey: 'qq', title: 'QQ', align: 'right', minWidth: 72, cell: 'qq' },
    { colKey: 'other', title: '其它', align: 'right', minWidth: 88, cell: 'other' },
  ];
});

function buildBarSeries(meta: readonly { name: string; color: string }[]) {
  return meta.map((m) => ({
    name: m.name,
    type: 'bar' as const,
    barMaxWidth: 14,
    itemStyle: { color: m.color },
    data: STAFF_NAMES.map(() => MOCK),
  }));
}

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);

  const meta = activeTab.value === 'object' ? OBJECT_SERIES : TYPE_SERIES;
  const gridBottom = activeTab.value === 'type' ? '22%' : '18%';

  chartInstance.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        bottom: 0,
        type: activeTab.value === 'type' ? 'scroll' : 'plain',
        data: meta.map((m) => m.name),
        textStyle: { fontSize: 11 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: gridBottom,
        top: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: STAFF_NAMES,
        axisLabel: { interval: 0, fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 300,
        splitNumber: 6,
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      series: buildBarSeries(meta),
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

function handleTabChange() {
  nextTick(() => renderChart());
}

function handleSearch() {
  objectTableData.value = buildObjectRows();
  typeTableData.value = buildTypeRows();
  nextTick(() => renderChart());
}

function handleReset() {
  filters.value = {
    followTime: 'write',
    statMode: 'month',
    monthRange: defaultMonthRange(),
    deptId: undefined,
    userId: undefined,
  };
  objectTableData.value = buildObjectRows();
  typeTableData.value = buildTypeRows();
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
  a.download = `跟进记录汇总_${dayjs().format('YYYY-MM-DD')}.csv`;
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
.follow-up-record-page {
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

.filter-select-follow {
  width: 140px;
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
  height: 440px;
}

.summary-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  &--actions-only {
    justify-content: flex-end;
  }
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

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.table-card {
  :deep(.t-table) {
    th {
      background: var(--td-bg-color-secondarycontainer);
    }
  }
}
</style>
