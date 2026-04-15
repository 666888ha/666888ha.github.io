<template>
  <div class="customer-container">
    <!-- 顶部标签页 -->
    <t-tabs v-model="activeTab" class="customer-tabs" @change="handleTabChange">
      <t-tab-panel value="all" label="全部跟进"> </t-tab-panel>
      <t-tab-panel value="self" label="我的跟进"> </t-tab-panel>
      <t-tab-panel value="subordinate" label="下属跟进"> </t-tab-panel>
      <t-tab-panel value="collaborate" label="我协作的"> </t-tab-panel>
    </t-tabs>
    <!-- 搜索区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <!-- 客户名称输入 -->
        <div class="filter-item">
          <label class="filter-label">客户名称</label>
          <t-input v-model="searchForm.customerName" placeholder="请输入客户名称" />
        </div>
        <!-- 跟进阶段 -->
        <div class="filter-item">
          <label class="filter-label">跟进阶段</label>
          <t-select
            v-model="searchForm.followStage"
            placeholder="请选择跟进阶段"
            :options="followStageOptions"
            clearable
          />
        </div>
        <!-- 跟进人 -->
        <div class="filter-item">
          <label class="filter-label">跟进人</label>
          <t-select
            v-model="searchForm.followPerson"
            placeholder="请选择跟进人"
            :options="followPersonOptions"
            clearable
          />
        </div>
        <!-- 成交几率 -->
        <div class="filter-item">
          <label class="filter-label">成交几率</label>
          <t-select
            v-model="searchForm.dealProbability"
            placeholder="请选择成交几率"
            :options="dealProbabilityOptions"
            clearable
          />
        </div>

        <!-- 跟进时间 -->
        <div class="filter-item">
          <label class="filter-label">跟进时间</label>
          <t-date-range-picker v-model="searchForm.followTime" placeholder="请选择跟进时间" clearable />
        </div>
      </div>
      <div class="filter-right">
        <!-- 操作按钮 -->
        <t-button theme="primary" @click="handleSearch">查询</t-button>
        <t-button theme="default" @click="handleReset">重置</t-button>
        <t-button theme="default" text @click="handleAdvancedFilter">
          <span style="color: #165dff">Y. 高级筛选</span>
        </t-button>
      </div>
    </div>
    <!-- 操作按钮和表格控制 -->
    <div class="operation-bar">
      <div class="operation-left">
        <t-button theme="primary" @click="clickOper(1)">
          <template #icon>
            <t-icon name="add" />
          </template>
          添加
        </t-button>
      </div>
      <div class="operation-right">
        <t-checkbox>跟进模式</t-checkbox>
        <t-tooltip content="当对列表客户写跟进时,会自动将刚刚写过跟进的客户排到最后。" :show-arrow="false">
          <t-icon name="help-circle" />
        </t-tooltip>
        <t-tooltip content="排序">
          <t-button theme="default" variant="outline" @click="clickOper(4)">
            <template #icon>
              <t-icon name="swap" />
            </template>
            排序
          </t-button>
        </t-tooltip>
        <t-tooltip content="列表">
          <t-button theme="default" variant="outline" @click="clickOper(6)">
            <template #icon>
              <t-icon name="view-list" />
            </template>
            列表
          </t-button>
        </t-tooltip>
      </div>
    </div>

    <!-- 数据表格 -->
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
        <!-- 客户名称（与客户列表一致：单行省略 + 悬停展示全称） -->
        <template #customer_name="{ row }">
          <div class="customer-name-container">
            <t-tooltip :content="row.customer_name || ''" placement="top">
              <t-link theme="primary" class="customer-name-link" @click="clickOper(8, row)">
                {{ row.customer_name }}
              </t-link>
            </t-tooltip>
          </div>
        </template>

        <!-- 跟进人 -->
        <template #followPerson="{ row }">
          <t-link theme="primary" @click="clickOper(12, row)">
            {{ row.followPerson }}
          </t-link>
        </template>

        <!-- 审批状态 -->
        <template #approval_status_name="{ row }">
          <span class="status-dot" :class="[`status-${row.approval_status}`]"></span>
          {{ getApprovalStatusText(row.approval_status) }}
        </template>

        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="clickOper(12, row)"> 详情 </t-link>
            <t-link v-if="row.approval_status === 1" theme="primary" @click="clickOper(11, row)"> 报价 </t-link>
            <t-link v-if="!row.approval_status" theme="primary" @click="clickOper(5, row)"> 编辑 </t-link>
            <t-link v-if="row.approval_status === 1" theme="danger" @click="clickOper(10, row)"> 删除 </t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 底部操作和分页 -->
    <div class="footer-wrapper">
      <div class="footer-left">
        <t-button theme="default" variant="outline"
          ><t-checkbox v-model="selectAll" @change="handleSelectAll">全选</t-checkbox>
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
    <!-- 导入导出 -->
    <baseImport ref="listImport" />
    <baseExport ref="listExport" />
    <!-- 自定义列弹框 -->
    <custom-column-dialog
      ref="customColumnDialogRef"
      :all-columns-config="allColumnsConfig"
      :table-columns="tableColumns"
      :required-columns="requiredColumns"
      custom-key-name="followUpListKey"
      @confirm="handleColumnConfirm"
    />
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { delFollow, getAllFollowList } from '@/api/customer/customer';
import { copyToClipboard, getApprovalStatusText } from '@/utils/ruoyi';

