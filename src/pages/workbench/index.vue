<template>
  <div class="workbench-container">
    <!-- 标题和时间选择区域 -->
    <div class="workbench-header">
      <div class="header-title">
        <h2>
          <img src="@/assets/home-icon1.png" alt="首页图标" class="header-icon" />
          新签销售总额&目标冲刺进度
        </h2>
        <span class="unit-label">（万元）</span>
      </div>
      <div class="header-actions">
        <t-radio-group v-model="timeRange" class="time-range-group" @change="handleTimeRangeChange">
          <t-radio-button value="week">本周</t-radio-button>
          <t-radio-button value="month">本月</t-radio-button>
          <t-radio-button value="quarter">近三个月</t-radio-button>
        </t-radio-group>
      </div>
    </div>

    <!-- 数据卡片区域 -->
    <div class="workbench-cards">
      <!-- 当前累计业绩 -->
      <div class="workbench-card-wrapper">
        <t-card :bordered="false" class="workbench-card workbench-card--green">
          <template #header>
            <div class="card-header">
              <span class="card-title">当前累计业绩</span>
              <t-tooltip content="当前时间范围内的累计业绩总额">
                <t-icon name="info-circle" class="info-icon" />
              </t-tooltip>
            </div>
          </template>
          <div class="card-content">
            <span class="card-value">¥ {{ formatNumber(data.currentPerformance) }}</span>
          </div>
        </t-card>
      </div>

      <!-- 业绩平衡目标 -->
      <div class="workbench-card-wrapper">
        <t-card :bordered="false" class="workbench-card workbench-card--black">
          <template #header>
            <div class="card-header">
              <span class="card-title">业绩平衡目标</span>
              <t-tooltip content="业绩平衡目标金额">
                <t-icon name="info-circle" class="info-icon" />
              </t-tooltip>
            </div>
          </template>
          <div class="card-content">
            <span class="card-value">¥ {{ formatNumber(data.balanceTarget) }}</span>
          </div>
        </t-card>
      </div>

      <!-- 业绩保底目标 -->
      <div class="workbench-card-wrapper">
        <t-card :bordered="false" class="workbench-card workbench-card--black">
          <template #header>
            <div class="card-header">
              <span class="card-title">业绩保底目标</span>
              <t-tooltip content="业绩保底目标金额">
                <t-icon name="info-circle" class="info-icon" />
              </t-tooltip>
            </div>
          </template>
          <div class="card-content">
            <span class="card-value">¥ {{ formatNumber(data.minimumTarget) }}</span>
          </div>
        </t-card>
      </div>

      <!-- 平衡目标完成率 -->
      <div class="workbench-card-wrapper">
        <t-card :bordered="false" class="workbench-card workbench-card--orange">
          <template #header>
            <div class="card-header">
              <span class="card-title">平衡目标完成率</span>
              <t-tooltip content="当前累计业绩占平衡目标的百分比">
                <t-icon name="info-circle" class="info-icon" />
              </t-tooltip>
            </div>
          </template>
          <div class="card-content">
            <span class="card-value">{{ data.completionRate }}%</span>
          </div>
        </t-card>
      </div>

      <!-- 距平衡目标还差 -->
      <div class="workbench-card-wrapper">
        <t-card :bordered="false" class="workbench-card workbench-card--red">
          <template #header>
            <div class="card-header">
              <span class="card-title">距平衡目标还差</span>
              <t-tooltip content="距离完成平衡目标还差的金额">
                <t-icon name="info-circle" class="info-icon" />
              </t-tooltip>
            </div>
          </template>
          <div class="card-content">
            <span class="card-value">{{ formatNumber(data.remainingAmount) }}</span>
          </div>
        </t-card>
      </div>
    </div>

    <!-- 销售员目标完成率表格 -->
    <div class="workbench-table-section">
      <div class="table-header">
        <div class="table-title">
          <h2><img src="@/assets/home-icon2.png" alt="首页图标" class="header-icon" />2025年销售员保定目标完成率</h2>
          <span class="unit-label">（单位: 万元）</span>
        </div>
        <div class="table-actions">
          <t-radio-group v-model="tableTimeRange" class="time-range-group" @change="handleTableTimeRangeChange">
            <t-radio-button value="week">本周</t-radio-button>
            <t-radio-button value="month">本月</t-radio-button>
            <t-radio-button value="quarter">近三个月</t-radio-button>
          </t-radio-group>
        </div>
      </div>

      <t-card :bordered="false" class="workbench-table-card">
        <t-table
          :data="tableData"
          :columns="tableColumns"
          :hover="true"
          :loading="tableLoading"
          row-key="id"
          class="salesperson-table"
        >
          <template #newSignedAmount="{ row }">
            {{ formatNumber(row.newSignedAmount || 0) }}
          </template>
          <template #minimumTarget="{ row }">
            {{ formatNumber(row.minimumTarget || 0) }}
          </template>
          <template #completionRate="{ row }"> {{ row.completionRate || 0 }}% </template>
          <template #grossProfitMargin="{ row }"> {{ row.grossProfitMargin || 0 }}% </template>
        </t-table>
      </t-card>
    </div>

    <!-- 年度部门新签合同统计 -->
    <div class="workbench-table-section">
      <div class="table-header">
        <div class="table-title">
          <h2><img src="@/assets/home-icon3.png" alt="首页图标" class="header-icon" />年度部门新签合同统计</h2>
          <span class="unit-label">（单位: 万元）</span>
        </div>
      </div>

      <t-row :gutter="10">
        <!-- 左侧表格：年度部门新签合同统计 -->
        <t-col :span="8">
          <t-card :bordered="true" hover-shadow>
            <div class="table-subtitle">2025年度新签合同统计</div>
            <t-table
              :data="departmentAnnualData"
              :columns="departmentAnnualColumns"
              :hover="true"
              row-key="id"
              class="department-table"
            >
              <template #balanceTarget="{ row }">
                {{ formatNumber(row.balanceTarget || 0) }}
              </template>
              <template #minimumTarget="{ row }">
                {{ formatNumber(row.minimumTarget || 0) }}
              </template>
              <template #annualPerformance="{ row }">
                {{ formatNumber(row.annualPerformance || 0) }}
              </template>
              <template #completionRate="{ row }"> {{ row.completionRate || 0 }}% </template>
              <template #profitMargin="{ row }"> {{ row.profitMargin || 0 }}% </template>
            </t-table>
          </t-card>
        </t-col>
        <!-- 右侧表格：2025年11月部门业绩完成度 -->
        <t-col :span="4">
          <t-card :bordered="true" hover-shadow>
            <div class="table-subtitle">2025年11月部门业绩完成度</div>
            <t-table
              :data="departmentNovemberData"
              :columns="departmentNovemberColumns"
              :hover="true"
              row-key="id"
              class="department-table"
            >
              <template #novemberTarget="{ row }">
                {{ formatNumber(row.novemberTarget || 0) }}
              </template>
              <template #completionRate="{ row }"> {{ row.completionRate || 0 }}% </template>
            </t-table>
          </t-card>
        </t-col>
      </t-row>
    </div>

    <!-- 11月销售拜访榜和跟进项目排名 -->
    <div class="workbench-table-section">
      <t-row :gutter="10">
        <!-- 左侧表格：11月销售拜访榜 -->
        <t-col :span="6">
          <div class="table-header">
            <div class="table-header table-header--inline">
              <div class="table-title">
                <h2><img src="@/assets/home-icon5.png" alt="首页图标" class="header-icon" />11月销售拜访榜</h2>
              </div>
            </div>
            <div class="table-subtitle">拜访转化: 跟进拜访后产生报价的拜访</div>
          </div>
          <t-card :bordered="false" hover-shadow>
            <t-table
              :data="visitRankingData"
              :columns="visitRankingColumns"
              :hover="true"
              row-key="id"
              class="visit-ranking-table"
            >
              <template #rank="{ rowIndex }">
                <div class="rank-number" :class="[rowIndex < 3 ? 'rank-top' : '']">{{ rowIndex + 1 }}</div>
              </template>
              <template #totalVisits="{ row }"> {{ row.totalVisits || 0 }}次 </template>
              <template #newCustomerVisits="{ row }"> {{ row.newCustomerVisits || 0 }}家 </template>
              <template #dailyAverage="{ row }"> {{ row.dailyAverage || 0 }}家/天 </template>
              <template #conversionRate="{ row }"> {{ row.conversionRate || 0 }}% </template>
            </t-table>
          </t-card>
        </t-col>

        <!-- 右侧表格：跟进项目排名 -->
        <t-col :span="6">
          <div class="table-header">
            <div class="table-title">
              <t-icon name="folder" style="margin-right: 8px; color: var(--td-brand-color)" />
              <h2>跟进项目排名</h2>
            </div>
          </div>
          <t-card :bordered="false" hover-shadow>
            <t-table
              :data="projectRankingData"
              :columns="projectRankingColumns"
              :hover="true"
              row-key="id"
              class="project-ranking-table"
            >
              <template #rank="{ rowIndex }">
                <div class="rank-number" :class="[rowIndex < 3 ? 'rank-top' : '']">{{ rowIndex + 1 }}</div>
              </template>
              <template #totalAmount="{ row }"> {{ formatNumber(row.totalAmount || 0) }}万 </template>
              <template #dealProbability="{ row }">
                <span class="text-red">{{ row.dealProbability || 0 }}%</span>
              </template>
              <template #customer="{ row }">
                <span class="text-ellipsis">{{ row.customer || '-' }}</span>
              </template>
              <template #estimatedSigning="{ row }">
                <span :class="row.estimatedSigning === 0 ? 'text-grey' : 'text-orange'">
                  {{ formatNumber(row.estimatedSigning || 0) }}万
                </span>
              </template>
            </t-table>
          </t-card>
        </t-col>
      </t-row>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { ref } from 'vue';

