<template>
  <div class="sales-funnel-page">
    <!-- 筛选 -->
    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
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

    <!-- 漏斗图 -->
    <t-card :bordered="false" class="chart-card">
      <div ref="chartRef" class="funnel-chart" />
    </t-card>

    <!-- 汇总 + 表格 -->
    <t-card :bordered="false" class="table-card">
      <div class="summary-toolbar">
        <div class="summary-text">
          预计销售金额：{{ formatMoney(summary.estimated) }}，实际销售金额：{{ formatMoney(summary.actual) }}
        </div>
        <t-button theme="default" variant="outline" @click="handleExport">
          <template #icon><t-icon name="upload" /></template>
          导出
        </t-button>
      </div>
      <t-table :data="tableData" :columns="columns" row-key="rowKey" size="medium" bordered>
        <template #stage="{ row }">
          <t-link v-if="!row.isTotal" theme="primary" @click.prevent>{{ row.stage }}</t-link>
          <span v-else class="total-label">{{ row.stage }}</span>
        </template>
        <template #qty="{ row }">
          {{ row.qty }}
        </template>
        <template #rate="{ row }">
          {{ row.rateText }}
        </template>
        <template #estimated="{ row }">
          {{ formatMoney(row.estimated) }}
        </template>
        <template #probability="{ row }">
          {{ formatMoney(row.probability) }}
        </template>
      </t-table>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import dayjs from 'dayjs';
import { FunnelChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

defineOptions({
  name: 'SalesFunnelAnalysis',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, FunnelChart, CanvasRenderer]);

/** 漏斗从上到下：锁单 → 跟进 → 报价 → 购买 → 流失（与「销售阶段」一致） */
const STAGES = [
  { name: '锁单', value: 500, pct: '36%', color: '#9ec5f7', insideColor: '#fff' },
  { name: '跟进', value: 350, pct: '25%', color: '#2ec7a6', insideColor: '#fff' },
  { name: '报价', value: 250, pct: '18%', color: '#f5d547', insideColor: '#333' },
  { name: '购买', value: 150, pct: '10%', color: '#3d5a9a', insideColor: '#fff' },
  { name: '流失', value: 120, pct: '8%', color: '#8b7fd8', insideColor: '#fff' },
] as const;

const statModeOptions = [{ label: '按月统计', value: 'month' }];

const defaultMonthRange = (): string[] => {
  const y = dayjs().year();
  return [`${y}-01`, `${y}-12`];
};

const filters = ref({
  statMode: 'month',
  /** 与 TDesign month 范围 + value-type=YYYY-MM 一致 */
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

interface TableRow {
  rowKey: string;
  stage: string;
  qty: number;
  rateText: string;
  estimated: number;
  probability: number;
  isTotal?: boolean;
}

const MOCK_QTY = 1000;
const MOCK_RATE = '10%';
const MOCK_EST = 1_000_000;
const MOCK_PROB = 900_000;

function buildTableData(): TableRow[] {
  const rows: TableRow[] = STAGES.map((s, i) => ({
    rowKey: `s-${i}`,
    stage: s.name,
    qty: MOCK_QTY,
    rateText: s.name === '流失' ? '-' : MOCK_RATE,
    estimated: MOCK_EST,
    probability: MOCK_PROB,
  }));
  rows.push({
    rowKey: 'total',
    stage: '总计',
    qty: MOCK_QTY,
    rateText: '-',
    estimated: MOCK_EST,
    probability: MOCK_PROB,
    isTotal: true,
  });
  return rows;
}

const tableData = ref<TableRow[]>(buildTableData());

const summary = ref({
  estimated: MOCK_EST,
  actual: MOCK_PROB,
});

const columns: PrimaryTableCol[] = [
  { colKey: 'stage', title: '销售阶段', width: 120, cell: 'stage' },
  { colKey: 'qty', title: '数量', width: 100, align: 'right', cell: 'qty' },
  {
    colKey: 'rate',
    title: '转化率',
    width: 120,
    align: 'center',
    cell: 'rate',
  },
  { colKey: 'estimated', title: '预计销售金额', cell: 'estimated' },
  {
    colKey: 'probability',
    title: '概率金额',
    width: 140,
    cell: 'probability',
  },
];

function formatMoney(n: number) {
  return `¥ ${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  try {
    if (!chartInstance) {
      chartInstance = echarts.init(el);
    }

    const funnelData = STAGES.map((s) => ({
      value: s.value,
      name: s.name,
      itemStyle: { color: s.color },
      pct: s.pct,
      insideColor: s.insideColor,
    }));

    chartInstance.setOption(
      {
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            const d = params.data || {};
            return `${params.name}<br/>数量：${params.value}<br/>占比：${d.pct || ''}`;
          },
        },
        legend: { show: false },
        series: [
          {
            name: '销售漏斗',
            type: 'funnel',
            z: 2,
            left: 'center',
            top: 48,
            bottom: 32,
            width: '52%',
            min: 0,
            max: 500,
            minSize: '0%',
            maxSize: '100%',
            sort: 'descending',
            gap: 4,
            funnelAlign: 'center',
            label: { show: false },
            labelLine: { show: false },
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 2,
            },
            data: funnelData.map((d) => ({
              value: d.value,
              name: d.name,
              itemStyle: d.itemStyle,
              pct: d.pct,
              label: {
                show: true,
                position: 'inside',
                formatter: d.pct,
                color: d.insideColor,
                fontSize: 16,
                fontWeight: 600,
              },
            })),
          },
          /** 透明层叠在上层，仅用于右侧「阶段名 + 数量」与引导线（勿设 itemStyle.opacity:0，否则标签会一起透明） */
          {
            name: '阶段说明',
            type: 'funnel',
            z: 10,
            left: 'center',
            top: 48,
            bottom: 32,
            width: '52%',
            min: 0,
            max: 500,
            sort: 'descending',
            gap: 4,
            funnelAlign: 'center',
            silent: true,
            animation: false,
            label: {
              show: true,
              position: 'right',
              formatter: (params: any) => `${params.name} ${params.value}`,
              color: '#000',
              fontSize: 14,
              fontWeight: 500,
              distance: 10,
              opacity: 1,
            },
            emphasis: {
              disabled: true,
            },
            labelLine: {
              show: true,
              length: 32,
              lineStyle: { color: '#d0d0d0', width: 1 },
            },
            itemStyle: {
              color: 'rgba(0,0,0,0)',
              borderColor: 'transparent',
              borderWidth: 0,
            },
            tooltip: { show: false },
            data: funnelData.map((d) => ({
              value: d.value,
              name: d.name,
            })),
          },
        ],
      },
      true,
    );
  } catch (e) {
    console.error('销售漏斗图表渲染失败:', e);
  }
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

function handleSearch() {
  tableData.value = buildTableData();
  nextTick(() => renderChart());
}

function handleReset() {
  filters.value = {
    statMode: 'month',
    monthRange: defaultMonthRange(),
    deptId: undefined,
    userId: undefined,
  };
  tableData.value = buildTableData();
  nextTick(() => renderChart());
}

function handleExport() {
  const header = ['销售阶段', '数量', '转化率', '预计销售金额', '概率金额'];
  const lines = [
    header.join(','),
    ...tableData.value.map((r) =>
      [r.stage, r.qty, r.rateText, r.estimated.toFixed(2), r.probability.toFixed(2)].join(','),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `销售漏斗_${dayjs().format('YYYY-MM-DD')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  MessagePlugin.success('导出成功');
}

watch(winWidth, () => {
  chartInstance?.resize();
});

onMounted(() => {
  filters.value.monthRange = defaultMonthRange();
  nextTick(() => {
    renderChart();
  });
  void Promise.all([loadDeptOptions(), loadUserOptions()]).then(() => {
    nextTick(() => chartInstance?.resize());
  });
});

onUnmounted(() => {
  disposeChart();
});
</script>
<style scoped lang="less">
.sales-funnel-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--td-bg-color-page);
  min-height: 100%;
}

.filter-card,
.chart-card,
.table-card {
  background: #fff;
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

.funnel-chart {
  width: 100%;
  height: 480px;
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
}

.total-label {
  font-weight: 600;
}

.table-card {
  :deep(.t-table) {
    th {
      background: var(--td-bg-color-secondarycontainer);
    }
  }
}
</style>