defineOptions({
  name: 'ContactsList',
});

const customColumnDialogRef = ref(null);
const CustomColumnDialog = defineAsyncComponent(() => import('@/components/BaseCustomColumn/index.vue'));
const baseImport = defineAsyncComponent(() => import('@/components/baseImport/index.vue'));
const baseExport = defineAsyncComponent(() => import('@/components/baseExport/index.vue'));
const router = useRouter();
const listImport = ref(null);
const listExport = ref(null);
// 标签页
const activeTab = ref('all');
// 标签页切换
const handleTabChange = (value: string | number) => {
  activeTab.value = String(value);
  // 重新加载数据
  loadTableData();
};
// 搜索表单
const searchForm = ref({
  customerName: '',
  followStage: '',
  followPerson: '',
  dealProbability: '',
  followTime: [],
});

// 跟进阶段选项
const followStageOptions = ref([
  { label: '初步洽谈', value: 'initial' },
  { label: '深入沟通', value: 'follow' },
  { label: '产品报价', value: 'follow1' },
  { label: '流失', value: 'follow2' },
  { label: '成交', value: 'follow3' },
]);

// 跟进人选项
const followPersonOptions = ref([
  { label: '张三', value: 'zhangsan' },
  { label: '李四', value: 'lisi' },
  { label: '王五', value: 'wangwu' },
  { label: '赵六', value: 'zhaoliu' },
  { label: '孙七', value: 'sunqi' },
]);

// 成交几率选项
const dealProbabilityOptions = ref([
  { label: '10%', value: '10' },
  { label: '20%', value: '20' },
  { label: '30%', value: '30' },
  { label: '40%', value: '40' },
  { label: '50%', value: '50' },
  { label: '60%', value: '60' },
  { label: '70%', value: '70' },
  { label: '80%', value: '80' },
  { label: '90%', value: '90' },
  { label: '100%', value: '100' },
]);

// 所有可用的列定义（完整配置）
const allColumnsConfig: Record<string, PrimaryTableCol> = {
  rowSelect: {
    colKey: 'row-select',
    type: 'multiple',
    width: 50,
    fixed: 'left',
  },
  customer_name: {
    title: '客户名称',
    align: 'left',
    width: 200,
    colKey: 'customer_name',
    ellipsis: true,
    cell: 'customer_name',
  },
  follow_stage_name: {
    title: '跟进阶段',
    align: 'left',
    width: 120,
    colKey: 'follow_stage_name',
    ellipsis: true,
  },
  follow_content: {
    title: '跟进记录',
    align: 'left',
    width: 350,
    colKey: 'follow_content',
    ellipsis: true,
  },
  follow_user_name: {
    title: '跟进人',
    align: 'left',
    width: 120,
    colKey: 'follow_user_name',
    ellipsis: true,
    cell: 'follow_user_name',
  },
  follow_type_name: {
    title: '跟进方式',
    align: 'left',
    width: 120,
    colKey: 'follow_type_name',
    ellipsis: true,
  },
  create_time_text: {
    title: '跟进时间',
    align: 'left',
    width: 160,
    colKey: 'create_time_text',
  },
  unfollow_days_text: {
    title: '未跟进天数',
    align: 'left',
    width: 120,
    colKey: 'unfollow_days_text',
  },
  approval_status_name: {
    title: '审批状态',
    align: 'left',
    width: 120,
    colKey: 'approval_status_name',
    cell: 'approval_status_name',
  },
  operation: {
    title: '操作',
    align: 'left',
    width: 220,
    colKey: 'operation',
    fixed: 'right',
    cell: 'operation',
  },
};