defineOptions({
  name: 'Workbench',
});

// 时间范围选择
const timeRange = ref('quarter'); // 默认选中"近三个月"
const tableTimeRange = ref('quarter'); // 表格时间范围
const tableLoading = ref(false);

// 数据源
const data = ref({
  currentPerformance: 8450, // 当前累计业绩
  balanceTarget: 12000, // 业绩平衡目标
  minimumTarget: 10000, // 业绩保底目标
  completionRate: 70.4, // 平衡目标完成率
  remainingAmount: 3550, // 距平衡目标还差
});

// 计算完成率
const calculateCompletionRate = () => {
  if (data.value.balanceTarget > 0) {
    data.value.completionRate = Number(((data.value.currentPerformance / data.value.balanceTarget) * 100).toFixed(1));
  }
};

// 计算剩余金额
const calculateRemainingAmount = () => {
  data.value.remainingAmount = Math.max(0, data.value.balanceTarget - data.value.currentPerformance);
};

// 格式化数字（添加千分位）
const formatNumber = (num: number) => {
  return num.toLocaleString('zh-CN');
};

// 时间范围改变处理
const handleTimeRangeChange = (value: string) => {
  timeRange.value = value;
  // 这里可以根据时间范围重新获取数据
  // 目前使用模拟数据
  loadDataByTimeRange(value);
};

