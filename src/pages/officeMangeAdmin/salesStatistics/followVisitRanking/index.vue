<template>
  <div class="follow-visit-ranking-page">
    <t-card :bordered="false" class="tabs-card">
      <t-tabs v-model="activeTab" class="rank-tabs" @change="handleTabChange">
        <t-tab-panel value="individual" label="个人排名" />
        <t-tab-panel value="department" label="部门排名" />
      </t-tabs>
    </t-card>

    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
        <t-select
          v-model="filters.followType"
          class="filter-select-type"
          :options="typeOptions"
          placeholder="类型"
        />
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
          <t-link theme="primary" @click.prevent>{{ row.name }}</t-link>
        </template>
        <template #followCnt="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.followCount }}</t-link>
        </template>
        <template #visitCnt="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.visitCount }}</t-link>
        </template>
        <template #checkinCnt="{ row }">
          <t-link theme="primary" @click.prevent>{{ row.checkinCount }}</t-link>
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
import type { PrimaryTableCol, RowClassNameParams } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { getEmployeeList } from '@/api/customer/customer';
import { getSystemDeptOptions } from '@/api/system/dept';

defineOptions({
  name: 'FollowVisitRanking',
});

echarts.use([TooltipComponent, LegendComponent, GridComponent, BarChart, CanvasRenderer]);

type RankTab = 'individual' | 'department';

const COLOR_FOLLOW = '#5eadf5';
const COLOR_VISIT = '#52c41a';
const COLOR_CHECKIN = '#faad14';

const typeOptions = [{ label: '写跟进时间', value: 'follow_write_time' }];

const MOCK_TABLE = 200;

const EMPLOYEE_NAMES = [
  '赵小刚',
  '李小红',
  '王小明',
  '周小伟',
  '孙小军',
  '吴小丽',
  '郑小强',
  '钱小敏',
  '冯小涛',
];

/** 周小伟（下标 3）：跟进 215、拜访 152、签到 155 */
const CHART_IND_FOLLOW = [268, 255, 245, 215, 205, 195, 185, 172, 160];
const CHART_IND_VISIT = [188, 175, 165, 152, 142, 135, 125, 118, 108];
const CHART_IND_CHECKIN = [192, 180, 170, 155, 148, 138, 128, 118, 108];

const DEPT_LABELS = Array.from({ length: 10 }, (_, i) => `部门名称${i + 1}`);
const CHART_DEPT_FOLLOW = [275, 258, 242, 228, 212, 198, 185, 172, 158, 145];
const CHART_DEPT_VISIT = [195, 182, 170, 158, 148, 138, 128, 118, 108, 98];
const CHART_DEPT_CHECKIN = [200, 188, 175, 162, 152, 142, 132, 122, 112, 102];

const currentYear = dayjs().year();
const yearOptions = Array.from({ length: 12 }, (_, i) => {
  const y = currentYear - 5 + i;
  return { label: `${y}年`, value: y };
});

const activeTab = ref<RankTab>('individual');

const filters = ref({
  followType: 'follow_write_time' as string,
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

const summaryLine = computed(
  () => `跟进次数: ${MOCK_TABLE}, 拜访次数: ${MOCK_TABLE}, 签到次数: ${MOCK_TABLE}`,
);

interface IndividualRow {
  rowKey: string;
  rank: number;
  name: string;
  dept: string;
  followCount: number;
  visitCount: number;
  checkinCount: number;
}

interface DepartmentRow {
  rowKey: string;
  rank: number;
  name: string;
  followCount: number;
  visitCount: number;
  checkinCount: number;
}

function buildIndividualRows(): IndividualRow[] {
  return EMPLOYEE_NAMES.map((_, i) => ({
    rowKey: `e-${i}`,
    rank: i + 1,
    name: '赵小刚',
    dept: '销售一部',
    followCount: MOCK_TABLE,
    visitCount: MOCK_TABLE,
    checkinCount: MOCK_TABLE,
  }));
}

function buildDepartmentRows(): DepartmentRow[] {
  return DEPT_LABELS.map((_, i) => ({
    rowKey: `d-${i}`,
    rank: i + 1,
    name: '销售一部',
    followCount: MOCK_TABLE,
    visitCount: MOCK_TABLE,
    checkinCount: MOCK_TABLE,
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
      { colKey: 'followCount', title: '跟进次数', align: 'right', width: 100, cell: 'followCnt' },
      { colKey: 'visitCount', title: '拜访次数', align: 'right', width: 100, cell: 'visitCnt' },
      { colKey: 'checkinCount', title: '签到次数', align: 'right', width: 100, cell: 'checkinCnt' },
    ];
  }
  return [
    { colKey: 'rank', title: '排名', width: 72, align: 'center', cell: 'rank' },
    { colKey: 'name', title: '部门名称', minWidth: 140, cell: 'deptName' },
    { colKey: 'followCount', title: '跟进次数', align: 'right', width: 100, cell: 'followCnt' },
    { colKey: 'visitCount', title: '拜访次数', align: 'right', width: 100, cell: 'visitCnt' },
    { colKey: 'checkinCount', title: '签到次数', align: 'right', width: 100, cell: 'checkinCnt' },
  ];
});

function rowClassName({ rowIndex }: RowClassNameParams<unknown>) {
  if (activeTab.value === 'individual' && rowIndex === 0) return 'rank-top-row';
  return '';
}

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);

  const isInd = activeTab.value === 'individual';
  const categories = isInd ? EMPLOYEE_NAMES : DEPT_LABELS;
  const followData = isInd ? [...CHART_IND_FOLLOW] : [...CHART_DEPT_FOLLOW];
  const visitData = isInd ? [...CHART_IND_VISIT] : [...CHART_DEPT_VISIT];
  const checkinData = isInd ? [...CHART_IND_CHECKIN] : [...CHART_DEPT_CHECKIN];

  chartInstance.setOption(
    {
      color: [COLOR_FOLLOW, COLOR_VISIT, COLOR_CHECKIN],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['跟进次数', '拜访次数', '签到次数'],
        bottom: 4,
        left: 'center',
        orient: 'horizontal',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: isInd ? '20%' : '18%',
        top: '8%',
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
        max: 300,
        interval: 50,
        splitLine: { lineStyle: { type: 'dashed', color: '#e5e6eb' } },
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          name: '跟进次数',
          type: 'bar',
          barMaxWidth: 16,
          itemStyle: { color: COLOR_FOLLOW, borderRadius: [3, 3, 0, 0] },
          data: followData,
        },
        {
          name: '拜访次数',
          type: 'bar',
          barMaxWidth: 16,
          itemStyle: { color: COLOR_VISIT, borderRadius: [3, 3, 0, 0] },
          data: visitData,
        },
        {
          name: '签到次数',
          type: 'bar',
          barMaxWidth: 16,
          itemStyle: { color: COLOR_CHECKIN, borderRadius: [3, 3, 0, 0] },
          data: checkinData,
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
    followType: 'follow_write_time',
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
    ...rows.map((row) => keys.map((k) => String(row[k] ?? '')).join(',')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `跟进拜访排名_${dayjs().format('YYYY-MM-DD')}.csv`;
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
.follow-visit-ranking-page {
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

.filter-select-type {
  width: 160px;
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
