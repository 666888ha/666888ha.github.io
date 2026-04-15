<template>
  <div class="product-sales-page">
    <t-card :bordered="false" class="tabs-card">
      <t-tabs v-model="activeTab" class="sales-tabs" @change="handleTabChange">
        <t-tab-panel value="product" label="按产品汇总" />
        <t-tab-panel value="category" label="按分类汇总" />
        <t-tab-panel value="time" label="按时间汇总" />
      </t-tabs>
    </t-card>

    <t-card :bordered="false" class="filter-card">
      <div v-if="activeTab === 'product' || activeTab === 'category'" class="filter-row">
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
      <div v-else class="filter-row">
        <t-select v-model="filters.year" class="filter-select-year" :options="yearOptions" />
        <t-select
          v-model="filters.categoryId"
          class="filter-select"
          placeholder="产品分类"
          clearable
          :options="categoryOptions"
        />
        <t-select
          v-model="filters.productId"
          class="filter-select"
          placeholder="产品名称"
          clearable
          :options="productFilterOptions"
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
      <t-table :data="tableRows" :columns="tableColumns" row-key="rowKey" size="medium" bordered stripe>
        <template v-if="activeTab === 'product'" #prodName="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.name }}</t-link>
        </template>
        <template v-if="activeTab === 'product'" #prodCode="{ row }">
          {{ row.code }}
        </template>
        <template v-if="activeTab === 'category'" #cateName="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.name }}</t-link>
        </template>
        <template v-if="activeTab === 'time'" #timeCell="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.time }}</t-link>
        </template>
        <template #qty="{ row }">
          {{ formatQty(row.qty) }}
        </template>
        <template #amount="{ row }">
          {{ formatMoney(row.amount) }}
        </template>
        <template v-if="activeTab !== 'time'" #avgPrice="{ row }">
          {{ formatMoney(row.avgPrice) }}
        </template>
        <template v-if="activeTab === 'time'" #mom="{ row }">
          {{ row.mom }}
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
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

defineOptions({
  name: 'ProductSalesVolumeSummary',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, BarChart, CanvasRenderer]);

type SalesTab = 'product' | 'category' | 'time';

const BAR_COLOR = '#5eadf5';

const MOCK_QTY = 10_000;
const MOCK_AMOUNT = 1_000_000;
const MOCK_AVG = 1_000;

/** 与示意图：产品名称7 约 252 万 */
const PRODUCT_CHART_VALUES = [
  1_200_000, 1_400_000, 1_600_000, 1_700_000, 1_840_000, 2_000_000, 2_520_000, 2_100_000, 1_900_000, 1_800_000,
  1_650_000, 1_500_000,
];

const PRODUCT_X_LABELS = [
  ...Array.from({ length: 11 }, (_, i) => `产品名称${i + 1}`),
  '2019年12月',
];

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const TIME_CHART_VALUES = [550_000, 600_000, 675_000, 750_000, 825_000, 900_000, 1_200_000, 1_250_000, 1_000_000, 850_000, 750_000, 650_000];

const statModeOptions = [{ label: '按月统计', value: 'month' }];

const currentYear = dayjs().year();
const defaultMonthRange = (): string[] => [`${currentYear}-01`, `${currentYear}-12`];

const yearOptions = Array.from({ length: 12 }, (_, i) => {
  const y = currentYear - 5 + i;
  return { label: `${y}年`, value: y };
});

const categoryOptions = [
  { label: '全部', value: '' },
  { label: '办公设备', value: 'office' },
  { label: '电子元件', value: 'elec' },
];

const productFilterOptions = [
  { label: '全部', value: '' },
  { label: '示例产品A', value: 'a' },
  { label: '示例产品B', value: 'b' },
];

const activeTab = ref<SalesTab>('product');