// 根据时间范围加载数据（模拟）
const loadDataByTimeRange = (range: string) => {
  // 这里应该调用实际的API获取数据
  // 目前使用模拟数据
  switch (range) {
    case 'week':
      data.value = {
        currentPerformance: 2100,
        balanceTarget: 3000,
        minimumTarget: 2500,
        completionRate: 70.0,
        remainingAmount: 900,
      };
      break;
    case 'month':
      data.value = {
        currentPerformance: 5600,
        balanceTarget: 8000,
        minimumTarget: 7000,
        completionRate: 70.0,
        remainingAmount: 2400,
      };
      break;
    case 'quarter':
      data.value = {
        currentPerformance: 8450,
        balanceTarget: 12000,
        minimumTarget: 10000,
        completionRate: 70.4,
        remainingAmount: 3550,
      };
      break;
  }
  calculateCompletionRate();
  calculateRemainingAmount();
};

// 初始化计算
calculateCompletionRate();
calculateRemainingAmount();

// 表格列定义
const tableColumns: PrimaryTableCol[] = [
  {
    title: '销售员',
    align: 'left',
    width: 150,
    colKey: 'salesperson',
  },
  {
    title: '本年新签金额(万元)',
    align: 'right',
    width: 180,
    colKey: 'newSignedAmount',
  },
  {
    title: '本年保底目标(万元)',
    align: 'right',
    width: 180,
    colKey: 'minimumTarget',
  },
  {
    title: '保底目标完成率',
    align: 'right',
    width: 160,
    colKey: 'completionRate',
  },
  {
    title: '累计出库毛利率',
    align: 'right',
    width: 160,
    colKey: 'grossProfitMargin',
  },
];

// 表格数据
interface SalespersonData {
  id: number;
  salesperson: string;
  newSignedAmount: number;
  minimumTarget: number;
  completionRate: number;
  grossProfitMargin: number;
}

