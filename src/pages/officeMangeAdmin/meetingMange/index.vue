<template>
  <div class="meeting-page-container">
    <!-- 筛选区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <!-- 会议标题 -->
        <div class="filter-item">
          <label class="filter-label">会议标题</label>
          <t-input v-model="searchForm.topic" placeholder="请输入会议标题" clearable />
        </div>

        <!-- 部门 -->
        <div class="filter-item">
          <label class="filter-label">部门</label>
          <t-select
            v-model="searchForm.dept_id"
            placeholder="请选择部门"
            :options="deptOptions"
            clearable
            :loading="loadingDeptOptions"
          />
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

    <!-- 操作栏 -->
    <div class="operation-bar">
      <div class="operation-left">
        <t-button theme="primary" @click="handleCreate">
          <template #icon>
            <t-icon name="add" />
          </template>
          新建会议纪要
        </t-button>
        <t-button theme="default" variant="outline" @click="handleUpload">
          <template #icon>
            <t-icon name="upload" />
          </template>
          上传会议纪要
        </t-button>
      </div>
      <div class="operation-right"></div>
    </div>

    <!-- 会议列表 -->
    <t-card :bordered="false" class="table-card">
      <t-table
        :data="tableData"
        :columns="columns"
        row-key="id"
        :loading="tableLoading"
        :hover="true"
        :pagination="false"
        table-layout="auto"
      >
        <!-- 名称 -->
        <template #name="{ row }">
          {{ row.title || row.name || row.topic || '-' }}
        </template>

        <!-- 部门 -->
        <template #dept_name="{ row }">
          {{ row.dept_name || '-' }}
        </template>

        <!-- 备注 -->
        <template #remark="{ row }">
          {{ row.remark || '-' }}
        </template>

        <!-- 创建时间 -->
        <template #create_time="{ row }">
          {{ row.create_time || '-' }}
        </template>

        <!-- 修改时间 -->
        <template #update_time="{ row }">
          {{ row.update_time || '-' }}
        </template>

        <!-- 操作 -->
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="handleEdit(row)">修改</t-link>
            <t-link theme="danger" @click="handleDelete(row)">删除</t-link>
          </t-space>
        </template>

        <template #empty>
          <div style="text-align: center; padding: 40px 0; color: #999">暂无数据</div>
        </template>
      </t-table>
    </t-card>

    <!-- 新建 / 编辑会议纪要弹框 -->
    <meeting-dialog ref="meetingDialogRef" @success="loadTableData" />
    <!-- 上传会议纪要弹框 -->
    <upload-meeting-dialog ref="uploadMeetingDialogRef" @success="loadTableData" />

    <!-- 底部分页 -->
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
</template>
<script setup lang="ts">
import type { PrimaryTableCol, TablePaginationConfig } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import { deleteOfficeMeeting, getOfficeMeetingList } from '@/api/office';
import { getSystemDeptOptions } from '@/api/system/dept';

import MeetingDialog from './components/meetingDialog.vue';
import UploadMeetingDialog from './components/uploadMeetingDialog.vue';

defineOptions({
  name: 'MeetingMange',
});

// 筛选表单
const searchForm = ref({
  topic: '',
  dept_id: '',
});

// 部门选项
const deptOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingDeptOptions = ref(false);

// 表格数据
const tableData = ref<any[]>([]);
const tableLoading = ref(false);

// 分页
const pagination = ref<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showPageSize: true,
  totalContent: false,
  pageSizeOptions: [10, 20, 50, 100],
});

// 表格列
const columns: PrimaryTableCol[] = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'name', title: '名称', minWidth: 200, cell: 'name' },
  { colKey: 'dept_name', title: '部门', width: 140, cell: 'dept_name' },
  { colKey: 'remark', title: '备注', minWidth: 200, ellipsis: true, cell: 'remark' },
  { colKey: 'create_time', title: '创建时间', width: 180, cell: 'create_time' },
  { colKey: 'update_time', title: '修改时间', width: 180, cell: 'update_time' },
  { colKey: 'operation', title: '操作', width: 200, align: 'center', cell: 'operation' },
];

