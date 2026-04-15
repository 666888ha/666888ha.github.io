<template>
  <div class="system-role-container">
    <!-- 筛选区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <div class="filter-item">
          <label class="filter-label">角色名称</label>
          <t-input v-model="searchForm.role_name" placeholder="请输入角色名称" clearable @enter="handleSearch" />
        </div>
        <div class="filter-item">
          <label class="filter-label">数据范围</label>
          <t-select
            v-model="searchForm.data_scope"
            :options="dataScopeOptions"
            placeholder="请选择数据范围"
            clearable
          />
        </div>
      </div>
      <div class="filter-right">
        <t-button theme="primary" @click="handleSearch">查询</t-button>
        <t-button theme="default" variant="outline" @click="handleReset">重置</t-button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="operation-bar">
      <div class="operation-left">
        <t-button theme="primary" @click="handleAdd">
          <template #icon>
            <t-icon name="add" />
          </template>
          添加角色
        </t-button>
      </div>
      <div class="operation-right"></div>
    </div>

    <!-- 列表 -->
    <t-card :bordered="false" class="table-card">
      <t-table :data="tableData" :columns="columns" row-key="id" :loading="tableLoading" table-layout="auto">
        <template #data_scope="{ row }">
          {{ dataScopeTextMap[row.data_scope] || row.data_scope || '-' }}
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="handleEdit(row)">编辑</t-link>
            <t-link v-if="row.id !== 3" theme="primary" @click="handleEditPermission(row)">编辑权限</t-link>
            <t-link v-if="row.id !== 3" theme="danger" @click="handleDelete(row)">删除</t-link>
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

    <!-- 角色新增/编辑弹框 -->
    <role-dialog ref="roleDialogRef" @success="loadTableData" />

    <!-- 权限编辑弹框 -->
    <permission-dialog ref="permissionDialogRef" @success="handlePermissionSuccess" />
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import type { SystemRoleItem } from '@/api/system/role';
import { deleteSystemRole, getSystemRoleList } from '@/api/system/role';

import PermissionDialog from './components/permissionDialog.vue';
import RoleDialog from './components/roleDialog.vue';

defineOptions({
  name: 'SystemRoleList',
});

// 筛选
const searchForm = ref({
  role_name: '',
  data_scope: '',
});

const dataScopeOptions = [
  { label: '全部(all)', value: 'all' },
  { label: '本人(self)', value: 'self' },
  { label: '本部门(dept)', value: 'dept' },
  { label: '本部门及子部门(office)', value: 'office' },
];

const dataScopeTextMap: Record<string, string> = {
  all: '全部数据',
  self: '本人数据',
  dept: '本部门数据',
  office: '本部门及子部门数据',
};

// 列表数据
const tableData = ref<SystemRoleItem[]>([]);
const tableLoading = ref(false);

// 分页
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50, 100],
});

// 表头
const columns: PrimaryTableCol<SystemRoleItem>[] = [
  { colKey: 'id', title: 'ID', width: 80 },
  { colKey: 'role_name', title: '角色名称', minWidth: 180 },
  { colKey: 'data_scope', title: '数据范围', minWidth: 160, cell: 'data_scope' },
  { colKey: 'create_time', title: '创建时间', minWidth: 180 },
  { colKey: 'operation', title: '操作', minWidth: 160, align: 'center', cell: 'operation' },
];

// 弹框引用
const roleDialogRef = ref<InstanceType<typeof RoleDialog> | null>(null);
const permissionDialogRef = ref<InstanceType<typeof PermissionDialog> | null>(null);
// 权限编辑弹框
const permissionDialogVisible = ref(false);
const currentRoleId = ref<number | string>('');
const currentRoleName = ref('');

// 加载数据
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    const params = {
      role_name: searchForm.value.role_name || undefined,
      data_scope: searchForm.value.data_scope || undefined,
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };
    const res = await getSystemRoleList(params);
    if (res.code === 0 || res.code === 200) {
      tableData.value = res.data || [];
      pagination.value.total = res.count || 0;
    } else {
      MessagePlugin.error(res.msg || '获取角色列表失败');
    }
  } catch (error: any) {
    console.error('获取角色列表失败:', error);
    MessagePlugin.error(error?.message || '获取角色列表失败，请重试');
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
  searchForm.value.role_name = '';
  searchForm.value.data_scope = '';
  pagination.value.current = 1;
  loadTableData();
};

// 分页事件
const handlePageChange = (page: number) => {
  pagination.value.current = page;
  loadTableData();
};
const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  pagination.value.current = 1;
  loadTableData();
};

// 添加
const handleAdd = () => {
  roleDialogRef.value?.show();
};

// 编辑
const handleEdit = (row: SystemRoleItem) => {
  roleDialogRef.value?.show(row);
};

const handleDelete = (row: SystemRoleItem) => {
  const confirmDia = DialogPlugin.confirm({
    header: '删除角色',
    body: `确定要删除角色【${row.role_name}】吗？删除后无法恢复。`,
    theme: 'warning',
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const res = await deleteSystemRole(row.id);
        if (res.code === 0 || res.code === 200) {
          MessagePlugin.success(res.msg || '删除成功');
          confirmDia.hide();
          loadTableData();
        } else {
          MessagePlugin.error(res.msg || '删除失败');
        }
      } catch (error: any) {
        console.error('删除角色失败:', error);
        MessagePlugin.error(error?.response?.data?.msg || error?.message || '删除失败，请重试');
      }
    },
    onCancel: () => {
      confirmDia.hide();
    },
  });
};

// 编辑权限
const handleEditPermission = (row: SystemRoleItem) => {
  permissionDialogRef.value?.show({ roleId: row.id, roleName: row.role_name });
};

// 权限保存成功
const handlePermissionSuccess = () => {
  MessagePlugin.success('权限编辑成功');
};

onMounted(() => {
  loadTableData();
});
</script>
<style scoped lang="less">
.system-role-container {
  padding: 20px;
  background: #fff;
}

.filter-bar {
  margin: 32px 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .filter-left {
    display: flex;
    gap: 24px;

    .filter-item {
      display: flex;
      align-items: center;
      column-gap: 10px;

      .filter-label {
        min-width: 80px;
        text-align: right;
      }
    }
  }

  .filter-right {
    display: flex;
    gap: 8px;
  }
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.table-card {
  margin-top: 8px;
}

.footer-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0 0;
}
</style>
