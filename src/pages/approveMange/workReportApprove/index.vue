<template>
  <div class="work-report-container">
    <!-- 标签页 -->
    <t-tabs v-model="activeTab" class="report-tabs" @change="handleMainTabChange">
      <t-tab-panel value="submitted" label="提交给我的">
        <!-- 提交给我的内容 -->
        <div v-if="activeTab === 'submitted'">
          <!-- 搜索筛选区域 -->
          <div class="filter-bar">
            <div class="filter-left">
              <!-- 搜索关键词 -->
              <div class="filter-item">
                <label class="filter-label">搜索关键词</label>
                <t-input v-model="searchForm.keyword" placeholder="请输入内容" clearable />
              </div>
              <!-- 提交人员 -->
              <div class="filter-item">
                <label class="filter-label">提交人员</label>
                <t-select
                  v-model="searchForm.user_id"
                  placeholder="请选择提交人员"
                  :options="userOptions"
                  :loading="loadingUsers"
                  filterable
                  clearable
                >
                </t-select>
              </div>
              <!-- 批阅状态 -->
              <div class="filter-item">
                <label class="filter-label">批阅状态</label>
                <t-select
                  v-model="searchForm.approve_status"
                  placeholder="请选择批阅状态"
                  :options="approveStatusOptions"
                  clearable
                />
              </div>
              <!-- 提交部门 -->
              <div class="filter-item">
                <label class="filter-label">提交部门</label>
                <t-select
                  v-model="searchForm.department_id"
                  placeholder="请选择提交部门"
                  :options="departmentOptions"
                  :loading="loadingDepartments"
                  filterable
                  clearable
                />
              </div>
              <!-- 报告类型 -->
              <div class="filter-item">
                <label class="filter-label">报告类型</label>
                <t-select
                  v-model="searchForm.report_type"
                  placeholder="请选择报告类型"
                  :options="reportTypeOptions"
                  clearable
                />
              </div>
            </div>
            <div class="filter-right">
              <!-- 操作按钮 -->
              <t-button theme="primary" @click="handleSearch">
                <template #icon>
                  <t-icon name="search" />
                </template>
                查询
              </t-button>
              <t-button theme="default" @click="handleReset">
                <template #icon>
                  <t-icon name="refresh" />
                </template>
                重置
              </t-button>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="operation-bar">
            <div class="operation-left">
              <t-dropdown :options="exportOptions" @click="handleExport">
                <t-button theme="default" variant="outline">
                  <template #icon>
                    <t-icon name="upload" />
                  </template>
                  导出
                  <template #suffixIcon>
                    <t-icon name="chevron-down" />
                  </template>
                </t-button>
              </t-dropdown>
            </div>
          </div>

          <!-- 数据表格 -->
          <t-card :bordered="false" class="table-card">
            <t-table :data="tableData" :columns="tableColumns" :row-key="rowKey" :loading="tableLoading" :hover="true">
              <!-- 报告标题 -->
              <template #report_title="{ row }">
                {{ row.report_title || row.report_no || '-' }}
              </template>

              <!-- 提交人员 -->
              <template #user_name="{ row }">
                <div class="user-cell">
                  <t-icon name="user" class="user-icon" />
                  <span>{{ row.user_name || '-' }}</span>
                </div>
              </template>

              <!-- 报告类型 -->
              <template #report_type="{ row }">
                {{ getReportTypeText(row.report_type) }}
              </template>

              <!-- 批阅状态 -->
              <template #approve_status="{ row }">
                <div class="status-cell">
                  <span
                    class="status-dot"
                    :class="{
                      'status-pending': row.approve_status === 0,
                      'status-approved': row.approve_status === 1,
                    }"
                  ></span>
                  <span>{{ getApproveStatusText(row.approve_status) }}</span>
                </div>
              </template>

              <!-- 提交时间 -->
              <template #submit_time="{ row }">
                <div class="time-cell">
                  <t-icon name="time" class="time-icon" />
                  <span>{{ formatDateTime(row.submit_time) }}</span>
                </div>
              </template>

              <!-- 操作列 -->
              <template #operation="{ row }">
                <t-button theme="primary" variant="text" @click="handleViewDetail(row, 1)"> 详情 </t-button>
                <t-button
                  v-if="row.approve_status === 0"
                  theme="primary"
                  variant="text"
                  @click="handleViewDetail(row, 2)"
                >
                  审批
                </t-button>
              </template>

              <template #empty>
                <div style="text-align: center; padding: 40px 0; color: #999">暂无数据</div>
              </template>
            </t-table>
          </t-card>

          <!-- 底部操作和分页 -->
          <div class="footer-wrapper">
            <div class="footer-left"></div>
            <div class="footer-right">
              <t-pagination
                v-model="pagination.current"
                v-model:page-size="pagination.pageSize"
                :total="pagination.total"
                :show-page-size="pagination.showPageSize"
                :page-size-options="pagination.pageSizeOptions"
                :total-content="false"
                @current-change="handlePageChange"
                @page-size-change="handlePageSizeChange"
              />
            </div>
          </div>
        </div>
      </t-tab-panel>
      <t-tab-panel value="statistics" label="报告统计">
        <!-- 报告统计内容 -->
        <div v-if="activeTab === 'statistics'">
          <!-- 子标签页：日报、周报、月报 -->
          <t-tabs v-model="statisticsType" class="statistics-sub-tabs" @change="handleStatisticsTypeChange">
            <t-tab-panel value="1" label="日报"> </t-tab-panel>
            <t-tab-panel value="2" label="周报"> </t-tab-panel>
            <t-tab-panel value="3" label="月报"> </t-tab-panel>
          </t-tabs>

          <!-- 周期导航 -->
          <div class="cycle-navigation">
            <t-button theme="default" variant="outline" @click="handleCyclePrev">
              <template #icon>
                <t-icon name="chevron-left" />
              </template>
            </t-button>
            <div class="cycle-display">{{ cycleDisplayText }}</div>
            <t-button theme="default" variant="outline" @click="handleCycleNext">
              <template #icon>
                <t-icon name="chevron-right" />
              </template>
            </t-button>
          </div>

          <!-- 统计表格 -->
          <t-card :bordered="false" class="table-card">
            <t-table
              :data="statTableData"
              :columns="statTableColumns"
              :row-key="statRowKey"
              :loading="statTableLoading"
              :hover="true"
            >
              <!-- 姓名列 -->
              <template #user_name="{ row }">
                {{ row.user_name || '-' }}
              </template>

              <!-- 动态日期列 -->
              <template v-for="col in dynamicDateColumns" :key="col.colKey" #[col.colKey]="{ row }">
                <div class="submit-status-cell">
                  <t-icon
                    v-if="row[col.colKey]?.has_submit === 1"
                    name="check-circle"
                    class="status-icon status-submitted"
                  />
                  <t-icon
                    v-else-if="row[col.colKey]?.has_submit === 0"
                    name="error-circle"
                    class="status-icon status-not-submitted"
                  />
                  <span>{{ row[col.colKey]?.has_submit === 1 ? '已提交' : '未提交' }}</span>
                </div>
              </template>

              <!-- 完成率列 -->
              <template #submit_rate="{ row }">
                {{ row.submit_rate || '0%' }}
              </template>

              <template #empty>
                <div style="text-align: center; padding: 40px 0; color: #999">暂无数据</div>
              </template>
            </t-table>
          </t-card>
        </div>
      </t-tab-panel>
    </t-tabs>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { getEmployeeList } from '@/api/customer/customer';
