<template>
  <div class="transaction-data-ranking-page">
    <t-card :bordered="false" class="tabs-card">
      <t-tabs v-model="activeTab" class="rank-tabs" @change="handleTabChange">
        <t-tab-panel value="individual" label="个人排名" />
        <t-tab-panel value="department" label="部门排名" />
      </t-tabs>
    </t-card>

    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
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
        <template #dealAmt="{ row }">
          <t-link theme="primary" @click.prevent>{{ formatMoney(row.deal) }}</t-link>
        </template>
        <template #contracts="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.contracts }}</t-link>
        </template>
        <template #prodQty="{ row }">
          {{ formatQty(row.productQty) }}
        </template>
        <template #avgPrice="{ row }">
          {{ formatMoney(row.avgPrice) }}
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import dayjs from 'dayjs';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { PrimaryTableCol, TableRowClassNameParams } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

defineOptions({
  name: 'TransactionDataRanking',
});

echarts.use([TooltipComponent, GridComponent, BarChart, CanvasRenderer]);

type RankTab = 'individual' | 'department';

const BAR_COLOR = '#5eadf5';

const MOCK_DEAL = 1_000_000;
const MOCK_CONTRACTS = 200;
const MOCK_PRODUCT_QTY = 10_000;
const MOCK_AVG = 100_000;

const EMPLOYEE_NAMES = [
  '赵小刚',
  '周小伟',
  '王小明',
  '李小红',
  '孙小军',
  '吴小丽',
  '郑小强',
  '钱小敏',
  '冯小涛',
];

const INDIVIDUAL_VALUES = [
  1_880_000, 1_720_000, 1_550_000, 1_420_000, 1_300_000, 1_180_000, 1_050_000, 920_000, 800_000,
];

const DEPT_LABELS = Array.from({ length: 10 }, (_, i) => `部门名称${i + 1}`);
const DEPT_VALUES = INDIVIDUAL_VALUES.slice(0, 10).map((v, i) => Math.round(v * (1 - i * 0.03)));

const currentYear = dayjs().year();
const yearOptions = Array.from({ length: 12 }, (_, i) => {
  const y = currentYear - 5 + i;
  return { label: `${y}年`, value: y };
});

const activeTab = ref<RankTab>('individual');

const filters = ref({
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

function formatMoney(n: number) {
  return `¥ ${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatQty(n: number) {
  return n.toLocaleString('zh-CN');
}

const summaryLine = computed(
  () =>
    `成交金额: ${formatMoney(MOCK_DEAL)}, 成交合同: ${MOCK_CONTRACTS}, 成交产品数量: ${formatQty(MOCK_PRODUCT_QTY)}, 平均客单价: ${formatMoney(MOCK_AVG)}`,
);

interface RowBase {
  rowKey: string;
  rank: number;
  deal: number;
  contracts: number;
  productQty: number;
  avgPrice: number;
}

interface IndividualRow extends RowBase {
  name: string;
  dept: string;
}

interface DepartmentRow extends RowBase {
  name: string;
}

function buildIndividualRows(): IndividualRow[] {
  return EMPLOYEE_NAMES.map((_, i) => ({
    rowKey: `e-${i}`,
    rank: i + 1,
    name: '赵小刚',
    dept: '销售一部',
    deal: MOCK_DEAL,
    contracts: MOCK_CONTRACTS,
    productQty: MOCK_PRODUCT_QTY,
    avgPrice: MOCK_AVG,
  }));
}

function buildDepartmentRows(): DepartmentRow[] {
  return DEPT_LABELS.map((name, i) => ({
    rowKey: `d-${i}`,
    rank: i + 1,
    name,
    deal: MOCK_DEAL,
    contracts: MOCK_CONTRACTS,
    productQty: MOCK_PRODUCT_QTY,
    avgPrice: MOCK_AVG,
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
      { colKey: 'deal', title: '成交金额', align: 'right', cell: 'dealAmt' },
      { colKey: 'contracts', title: '成交合同', align: 'right', width: 110, cell: 'contracts' },
      { colKey: 'productQty', title: '成交产品数量', align: 'right', cell: 'prodQty' },
      { colKey: 'avgPrice', title: '平均客单价', align: 'right', cell: 'avgPrice' },
    ];
  }
  return [
    { colKey: 'rank', title: '排名', width: 72, align: 'center', cell: 'rank' },
    { colKey: 'name', title: '部门名称', minWidth: 140, cell: 'deptName' },
    { colKey: 'deal', title: '成交金额', align: 'right', cell: 'dealAmt' },
    { colKey: 'contracts', title: '成交合同', align: 'right', width: 110, cell: 'contracts' },
    { colKey: 'productQty', title: '成交产品数量', align: 'right', cell: 'prodQty' },
    { colKey: 'avgPrice', title: '平均客单价', align: 'right', cell: 'avgPrice' },
  ];
});

function rowClassName({ rowIndex }: TableRowClassNameParams<unknown>) {
  if (activeTab.value === 'individual' && rowIndex === 0) return 'rank-top-row';
  return '';
}

function tooltipExtra(name: string) {
  if (name === '赵小刚') {
    return '<br/>报价数量: 200, 客户数量: 200, 合同数量: 200';
  }
  return '';
}

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);

  const isInd = activeTab.value === 'individual';
  const categories = isInd ? EMPLOYEE_NAMES : DEPT_LABELS;
  const data = isInd ? [...INDIVIDUAL_VALUES] : [...DEPT_VALUES];

  chartInstance.setOption(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const list = params as { name: string; value: number }[];
          const p = list[0];
          if (!p) return '';
          const head = `${p.name}<br/>成交金额: ${formatMoney(p.value)}`;
          return head + tooltipExtra(p.name);
        },
      },
      legend: { show: false },
      grid: {
        left: '3%',
        right: '4%',
        bottom: isInd ? '12%' : '10%',
        top: '6%',
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
        max: 2_000_000,
        interval: 400_000,
        splitLine: { lineStyle: { type: 'dashed', color: '#e5e6eb' } },
        axisLabel: {
          fontSize: 11,
          formatter: (v: number) => (v >= 10_000 ? `${v / 10_000}万` : String(v)),
        },
      },
      series: [
        {
          name: '成交金额',
          type: 'bar',
          barMaxWidth: 32,
          itemStyle: { color: BAR_COLOR, borderRadius: [4, 4, 0, 0] },
          data,
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
          if (k === 'deal' || k === 'avgPrice') return typeof v === 'number' ? formatMoney(v) : String(v ?? '');
          if (k === 'productQty') return typeof v === 'number' ? formatQty(v) : String(v ?? '');
          return String(v ?? '');
        })
        .join(','),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `成交数据排名_${dayjs().format('YYYY-MM-DD')}.csv`;
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
.transaction-data-ranking-page {
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
