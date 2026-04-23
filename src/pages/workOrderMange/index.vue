<template>
  <div class="work-order-page-container">
    <!-- 顶部标签页 -->
    <t-tabs v-model="activeTab" class="work-order-tabs" @change="handleTabChange">
      <t-tab-panel value="all" label="全部工单"> </t-tab-panel>
      <t-tab-panel value="mine" label="我的工单"> </t-tab-panel>
    </t-tabs>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <!-- 搜索关键词 -->
        <div class="filter-item">
          <label class="filter-label">搜索关键词</label>
          <t-input v-model="searchForm.keyword" placeholder="请输入内容" clearable />
        </div>
        <!-- 工单状态 -->
        <div class="filter-item">
          <label class="filter-label">工单状态</label>
          <t-select v-model="searchForm.status" placeholder="请选择工单状态" :options="statusOptions" clearable />
        </div>
        <!-- 工单类型 -->
        <div class="filter-item">
          <label class="filter-label">工单类型</label>
          <t-select v-model="searchForm.type" placeholder="请选择工单类型" :options="typeOptions" clearable />
        </div>
      </div>
      <div class="filter-right">
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

    <!-- 工单列表 -->
    <t-card :bordered="false" class="table-card">
      <t-table
        :data="tableData"
        :columns="tableColumns"
        :row-key="rowKey"
        :selected-row-keys="selectedRowKeys"
        :loading="tableLoading"
        :hover="true"
        select-on-row-click
        @select-change="handleSelectChange"
      >
        <!-- 工单编号 -->
        <template #work_order_no="{ row }">
          {{ row.work_order_no || '-' }}
        </template>

        <!-- 工单标题 -->
        <template #work_order_title="{ row }">
          {{ row.work_order_title || '-' }}
        </template>

        <!-- 工单类型 -->
        <template #work_order_type="{ row }">
          {{ row.work_order_type || '-' }}
        </template>

        <!-- 处理人员 -->
        <template #handler_name="{ row }">
          {{ row.handler_name || '-' }}
        </template>

        <!-- 发起时间 -->
        <template #start_time="{ row }">
          {{ row.start_time || '-' }}
        </template>

        <!-- 完成时间 -->
        <template #end_time="{ row }">
          {{ row.end_time || '-' }}
        </template>

        <!-- 工单状态 -->
        <template #status="{ row }">
          <div class="status-cell">
            <span class="status-dot" :class="statusDotClass(row.status)"></span>
            <span>{{ row.status || '-' }}</span>
          </div>
        </template>

        <!-- 客户名称 -->
        <template #customer_name="{ row }">
          {{ row.customer_name || '-' }}
        </template>

        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-link theme="primary" @click="handleViewDetail(row)">详情</t-link>
        </template>

        <template #empty>
          <div style="text-align: center; padding: 40px 0; color: #999">暂无数据</div>
        </template>
      </t-table>
    </t-card>

    <!-- 底部分页 -->
    <div class="footer-wrapper">
      <div class="footer-left">
        <t-button theme="default" variant="outline">
          <t-checkbox v-model="selectAll" @change="handleSelectAll">全选</t-checkbox>
        </t-button>
        <t-button theme="default" variant="outline">
          <t-checkbox v-model="inverse" @change="handleInvertSelection">反选</t-checkbox>
        </t-button>
      </div>
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

    <t-drawer v-model:visible="detailVisible" header="工单详情" size="480px" @close="onDetailClose">
      <t-loading :loading="detailLoading" size="small">
        <div v-if="detailEntries.length" class="detail-kv">
          <div v-for="({ label, value }, idx) in detailEntries" :key="idx" class="detail-row">
            <span class="detail-k">{{ label }}</span>
            <span class="detail-v">{{ formatDetailValue(value) }}</span>
          </div>
        </div>
        <div v-else-if="!detailLoading" class="detail-empty">暂无详情数据</div>
      </t-loading>
    </t-drawer>
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import { getWorkOrderDetail, getWorkOrderList } from '@/api/workorder';

defineOptions({
  name: 'WorkOrderMange',
});

// 顶部标签页
const activeTab = ref<'all' | 'mine'>('all');

// 搜索表单（type 为工单系统字典 id，与后台一致时可筛类型）
const searchForm = ref({
  keyword: '',
  status: '',
  type: '' as number | '',
});

// 工单状态选项
const statusOptions = ref([
  { label: '全部', value: '' },
  { label: '待处理', value: '待处理' },
  { label: '处理中', value: '处理中' },
  { label: '已完结', value: '已完结' },
  { label: '被驳回', value: '被驳回' },
]);

// 工单类型选项（value 为工单系统 type 字典 id；未知 id 时可只选「全部」）
const typeOptions = ref<{ label: string; value: number | '' }[]>([
  { label: '全部', value: '' },
  { label: '普通工单', value: 1 },
  { label: '紧急工单', value: 2 },
  { label: '售后工单', value: 3 },
]);

