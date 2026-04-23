<template>
  <div class="regional-distribution-page">
    <t-card :bordered="false" class="tabs-card">
      <t-tabs v-model="activeTab" class="dist-tabs" @change="handleTabChange">
        <t-tab-panel value="province" label="按省份分布" />
        <t-tab-panel value="detail" label="按地区明细" />
      </t-tabs>
    </t-card>

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

    <t-card :bordered="false" class="main-card">
      <t-alert
        v-if="mapLoadError && activeTab === 'province'"
        theme="warning"
        class="map-alert"
        message="中国地图数据加载失败，请刷新页面后重试"
      />
      <t-row :gutter="[16, 16]" class="main-row">
        <t-col :xs="12" :xl="14">
          <div v-show="activeTab === 'province'" class="viz-wrap">
            <div v-if="!mapLoadError" ref="mapProvinceRef" class="map-box" />
            <div v-else class="map-fallback">地图暂不可用</div>
          </div>
          <div v-show="activeTab === 'detail'" ref="chartDetailRef" class="chart-country-box" />
        </t-col>
        <t-col :xs="12" :xl="10">
          <t-table
            :data="tableData"
            :columns="tableColumns"
            :loading="loadingData"
            row-key="rowKey"
            size="medium"
            bordered
            stripe
            :max-height="520"
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
import { BarChart, MapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import type { EChartsCoreOption } from 'echarts/core';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import dayjs from 'dayjs';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getCustomerRegionalDistribution } from '@/api/statistics';
import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';
import chinaGeoJson from '@/assets/geo/china-100000-full.json';

import { effectiveMonthRange, monthRangeParams, statisticsScope } from '../../statisticsRequest';

defineOptions({
  name: 'CustomerRegionalDistribution',
});

echarts.use([TooltipComponent, VisualMapComponent, GridComponent, MapChart, BarChart, CanvasRenderer]);

type DistTab = 'province' | 'detail';

const statModeOptions = [{ label: '按月统计', value: 'month' }];

function defaultMonthRange(): string[] {
  const y = dayjs().year();
  return [`${y}-01`, `${y}-12`];
}

const activeTab = ref<DistTab>('province');

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

interface Row {
  rowKey: string;
  rank: number;
  name: string;
  newCustomers: number;
  newRatio: number;
  followCount: number;
  dealCount: number;
}

function normalizeApiRows(list: unknown): Row[] {
  if (!Array.isArray(list)) return [];
  return list.map((r: any, i: number) => ({
    rowKey: String(r.row_key ?? `r-${i}`),
    rank: i + 1,
    name: r.name ?? '',
    newCustomers: Number(r.new_customers) || 0,
    newRatio: Number(r.new_ratio) || 0,
    followCount: Number(r.follow_count) || 0,
    dealCount: Number(r.deal_count) || 0,
  }));
}

const rawRows = ref<Row[]>([]);

function provinceFromRegionName(s: string): string {
  const t = (s || '').trim();
  if (!t) return '（未填写）';
  const i = t.indexOf('/');
  if (i < 0) return t;
  const head = t.slice(0, i).trim();
  return head || t;
}

const provinceRows = computed((): Row[] => {
  const m = new Map<string, { newCustomers: number; followCount: number; dealCount: number }>();
  for (const r of rawRows.value) {
    const p = provinceFromRegionName(r.name);
    const c = m.get(p) || { newCustomers: 0, followCount: 0, dealCount: 0 };
    c.newCustomers += r.newCustomers;
    c.followCount += r.followCount;
    c.dealCount += r.dealCount;
    m.set(p, c);
  }
  const total = rawRows.value.reduce((s, r) => s + r.newCustomers, 0);
  const list: Row[] = [...m.entries()].map(([name, v], i) => ({
    rowKey: `p-${i}-${name}`,
    rank: 0,
    name,
    newCustomers: v.newCustomers,
    newRatio: total > 0 ? Math.round((v.newCustomers / total) * 10000) / 100 : 0,
    followCount: v.followCount,
    dealCount: v.dealCount,
  }));
  list.sort((a, b) => b.newCustomers - a.newCustomers);
  list.forEach((r, i) => {
    r.rank = i + 1;
  });
  return list;
});

const detailRows = computed((): Row[] =>
  rawRows.value.map((r, i) => ({
    ...r,
    rank: i + 1,
  })),
);

const tableData = computed(() => (activeTab.value === 'province' ? provinceRows.value : detailRows.value));

const tableColumns = computed<PrimaryTableCol[]>(() => {
  const metrics: PrimaryTableCol[] = [
    { colKey: 'newCustomers', title: '新增客户', align: 'right', width: 100 },
    { colKey: 'newRatio', title: '新增占比', align: 'right', width: 96, cell: 'ratio' },
    { colKey: 'followCount', title: '跟进次数', align: 'right', width: 100 },
    { colKey: 'dealCount', title: '成交次数', align: 'right', width: 100 },
  ];
  const nameTitle = activeTab.value === 'province' ? '省份/一级地区' : '地区（完整）';
  return [
    { colKey: 'rank', title: '排名', width: 72, align: 'center' },
    { colKey: 'name', title: nameTitle, minWidth: 140, ellipsis: true },
    ...metrics,
  ];
});

const mapLoadError = ref(false);
const mapChinaRegistered = ref(false);