const tableData = ref<SalespersonData[]>([
  {
    id: 1,
    salesperson: '彭硕',
    newSignedAmount: 1500,
    minimumTarget: 1200,
    completionRate: 125,
    grossProfitMargin: 28,
  },
  {
    id: 2,
    salesperson: '昌瑞辰',
    newSignedAmount: 1200,
    minimumTarget: 1000,
    completionRate: 120,
    grossProfitMargin: 32,
  },
  {
    id: 3,
    salesperson: '朱明远',
    newSignedAmount: 950,
    minimumTarget: 1000,
    completionRate: 95,
    grossProfitMargin: 32,
  },
  {
    id: 4,
    salesperson: '尤欣源',
    newSignedAmount: 820,
    minimumTarget: 800,
    completionRate: 102.5,
    grossProfitMargin: 30,
  },
  {
    id: 5,
    salesperson: '程甜',
    newSignedAmount: 600,
    minimumTarget: 800,
    completionRate: 75,
    grossProfitMargin: 38,
  },
]);

// 表格时间范围改变处理
const handleTableTimeRangeChange = (value: string) => {
  tableTimeRange.value = value;
  // 这里可以根据时间范围重新获取表格数据
  // 目前使用模拟数据
  loadTableDataByTimeRange(value);
};

// 根据时间范围加载表格数据（模拟）
const loadTableDataByTimeRange = (range: string) => {
  tableLoading.value = true;
  // 模拟API调用
  setTimeout(() => {
    // 这里应该调用实际的API获取数据
    // 目前使用模拟数据，可以根据range返回不同数据
    switch (range) {
      case 'week':
        tableData.value = [
          {
            id: 1,
            salesperson: '彭硕',
            newSignedAmount: 350,
            minimumTarget: 280,
            completionRate: 125,
            grossProfitMargin: 28,
          },
          {
            id: 2,
            salesperson: '昌瑞辰',
            newSignedAmount: 280,
            minimumTarget: 230,
            completionRate: 121.7,
            grossProfitMargin: 32,
          },
          {
            id: 3,
            salesperson: '朱明远',
            newSignedAmount: 220,
            minimumTarget: 230,
            completionRate: 95.7,
            grossProfitMargin: 32,
          },
          {
            id: 4,
            salesperson: '尤欣源',
            newSignedAmount: 190,
            minimumTarget: 185,
            completionRate: 102.7,
            grossProfitMargin: 30,
          },
          {
            id: 5,
            salesperson: '程甜',
            newSignedAmount: 140,
            minimumTarget: 185,
            completionRate: 75.7,
            grossProfitMargin: 38,
          },
        ];
        break;
      case 'month':
        tableData.value = [
          {
            id: 1,
            salesperson: '彭硕',
            newSignedAmount: 900,
            minimumTarget: 720,
            completionRate: 125,
            grossProfitMargin: 28,
          },
          {
            id: 2,
            salesperson: '昌瑞辰',
            newSignedAmount: 720,
            minimumTarget: 600,
            completionRate: 120,
            grossProfitMargin: 32,
          },
          {
            id: 3,
            salesperson: '朱明远',
            newSignedAmount: 570,
            minimumTarget: 600,
            completionRate: 95,
            grossProfitMargin: 32,
          },
          {
            id: 4,
            salesperson: '尤欣源',
            newSignedAmount: 492,
            minimumTarget: 480,
            completionRate: 102.5,
            grossProfitMargin: 30,
          },
          {
            id: 5,
            salesperson: '程甜',
            newSignedAmount: 360,
            minimumTarget: 480,
            completionRate: 75,
            grossProfitMargin: 38,
          },
        ];
        break;
      case 'quarter':
        tableData.value = [
          {
            id: 1,
            salesperson: '彭硕',
            newSignedAmount: 1500,
            minimumTarget: 1200,
            completionRate: 125,
            grossProfitMargin: 28,
          },
          {
            id: 2,
            salesperson: '昌瑞辰',
            newSignedAmount: 1200,
            minimumTarget: 1000,
            completionRate: 120,
            grossProfitMargin: 32,
          },
          {
            id: 3,
            salesperson: '朱明远',
            newSignedAmount: 950,
            minimumTarget: 1000,
            completionRate: 95,
            grossProfitMargin: 32,
          },
          {
            id: 4,
            salesperson: '尤欣源',
            newSignedAmount: 820,
            minimumTarget: 800,
            completionRate: 102.5,
            grossProfitMargin: 30,
          },
          {
            id: 5,
            salesperson: '程甜',
            newSignedAmount: 600,
            minimumTarget: 800,
            completionRate: 75,
            grossProfitMargin: 38,
          },
        ];
        break;
    }
    tableLoading.value = false;
  }, 300);
};

