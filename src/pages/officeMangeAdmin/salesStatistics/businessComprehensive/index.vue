<template>
  <div class="business-comprehensive-page">
    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
        <t-select v-model="filters.metric" class="filter-select-metric" :options="metricOptions" />
        <t-select v-model="filters.statMode" class="filter-select-sm" :options="statModeOptions" />
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
      <div ref="chartRef" class="chart-el" />
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import dayjs from 'dayjs';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getBusinessComprehensive } from '@/api/statistics';
import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

import { monthRangeParams, statisticsScope } from '../statisticsRequest';

defineOptions({
  name: 'BusinessComprehensiveStatistics',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, BarChart, CanvasRenderer]);

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const BAR_COLOR = '#5eadf5';

const metricOptions = [{ label: '跟进次数', value: 'follow' }];

const statModeOptions = [{ label: '按月统计', value: 'month' }];

const filters = ref({
  metric: 'follow',
  statMode: 'month',
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

const barData = ref<number[]>(Array(12).fill(0));

async function fetchComprehensive() {
  try {
    const y = dayjs().year();
    const res = await getBusinessComprehensive({
      ...statisticsScope(filters.value.deptId, filters.value.userId),
      ...monthRangeParams([`${y}-01`, `${y}-12`]),
    });
    if (res.code !== 0 && res.code !== 200) {
      MessagePlugin.error(res.msg || '加载失败');
      return;
    }
    const list = (res.data?.list || []) as { value?: number }[];
    const vals = list.map((r) => Number(r.value) || 0);
    while (vals.length < 12) vals.push(0);
    barData.value = vals.slice(0, 12);
    await nextTick();
    renderChart();
  } catch (e: any) {
    MessagePlugin.error(e?.message || '网络错误');
  }
}

function currentMetricLabel() {
  return metricOptions.find((o) => o.value === filters.value.metric)?.label ?? '跟进次数';
}

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);

  const name = currentMetricLabel();

  chartInstance.setOption(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        bottom: 8,
        data: [name],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '14%',
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
        scale: true,
        splitLine: {
          lineStyle: { type: 'dashed', color: '#e5e6eb' },
        },
        axisLabel: { fontSize: 12 },
      },
      series: [
        {
          name,
          type: 'bar',
          barMaxWidth: 36,
          itemStyle: {
            color: BAR_COLOR,
            borderRadius: [4, 4, 0, 0],
          },
          data: barData.value,
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
  void fetchComprehensive();
}

function handleReset() {
  filters.value = {
    metric: 'follow',
    statMode: 'month',
    deptId: undefined,
    userId: undefined,
  };
  void fetchComprehensive();
}

watch(
  () => filters.value.metric,
  () => {
    nextTick(() => renderChart());
  },
);

watch(winWidth, () => {
  chartInstance?.resize();
});

onMounted(() => {
  void Promise.all([loadDeptOptions(), loadUserOptions()]).then(() => {
    void fetchComprehensive().then(() => nextTick(() => chartInstance?.resize()));
  });
});

onUnmounted(() => {
  disposeChart();
});
</script>

<style scoped lang="less">
.business-comprehensive-page {
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

.filter-select-sm {
  width: 140px;
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
  height: 480px;
}
</style>