// 表格列定义（默认显示）
const tableColumns = ref<PrimaryTableCol[]>([
  allColumnsConfig.rowSelect,
  allColumnsConfig.customer_name,
  allColumnsConfig.follow_stage_name,
  allColumnsConfig.follow_content,
  allColumnsConfig.follow_user_name,
  allColumnsConfig.follow_type_name,
  allColumnsConfig.create_time_text,
  allColumnsConfig.unfollow_days_text,
  allColumnsConfig.approval_status_name,
  allColumnsConfig.operation,
]);
const requiredColumns = ['customer_name', 'operation'];
// 表格数据
interface FollowUpRecordData {
  id: number;
  customer_name: string;
  follow_stage_name: string;
  follow_content: string;
  follow_user_name: string;
  follow_type_name: string;
  create_time_text: string;
  unfollow_days_text: number;
  approval_status_name: string;
}

// 表格数据（筛选后的数据）
const tableData = ref<FollowUpRecordData[]>([]);

// 选中的行
const selectedRowKeys = ref<(string | number)[]>([]);
const selectAll = ref(false);
const inverse = ref(false);

// 分页
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showPageSize: true,
  totalContent: false,
  pageSizeOptions: [10, 20, 50, 100],
});

// 加载状态
const tableLoading = ref(false);

// 行键
const rowKey = 'id';

// 查询操作
const handleSearch = () => {
  pagination.value.current = 1; // 重置到第一页
  loadTableData();
};

// 重置操作
const handleReset = () => {
  // 清空筛选表单
  searchForm.value.customerName = '';
  searchForm.value.followStage = '';
  searchForm.value.followPerson = '';
  searchForm.value.dealProbability = '';
  searchForm.value.followTime = [];
  loadTableData();
};

// 高级筛选
const handleAdvancedFilter = () => {
  MessagePlugin.info('高级筛选功能开发中');
};

// 操作
const clickOper = async (type: number, row) => {
  switch (type) {
    case 1: // 添加跟进
      router.push({
        path: '/followUpManagement/add',
      });
      break;
    case 4: // 排序
      MessagePlugin.info('排序功能开发中');
      break;
    case 5: // 编辑
      router.push({
        path: '/followUpManagement/edit',
        query: { id: row.id },
      });
      break;
    case 6: // 列表
      if (customColumnDialogRef.value) {
        customColumnDialogRef.value.show();
      }
      break;
    case 7: {
      // 拨打
      const success = await copyToClipboard(row.mobile);
      if (success) {
        MessagePlugin.success('复制成功');
      } else {
        MessagePlugin.error('复制失败，请手动复制');
      }
      break;
    }
    case 8: // 客户详情
      router.push({
        path: '/customerMange/customer/detail',
        query: { id: row.customer_id },
      });
      break;
    case 9: // 联系人详情
      router.push({
        path: '/customerMange/contacts/detail',
        query: { id: row.id },
      });
      break;
    case 10: // 删除跟进记录
      handleDeleteRecord(row);
      break;
    case 11: // 报价
      router.push({
        path: '/quotation/chooseProduct',
        query: { folowId: row.id },
      });
      break;
    case 12: // 跟进人详情
      router.push({
        path: '/followUpManagement/detail',
        query: { id: row.id },
      });
      break;
  }
};
// 删除记录
const handleDeleteRecord = (record: any) => {
  const confirmDia = DialogPlugin.confirm({
    header: '提示',
    body: '此操作将永久删除该跟进记录, 是否继续?',
    theme: 'warning',
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const res = await delFollow(record.id);
        if (res.code === 0 || res.code === 200) {
          MessagePlugin.success('删除成功!');
          confirmDia.hide();
          loadTableData();
        } else {
          MessagePlugin.error(res.msg || '删除失败');
          confirmDia.hide();
        }
      } catch (error: any) {
        console.error('删除跟进记录失败:', error);
        MessagePlugin.error(error.msg || '删除失败');
        confirmDia.hide();
      }
    },
    onCancel: () => {
      MessagePlugin.info('已取消删除');
      confirmDia.hide();
    },
  });
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