// 年度部门新签合同统计表格列定义
const departmentAnnualColumns: PrimaryTableCol[] = [
  {
    title: '部门',
    align: 'left',
    width: 120,
    colKey: 'department',
  },
  {
    title: '业绩平衡目标',
    align: 'right',
    width: 120,
    colKey: 'balanceTarget',
  },
  {
    title: '业绩保底目标',
    align: 'right',
    width: 120,
    colKey: 'minimumTarget',
  },
  {
    title: '全年新签业绩',
    align: 'right',
    width: 120,
    colKey: 'annualPerformance',
  },
  {
    title: '平衡目标完成情况',
    align: 'right',
    width: 130,
    colKey: 'completionRate',
  },
  {
    title: '累计出库毛利率',
    align: 'right',
    width: 130,
    colKey: 'profitMargin',
  },
];

// 年度部门新签合同统计数据
const departmentAnnualData = ref([
  {
    id: 1,
    department: '销售一部',
    balanceTarget: 1500,
    minimumTarget: 1200,
    annualPerformance: 1500,
    completionRate: 125,
    profitMargin: 28,
  },
  {
    id: 2,
    department: '销售二部',
    balanceTarget: 1200,
    minimumTarget: 1000,
    annualPerformance: 1140,
    completionRate: 95,
    profitMargin: 32,
  },
  {
    id: 3,
    department: '大客户部',
    balanceTarget: 1000,
    minimumTarget: 1000,
    annualPerformance: 950,
    completionRate: 95,
    profitMargin: 32,
  },
]);

// 2025年11月部门业绩完成度表格列定义
const departmentNovemberColumns: PrimaryTableCol[] = [
  {
    title: '部门',
    align: 'left',
    colKey: 'department',
  },
  {
    title: '11月平衡目标',
    align: 'right',
    colKey: 'novemberTarget',
  },
  {
    title: '11月完成率',
    align: 'right',
    colKey: 'completionRate',
  },
];

// 2025年11月部门业绩完成度数据
const departmentNovemberData = ref([
  {
    id: 1,
    department: '销售一部',
    novemberTarget: 450,
    completionRate: 112,
  },
  {
    id: 2,
    department: '销售二部',
    novemberTarget: 350,
    completionRate: 88,
  },
  {
    id: 3,
    department: '大客户部',
    novemberTarget: 200,
    completionRate: 45,
  },
]);

// 11月销售拜访榜表格列定义
const visitRankingColumns: PrimaryTableCol[] = [
  {
    title: '排名',
    align: 'center',
    width: 80,
    colKey: 'rank',
  },
  {
    title: '销售人员',
    align: 'left',
    width: 120,
    colKey: 'salesperson',
  },
  {
    title: '本月拜访总次数',
    align: 'right',
    width: 130,
    colKey: 'totalVisits',
  },
  {
    title: '其中新客拜访数',
    align: 'right',
    width: 130,
    colKey: 'newCustomerVisits',
  },
  {
    title: '日均拜访量',
    align: 'right',
    width: 110,
    colKey: 'dailyAverage',
  },
  {
    title: '拜访转化率',
    align: 'right',
    width: 110,
    colKey: 'conversionRate',
  },
];

// 11月销售拜访榜数据
const visitRankingData = ref([
  {
    id: 1,
    salesperson: '彭硕',
    totalVisits: 42,
    newCustomerVisits: 15,
    dailyAverage: 2.1,
    conversionRate: 35,
  },
  {
    id: 2,
    salesperson: '昌瑞辰',
    totalVisits: 38,
    newCustomerVisits: 8,
    dailyAverage: 1.9,
    conversionRate: 15,
  },
  {
    id: 3,
    salesperson: '朱明远',
    totalVisits: 25,
    newCustomerVisits: 5,
    dailyAverage: 1.2,
    conversionRate: 60,
  },
  {
    id: 4,
    salesperson: '尤欣源',
    totalVisits: 22,
    newCustomerVisits: 2,
    dailyAverage: 1.1,
    conversionRate: 45,
  },
  {
    id: 5,
    salesperson: '程甜',
    totalVisits: 18,
    newCustomerVisits: 0,
    dailyAverage: 0.9,
    conversionRate: 20,
  },
]);

