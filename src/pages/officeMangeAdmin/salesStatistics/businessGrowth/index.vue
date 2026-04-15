<template>
  <div class="business-growth-page">
    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
        <t-select v-model="filters.metric" class="filter-select-metric" :options="metricOptions" />
        <t-select v-model="filters.growthType" class="filter-select-growth" :options="growthTypeOptions" />
        <t-select
          v-model="filters.deptId"
          class="filter-select"
          placeholder="选择部门"
          clearable
          :options="deptOptions"
          :loading="loadingDept"
        />
        <t-select
          v-model="filters.years"
          class="filter-select-years"
          multiple
          clearable
          :min-collapsed-num="1"
          placeholder="选择年份"
          :options="yearOptions"
        />
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

    <div class="formula-notes">
      <p>
        <strong>同比增长率</strong>：（当前周期 − 去年同期）÷ 去年同期 × 100%。例如 (150 − 100) ÷ 100 × 100% = 50%。
      </p>
      <p>
        <strong>环比增长率</strong>：（当前周期 − 上一个周期）÷ 上一个周期 × 100%。例如 (120 − 100) ÷ 100 × 100% =
        20%。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import dayjs from 'dayjs';
import { BarChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getSystemDeptOptions } from '@/api/system/dept';

defineOptions({
  name: 'BusinessGrowthStatistics',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, BarChart, CanvasRenderer]);

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

/** 与示意图一致：4 月约 14.5 / 8.5 */
const PRESET_YEAR_DATA: Record<number, number[]> = {
  2018: [6, 7, 9, 14.5, 12, 10, 8, 15, 18, 16, 12, 10],
  2019: [4, 5, 7, 8.5, 10, 11, 9, 12, 14, 13, 10, 8],
};

const SERIES_COLORS = ['#5eadf5', '#2ec7a6', '#f5d547', '#8b7fd8', '#ec746e'];

const metricOptions = [
  { label: '新增客户', value: 'customer' },
  { label: '新增商机', value: 'opportunity' },
  { label: '新增合同', value: 'contract' },
];

const growthTypeOptions = [
  { label: '同比增长率', value: 'yoy' },
  { label: '环比增长率', value: 'mom' },
];

const currentYear = dayjs().year();
const yearOptions = Array.from({ length: currentYear - 2009 + 2 }, (_, i) => {
  const y = 2010 + i;
  return { label: `${y}年`, value: y };
});

const DEFAULT_YEARS = [2018, 2019];

const filters = ref({
  metric: 'customer',
  growthType: 'yoy' as 'yoy' | 'mom',
  deptId: undefined as string | number | undefined,
  years: [...DEFAULT_YEARS] as number[],
});

const deptOptions = ref<{ label: string; value: string | number }[]>([]);
const loadingDept = ref(false);

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const { width: winWidth } = useWindowSize();

function resolvedYears(): number[] {
  const ys = filters.value.years?.length ? [...filters.value.years] : [...DEFAULT_YEARS];
  return ys.sort((a, b) => a - b);
}

function monthValue(year: number, monthIndex: number): number {
  const preset = PRESET_YEAR_DATA[year];
  if (preset) return preset[monthIndex];
  const base = 5 + (year % 7) + (monthIndex % 5) * 0.8;
  const wave = Math.sin((monthIndex + 1) * 0.5 + year * 0.1) * 6;
  return Math.round((base + wave) * 10) / 10;
}

function growthSuffix(): string {
  return filters.value.growthType === 'yoy' ? '同比增长率' : '环比增长率';
}

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);

  const years = resolvedYears();
  const suffix = growthSuffix();

  const series = years.map((y, idx) => ({
    name: `${y}年${suffix}%`,
    type: 'bar' as const,
    barMaxWidth: 22,
    itemStyle: { color: SERIES_COLORS[idx % SERIES_COLORS.length] },
    data: MONTH_LABELS.map((_, mi) => monthValue(y, mi)),
  }));

  chartInstance.setOption(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v: number | string) => (typeof v === 'number' ? String(v) : v),
      },
      legend: {
        bottom: 8,
        data: series.map((s) => s.name),
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: years.length > 2 ? '18%' : '14%',
        top: '6%',
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
        max: 30,
        interval: 5,
        splitLine: {
          lineStyle: { type: 'dashed', color: '#e5e6eb' },
        },
        axisLabel: { fontSize: 12 },
      },
      series,
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

function handleSearch() {
  nextTick(() => renderChart());
}

function handleReset() {
  filters.value = {
    metric: 'customer',
    growthType: 'yoy',
    deptId: undefined,
    years: [...DEFAULT_YEARS],
  };
  nextTick(() => renderChart());
}

watch(
  () => [filters.value.growthType, filters.value.years],
  () => nextTick(() => renderChart()),
  { deep: true },
);

watch(winWidth, () => {
  chartInstance?.resize();
});

onMounted(() => {
  nextTick(() => renderChart());
  void loadDeptOptions().then(() => nextTick(() => chartInstance?.resize()));
});

onUnmounted(() => {
  disposeChart();
});
</script>

<style scoped lang="less">
.business-growth-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--td-bg-color-page);
  min-height: 100%;
}

.filter-card,
.chart-card {
  background: #fff;
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

.filter-select-growth {
  width: 150px;
}

.filter-select {
  width: 200px;
}

.filter-select-years {
  min-width: 260px;
  max-width: 420px;
  flex: 1;
}

.chart-el {
  width: 100%;
  height: 480px;
}

.formula-notes {
  padding: 12px 16px 20px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--td-text-color-secondary);

  p {
    margin: 0 0 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    color: var(--td-text-color-primary);
    font-weight: 600;
  }
}
</style>