import { deleteWorkReport, exportWorkReportList, getWorkReportList, getWorkReportStat } from '@/api/workReport';

defineOptions({
  name: 'WorkReport',
});
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

const router = useRouter();

// 当前激活的主标签页
const activeTab = ref('submitted');

// 报告统计子标签页类型（1日报/2周报/3月报）
const statisticsType = ref('1');

// 统计周期相关
const currentCycle = ref({
  year: dayjs().year(),
  month: dayjs().month() + 1,
  week: dayjs().isoWeek(),
});

// 统计表格数据
const statTableData = ref<any[]>([]);
const statTableLoading = ref(false);
const statRowKey = 'user_id';

// 动态日期列
const dynamicDateColumns = ref<PrimaryTableCol[]>([]);

// 搜索表单
const searchForm = reactive({
  keyword: '',
  user_id: '',
  approve_status: '',
  department_id: '',
  report_type: '',
});

// 表格数据
const tableData = ref<any[]>([]);
const tableLoading = ref(false);

// 分页信息
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showPageSize: true,
  totalContent: false,
  pageSizeOptions: [10, 20, 50, 100],
});

// 报告类型选项
const reportTypeOptions = [
  { label: '日报', value: 1 },
  { label: '周报', value: 2 },
  { label: '月报', value: 3 },
];

