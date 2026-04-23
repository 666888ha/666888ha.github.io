<template>
  <div class="attribute-analysis-page">
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

    <!-- 客户价值等级 -->
    <t-card :bordered="false" class="section-card">
      <div class="section-head">
        <span class="section-title">客户价值等级</span>
      </div>
      <t-row :gutter="[16, 16]" class="section-body">
        <t-col :xs="12" :lg="6">
          <div ref="chartValueRef" class="chart-box" />
        </t-col>
        <t-col :xs="12" :lg="6">
          <t-table
            :data="valueTableData"
            :columns="tableColumns"
            :loading="loadingData"
            row-key="rowKey"
            size="medium"
            bordered
            stripe
          >
            <template #ratio="{ row }">
              {{ row.newRatio }}%
            </template>
          </t-table>
        </t-col>
      </t-row>
    </t-card>

    <!-- 客户渠道 -->
    <t-card :bordered="false" class="section-card">
      <div class="section-head">
        <span class="section-title">客户渠道</span>
      </div>
      <t-row :gutter="[16, 16]" class="section-body">
        <t-col :xs="12" :lg="6">
          <div ref="chartSourceRef" class="chart-box" />
        </t-col>
        <t-col :xs="12" :lg="6">
          <t-table
            :data="channelTableData"
            :columns="tableColumns"
            :loading="loadingData"
            row-key="rowKey"
            size="medium"
            bordered
            stripe
          >
            <template #ratio="{ row }">
              {{ row.newRatio }}%
            </template>
          </t-table>
        </t-col>
      </t-row>
    </t-card>

    <!-- 所在地区 -->
    <t-card :bordered="false" class="section-card">
      <div class="section-head">
        <span class="section-title">所在地区</span>
      </div>
      <t-row :gutter="[16, 16]" class="section-body">
        <t-col :xs="12" :lg="6">
          <div ref="chartCityRef" class="chart-box" />
        </t-col>
        <t-col :xs="12" :lg="6">
          <t-table
            :data="cityTableData"
            :columns="tableColumns"
            :loading="loadingData"
            row-key="rowKey"
            size="medium"
            bordered
            stripe
          >
            <template #ratio="{ row }">
              {{ row.newRatio }}%
            </template>
          </t-table>
        </t-col>
      </t-row>
    </t-card>

    <!-- 所属行业 -->
    <t-card :bordered="false" class="section-card">
      <div class="section-head">
        <span class="section-title">所属行业</span>
      </div>
      <t-row :gutter="[16, 16]" class="section-body">
        <t-col :xs="12" :lg="6">
          <div ref="chartIndustryRef" class="chart-box" />
        </t-col>
        <t-col :xs="12" :lg="6">
          <t-table
            :data="industryTableData"
            :columns="tableColumns"
            :loading="loadingData"
            row-key="rowKey"
            size="medium"
            bordered
            stripe
          >
            <template #ratio="{ row }">
              {{ row.newRatio }}%
            </template>
          </t-table>
        </t-col>
      </t-row>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import { BarChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import type { EChartsCoreOption } from 'echarts/core';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import dayjs from 'dayjs';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getCustomerAttributeAnalysis } from '@/api/statistics';
import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

import { effectiveMonthRange, monthRangeParams, statisticsScope } from '../../statisticsRequest';

defineOptions({
  name: 'CustomerAttributeAnalysis',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, PieChart, BarChart, CanvasRenderer]);

const PIE_COLORS_9 = [
  '#5b8ff9',
  '#61d9a8',
  '#65789b',
  '#f6bd16',
  '#7262fd',
  '#78d3f8',
  '#9661bc',
  '#f6903d',
  '#008685',
];

const BAR_COLOR = '#5eadf3';

const statModeOptions = [{ label: '按月统计', value: 'month' }];

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

interface TableRow {
  rowKey: string;
  name: string;
  newCustomers: number;
  newRatio: number;
  followCount: number;
  dealCount: number;
}

function normalizeRows(list: unknown): TableRow[] {
  if (!Array.isArray(list)) return [];
  return list.map((r: any, i: number) => ({
    rowKey: String(r.row_key ?? `k-${i}`),
    name: r.name ?? '',
    newCustomers: Number(r.new_customers) || 0,
    newRatio: Number(r.new_ratio) || 0,
    followCount: Number(r.follow_count) || 0,
    dealCount: Number(r.deal_count) || 0,
  }));
}

const valueTableData = ref<TableRow[]>([]);
const channelTableData = ref<TableRow[]>([]);
const cityTableData = ref<TableRow[]>([]);
const industryTableData = ref<TableRow[]>([]);

const tableColumns: PrimaryTableCol[] = [
  { colKey: 'name', title: '名称', minWidth: 120, ellipsis: true },
  { colKey: 'newCustomers', title: '新增客户', align: 'right', width: 100 },
  { colKey: 'newRatio', title: '新增占比', align: 'right', width: 96, cell: 'ratio' },
  { colKey: 'followCount', title: '跟进次数', align: 'right', width: 100 },
  { colKey: 'dealCount', title: '成交次数', align: 'right', width: 100 },
];