// 表格数据（来自 /api/workorder/list）
const tableData = ref<any[]>([]);
const tableLoading = ref(false);

// 分页（与 t-pagination v-model 字段一致）
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showPageSize: true,
  totalContent: false,
  pageSizeOptions: [10, 20, 50, 100] as number[],
});

// 选中
const selectedRowKeys = ref<(string | number)[]>([]);
const selectAll = ref(false);
const inverse = ref(false);

// 表格列
const tableColumns: PrimaryTableCol[] = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'work_order_no', title: '工单编号', width: 180 },
  { colKey: 'work_order_title', title: '工单标题', width: 150 },
  { colKey: 'work_order_type', title: '工单类型', width: 120 },
  { colKey: 'handler_name', title: '处理人员', width: 120 },
  { colKey: 'start_time', title: '发起时间', width: 180 },
  { colKey: 'end_time', title: '完成时间', width: 180 },
  { colKey: 'status', title: '工单状态', width: 120 },
  { colKey: 'customer_name', title: '客户名称', width: 180 },
  { colKey: 'operation', title: '操作', width: 100, fixed: 'right' },
];

const rowKey = 'id';

/** 列表筛选用状态：UI 文案 → 工单接口参数 */
function statusToApi(ui: string): string {
  const map: Record<string, string> = {
    待处理: 'pending',
    处理中: 'unfinished',
    已完结: 'completed',
    被驳回: 'rejected',
  };
  const k = (ui || '').trim();
  return k && map[k] ? map[k] : 'all';
}

/** 工单返回文案 → 列表展示（与圆点样式一致） */
function normalizeStatusText(raw: string): string {
  const t = (raw || '').trim();
  if (t === '已完成' || t === '已完结') return '已完结';
  return t;
}

function mapListRow(raw: Record<string, any>) {
  const id = raw.id ?? raw.ID;
  const statusText = normalizeStatusText(String(raw.status_text ?? raw.status ?? ''));
  return {
    id,
    work_order_no: raw.ordersn ?? raw.work_order_no ?? '',
    work_order_title: raw.title ?? raw.work_order_title ?? '',
    work_order_type: raw.type_name ?? raw.work_order_type ?? '',
    handler_name: raw.handler_name ?? '',
    start_time: raw.create_time ?? raw.start_time ?? '',
    end_time: raw.wctime ?? raw.end_time ?? '',
    status: statusText || '-',
    customer_name: raw.kh_name ?? raw.customer_name ?? '',
  };
}

function statusDotClass(display: string) {
  if (display === '已完结') return 'status-finished';
  if (display === '被驳回') return 'status-failed';
  if (display === '待处理' || display === '处理中') return 'status-processing';
  return '';
}

// 详情抽屉
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailRaw = ref<Record<string, any> | null>(null);

/** 接口常把工单包在 item / data / detail 下，可能多层嵌套，解包到含 id、ordersn 等扁平字段为止 */
function unwrapWorkOrderDetailPayload(data: unknown): Record<string, any> | null {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return null;
  let cur = data as Record<string, any>;
  for (let depth = 0; depth < 6; depth++) {
    if (
      Object.prototype.hasOwnProperty.call(cur, 'id') ||
      Object.prototype.hasOwnProperty.call(cur, 'ordersn') ||
      Object.prototype.hasOwnProperty.call(cur, 'realname')
    ) {
      return cur;
    }
    const next =
      (cur.item && typeof cur.item === 'object' && !Array.isArray(cur.item) ? cur.item : null) ||
      (cur.data && typeof cur.data === 'object' && !Array.isArray(cur.data) ? cur.data : null) ||
      (cur.detail && typeof cur.detail === 'object' && !Array.isArray(cur.detail) ? cur.detail : null) ||
      (cur.record && typeof cur.record === 'object' && !Array.isArray(cur.record) ? cur.record : null) ||
      (cur.info && typeof cur.info === 'object' && !Array.isArray(cur.info) ? cur.info : null);
    if (!next) return cur;
    cur = next as Record<string, any>;
  }
  return cur;
}

/** 详情仅展示扁平字段，展示到「工单 ID」为止，不展示 wc_message、handler、sales 等 */
const DETAIL_FIELD_DEFS: { key: string; label: string }[] = [
  { key: 'ordersn', label: '工单编号' },
  { key: 'realname', label: '客户姓名' },
  { key: 'tel', label: '联系电话' },
  { key: 'danwei', label: '单位' },
  { key: 'sbname', label: '设备名称' },
  { key: 'address', label: '地址' },
  { key: 'message', label: '问题描述' },
  { key: 'create_time', label: '创建时间' },
  { key: 'id', label: '工单 ID' },
];