// 批阅状态选项
const approveStatusOptions = [
  { label: '待批阅', value: 0 },
  { label: '已批阅', value: 1 },
];

// 用户选项
const userOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingUsers = ref(false);

// 部门选项
const departmentOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingDepartments = ref(false);

// 导出选项
const exportOptions = [
  { content: '导出当前页', value: 'current' },
  { content: '导出全部', value: 'all' },
];

// 表格列配置
const tableColumns: PrimaryTableCol[] = [
  { colKey: 'report_title', title: '报告标题', width: 200, ellipsis: true },
  { colKey: 'user_name', title: '提交人员', width: 150 },
  { colKey: 'report_type', title: '报告类型', width: 120 },
  { colKey: 'approve_status', title: '批阅状态', width: 120 },
  { colKey: 'submit_time', title: '提交时间', width: 180 },
  { colKey: 'operation', title: '操作', width: 100, fixed: 'right' },
];

const rowKey = 'id';

// 获取报告类型文本
const getReportTypeText = (type: number | undefined | null) => {
  if (type === 1) return '日报';
  if (type === 2) return '周报';
  if (type === 3) return '月报';
  return '-';
};

// 获取批阅状态文本
const getApproveStatusText = (status: number | undefined | null) => {
  if (status === 0) return '未批阅';
  if (status === 1) return '已批阅';
  return '-';
};

// 格式化日期时间
const formatDateTime = (dateTime: string | null | undefined) => {
  if (!dateTime) return '-';
  return dateTime;
};

// 加载用户列表
const loadUserOptions = async () => {
  if (loadingUsers.value || userOptions.value.length > 0) {
    return;
  }
  loadingUsers.value = true;
  try {
    const res = await getEmployeeList({
      limit: 1000,
    });
    if (res.code === 0 || res.code === 200) {
      const data = res.data || [];
      userOptions.value = data.map((emp: any) => ({
        label: emp.real_name || '',
        value: emp.id || '',
      }));
    }
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
  } finally {
    loadingUsers.value = false;
  }
};

// 加载部门列表（这里需要根据实际API调整）
const loadDepartmentOptions = async () => {
  if (loadingDepartments.value || departmentOptions.value.length > 0) {
    return;
  }
  loadingDepartments.value = true;
  try {
    // TODO: 调用部门列表接口
    // const res = await getDepartmentList();
    // if (res.code === 0 || res.code === 200) {
    //   const data = res.data || [];
    //   departmentOptions.value = data.map((dept: any) => ({
    //     label: dept.name || '',
    //     value: dept.id || '',
    //   }));
    // }
  } catch (error: any) {
    console.error('获取部门列表失败:', error);
  } finally {
    loadingDepartments.value = false;
  }
};

function buildWorkReportListParams(withPaging: boolean): Record<string, any> {
  const params: Record<string, any> = {};
  if (withPaging) {
    params.page = pagination.current;
    params.limit = pagination.pageSize;
  }
  if (searchForm.keyword) {
    params.keyword = searchForm.keyword;
  }
  if (searchForm.user_id) {
    params.user_id = searchForm.user_id;
  }
  if (searchForm.approve_status !== '') {
    params.approve_status = Number(searchForm.approve_status);
  }
  if (searchForm.department_id) {
    params.department_id = searchForm.department_id;
  }
  if (searchForm.report_type !== '') {
    params.report_type = Number(searchForm.report_type);
  }
  return params;
}