const chartValueRef = ref<HTMLElement | null>(null);
const chartSourceRef = ref<HTMLElement | null>(null);
const chartCityRef = ref<HTMLElement | null>(null);
const chartIndustryRef = ref<HTMLElement | null>(null);

let chartValue: echarts.ECharts | null = null;
let chartSource: echarts.ECharts | null = null;
let chartCity: echarts.ECharts | null = null;
let chartIndustry: echarts.ECharts | null = null;

const { width: winWidth } = useWindowSize();

function colorsForSlice(n: number): string[] {
  const base = PIE_COLORS_9;
  if (n <= 0) return [...base];
  if (n <= base.length) return base.slice(0, n);
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(base[i % base.length]);
  return out;
}

function pieOption(rows: TableRow[], colors: string[]): EChartsCoreOption {
  const data = rows.map((r) => ({ name: r.name, value: r.newCustomers }));
  return {
    color: colors,
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => {
        const v = p.value ?? 0;
        const pct = p.percent != null ? Number(p.percent).toFixed(2) : '';
        return `${p.name}<br/>新增客户: ${v}${pct !== '' ? `<br/>占比: ${pct}%` : ''}`;
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['0%', '68%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          formatter: '{b}: {d}%',
          fontSize: 11,
        },
        labelLine: {
          length: 12,
          length2: 8,
        },
        data,
      },
    ],
  };
}

function barOption(categories: string[], values: number[]): EChartsCoreOption {
  const maxVal = Math.max(1, ...values);
  const niceMax = Math.ceil(maxVal * 1.15);
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisTick: { alignWithLabel: true },
      axisLabel: { rotate: 20, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: niceMax,
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e6eb' } },
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 36,
        itemStyle: {
          color: BAR_COLOR,
          borderRadius: [4, 4, 0, 0],
        },
        data: values,
      },
    ],
  };
}

function renderCharts() {
  if (chartValueRef.value && !chartValue) chartValue = echarts.init(chartValueRef.value);
  if (chartSourceRef.value && !chartSource) chartSource = echarts.init(chartSourceRef.value);
  if (chartCityRef.value && !chartCity) chartCity = echarts.init(chartCityRef.value);
  if (chartIndustryRef.value && !chartIndustry) chartIndustry = echarts.init(chartIndustryRef.value);

  const v = valueTableData.value;
  const ch = channelTableData.value;
  const ci = cityTableData.value;
  const ind = industryTableData.value;

  chartValue?.setOption(pieOption(v, colorsForSlice(Math.max(v.length, 1))), true);
  chartSource?.setOption(pieOption(ch, colorsForSlice(Math.max(ch.length, 1))), true);
  chartCity?.setOption(
    barOption(
      ci.map((r) => r.name),
      ci.map((r) => r.newCustomers),
    ),
    true,
  );
  chartIndustry?.setOption(
    barOption(
      ind.map((r) => r.name),
      ind.map((r) => r.newCustomers),
    ),
    true,
  );
}

function disposeCharts() {
  chartValue?.dispose();
  chartSource?.dispose();
  chartCity?.dispose();
  chartIndustry?.dispose();
  chartValue = null;
  chartSource = null;
  chartCity = null;
  chartIndustry = null;
}

function resizeCharts() {
  chartValue?.resize();
  chartSource?.resize();
  chartCity?.resize();
  chartIndustry?.resize();
}

async function fetchData() {
  loadingData.value = true;
  try {
    const range = effectiveMonthRange(filters.value.monthRange, defaultMonthRange);
    const res = await getCustomerAttributeAnalysis({
      ...statisticsScope(filters.value.deptId, filters.value.userId),
      ...monthRangeParams(range),
    });
    if (res.code !== 0 && res.code !== 200) {
      MessagePlugin.error((res as any).msg || '加载失败');
      return;
    }
    const d = (res as any).data || {};
    valueTableData.value = normalizeRows(d.value_level);
    channelTableData.value = normalizeRows(d.channel);
    cityTableData.value = normalizeRows(d.city);
    industryTableData.value = normalizeRows(d.industry);
    await nextTick();
    renderCharts();
  } catch (e: any) {
    MessagePlugin.error(e?.message || '网络错误');
  } finally {
    loadingData.value = false;
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

watch(winWidth, () => resizeCharts());

onMounted(() => {
  void Promise.all([loadDeptOptions(), loadUserOptions()]).then(() => {
    void fetchData();
  });
});

onUnmounted(() => {
  disposeCharts();
});

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
</script>

<style scoped lang="less">
.attribute-analysis-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--td-bg-color-page);
  min-height: 100%;
}

.filter-card,
.section-card {
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

.section-head {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--td-component-stroke);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.chart-box {
  width: 100%;
  height: 320px;
}

.section-body {
  align-items: stretch;
}

.section-card {
  :deep(.t-table) {
    th {
      background: var(--td-bg-color-secondarycontainer);
    }
  }
}
</style>
