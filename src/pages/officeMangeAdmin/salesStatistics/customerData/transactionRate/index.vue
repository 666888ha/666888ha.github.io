<template>
  <div class="transaction-rate-page">
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
  </div>
</template>
<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import dayjs from 'dayjs';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import type { EChartsCoreOption } from 'echarts/core';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getCustomerTransactionRate } from '@/api/statistics';
import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

import { statisticsScope } from '../../statisticsRequest';

defineOptions({
  name: 'CustomerTransactionRateAnalysis',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, LineChart, CanvasRenderer]);

const COLOR_FIRST = '#5eadf5';
const COLOR_RENEW = '#52c41a';
const COLOR_CHURN = '#f5c542';

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);

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
const loadingData = ref(false);

const seriesFirst = ref<number[]>(Array(12).fill(0));
const seriesRenew = ref<number[]>(Array(12).fill(0));
const seriesChurn = ref<number[]>(Array(12).fill(0));

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const { width: winWidth } = useWindowSize();

function chartOption(): EChartsCoreOption {
  return {
    color: [COLOR_FIRST, COLOR_RENEW, COLOR_CHURN],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', crossStyle: { color: '#999' } },
      formatter: (params: unknown) => {
        const list = params as { axisValue: string; seriesName: string; value: number }[];
        if (!list?.length) return '';
        const lines = [`${list[0].axisValue}`];
        for (const p of list) {
          lines.push(`${p.seriesName}: ${p.value}%`);
        }
        return lines.join('<br/>');
      },
    },
    legend: {
      data: ['首次成交率%', '续约率%', '流失率%'],
      bottom: 12,
      left: 'center',
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '8%',
      bottom: '18%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: MONTH_LABELS,
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e6eb' } },
      axisLabel: { fontSize: 11, formatter: '{value}%' },
    },
    series: [
      {
        name: '首次成交率%',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 1.5 },
        itemStyle: { color: COLOR_FIRST },
        data: [...seriesFirst.value],
      },
      {
        name: '续约率%',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 1.5 },
        itemStyle: { color: COLOR_RENEW },
        data: [...seriesRenew.value],
      },
      {
        name: '流失率%',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 1.5 },
        itemStyle: { color: COLOR_CHURN },
        data: [...seriesChurn.value],
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
    const res = await getCustomerTransactionRate({
      ...statisticsScope(filters.value.deptId, filters.value.userId),
      year: filters.value.year,
    });
    if (res.code !== 0 && res.code !== 200) {
      MessagePlugin.error((res as any).msg || '加载失败');
      return;
    }
    const list = (res as any).data?.list || [];
    const f = Array(12).fill(0);
    const ren = Array(12).fill(0);
    const ch = Array(12).fill(0);
    for (const row of list) {
      const m = Number(row.month);
      if (m >= 1 && m <= 12) {
        f[m - 1] = Number(row.first_rate) || 0;
        ren[m - 1] = Number(row.renew_rate) || 0;
        ch[m - 1] = Number(row.churn_rate) || 0;
      }
    }
    seriesFirst.value = f;
    seriesRenew.value = ren;
    seriesChurn.value = ch;
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
    year: currentYear,
    deptId: undefined,
    userId: undefined,
  };
  handleSearch();
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
.transaction-rate-page {
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

.chart-el {
  width: 100%;
  height: 420px;
}
</style>