async function saveBlobAsDownload(blob: Blob, filename: string) {
  if (blob.type && (blob.type.includes('application/json') || blob.type.includes('text/json'))) {
    const text = await blob.text();
    try {
      const j = JSON.parse(text);
      throw new Error((j as any)?.msg || (j as any)?.message || '导出失败');
    } catch (e: any) {
      if (e?.message === '导出失败' || e?.message?.includes('失败')) {
        throw e;
      }
      throw new Error(text.slice(0, 200));
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 加载表格数据
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    const params = buildWorkReportListParams(true);
    const res = await getWorkReportList(params);
    if (res.code === 0 || res.code === 200) {
      tableData.value = res.data?.list || [];
      pagination.total = res.data?.count || 0;
    } else {
      MessagePlugin.error(res.msg || '获取报告列表失败');
      tableData.value = [];
    }
  } catch (error: any) {
    console.error('获取报告列表失败:', error);
    MessagePlugin.error('获取报告列表失败，请重试');
  } finally {
    tableLoading.value = false;
  }
};

// 查询
const handleSearch = () => {
  pagination.current = 1;
  loadTableData();
};

// 重置
const handleReset = () => {
  searchForm.keyword = '';
  searchForm.user_id = '';
  searchForm.approve_status = '';
  searchForm.department_id = '';
  searchForm.report_type = '';
  pagination.current = 1;
  loadTableData();
};

// 导出（当前页 = 带 ids；全部 = 仅筛选条件最多 5000 条）
const handleExport = async (data: any) => {
  const mode = data?.value || 'all';
  tableLoading.value = true;
  try {
    const params = buildWorkReportListParams(false);
    if (mode === 'current' && tableData.value.length > 0) {
      params.ids = tableData.value.map((r: any) => r.id).filter(Boolean).join(',');
    }
    const blob = await exportWorkReportList(params);
    await saveBlobAsDownload(blob, `工作报告列表_${Date.now()}.csv`);
    MessagePlugin.success('导出已开始下载');
  } catch (e: any) {
    MessagePlugin.error(e?.message || '导出失败');
  } finally {
    tableLoading.value = false;
  }
};

// 查看详情
const handleViewDetail = (row: any, type: number | undefined) => {
  if (type === 1) {
    router.push(`/approveMange/workReportApprove/approveDetail?id=${row.id}`);
  } else {
    router.push(`/approveMange/workReportApprove/approve?id=${row.id}`);
  }
};

// 分页变化
const handlePageChange = (current: number, pageInfo: any) => {
  pagination.current = current;
  pagination.pageSize = pageInfo.pageSize;
  loadTableData();
};

// 每页条数变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.current = 1;
  loadTableData();
};

// 添加成功回调
const handleAddSuccess = () => {
  // 刷新列表数据
  loadTableData();
};

// 主标签页切换
const handleMainTabChange = (value: string | number) => {
  activeTab.value = String(value);
  if (value === 'statistics') {
    // 切换到统计tab时，初始化统计表格
    // 重置周期
    const now = dayjs();
    currentCycle.value = {
      year: now.year(),
      month: now.month() + 1,
      week: now.isoWeek(),
    };
    initStatisticsColumns();
    loadStatisticsData();
  } else {
    // 切换到提交给我的tab时，加载列表数据
    loadTableData();
  }
};

// 统计类型切换
const handleStatisticsTypeChange = (value: string | number) => {
  statisticsType.value = String(value);
  // 重置周期
  const now = dayjs();
  currentCycle.value = {
    year: now.year(),
    month: now.month() + 1,
    week: now.isoWeek(),
  };
  initStatisticsColumns();
  loadStatisticsData();
};

// 周期显示文本
const cycleDisplayText = computed(() => {
  const type = Number(statisticsType.value);
  if (type === 1) {
    // 日报：显示周信息
    const weekStart = dayjs().year(currentCycle.value.year).isoWeek(currentCycle.value.week).startOf('isoWeek');
    const weekEnd = weekStart.endOf('isoWeek');
    return `${currentCycle.value.year}年第${currentCycle.value.week}周`;
  } else if (type === 2) {
    // 周报：显示月份
    return `${currentCycle.value.year}年${currentCycle.value.month}月`;
  } else if (type === 3) {
    // 月报：显示年份
    return `${currentCycle.value.year}年`;
  }
  return '';
});

