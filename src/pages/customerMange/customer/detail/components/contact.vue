<template>
  <div class="contact-container">
    <!-- 顶部标题和操作按钮 -->
    <div class="contact-header">
      <div class="header-title">联系人</div>
      <div class="header-actions">
        <t-button theme="primary" @click="clickOper(1)">
          <template #icon>
            <t-icon name="add" />
          </template>
          添加
        </t-button>
        <div class="action-with-badge">
          <t-dropdown :options="smsOptions" trigger="click" @click="clickOper(2)">
            <t-button theme="primary" variant="outline">
              <template #icon>
                <t-icon name="chat" />
              </template>
              发送短信
            </t-button>
          </t-dropdown>
        </div>
        <div class="action-with-badge">
          <t-dropdown :options="exportOptions" trigger="click" @click="clickOper(3)">
            <t-button theme="primary" variant="outline">
              <template #icon>
                <t-icon name="download" />
              </template>
              导出
            </t-button>
          </t-dropdown>
        </div>
        <t-button theme="primary" variant="outline" @click="clickOper(4)">
          <template #icon>
            <t-icon name="delete" />
          </template>
          删除
        </t-button>
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
        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="clickOper(6, row)"> 短信 </t-link>
            <t-link theme="danger" @click="clickOper(7, row)"> 删除 </t-link>
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
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { useRoute,useRouter } from 'vue-router';

import { deleteContact, getContactList } from '@/api/customer/customer';

defineOptions({
  name: 'Contact',
});

const route = useRoute();
const router = useRouter();

// 表格数据
const tableData = ref([]);

// 表格列配置
const tableColumns: PrimaryTableCol[] = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'contact_name', title: '联系人姓名', width: 150 },
  { colKey: 'mobile', title: '手机号码', width: 150 },
  { colKey: 'role', title: '角色', width: 120 },
  { colKey: 'position', title: '部门职务', width: 150 },
  { colKey: 'birthday', title: '生日', width: 150 },
  { colKey: 'operation', title: '操作', width: 200, fixed: 'right' },
];

// 行主键
const rowKey = 'id';

// 表格加载状态
const tableLoading = ref(false);

const selectedRowKeys = ref<(string | number)[]>([]);
const selectAll = ref(false);
const inverse = ref(false);

// 分页
const pagination = ref({
  current: 1,
  pageSize: 10,
  showPageSize: true,
  totalContent: false,
  pageSizeOptions: [10, 20, 50, 100],
});

// 下拉选项
const smsOptions = [
  { content: '选中数据发送', value: 'send' },
  { content: '批量发送', value: 'batch' },
];

const exportOptions = [
  { content: '选中数据导出', value: 'excel' },
  { content: '批量导出', value: 'csv' },
];

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

// 加载表格数据
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    // 从路由获取客户ID
    const customerId = route.query.id as string;
    if (!customerId) {
      tableLoading.value = false;
      return;
    }

    const res = await getContactList(customerId);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || [];
      tableData.value = Array.isArray(data.list) ? data.list : [];
    } else {
      MessagePlugin.error((res as any).msg || res.message || '获取联系人列表失败');
      tableData.value = [];
    }
  } catch (error: any) {
    console.error('获取联系人列表失败:', error);
    MessagePlugin.error('获取联系人列表失败，请重试');
    tableData.value = [];
  } finally {
    tableLoading.value = false;
  }
};

// 操作处理
const clickOper = (type: number, row?: any) => {
  switch (type) {
    case 1: // 添加
    router.push(`/customerMange/contacts/detailAddCustomer?customer_id=${route.query.id}`);
      break;
    case 2: // 发送短信
      if (selectedRowKeys.value.length === 0) {
        MessagePlugin.warning('请先选择要发送短信的联系人');
        return;
      }
      MessagePlugin.info('发送短信功能开发中');
      break;
    case 3: // 导出
      if (selectedRowKeys.value.length === 0) {
        MessagePlugin.warning('请先选择要导出的联系人');
        return;
      }
      MessagePlugin.info('导出功能开发中');
      break;
    case 4: // 批量删除
      if (selectedRowKeys.value.length === 0) {
        MessagePlugin.warning('请先选择要删除的联系人');
        return;
      }
      handleBatchDelete();
      break;
    case 5: // 拨打
      MessagePlugin.info(`拨打: ${row.mobile}`);
      break;
    case 6: // 短信
      MessagePlugin.info(`发送短信到: ${row.mobile}`);
      break;
    case 7: // 删除单条
      if (row && row.id) {
        handleDeleteContact(row.id, row.contactName || '该联系人');
      }
      break;
  }
};

// 删除单个联系人
const handleDeleteContact = (contactId: string | number, contactName: string) => {
  const confirmDia = DialogPlugin.confirm({
    header: '确认删除',
    body: `确定要删除联系人"${contactName}"吗？删除后无法恢复。`,
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const res = await deleteContact(contactId);
        if (res.code === 0 || res.code === 200) {
          MessagePlugin.success('删除成功');
          confirmDia.hide();
          // 重新加载列表数据
          loadTableData();
        } else {
          MessagePlugin.error((res as any).msg || res.message || '删除失败');
        }
      } catch (error: any) {
        console.error('删除联系人失败:', error);
        MessagePlugin.error(error?.message || '删除失败，请重试');
      }
    },
    onClose: () => {
      confirmDia.hide();
    },
  });
};

// 批量删除联系人
const handleBatchDelete = () => {
  const contactIds = selectedRowKeys.value;
  const count = contactIds.length;
  const confirmDia = DialogPlugin.confirm({
    header: '确认删除',
    body: `确定要删除选中的 ${count} 个联系人吗？删除后无法恢复。`,
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        // 批量删除：逐个调用删除接口
        const deletePromises = contactIds.map((id) => deleteContact(id));
        const results = await Promise.all(deletePromises);

        // 检查是否全部成功
        const allSuccess = results.every((res) => res.code === 0 || res.code === 200);

        if (allSuccess) {
          MessagePlugin.success(`成功删除 ${count} 个联系人`);
          confirmDia.hide();
          // 清空选中项
          selectedRowKeys.value = [];
          selectAll.value = false;
          // 重新加载列表数据
          loadTableData();
        } else {
          MessagePlugin.warning('部分联系人删除失败，请重试');
        }
      } catch (error: any) {
        console.error('批量删除联系人失败:', error);
        MessagePlugin.error(error?.message || '删除失败，请重试');
      }
    },
    onClose: () => {
      confirmDia.hide();
    },
  });
};

// 初始化
onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.contact-container {
  .contact-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;

      .action-with-badge {
        position: relative;
      }
    }
  }

  .table-card {
    margin-bottom: 16px;
  }

  .footer-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .footer-left {
      display: flex;
      gap: 16px;
      align-items: center;
    }
  }
}

:deep(.t-link) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 16px;

  &:last-child {
    margin-right: 0;
  }
}
</style>
