<template>
  <div class="regional-distribution-page">
    <t-card :bordered="false" class="tabs-card">
      <t-tabs v-model="activeTab" class="dist-tabs" @change="handleTabChange">
        <t-tab-panel value="province" label="按省份分布" />
        <t-tab-panel value="country" label="按国家分布" />
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

    <t-card :bordered="false" class="main-card">
      <t-alert
        v-if="mapLoadError && activeTab === 'province'"
        theme="warning"
        class="map-alert"
        message="中国地图数据加载失败，请检查网络后重试"
      />
      <t-row :gutter="[16, 16]" class="main-row">
        <t-col :xs="12" :xl="14">
          <div v-show="activeTab === 'province'" class="viz-wrap">
            <div v-if="!mapLoadError" ref="mapProvinceRef" class="map-box" />
            <div v-else class="map-fallback">地图暂不可用</div>
          </div>
          <div v-show="activeTab === 'country'" ref="chartCountryRef" class="chart-country-box" />
        </t-col>
        <t-col :xs="12" :xl="10">
          <t-table
            :data="tableData"
            :columns="tableColumns"
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
import dayjs from 'dayjs';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

defineOptions({
  name: 'CustomerRegionalDistribution',
});

echarts.use([TooltipComponent, VisualMapComponent, GridComponent, MapChart, BarChart, CanvasRenderer]);

const CHINA_GEO_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';

type DistTab = 'province' | 'country';

const statModeOptions = [{ label: '按月统计', value: 'month' }];

const MOCK = {
  newCustomers: 1000,
  newRatio: 10,
};

/**
 * 省份维度：表格「新增客户」与地图填色共用同一数值。
 * 新增越多颜色越深（visualMap：低值浅色 → 高值深色）。
 */
const PROVINCE_STATS: { displayName: string; mapName: string; newCustomers: number }[] = [
  { displayName: '北京', mapName: '北京市', newCustomers: 3200 },
  { displayName: '广东省深圳市', mapName: '广东省', newCustomers: 2980 },
  { displayName: '上海', mapName: '上海市', newCustomers: 2760 },
  { displayName: '浙江', mapName: '浙江省', newCustomers: 2540 },
  { displayName: '江苏', mapName: '江苏省', newCustomers: 2320 },
  { displayName: '山东', mapName: '山东省', newCustomers: 2100 },
  { displayName: '湖北', mapName: '湖北省', newCustomers: 1880 },
  { displayName: '福建', mapName: '福建省', newCustomers: 1660 },
  { displayName: '四川', mapName: '四川省', newCustomers: 1440 },
  { displayName: '天津', mapName: '天津市', newCustomers: 1220 },
  { displayName: '河南', mapName: '河南省', newCustomers: 1000 },
  { displayName: '陕西', mapName: '陕西省', newCustomers: 880 },
  { displayName: '湖南', mapName: '湖南省', newCustomers: 760 },
  { displayName: '重庆', mapName: '重庆市', newCustomers: 640 },
  { displayName: '辽宁', mapName: '辽宁省', newCustomers: 520 },
];

const provinceNewCustomerTotal = PROVINCE_STATS.reduce((s, r) => s + r.newCustomers, 0);

function provinceMapSeriesData() {
  return PROVINCE_STATS.map((r) => ({ name: r.mapName, value: r.newCustomers }));
}

const COUNTRY_NAMES = [
  '美国',
  '日本',
  '德国',
  '英国',
  '韩国',
  '澳大利亚',
  '新加坡',
  '马来西亚',
  '泰国',
  '越南',
];

const COUNTRY_BAR = [2680, 2350, 2080, 1820, 1650, 1480, 1250, 1080, 920, 780];

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

const mapLoadError = ref(false);
const mapChinaRegistered = ref(false);

const mapProvinceRef = ref<HTMLElement | null>(null);
const chartCountryRef = ref<HTMLElement | null>(null);

let chartProvince: echarts.ECharts | null = null;
let chartCountry: echarts.ECharts | null = null;

const { width: winWidth } = useWindowSize();

const tableColumns = computed<PrimaryTableCol[]>(() => [
  { colKey: 'rank', title: '排名', width: 72, align: 'center' },
  {
    colKey: 'name',
    title: activeTab.value === 'province' ? '省份' : '国家',
    minWidth: 140,
    ellipsis: true,
  },
  { colKey: 'newCustomers', title: '新增客户', align: 'right', width: 100 },
  { colKey: 'newRatio', title: '新增占比', align: 'right', width: 96, cell: 'ratio' },
]);

const provinceTableData = computed(() =>
  PROVINCE_STATS.map((row, i) => {
    const newRatio =
      provinceNewCustomerTotal > 0
        ? Math.round((1000 * row.newCustomers) / provinceNewCustomerTotal) / 10
        : 0;
    return {
      rowKey: `p-${i}`,
      rank: i + 1,
      name: row.displayName,
      newCustomers: row.newCustomers,
      newRatio,
    };
  }),
);

const countryTableData = computed(() =>
  COUNTRY_NAMES.map((name, i) => ({
    rowKey: `c-${i}`,
    rank: i + 1,
    name,
    ...MOCK,
  })),
);

const tableData = computed(() =>
  activeTab.value === 'province' ? provinceTableData.value : countryTableData.value,
);

function provinceMapOption(): EChartsCoreOption {
  const mapData = provinceMapSeriesData();
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
      // 自上而下：数值高（新增多）→ 深色；数值低（新增少）→ 浅色
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

function countryBarOption(): EChartsCoreOption {
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
      max: 3000,
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e6eb' } },
    },
    yAxis: {
      type: 'category',
      data: [...COUNTRY_NAMES].reverse(),
      axisTick: { show: false },
      axisLabel: { fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        data: [...COUNTRY_BAR].reverse(),
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

function renderCountryChart() {
  if (!chartCountryRef.value) return;
  if (!chartCountry) chartCountry = echarts.init(chartCountryRef.value);
  chartCountry.setOption(countryBarOption(), true);
}

async function loadChinaMap() {
  mapLoadError.value = false;
  try {
    const res = await fetch(CHINA_GEO_URL);
    if (!res.ok) throw new Error(String(res.status));
    const geoJson = await res.json();
    echarts.registerMap('china', geoJson as never);
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

function disposeCountryChart() {
  chartCountry?.dispose();
  chartCountry = null;
}

function handleTabChange() {
  nextTick(() => {
    if (activeTab.value === 'province') {
      renderProvinceMap();
      chartProvince?.resize();
    } else {
      renderCountryChart();
      chartCountry?.resize();
    }
  });
}

function handleSearch() {
  nextTick(() => {
    if (activeTab.value === 'province') renderProvinceMap();
    else renderCountryChart();
  });
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

watch(winWidth, () => {
  chartProvince?.resize();
  chartCountry?.resize();
});

onMounted(() => {
  void loadChinaMap();
  void Promise.all([loadDeptOptions(), loadUserOptions()]);
});

onUnmounted(() => {
  disposeProvinceChart();
  disposeCountryChart();
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