// 初始化统计表格列
const initStatisticsColumns = () => {
  const type = Number(statisticsType.value);
  const columns: PrimaryTableCol[] = [{ colKey: 'user_name', title: '姓名', width: 120, fixed: 'left' }];

  if (type === 1) {
    // 日报：显示周一到周日
    const weekStart = dayjs().year(currentCycle.value.year).isoWeek(currentCycle.value.week).startOf('isoWeek');
    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    for (let i = 0; i < 7; i++) {
      const date = weekStart.add(i, 'day');
      const dayName = weekDays[i];
      const dateStr = date.format('M/D');
      columns.push({
        colKey: `day_${i}`,
        title: `${dayName} ${dateStr}`,
        width: 120,
        align: 'center',
      });
    }
  } else if (type === 2) {
    // 周报：显示该月的各个周
    const monthStart = dayjs(`${currentCycle.value.year}-${String(currentCycle.value.month).padStart(2, '0')}-01`);
    const monthEnd = monthStart.endOf('month');
    const weeks: Array<{ start: dayjs.Dayjs; end: dayjs.Dayjs; index: number }> = [];
    let currentWeekStart = monthStart.startOf('isoWeek');
    let weekIndex = 0;

    // 如果月初的第一周开始日期在月初之前，从月初开始
    if (currentWeekStart.isBefore(monthStart)) {
      currentWeekStart = monthStart;
    }

    while (currentWeekStart.isBefore(monthEnd) || currentWeekStart.isSame(monthEnd, 'day')) {
      const weekEnd = currentWeekStart.endOf('isoWeek');
      const actualEnd = weekEnd.isAfter(monthEnd) ? monthEnd : weekEnd;

      weeks.push({
        start: currentWeekStart,
        end: actualEnd,
        index: weekIndex,
      });

      currentWeekStart = weekEnd.add(1, 'day');
      weekIndex++;

      // 防止无限循环
      if (weekIndex > 6) break;
    }

    weeks.forEach((week) => {
      const startStr = week.start.format('MM-DD');
      const endStr = week.end.format('MM-DD');
      columns.push({
        colKey: `week_${week.index}`,
        title: `${startStr} ~ ${endStr}`,
        width: 140,
        align: 'center',
      });
    });
  } else if (type === 3) {
    // 月报：显示1月到12月
    for (let i = 1; i <= 12; i++) {
      columns.push({
        colKey: `month_${i}`,
        title: `${String(i).padStart(2, '0')}月`,
        width: 100,
        align: 'center',
      });
    }
  }

  columns.push({ colKey: 'submit_rate', title: '完成率', width: 100, align: 'center', fixed: 'right' });
  dynamicDateColumns.value = columns.slice(1, -1); // 排除姓名和完成率列
  statTableColumns.value = columns;
};

// 统计表格列
const statTableColumns = ref<PrimaryTableCol[]>([]);

// 周期导航：上一周期
const handleCyclePrev = () => {
  const type = Number(statisticsType.value);
  if (type === 1) {
    // 日报：上一周
    if (currentCycle.value.week > 1) {
      currentCycle.value.week--;
    } else {
      currentCycle.value.year--;
      currentCycle.value.week = dayjs(`${currentCycle.value.year}-12-31`).isoWeek();
    }
  } else if (type === 2) {
    // 周报：上一月
    if (currentCycle.value.month > 1) {
      currentCycle.value.month--;
    } else {
      currentCycle.value.year--;
      currentCycle.value.month = 12;
    }
  } else if (type === 3) {
    // 月报：上一年
    currentCycle.value.year--;
  }
  // 重新初始化列（周报和月报的列会根据周期变化）
  if (type === 2 || type === 3) {
    initStatisticsColumns();
  }
  loadStatisticsData();
};

