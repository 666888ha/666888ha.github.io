<template>
  <div class="attribute-analysis-page">
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

    <!-- 客户来源 -->
    <t-card :bordered="false" class="section-card">
      <div class="section-head">
        <span class="section-title">客户来源</span>
      </div>
      <t-row :gutter="[16, 16]" class="section-body">
        <t-col :xs="12" :lg="6">
          <div ref="chartSourceRef" class="chart-box" />
        </t-col>
        <t-col :xs="12" :lg="6">
          <t-table
            :data="sourceTableData"
            :columns="tableColumns"
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

    <!-- 所在城市 -->
    <t-card :bordered="false" class="section-card">
      <div class="section-head">
        <span class="section-title">所在城市</span>
      </div>
      <t-row :gutter="[16, 16]" class="section-body">
        <t-col :xs="12" :lg="6">
          <div ref="chartCityRef" class="chart-box" />
        </t-col>
        <t-col :xs="12" :lg="6">
          <t-table
            :data="cityTableData"
            :columns="tableColumns"
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

defineOptions({
  name: 'CustomerAttributeAnalysis',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, PieChart, BarChart, CanvasRenderer]);

const PIE_COLORS_5 = ['#5b8ff9', '#61d9a8', '#65789b', '#f6bd16', '#7262fd'];
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

const MOCK = {
  newCustomers: 1000,
  newRatio: 10,
  followCount: 1000,
  dealCount: 1000,
};

function mockRows(names: string[], prefix: string) {
  return names.map((name, i) => ({
    rowKey: `${prefix}-${i}`,
    name,
    ...MOCK,
  }));
}

const VALUE_LEVEL_PIE = [
  { name: '一星客户', value: 26.98 },
  { name: '二星客户', value: 26.83 },
  { name: '三星客户', value: 21.26 },
  { name: '四星客户', value: 13.93 },
  { name: '五星客户', value: 11.0 },
];

const SOURCE_PIE = [
  { name: '电话营销', value: 16.09 },
  { name: '主动来电', value: 15.3 },
  { name: '客户介绍', value: 14.15 },
  { name: '朋友介绍', value: 13.05 },
  { name: '独立开发', value: 11.17 },
  { name: '网络搜索', value: 11.11 },
  { name: '广告杂志', value: 8.8 },
  { name: '展会促销', value: 5.77 },
  { name: '其它途径', value: 4.55 },
];

const CITIES = ['北京', '广州', '上海', '深圳', '天津', '武汉', '重庆'];
const CITY_BAR = [2680, 2510, 2340, 2180, 1990, 1820, 1650];

const INDUSTRIES = [
  '家用电器',
  '交通运输',
  '商务服务',
  '家居用品',
  '电工电气',
  '数码产品',
  '通信产品',
];
const INDUSTRY_BAR = [2550, 2380, 2220, 2050, 1890, 1720, 1560];

const tableColumns: PrimaryTableCol[] = [
  { colKey: 'name', title: '名称', minWidth: 120, ellipsis: true },
  { colKey: 'newCustomers', title: '新增客户', align: 'right', width: 100 },
  { colKey: 'newRatio', title: '新增占比', align: 'right', width: 96, cell: 'ratio' },
  { colKey: 'followCount', title: '跟进次数', align: 'right', width: 100 },
  { colKey: 'dealCount', title: '成交次数', align: 'right', width: 100 },
];

const valueTableData = computed(() => mockRows(VALUE_LEVEL_PIE.map((p) => p.name), 'v'));
const sourceTableData = computed(() => mockRows(SOURCE_PIE.map((p) => p.name), 's'));
const cityTableData = computed(() => mockRows(CITIES, 'c'));
const industryTableData = computed(() => mockRows(INDUSTRIES, 'i'));

const chartValueRef = ref<HTMLElement | null>(null);
const chartSourceRef = ref<HTMLElement | null>(null);
const chartCityRef = ref<HTMLElement | null>(null);
const chartIndustryRef = ref<HTMLElement | null>(null);

let chartValue: echarts.ECharts | null = null;
let chartSource: echarts.ECharts | null = null;
let chartCity: echarts.ECharts | null = null;
let chartIndustry: echarts.ECharts | null = null;

const { width: winWidth } = useWindowSize();

function pieOption(data: { name: string; value: number }[], colors: string[]): EChartsCoreOption {
  return {
    color: colors,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {d}%',
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
        data: data.map((d) => ({ name: d.name, value: d.value })),
      },
    ],
  };
}

function barOption(categories: string[], values: number[]): EChartsCoreOption {
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
      max: 3000,
      interval: 500,
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

  chartValue?.setOption(pieOption(VALUE_LEVEL_PIE, PIE_COLORS_5), true);
  chartSource?.setOption(pieOption(SOURCE_PIE, PIE_COLORS_9), true);
  chartCity?.setOption(barOption(CITIES, CITY_BAR), true);
  chartIndustry?.setOption(barOption(INDUSTRIES, INDUSTRY_BAR), true);
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

watch(winWidth, () => resizeCharts());

onMounted(() => {
  nextTick(() => {
    renderCharts();
  });
});

onUnmounted(() => {
  disposeCharts();
});
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

.section-card {
  background: #fff;
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