const filters = ref({
  statMode: 'month',
  monthRange: [] as string[],
  year: currentYear,
  categoryId: '' as string,
  productId: '' as string,
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

function formatMoney(n: number) {
  return `¥ ${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatQty(n: number) {
  return n.toLocaleString('zh-CN');
}

const summaryLine = computed(
  () => `销售数量：${formatQty(MOCK_QTY)}，销售金额：${formatMoney(MOCK_AMOUNT)}`,
);

interface ProductRow {
  rowKey: string;
  name: string;
  code: string;
  qty: number;
  amount: number;
  avgPrice: number;
}

interface CategoryRow {
  rowKey: string;
  name: string;
  qty: number;
  amount: number;
  avgPrice: number;
}

interface TimeRow {
  rowKey: string;
  time: string;
  qty: number;
  amount: number;
  mom: string;
}

function buildProductRows(): ProductRow[] {
  return PRODUCT_X_LABELS.map((label, i) => ({
    rowKey: `p-${i}`,
    name: label,
    code: `CP${String(i + 1).padStart(3, '0')}`,
    qty: MOCK_QTY,
    amount: MOCK_AMOUNT,
    avgPrice: MOCK_AVG,
  }));
}

function buildCategoryRows(): CategoryRow[] {
  return PRODUCT_X_LABELS.map((label, i) => ({
    rowKey: `c-${i}`,
    name: label.replace('产品名称', '分类名称'),
    qty: MOCK_QTY,
    amount: MOCK_AMOUNT,
    avgPrice: MOCK_AVG,
  }));
}

const MOM_SAMPLES = ['—', '8.2%', '10.4%', '9.1%', '7.5%', '6.8%', '12.3%', '11.0%', '5.2%', '4.8%', '3.9%', '3.2%'];

function buildTimeRows(year: number): TimeRow[] {
  return MONTH_LABELS.map((_, i) => ({
    rowKey: `t-${i}`,
    time: `${year}-${String(i + 1).padStart(2, '0')}`,
    qty: MOCK_QTY,
    amount: MOCK_AMOUNT,
    mom: MOM_SAMPLES[i] ?? '—',
  }));
}

const productRows = ref<ProductRow[]>(buildProductRows());
const categoryRows = ref<CategoryRow[]>(buildCategoryRows());
const timeRows = ref<TimeRow[]>(buildTimeRows(currentYear));

const tableRows = computed(() => {
  if (activeTab.value === 'product') return productRows.value;
  if (activeTab.value === 'category') return categoryRows.value;
  return timeRows.value;
});

const tableColumns = computed<PrimaryTableCol[]>(() => {
  if (activeTab.value === 'product') {
    return [
      { colKey: 'name', title: '产品名称', minWidth: 140, cell: 'prodName' },
      { colKey: 'code', title: '产品编号', width: 120, cell: 'prodCode' },
      { colKey: 'qty', title: '销售数量', align: 'right', cell: 'qty' },
      { colKey: 'amount', title: '销售金额', align: 'right', cell: 'amount' },
      { colKey: 'avgPrice', title: '平均单价', align: 'right', cell: 'avgPrice' },
    ];
  }
  if (activeTab.value === 'category') {
    return [
      { colKey: 'name', title: '分类名称', minWidth: 160, cell: 'cateName' },
      { colKey: 'qty', title: '销售数量', align: 'right', cell: 'qty' },
      { colKey: 'amount', title: '销售金额', align: 'right', cell: 'amount' },
      { colKey: 'avgPrice', title: '平均单价', align: 'right', cell: 'avgPrice' },
    ];
  }
  return [
    { colKey: 'time', title: '时间', width: 110, cell: 'timeCell' },
    { colKey: 'qty', title: '销售数量', align: 'right', cell: 'qty' },
    { colKey: 'amount', title: '销售金额', align: 'right', cell: 'amount' },
    { colKey: 'mom', title: '销售额环比增长', width: 140, align: 'center', cell: 'mom' },
  ];
});

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);

  const tab = activeTab.value;

  if (tab === 'time') {
    chartInstance.setOption(
      {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          valueFormatter: (v: number | string) =>
            typeof v === 'number' ? formatMoney(v).replace('¥ ', '¥') : String(v),
        },
        legend: { show: false },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
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
          max: 3_000_000,
          interval: 500_000,
          splitLine: { lineStyle: { type: 'dashed', color: '#e5e6eb' } },
          axisLabel: {
            fontSize: 11,
            formatter: (v: number) => (v >= 10_000 ? `${v / 10_000}万` : String(v)),
          },
        },
        series: [
          {
            name: '销售金额',
            type: 'bar',
            barMaxWidth: 36,
            itemStyle: { color: BAR_COLOR, borderRadius: [4, 4, 0, 0] },
            data: [...TIME_CHART_VALUES],
          },
        ],
      },
      true,
    );
    return;
  }

  chartInstance.setOption(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v: number | string) =>
          typeof v === 'number' ? formatMoney(v).replace('¥ ', '¥') : String(v),
      },
      legend: {
        bottom: 8,
        data: ['销售金额'],
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
        data: PRODUCT_X_LABELS,
        axisTick: { alignWithLabel: true },
        axisLabel: { rotate: 28, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 3_000_000,
        interval: 500_000,
        splitLine: { lineStyle: { type: 'dashed', color: '#e5e6eb' } },
        axisLabel: {
          fontSize: 11,
          formatter: (v: number) => (v >= 10_000 ? `${v / 10_000}万` : String(v)),
        },
      },
      series: [
        {
          name: '销售金额',
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: { color: BAR_COLOR, borderRadius: [4, 4, 0, 0] },
          data: [...PRODUCT_CHART_VALUES],
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
  productRows.value = buildProductRows();
  categoryRows.value = buildCategoryRows();
  timeRows.value = buildTimeRows(filters.value.year);
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
    statMode: 'month',
    monthRange: defaultMonthRange(),
    year: currentYear,
    categoryId: '',
    productId: '',
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
          if (k === 'amount' || k === 'avgPrice') return typeof v === 'number' ? formatMoney(v) : String(v ?? '');
          if (k === 'qty') return typeof v === 'number' ? formatQty(v) : String(v ?? '');
          return String(v ?? '');
        })
        .join(','),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `产品销量汇总_${dayjs().format('YYYY-MM-DD')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  MessagePlugin.success('导出成功');
}

watch(
  () => filters.value.year,
  () => {
    timeRows.value = buildTimeRows(filters.value.year);
    if (activeTab.value === 'time') nextTick(() => renderChart());
  },
);

watch(winWidth, () => chartInstance?.resize());

onMounted(() => {
  filters.value.monthRange = defaultMonthRange();
  nextTick(() => renderChart());
  void Promise.all([loadDeptOptions(), loadUserOptions()]).then(() => {
    nextTick(() => chartInstance?.resize());
  });
});

onUnmounted(() => disposeChart());
</script>

<style scoped lang="less">
.product-sales-page {
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

.sales-tabs {
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
  height: 440px;
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
}

.table-card {
  :deep(.t-table) {
    th {
      background: var(--td-bg-color-secondarycontainer);
    }
  }
}
</style>