// 周期导航：下一周期
const handleCycleNext = () => {
  const type = Number(statisticsType.value);
  if (type === 1) {
    // 日报：下一周
    const maxWeek = dayjs(`${currentCycle.value.year}-12-31`).isoWeek();
    if (currentCycle.value.week < maxWeek) {
      currentCycle.value.week++;
    } else {
      currentCycle.value.year++;
      currentCycle.value.week = 1;
    }
  } else if (type === 2) {
    // 周报：下一月
    if (currentCycle.value.month < 12) {
      currentCycle.value.month++;
    } else {
      currentCycle.value.year++;
      currentCycle.value.month = 1;
    }
  } else if (type === 3) {
    // 月报：下一年
    currentCycle.value.year++;
  }
  // 重新初始化列（周报和月报的列会根据周期变化）
  if (type === 2 || type === 3) {
    initStatisticsColumns();
  }
  loadStatisticsData();
};

// 加载统计数据
const loadStatisticsData = async () => {
  statTableLoading.value = true;
  try {
    const type = Number(statisticsType.value);
    let cycle = '';
    if (type === 1) {
      // 日报：Y-m格式，使用当前周所在的月份
      const weekStart = dayjs().year(currentCycle.value.year).isoWeek(currentCycle.value.week).startOf('isoWeek');
      cycle = weekStart.format('YYYY-MM');
    } else if (type === 2) {
      // 周报：Y-m格式
      cycle = `${currentCycle.value.year}-${String(currentCycle.value.month).padStart(2, '0')}`;
    } else if (type === 3) {
      // 月报：Y格式
      cycle = String(currentCycle.value.year);
    }

    const params: any = {
      report_type: type,
      cycle,
    };

    const res = await getWorkReportStat(params);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      const statList = data.stat_list || [];

      // 获取用户列表
      const users = userOptions.value.length > 0 ? userOptions.value : [];
      if (users.length === 0) {
        await loadUserOptions();
      }

      // 构建日期到列键的映射
      const dateToColKeyMap = new Map<string, string>();

      if (type === 1) {
        // 日报：周一到周日
        const weekStart = dayjs().year(currentCycle.value.year).isoWeek(currentCycle.value.week).startOf('isoWeek');
        for (let i = 0; i < 7; i++) {
          const date = weekStart.add(i, 'day');
          dateToColKeyMap.set(date.format('YYYY-MM-DD'), `day_${i}`);
        }
      } else if (type === 2) {
        // 周报：该月的各个周
        const monthStart = dayjs(`${currentCycle.value.year}-${String(currentCycle.value.month).padStart(2, '0')}-01`);
        const monthEnd = monthStart.endOf('month');
        let currentWeekStart = monthStart.startOf('isoWeek');
        let weekIndex = 0;

        // 如果月初的第一周开始日期在月初之前，从月初开始
        if (currentWeekStart.isBefore(monthStart)) {
          currentWeekStart = monthStart;
        }

        while (currentWeekStart.isBefore(monthEnd) || currentWeekStart.isSame(monthEnd, 'day')) {
          const weekEnd = currentWeekStart.endOf('isoWeek');
          const actualEnd = weekEnd.isAfter(monthEnd) ? monthEnd : weekEnd;

          // 将该周的所有日期映射到对应的列
          let currentDate = currentWeekStart;
          while (currentDate.isBefore(actualEnd) || currentDate.isSame(actualEnd, 'day')) {
            dateToColKeyMap.set(currentDate.format('YYYY-MM-DD'), `week_${weekIndex}`);
            currentDate = currentDate.add(1, 'day');
          }

          currentWeekStart = weekEnd.add(1, 'day');
          weekIndex++;

          // 防止无限循环
          if (weekIndex > 6) break;
        }
      } else if (type === 3) {
        // 月报：1月到12月
        for (let month = 1; month <= 12; month++) {
          const monthStart = dayjs(`${currentCycle.value.year}-${String(month).padStart(2, '0')}-01`);
          const monthEnd = monthStart.endOf('month');
          let currentDate = monthStart;
          while (currentDate.isBefore(monthEnd) || currentDate.isSame(monthEnd, 'day')) {
            dateToColKeyMap.set(currentDate.format('YYYY-MM-DD'), `month_${month}`);
            currentDate = currentDate.add(1, 'day');
          }
        }
      }

      // 构建表格数据
      // 根据API返回的数据，假设返回的是当前用户的统计数据
      // 如果API返回的是所有用户的数据，需要调整数据结构
      const rowData: any = {
        user_id: '',
        user_name: '当前用户',
        submit_rate: data.submit_rate || '0%',
      };

      // 初始化所有列的数据
      dynamicDateColumns.value.forEach((col) => {
        rowData[col.colKey] = { has_submit: 0 };
      });

      // 填充统计数据
      statList.forEach((stat: any) => {
        const colKey = dateToColKeyMap.get(stat.date);
        if (colKey && rowData[colKey] !== undefined) {
          rowData[colKey] = {
            has_submit: stat.has_submit || 0,
          };
        }
      });

      // 如果API返回了用户列表，为每个用户创建一行
      // 目前先使用单行数据
      statTableData.value = [rowData];
    } else {
      MessagePlugin.error(res.msg || '获取报告统计失败');
      statTableData.value = [];
    }
  } catch (error: any) {
    console.error('获取报告统计失败:', error);
    MessagePlugin.error('获取报告统计失败，请重试');
    statTableData.value = [];
  } finally {
    statTableLoading.value = false;
  }
};
// 删除报告
const handleDelete = (row) => {
  const id = row.id;
  if (!id) {
    MessagePlugin.error('缺少报告ID');
    return;
  }

  const confirmDialog = DialogPlugin.confirm({
    header: '删除报告',
    body: '确定要删除该报告吗？删除后无法恢复。',
    onConfirm: async () => {
      try {
        const res = await deleteWorkReport(id);
        if (res.code === 0 || res.code === 200) {
          MessagePlugin.success('删除成功');
          confirmDialog.destroy();
          loadTableData(); // 刷新列表
        } else {
          MessagePlugin.error(res.msg || '删除失败');
        }
      } catch (error: any) {
        MessagePlugin.error(error.message || '删除失败，请重试');
      }
    },
  });
};
onMounted(() => {
  loadUserOptions();
  loadDepartmentOptions();
  if (activeTab.value === 'statistics') {
    initStatisticsColumns();
    loadStatisticsData();
  } else {
    loadTableData();
  }
});
</script>
<style lang="less" scoped>
.work-report-container {
  padding: var(--td-comp-paddingTB-lg) var(--td-comp-paddingLR-lg);
  background: #fff;
  padding: 20px;
}

