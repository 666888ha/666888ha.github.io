<template>
  <div class="system-user-container">
    <!-- 筛选区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <div class="filter-item">
          <label class="filter-label">用户名称</label>
          <t-input v-model="searchForm.username" placeholder="请输入用户账号或名称" clearable @enter="handleSearch" />
        </div>
      </div>
      <div class="filter-right">
        <t-button theme="primary" @click="handleSearch">查询</t-button>
        <t-button theme="default" variant="outline" @click="handleReset">重置</t-button>
      </div>
    </div>
    <!-- 操作按钮和表格控制 -->
    <div class="operation-bar">
      <div class="operation-left">
        <t-button theme="primary" @click="clickOper(1)">
          <template #icon>
            <t-icon name="add" />
          </template>
          添加用户
        </t-button>
      </div>
      <div class="operation-right"></div>
    </div>
    <!-- 列表区域 -->
    <t-card :bordered="false" class="table-card">
      <t-table :data="tableData" :columns="columns" row-key="id" :loading="tableLoading" table-layout="auto">
        <!-- 角色列 -->
        <template #role_name="{ row }">
          {{ row.role?.role_name || '-' }}
        </template>
        <!-- 所属部门列 -->
        <template #dept_name="{ row }">
          {{ row.dept_name || row.dept?.dept_name || '-' }}
        </template>
        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="handleEdit(row)">编辑</t-link>
            <t-link theme="danger" @click="handleDelete(row)">删除</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 分页 -->
    <div class="footer-wrapper">
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
    <!-- 新增 / 编辑用户弹框 -->
    <add-user-dialog ref="addUserDialogRef" @success="loadTableData" />
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import type { SystemEmployeeItem } from '@/api/system/user';
import { deleteSystemUser, getSystemEmployeeList } from '@/api/system/user';

import AddUserDialog from './components/addUserDialog.vue';

defineOptions({
  name: 'SystemUserList',
});

// 筛选表单
const searchForm = ref({
  username: '',
});

// 列表数据
const tableData = ref<SystemEmployeeItem[]>([]);
const tableLoading = ref(false);

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50, 100],
});

// 新增 / 编辑弹框
const addUserDialogRef = ref<InstanceType<typeof AddUserDialog> | null>(null);

// 列配置
const columns: PrimaryTableCol<SystemEmployeeItem>[] = [
  { colKey: 'username', title: '用户账号', minWidth: 160 },
  { colKey: 'real_name', title: '姓名', minWidth: 140 },
  { colKey: 'role_name', title: '角色', width: 160, cell: 'role_name' },
  { colKey: 'dept_name', title: '所属部门', width: 160, cell: 'dept_name' },
  { colKey: 'create_time', title: '创建时间', minWidth: 180 },
  { colKey: 'operation', title: '操作', width: 160, align: 'center', cell: 'operation' },
];

// 加载表格数据
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    const params = {
      username: searchForm.value.username || undefined,
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };
    const res = await getSystemEmployeeList(params);
    if (res.code === 0 || res.code === 200) {
      tableData.value = res.data || [];
      pagination.value.total = res.count || 0;
    } else {
      MessagePlugin.error(res.msg || '获取用户列表失败');
    }
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    MessagePlugin.error(error?.message || '获取用户列表失败，请重试');
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
  searchForm.value.username = '';
  pagination.value.current = 1;
  loadTableData();
};

// 页码改变
const handlePageChange = (page: number) => {
  pagination.value.current = page;
  loadTableData();
};

// 每页条数改变
const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  pagination.value.current = 1;
  loadTableData();
};

const handleEdit = (row: SystemEmployeeItem) => {
  addUserDialogRef.value?.show(row);
};

// 删除（占位，后续可接删除接口）
// 删除部门
const handleDelete = (row: SystemEmployeeItem) => {
  const confirmDia = DialogPlugin.confirm({
    header: '删除用户',
    body: `确定要删除用户【${row.username}】吗？删除后无法恢复。`,
    theme: 'warning',
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const res = await deleteSystemUser(row.id);
        if (res.code === 0 || res.code === 200) {
          MessagePlugin.success(res.msg || '删除成功');
          confirmDia.hide();
          loadTableData();
        } else {
          MessagePlugin.error(res.msg || '删除失败');
        }
      } catch (error: any) {
        console.error('删除用户失败:', error);
        MessagePlugin.error(error?.response?.data?.msg || error?.message || '删除失败，请重试');
      }
    },
    onCancel: () => {
      confirmDia.hide();
    },
  });
};

// 操作入口
const clickOper = (type: number, row?: SystemEmployeeItem) => {
  switch (type) {
    case 1: // 新增
      addUserDialogRef.value?.show();
      break;
    case 2: // 预留
    default:
      break;
  }
};

onMounted(() => {
  loadTableData();
});
</script>
<style scoped lang="less">
.system-user-container {
  padding: 20px;
  background: #fff;
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

.table-card {
  margin-top: 8px;
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.footer-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0 0;
}
</style>