// 弹框引用
const meetingDialogRef = ref<InstanceType<typeof MeetingDialog> | null>(null);
const uploadMeetingDialogRef = ref<InstanceType<typeof UploadMeetingDialog> | null>(null);

// 加载部门选项
const loadDeptOptions = async () => {
  if (deptOptions.value.length > 0) return;
  loadingDeptOptions.value = true;
  try {
    const res = await getSystemDeptOptions();
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      deptOptions.value = Object.entries(data).map(([id, name]) => ({
        label: name as string,
        value: Number(id) || id,
      }));
    }
  } catch (error: any) {
    console.error('获取部门选项失败:', error);
    MessagePlugin.error('获取部门选项失败，请重试');
  } finally {
    loadingDeptOptions.value = false;
  }
};

// 加载会议列表
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    const params: any = {
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };
    if (searchForm.value.topic) {
      params.topic = searchForm.value.topic.trim();
    }
    if (searchForm.value.dept_id) {
      params.dept_id = searchForm.value.dept_id;
    }

    const res = await getOfficeMeetingList(params);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      tableData.value = data.list || data || [];
      pagination.value.total = data.count || data.total || 0;
    } else {
      MessagePlugin.error(res.msg || '获取会议列表失败');
      tableData.value = [];
      pagination.value.total = 0;
    }
  } catch (error: any) {
    console.error('获取会议列表失败:', error);
    MessagePlugin.error('获取会议列表失败，请重试');
    tableData.value = [];
    pagination.value.total = 0;
  } finally {
    tableLoading.value = false;
  }
};

// 查询
const handleSearch = () => {
  pagination.value.current = 1;
  loadTableData();
};

// 重置
const handleReset = () => {
  searchForm.value.topic = '';
  searchForm.value.dept_id = '';
  pagination.value.current = 1;
  loadTableData();
};

// 分页
const handlePageChange = (current: number, pageInfo: any) => {
  pagination.value.current = current;
  pagination.value.pageSize = pageInfo.pageSize;
  loadTableData();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  pagination.value.current = 1;
  loadTableData();
};

// 顶部按钮操作
const handleCreate = () => {
  meetingDialogRef.value?.show();
};

const handleUpload = () => {
  uploadMeetingDialogRef.value?.show();
};

// 行操作
const handleEdit = (row: any) => {
  meetingDialogRef.value?.show(row);
};

const handleRemark = (row: any) => {
  MessagePlugin.info(`备注会议【${row.name || row.topic || ''}】功能开发中`);
};

const handleDelete = (row: any) => {
  if (!row?.id) {
    MessagePlugin.warning('缺少会议ID，无法删除');
    return;
  }
  const confirmDia = DialogPlugin.confirm({
    header: '删除会议',
    body: `确定要删除会议【${row.title || row.name || row.topic || ''}】吗？删除后无法恢复。`,
    theme: 'warning',
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const res = await deleteOfficeMeeting(row.id);
        if (res.code === 0 || res.code === 200) {
          MessagePlugin.success(res.msg || '删除成功');
          confirmDia.hide();
          loadTableData();
        } else {
          MessagePlugin.error(res.msg || '删除失败');
        }
      } catch (error: any) {
        console.error('删除会议失败:', error);
        MessagePlugin.error(error?.response?.data?.msg || error?.message || '删除失败，请重试');
      }
    },
    onCancel: () => {
      confirmDia.hide();
    },
  });
};

onMounted(() => {
  loadDeptOptions();
  loadTableData();
});
</script>
<style lang="less" scoped>
.meeting-page-container {
  padding: 20px;
  background: #fff;
}

.filter-bar {
  margin-bottom: 32px;
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-content: center;

  .filter-left {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    flex: 1;
    margin-right: 20px;

    .filter-item {
      display: flex;
      align-items: center;
      column-gap: 10px;

      .filter-label {
        min-width: 80px;
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
</style>