.report-tabs {
  margin-bottom: var(--td-comp-margin-lg);
}

.filter-bar {
  margin-bottom: 32px;
  margin-top: 32px;
  display: flex;
  justify-content: space-between;
  align-content: center;

  .filter-left {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    flex: 1;
    margin-right: 20px;

    .filter-item {
      display: flex;
      align-items: center;
      column-gap: 10px;

      .filter-label {
        min-width: 100px;
        text-align: right;
        flex-shrink: 0;
      }
    }
  }

  .filter-right {
    display: flex;
    flex-wrap: wrap;
    gap: var(--td-comp-margin-md);
  }
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--td-comp-margin-lg);

  .operation-left {
    display: flex;
    gap: var(--td-comp-margin-md);
  }

  .operation-right {
    display: flex;
    gap: var(--td-comp-margin-xs);
    align-items: center;
  }
}

.table-card {
  :deep(.t-table) {
    .t-table__cell {
      padding: var(--td-comp-paddingTB-md) var(--td-comp-paddingLR-md);
    }
  }
}

.footer-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--td-comp-margin-lg);
  background: #fff;

  .footer-left {
    display: flex;
    align-items: center;
    gap: var(--td-comp-margin-md);
  }

  .footer-right {
    display: flex;
    align-items: center;
  }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .user-icon {
    color: #666;
  }
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #999;

    &.status-pending {
      background-color: #ffa940;
    }

    &.status-approved {
      background-color: #00a870;
    }
  }
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .time-icon {
    color: #666;
  }
}

.statistics-sub-tabs {
  margin-bottom: 16px;
}

.cycle-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;

  .cycle-display {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    min-width: 150px;
    text-align: center;
  }
}

.submit-status-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  .status-icon {
    font-size: 16px;

    &.status-submitted {
      color: #00a870;
    }

    &.status-not-submitted {
      color: #ff4d4f;
    }
  }
}
</style>