const mapProvinceRef = ref<HTMLElement | null>(null);
const chartDetailRef = ref<HTMLElement | null>(null);

let chartProvince: echarts.ECharts | null = null;
let chartDetail: echarts.ECharts | null = null;

const { width: winWidth } = useWindowSize();

function provinceMapOption(): EChartsCoreOption {
  const mapData = provinceRows.value.map((r) => ({ name: r.name, value: r.newCustomers }));
  const maxVal = Math.max(1, ...mapData.map((d) => d.value));

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as { name: string; value?: number };
        const v = p.value;
        if (v === undefined || Number.isNaN(Number(v))) {
          return `${p.name}<br/>新增客户: —`;
        }
        return `${p.name}<br/>新增客户: ${Number(v).toLocaleString('zh-CN')}`;
      },
    },
    visualMap: {
      type: 'continuous',
      min: 0,
      max: maxVal,
      left: 24,
      bottom: 32,
      orient: 'vertical',
      text: ['高', '低'],
      calculable: false,
      inRange: {
        color: ['#eff6ff', '#bfdbfe', '#3b82f6', '#1e40af'],
      },
      textStyle: { fontSize: 12 },
    },
    series: [
      {
        name: '新增客户',
        type: 'map',
        map: 'china',
        roam: false,
        emphasis: {
          label: { show: true },
          itemStyle: { areaColor: '#2563eb' },
        },
        label: { show: false },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 0.6,
        },
        data: mapData,
      },
    ],
  };
}

function detailBarOption(): EChartsCoreOption {
  const rows = detailRows.value.slice(0, 20);
  const categories = rows.map((r) => r.name);
  const values = rows.map((r) => r.newCustomers);
  const maxVal = Math.max(1, ...values);
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: Math.ceil(maxVal * 1.1),
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e6eb' } },
    },
    yAxis: {
      type: 'category',
      data: [...categories].reverse(),
      axisTick: { show: false },
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: [...values].reverse(),
        barMaxWidth: 22,
        itemStyle: {
          color: '#5eadf3',
          borderRadius: [0, 4, 4, 0],
        },
      },
    ],
  };
}

function renderProvinceMap() {
  if (!mapProvinceRef.value || !mapChinaRegistered.value) return;
  if (!chartProvince) chartProvince = echarts.init(mapProvinceRef.value);
  chartProvince.setOption(provinceMapOption(), true);
}

function renderDetailChart() {
  if (!chartDetailRef.value) return;
  if (!chartDetail) chartDetail = echarts.init(chartDetailRef.value);
  chartDetail.setOption(detailBarOption(), true);
}

function loadChinaMap() {
  mapLoadError.value = false;
  try {
    echarts.registerMap('china', chinaGeoJson as never);
    mapChinaRegistered.value = true;
    nextTick(() => renderProvinceMap());
  } catch (e) {
    console.error(e);
    mapLoadError.value = true;
    mapChinaRegistered.value = false;
  }
}

function disposeProvinceChart() {
  chartProvince?.dispose();
  chartProvince = null;
}

function disposeDetailChart() {
  chartDetail?.dispose();
  chartDetail = null;
}

function handleTabChange() {
  nextTick(() => {
    if (activeTab.value === 'province') {
      renderProvinceMap();
      chartProvince?.resize();
    } else {
      renderDetailChart();
      chartDetail?.resize();
    }
  });
}

async function fetchData() {
  loadingData.value = true;
  try {
    const range = effectiveMonthRange(filters.value.monthRange, defaultMonthRange);
    const res = await getCustomerRegionalDistribution({
      ...statisticsScope(filters.value.deptId, filters.value.userId),
      ...monthRangeParams(range),
    });
    if (res.code !== 0 && res.code !== 200) {
      MessagePlugin.error((res as any).msg || '加载失败');
      return;
    }
    const d = (res as any).data || {};
    const list = d.list || d.chart || [];
    rawRows.value = normalizeApiRows(list);
    await nextTick();
    if (activeTab.value === 'province') renderProvinceMap();
    else renderDetailChart();
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

watch(provinceRows, () => {
  if (activeTab.value === 'province') nextTick(() => renderProvinceMap());
});

watch(detailRows, () => {
  if (activeTab.value === 'detail') nextTick(() => renderDetailChart());
});

watch(winWidth, () => {
  chartProvince?.resize();
  chartDetail?.resize();
});

onMounted(() => {
  loadChinaMap();
  void Promise.all([loadDeptOptions(), loadUserOptions()]).then(() => {
    void fetchData();
  });
});

onUnmounted(() => {
  disposeProvinceChart();
  disposeDetailChart();
});
</script>

<style scoped lang="less">
.regional-distribution-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--td-bg-color-page);
  min-height: 100%;
}

.tabs-card,
.filter-card,
.main-card {
  background: #fff;
}

.dist-tabs {
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

.main-row {
  align-items: stretch;
}

.map-alert {
  margin-bottom: 12px;
}

.viz-wrap {
  width: 100%;
}

.map-box,
.chart-country-box {
  width: 100%;
  min-height: 480px;
  height: 520px;
}

.map-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 480px;
  height: 520px;
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-secondarycontainer);
  border-radius: var(--td-radius-default);
}

.main-card {
  :deep(.t-table) {
    th {
      background: var(--td-bg-color-secondarycontainer);
    }
  }
}
</style>
