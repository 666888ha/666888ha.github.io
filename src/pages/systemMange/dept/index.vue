<template>
  <div class="system-dept-container">
    <!-- 操作按钮 -->
    <div class="operation-bar">
      <div class="operation-left">
        <t-button theme="primary" @click="handleAdd">
          <template #icon>
            <t-icon name="add" />
          </template>
          添加部门
        </t-button>
      </div>
      <div class="operation-right"></div>
    </div>

    <!-- 部门树形列表 -->
    <t-card :bordered="false" class="table-card">
      <t-table
        :data="tableData"
        :columns="columns"
        row-key="id"
        :loading="tableLoading"
        :tree="{ childrenKey: 'children', treeNodeColumnIndex: 0 }"
        table-layout="auto"
        :pagination="false"
      >
        <template #dept_name="{ row }">
          {{ row.dept_name || '-' }}
        </template>

        <template #leader="{ row }">
          {{ row.leader || '-' }}
        </template>

        <template #phone="{ row }">
          {{ row.phone || '-' }}
        </template>

        <template #sort="{ row }">
          {{ row.sort || 0 }}
        </template>

        <template #create_time="{ row }">
          {{ row.create_time || '-' }}
        </template>

        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="handleEdit(row)">编辑</t-link>
            <t-link theme="danger" @click="handleDelete(row)">删除</t-link>
          </t-space>
        </template>

        <template #empty>
          <div style="text-align: center; padding: 40px 0; color: #999">暂无数据</div>
        </template>
      </t-table>
    </t-card>

    <!-- 部门新增/编辑弹框 -->
    <dept-dialog ref="deptDialogRef" @success="loadTableData" />
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import type { SystemDeptItem } from '@/api/system/dept';
import { deleteSystemDept, getSystemDeptList } from '@/api/system/dept';
import { handleTree } from '@/utils/ruoyi';

import DeptDialog from './components/deptDialog.vue';

defineOptions({
  name: 'SystemDeptList',
});

// 表格数据
const tableData = ref<SystemDeptItem[]>([]);
const tableLoading = ref(false);

// 部门弹框引用
const deptDialogRef = ref<InstanceType<typeof DeptDialog> | null>(null);

// 表格列
const columns: PrimaryTableCol[] = [
  { colKey: 'dept_name', title: '部门名称', width: 200, treeNode: true },
  { colKey: 'leader', title: '负责人', width: 120 },
  { colKey: 'phone', title: '联系电话', width: 150 },
  { colKey: 'sort', title: '排序', width: 100, align: 'center' },
  { colKey: 'create_time', title: '创建时间', width: 180 },
  { colKey: 'operation', title: '操作', width: 200, fixed: 'right' },
];

// 加载部门列表
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    const res = await getSystemDeptList();
    if (res.code === 0 || res.code === 200) {
      const data = res.data || [];
      // 将扁平数据转换为树形结构
      tableData.value = handleTree<SystemDeptItem>(data, 'id', 'parent_id', 'children');
    } else {
      MessagePlugin.error(res.msg || '获取部门列表失败');
      tableData.value = [];
    }
  } catch (error: any) {
    console.error('获取部门列表失败:', error);
    MessagePlugin.error('获取部门列表失败，请重试');
    tableData.value = [];
  } finally {
    tableLoading.value = false;
  }
};

// 添加部门
const handleAdd = (row?: SystemDeptItem) => {
  if (deptDialogRef.value) {
    deptDialogRef.value.show(undefined, row); // 传入父部门信息
  }
};

// 编辑部门
const handleEdit = (row: SystemDeptItem) => {
  if (deptDialogRef.value) {
    deptDialogRef.value.show(row); // 传入要编辑的部门信息
  }
};

// 删除部门
const handleDelete = (row: SystemDeptItem) => {
  const confirmDia = DialogPlugin.confirm({
    header: '删除部门',
    body: `确定要删除部门【${row.dept_name}】吗？删除后无法恢复。`,
    theme: 'warning',
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const res = await deleteSystemDept(row.id);
        if (res.code === 0 || res.code === 200) {
          MessagePlugin.success(res.msg || '删除成功');
          confirmDia.hide();
          loadTableData();
        } else {
          MessagePlugin.error(res.msg || '删除失败');
        }
      } catch (error: any) {
        console.error('删除部门失败:', error);
        MessagePlugin.error(error?.response?.data?.msg || error?.message || '删除失败，请重试');
      }
    },
    onCancel: () => {
      confirmDia.hide();
    },
  });
};

onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.system-dept-container {
  padding: 20px;
  background: #fff;
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
</style>