// 跟进项目排名表格列定义
const projectRankingColumns: PrimaryTableCol[] = [
  {
    title: '排名',
    align: 'center',
    width: 80,
    colKey: 'rank',
  },
  {
    title: '销售人员',
    align: 'left',
    width: 120,
    colKey: 'salesperson',
  },
  {
    title: '跟进总额',
    align: 'right',
    width: 110,
    colKey: 'totalAmount',
  },
  {
    title: '成交几率',
    align: 'right',
    width: 100,
    colKey: 'dealProbability',
  },
  {
    title: '跟进客户',
    align: 'left',
    width: 150,
    colKey: 'customer',
    ellipsis: true,
  },
  {
    title: '本月预计签约',
    align: 'right',
    width: 120,
    colKey: 'estimatedSigning',
  },
];

// 跟进项目排名数据
const projectRankingData = ref([
  {
    id: 1,
    salesperson: '彭硕',
    totalAmount: 850,
    dealProbability: 80,
    customer: '中建三局集团...',
    estimatedSigning: 300,
  },
  {
    id: 2,
    salesperson: '昌瑞辰',
    totalAmount: 620,
    dealProbability: 80,
    customer: '比亚迪二期项目...',
    estimatedSigning: 150,
  },
  {
    id: 3,
    salesperson: '朱明远',
    totalAmount: 580,
    dealProbability: 80,
    customer: '华润置地年度...',
    estimatedSigning: 0,
  },
  {
    id: 4,
    salesperson: '尤欣源',
    totalAmount: 410,
    dealProbability: 80,
    customer: '腾讯滨海大厦...',
    estimatedSigning: 50,
  },
  {
    id: 5,
    salesperson: '程甜',
    totalAmount: 220,
    dealProbability: 80,
    customer: '顺丰物流园区...',
    estimatedSigning: 80,
  },
]);
</script>
<style lang="less" scoped>
.workbench-container {
  padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl);
  background: #fff;
  min-height: 100vh;
}

.workbench-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--td-comp-margin-xxl);

  .header-title {
    display: flex;
    align-items: baseline;
    gap: var(--td-comp-margin-s);

    h2 {
      margin: 0;
      font-size: var(--td-font-size-title-large);
      font-weight: 500;
      color: var(--td-text-color-primary);
    }

    .unit-label {
      font-size: var(--td-font-size-body-medium);
      color: var(--td-text-color-secondary);
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
  }
}

// 时间选择器样式
.time-range-group {
  display: inline-flex;
  gap: 0;

  :deep(.t-radio-button) {
    border: 1px solid #e7e7e7;
    background: #fff;
    padding: 6px 20px;
    border-radius: 0;
    margin: 0;
    transition: all 0.2s;
    position: relative;

    &:first-child {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }

    &:last-child {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
      border-right: 1px solid #e7e7e7;
    }

    &:not(:last-child) {
      border-right: none;
    }

    &:hover {
      border-color: var(--td-brand-color);
      color: var(--td-brand-color);
      z-index: 1;
    }

    .t-radio-button__label {
      font-size: 14px;
      color: var(--td-text-color-primary);
      font-weight: 400;
    }
  }

  :deep(.t-is-checked) {
    border-color: var(--td-brand-color) !important;
    background: #fff !important;
    color: var(--td-brand-color) !important;
    z-index: 2;

    .t-radio-button__label {
      color: var(--td-brand-color) !important;
      font-weight: 500;
    }
  }

  :deep(.t-radio-button__input) {
    display: none;
  }
}

.workbench-cards {
  display: flex;
  gap: 16px;
  margin-top: var(--td-comp-margin-xxl);
  flex-wrap: wrap;

  .workbench-card-wrapper {
    flex: 1;
    min-width: 200px;
  }
}

.workbench-card {
  height: 100%;
  padding: var(--td-comp-paddingTB-xl) var(--td-comp-paddingLR-xxl);
  transition: all 0.3s ease;

  :deep(.t-card__header) {
    padding: 0;
    border-bottom: none;
  }

  :deep(.t-card__body) {
    padding: 0;
    margin-top: var(--td-comp-margin-xl);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: var(--td-comp-margin-xs);

    .card-title {
      font-size: var(--td-font-size-body-medium);
      color: var(--td-text-color-secondary);
    }

    .info-icon {
      font-size: 16px;
      color: var(--td-text-color-placeholder);
      cursor: help;
      transition: color 0.2s;

      &:hover {
        color: var(--td-brand-color);
      }
    }
  }

  .card-content {
    display: flex;
    align-items: center;

    .card-value {
      font-size: 32px;
      font-weight: 600;
      line-height: 1.2;
      color: var(--td-text-color-primary);
    }
  }

  &:hover {
    box-shadow: var(--td-shadow-2);
    transform: translateY(-2px);
  }
}