const detailEntries = computed((): { label: string; value: unknown }[] => {
  const o = detailRaw.value;
  if (!o || typeof o !== 'object') return [];
  const out: { label: string; value: unknown }[] = [];
  for (const { key, label } of DETAIL_FIELD_DEFS) {
    if (!Object.prototype.hasOwnProperty.call(o, key)) continue;
    const v = o[key];
    if (v !== null && v !== undefined && typeof v === 'object') continue;
    out.push({ label, value: v });
  }
  return out;
});

function formatDetailValue(v: unknown): string {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function onDetailClose() {
  detailRaw.value = null;
}

// 加载列表
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    const typeVal = searchForm.value.type;
    const typeNum = typeVal === '' ? undefined : Number(typeVal);

    const res = await getWorkOrderList({
      scope: activeTab.value,
      page: pagination.value.current,
      limit: pagination.value.pageSize,
      keyword: searchForm.value.keyword.trim(),
      status: statusToApi(searchForm.value.status),
      type: Number.isFinite(typeNum as number) && (typeNum as number) > 0 ? (typeNum as number) : undefined,
    });

    if (res.code !== 0 && res.code !== 200) {
      MessagePlugin.error((res as any).msg || (res as any).message || '加载工单列表失败');
      tableData.value = [];
      pagination.value.total = 0;
      return;
    }

    const payload = (res as any).data;
    const listRaw = payload?.list ?? payload?.rows ?? payload?.data ?? [];
    const total = Number(payload?.total ?? payload?.count ?? 0);

    const arr = Array.isArray(listRaw) ? listRaw : [];
    tableData.value = arr.map((item: Record<string, any>) => mapListRow(item));
    pagination.value.total = Number.isFinite(total) ? total : arr.length;
  } catch (e: any) {
    MessagePlugin.error(e?.message || '加载工单列表失败');
    tableData.value = [];
    pagination.value.total = 0;
  } finally {
    tableLoading.value = false;
  }
};

// 标签页切换
const handleTabChange = () => {
  pagination.value.current = 1;
  loadTableData();
};

// 查询
const handleSearch = () => {
  pagination.value.current = 1;
  loadTableData();
};

// 重置
const handleReset = () => {
  searchForm.value.keyword = '';
  searchForm.value.status = '';
  searchForm.value.type = '';
  pagination.value.current = 1;
  loadTableData();
};

// 选择变化
const handleSelectChange = (value: (string | number)[]) => {
  selectedRowKeys.value = value;
  selectAll.value = value.length === tableData.value.length && tableData.value.length > 0;
};

// 全选
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedRowKeys.value = tableData.value.map((item) => item.id);
  } else {
    selectedRowKeys.value = [];
  }
};

// 反选
const handleInvertSelection = () => {
  const allIds = tableData.value.map((item) => item.id);
  selectedRowKeys.value = allIds.filter((id) => !selectedRowKeys.value.includes(id));
  selectAll.value = selectedRowKeys.value.length === tableData.value.length;
};

// 分页变化
const handlePageChange = (current: number, pageInfo: any) => {
  pagination.value.current = current;
  pagination.value.pageSize = pageInfo.pageSize;
  loadTableData();
};

// 每页条数变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  pagination.value.current = 1;
  loadTableData();
};

// 查看详情
const handleViewDetail = async (row: any) => {
  const id = Number(row?.id);
  if (!Number.isFinite(id) || id <= 0) {
    MessagePlugin.warning('无效工单 id');
    return;
  }
  detailVisible.value = true;
  detailLoading.value = true;
  detailRaw.value = null;
  try {
    const res = await getWorkOrderDetail({ id, scope: activeTab.value });
    if (res.code === 0 || res.code === 200) {
      const d = (res as any).data;
      const unwrapped = unwrapWorkOrderDetailPayload(d);
      detailRaw.value =
        unwrapped ?? (d && typeof d === 'object' && !Array.isArray(d) ? (d as Record<string, any>) : { detail: d });
    } else {
      MessagePlugin.error((res as any).msg || (res as any).message || '加载详情失败');
    }
  } catch (e: any) {
    MessagePlugin.error(e?.message || '加载详情失败');
  } finally {
    detailLoading.value = false;
  }
};

onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.work-order-page-container {
  padding: 20px;
  background: #fff;
}

.work-order-tabs {
  margin-bottom: 16px;
}

.filter-bar {
  margin-bottom: 32px;
  margin-top: 16px;
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

.status-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-start;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #999;

    &.status-finished {
      background-color: #00a870;
    }

    &.status-processing {
      background-color: #2ba3ff;
    }

    &  .status-failed {
      background-color: #ff4d4f;
    }
  }
}

.detail-kv {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;

  .detail-k {
    color: var(--td-text-color-secondary);
  }

  .detail-v {
    color: var(--td-text-color-primary);
  }
}

.detail-empty {
  color: var(--td-text-color-placeholder);
  text-align: center;
  padding: 24px 0;
}
</style>