// 原始数据（用于筛选）
const originalTableData = ref<FollowUpRecordData[]>([]);

// 加载表格数据
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    // 构建请求参数
    const params: any = {
      type: activeTab.value,
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };

    // 添加搜索条件
    if (searchForm.value.customerName) {
      params.customer_name = searchForm.value.customerName.trim();
    }
    if (searchForm.value.followStage) {
      params.follow_stage = searchForm.value.followStage;
    }
    if (searchForm.value.followPerson) {
      params.follow_user_id = searchForm.value.followPerson;
    }
    if (searchForm.value.dealProbability) {
      params.deal_probability = searchForm.value.dealProbability;
    }
    if (Array.isArray(searchForm.value.followTime) && searchForm.value.followTime.length === 2) {
      params.start_time = searchForm.value.followTime[0];
      params.end_time = searchForm.value.followTime[1];
    }

    const response = await getAllFollowList(params);

    if (response.code === 0 || response.code === 200) {
      const data = response.data || {};
      const list = data.list || data.records || [];

      // 转换数据格式为表格需要的字段
      const mappedList: FollowUpRecordData[] = list;
      tableData.value = mappedList;
      originalTableData.value = mappedList;

      // 更新分页信息
      pagination.value = {
        ...pagination.value,
        total: data.count || data.total || 0,
      };
    } else {
      MessagePlugin.error(response.message || '获取跟进记录列表失败');
      tableData.value = [];
      originalTableData.value = [];
    }
  } catch (error: any) {
    MessagePlugin.error('获取跟进记录列表失败，请重试');
    tableData.value = [];
    originalTableData.value = [];
  } finally {
    tableLoading.value = false;
  }
};
// 处理自定义列确认
const handleColumnConfirm = (newColumns: any[]) => {
  // 更新表格列
  tableColumns.value = newColumns;
};

// 初始化
onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.customer-container {
  padding: var(--td-comp-paddingTB-lg) var(--td-comp-paddingLR-lg);
  background: #fff;
  padding: 20px;
}

.customer-tabs {
  margin-bottom: var(--td-comp-margin-lg);
  border-bottom: 1px solid #e7e7e7;

  :deep(.t-tabs__nav-item) {
    color: #999;
    font-size: 14px;
    padding: 12px 16px;
    transition: all 0.3s;

    &.t-is-active {
      color: #0052d9;
      font-weight: 500;

      .t-tabs__nav-item-wrapper::after {
        background-color: #0052d9;
      }
    }

    &:not(.t-is-active):hover {
      color: #333;
    }
  }

  :deep(.t-tabs__nav-scroll) {
    padding: 0;
  }
}

.search-card {
  margin-bottom: var(--td-comp-margin-lg);

  :deep(.t-card__body) {
    padding: var(--td-comp-paddingTB-lg) var(--td-comp-paddingLR-lg);
  }
}

.form-actions {
  display: flex;
  gap: var(--td-comp-margin-md);
  margin-top: var(--td-comp-margin-md);
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
  }
}

// 审批状态样式
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;

  &.status-approved {
    background-color: #00a870;
  }

  &.status-rejected {
    background-color: #e34d59;
  }
}
</style>
<style lang="less">
// 领取客户弹框样式（全局样式，因为 DialogPlugin 生成的弹框不在组件内）
.t-dialog__body {
  .claim-customer-dialog-content {
    display: flex;
    gap: 16px;
    padding: 8px 0;

    .dialog-icon-wrapper {
      flex-shrink: 0;

      .dialog-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #fa8c16;
        display: flex;
        align-items: center;
        justify-content: center;

        .icon-question {
          color: #fff;
          font-size: 24px;
          font-weight: 600;
          line-height: 1;
        }
      }
    }

    .dialog-text-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 4px;

      .main-question {
        font-size: 14px;
        color: var(--td-text-color-primary);
        font-weight: 500;
        line-height: 1.5;
      }
      .info-text {
        font-size: 12px;
        color: var(--td-text-color-placeholder);
        line-height: 1.5;
      }
    }
  }
}
</style>