// 绿色卡片 - 当前累计业绩
.workbench-card--green {
  .card-content .card-value {
    color: #00a870 !important;
  }
}

// 黑色卡片 - 业绩平衡目标、业绩保底目标
.workbench-card--black {
  .card-content .card-value {
    color: #000000 !important;
  }
}

// 橙色卡片 - 平衡目标完成率
.workbench-card--orange {
  .card-content .card-value {
    color: #ed7b2f !important;
  }
}

// 红色卡片 - 距平衡目标还差
.workbench-card--red {
  .card-content .card-value {
    color: #e34d59 !important;
  }
}
.header-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  vertical-align: middle;
}

// 响应式设计
@media (max-width: 1200px) {
  .workbench-cards {
    .workbench-card-wrapper {
      flex: 1 1 calc(50% - 8px);
      min-width: 250px;
    }
  }

  .workbench-card {
    .card-content .card-value {
      font-size: 28px;
    }
  }
}

@media (max-width: 768px) {
  .workbench-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--td-comp-margin-lg);

    .header-actions {
      width: 100%;
    }
  }

  .workbench-cards {
    .workbench-card-wrapper {
      flex: 1 1 100%;
      min-width: 100%;
    }
  }

  .workbench-card {
    .card-content .card-value {
      font-size: 24px;
    }
  }
}

// 表格区域样式
.workbench-table-section {
  margin-top: var(--td-comp-margin-xxl);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--td-comp-margin-xl);

  &.table-header--inline {
    margin-bottom: var(--td-comp-margin-lg);
  }
}

.table-subtitle {
  font-size: var(--td-font-size-body-medium);
  color: var(--td-text-color-secondary);
  margin-bottom: var(--td-comp-margin-lg);
}

// 排名样式
.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e7e7e7;
  color: #000;
  font-size: 14px;
  font-weight: 600;
}

// 前三名样式
.rank-top {
  background: #0052d9;
  color: #fff;
}

// 文本颜色样式
.text-red {
  color: #e34d59;
}

.text-orange {
  color: #ed7b2f;
}

.text-grey {
  color: var(--td-text-color-placeholder);
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  max-width: 100%;
}

.visit-ranking-table,
.project-ranking-table {
  :deep(.t-table__cell--align-center) {
    text-align: center;
  }
}

.table-title {
  display: flex;
  align-items: baseline;
  gap: var(--td-comp-margin-s);

  h2 {
    margin: 0;
    font-size: var(--td-font-size-title-large);
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  .unit-label {
    font-size: var(--td-font-size-body-medium);
    color: var(--td-text-color-secondary);
  }
}

.table-actions {
  display: flex;
  align-items: center;
}

.workbench-table-card {
  :deep(.t-card__body) {
    padding: 0;
  }
}

.salesperson-table {
  :deep(.t-table__content) {
    font-size: var(--td-font-size-body-medium);
  }

  :deep(.t-table__header) {
    background: var(--td-bg-color-container);
  }

  :deep(.t-table th) {
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  :deep(.t-table td) {
    color: var(--td-text-color-primary);
  }

  // 数字右对齐
  :deep(.t-table__cell--align-right) {
    text-align: right;
  }

  // 完成率样式
  :deep(td[data-col-key='completionRate']) {
    .t-table__cell {
      text-align: right;
    }
  }
}
/* 关键：穿透 scoped 样式，覆盖 t-card 组件默认样式 */
:deep(.t-card) {
  /* 1. 添加默认持久化阴影（可自定义阴影参数） */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08) !important;
  /* 可选：保持卡片的过渡效果，让 hover 阴影变化更平滑 */
  transition: box-shadow 0.3s ease-in-out;
}

/* 可选：保留 hover 时阴影增强效果（更有交互感） */
:deep(.t-card:hover) {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.12) !important;
}
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--td-comp-margin-lg);

    .table-actions {
      width: 100%;
    }
  }
}
</style>
