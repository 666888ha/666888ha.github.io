<template>
  <div class="customer-container">
    <!-- 顶部标签页 -->
    <t-tabs v-model="activeTab" class="customer-tabs" @change="handleTabChange">
      <t-tab-panel value="all" label="全部联系人"> </t-tab-panel>
      <t-tab-panel value="my" label="我的联系人"> </t-tab-panel>
      <t-tab-panel value="subordinate" label="下属联系人"> </t-tab-panel>
      <t-tab-panel value="collaboration" label="我协作的"> </t-tab-panel>
      <t-tab-panel value="nextcollaboration" label="下属协作的"> </t-tab-panel>
    </t-tabs>
    <!-- 搜索区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <!-- 关键词输入 -->
        <div class="filter-item">
          <label class="filter-label">关键词</label>
          <t-input v-model="searchForm.keyword" placeholder="请输入内容" />
        </div>
        <!-- 联系人生日 -->
        <div class="filter-item">
          <label class="filter-label">联系人生日</label>
          <t-date-picker
            v-model="searchForm.birthday"
            placeholder="请选择联系人生日"
            mode="date"
            clearable
            style="width: 100%"
          />
        </div>
        <!-- 角色 -->
        <div class="filter-item">
          <label class="filter-label">角色</label>
          <t-select v-model="searchForm.role" placeholder="请选择角色" :options="roleOptions" clearable />
        </div>
        <!-- 最后联系 -->
        <div class="filter-item">
          <label class="filter-label">最后联系</label>
          <t-date-picker
            v-model="searchForm.create_time_start"
            style="width: 100%"
            placeholder="请选择最后联系日期"
            mode="date"
            clearable
          />
        </div>

        <!-- 最后跟进 -->
        <div class="filter-item">
          <label class="filter-label">最后跟进</label>
          <t-date-picker
            v-model="searchForm.lastFollow"
            placeholder="请选择最后跟进日期"
            mode="date"
            clearable
            style="width: 100%"
          />
        </div>
      </div>
      <div class="filter-right">
        <!-- 操作按钮 -->
        <t-button theme="primary" @click="handleSearch">查询</t-button>
        <t-button theme="default" @click="handleReset">重置</t-button>
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
        <!-- <t-button theme="default" variant="outline" @click="clickOper(2)">
          <template #icon>
            <t-icon name="upload" />
          </template>
          导入
        </t-button>
        <t-button theme="default" variant="outline" @click="clickOper(3)">
          <template #icon>
            <t-icon name="download" />
          </template>
          导出
        </t-button> -->
      </div>
      <div class="operation-right">
        <t-tooltip content="排序">
          <t-button theme="default" variant="outline" @click="clickOper(4)">
            <template #icon>
              <t-icon name="swap" />
            </template>
            排序
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
        <!-- 联系人姓名 -->
        <template #contact_name="{ row }">
          <t-link theme="primary" @click="clickOper(9, row)">
            {{ row.contact_name }}
          </t-link>
        </template>

        <!-- 客户名称 -->
        <template #customer_name="{ row }">
          <div class="customer-name-container">
            <t-tooltip :content="row.customer_name" placement="top">
              <t-link theme="primary" class="customer-name-link" @click="clickOper(8, row)">
                {{ row.customer_name }}
              </t-link>
            </t-tooltip>
          </div>
        </template>
        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="clickOper(7, row)"> 拨打 </t-link>
            <t-link theme="primary" @click="clickOper(5, row)"> 编辑 </t-link>
            <t-link theme="danger" @click="clickOper(10, row)"> 删除 </t-link>
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
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { deleteContact, getContactAllList } from '@/api/customer/customer';
import { copyToClipboard } from '@/utils/ruoyi';

defineOptions({
  name: 'ContactsList',
});

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
// 搜索表单初始值（用于重置）
const initialSearchForm = {
  keyword: '',
  birthday: '',
  role: '',
  create_time_start: '',
  lastFollow: '',
};

// 搜索表单
const searchForm = ref({ ...initialSearchForm });

// 角色选项
const roleOptions = ref([
  { label: '全部', value: '' },
  { label: '决策人', value: 'decisionMaker' },
  { label: '影响人', value: 'influencer' },
  { label: '使用人', value: 'user' },
  { label: '采购人', value: 'purchaser' },
  { label: '其他', value: 'other' },
]);

// 所有可用的列定义（完整配置）
const allColumnsConfig: Record<string, PrimaryTableCol> = {
  rowSelect: {
    colKey: 'row-select',
    type: 'multiple',
    width: 50,
    fixed: 'left',
  },
  contact_name: {
    title: '联系人姓名',
    align: 'left',
    width: 150,
    colKey: 'contact_name',
    ellipsis: true,
    cell: 'contact_name',
  },
  customer_name: {
    title: '客户名称',
    align: 'left',
    width: 200,
    colKey: 'customer_name',
    ellipsis: true,
    cell: 'customer_name',
    sorter: (a: ContactData, b: ContactData) => {
      return a.customer_name.localeCompare(b.customer_name, 'zh-CN');
    },
  },
  mobile: {
    title: '手机号码',
    align: 'left',
    width: 140,
    colKey: 'mobile',
    sorter: (a: ContactData, b: ContactData) => {
      return a.mobile.localeCompare(b.mobile);
    },
  },
  birthday: {
    title: '生日',
    align: 'left',
    width: 120,
    colKey: 'birthday',
    sorter: (a: ContactData, b: ContactData) => {
      // 将日期字符串转换为时间戳进行比较
      const dateA = new Date(a.birthday).getTime();
      const dateB = new Date(b.birthday).getTime();
      return dateA - dateB;
    },
  },
  position: {
    title: '角色',
    align: 'left',
    width: 120,
    colKey: 'position',
    sorter: (a: ContactData, b: ContactData) => {
      return a.position.localeCompare(b.position, 'zh-CN');
    },
  },
  role: {
    title: '部门职务',
    align: 'left',
    width: 150,
    colKey: 'role',
  },
  lastContact: {
    title: '最后联系',
    align: 'left',
    width: 160,
    colKey: 'lastContact',
  },
  operation: {
    title: '操作',
    align: 'left',
    width: 220,
    colKey: 'operation',
    fixed: 'right',
  },
};

// 表格列定义（默认显示）
const tableColumns = ref<PrimaryTableCol[]>([
  allColumnsConfig.rowSelect,
  allColumnsConfig.contact_name,
  allColumnsConfig.customer_name,
  allColumnsConfig.mobile,
  allColumnsConfig.birthday,
  allColumnsConfig.role,
  allColumnsConfig.position,
  allColumnsConfig.lastContact,
  allColumnsConfig.operation,
]);

// 表格数据
interface ContactData {
  id: number;
  contact_name: string;
  customer_name: string;
  mobile: string;
  birthday: string;
  role: string;
  position: string;
  create_time_start: string;
}

// 表格数据（筛选后的数据）
const tableData = ref<ContactData[]>([]);

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
  // 重置搜索表单
  searchForm.value = { ...initialSearchForm };
  // 重置分页
  pagination.value.current = 1;
  // 重新加载数据
  loadTableData();
};

// 操作
const clickOper = async (type: number, row) => {
  switch (type) {
    case 1: // 添加联系人
      router.push({
        path: '/customerMange/contacts/add',
      });
      break;
    case 2: // 导入
      listImport.value.show();
      break;
    case 3: // 导出
      listExport.value.openExportProgress();
      break;
    case 4: // 排序
      MessagePlugin.info('排序功能开发中');
      break;
    case 5: // 编辑
      router.push({
        path: '/customerMange/contacts/edit',
        query: { id: row.id },
      });
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
        query: { id: row.id, customerId: row.customer_id },
      });
      break;
    case 10: // 删除联系人
      handleDeleteCustomer(row);
      break;
  }
};
// 删除客户
const handleDeleteCustomer = (row: ContactData) => {
  const contact_id = row.id;
  const contact_name = row.contact_name || '该联系人';
  const customer_name = row.customer_name || '该客户';
  const dialog = DialogPlugin.confirm({
    header: '确认删除',
    body: `确定要删除客户"${customer_name}"的联系人"${contact_name}"吗？删除后无法恢复。`,
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const response = await deleteContact(contact_id);
        if (response.code === 0 || response.code === 200) {
          MessagePlugin.success('删除成功');
          dialog.hide();
          // 重新加载列表数据
          loadTableData();
        } else {
          MessagePlugin.error(response.message || '删除失败');
        }
      } catch (error: any) {
        MessagePlugin.error(error.message || '删除失败，请重试');
      }
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

// 加载表格数据
const loadTableData = async () => {
  tableLoading.value = true;
  try {
    const params: any = {
      page: pagination.value.current,
      limit: pagination.value.pageSize,
    };

    // 根据标签页设置数据权限类型
    // 数据权限：all (全部)/my (我的)/subordinate (下属)/collaborate (我协作的)/sub_collaborate (下属协作的)
    const typeMap: Record<string, string> = {
      all: 'all',
      my: 'my',
      subordinate: 'subordinate',
      collaboration: 'collaborate',
      nextcollaboration: 'sub_collaborate',
    };
    if (activeTab.value && typeMap[activeTab.value]) {
      params.type = typeMap[activeTab.value];
    }

    // 关键词
    if (searchForm.value.keyword) {
      params.keyword = searchForm.value.keyword.trim();
    }

    // 生日
    if (searchForm.value.birthday) {
      let birthday = '';
      if (typeof searchForm.value.birthday === 'string') {
        birthday = searchForm.value.birthday;
      } else if (searchForm.value.birthday instanceof Date) {
        const year = searchForm.value.birthday.getFullYear();
        const month = String(searchForm.value.birthday.getMonth() + 1).padStart(2, '0');
        const day = String(searchForm.value.birthday.getDate()).padStart(2, '0');
        birthday = `${year}-${month}-${day}`;
      } else {
        birthday = String(searchForm.value.birthday);
      }
      params.birthday = birthday;
    }

    // 角色
    if (searchForm.value.role) {
      params.role = searchForm.value.role;
    }

    // 最后联系
    if (searchForm.value.lastContact) {
      let lastContact = '';
      if (typeof searchForm.value.lastContact === 'string') {
        lastContact = searchForm.value.lastContact;
      } else if (searchForm.value.lastContact instanceof Date) {
        const year = searchForm.value.lastContact.getFullYear();
        const month = String(searchForm.value.lastContact.getMonth() + 1).padStart(2, '0');
        const day = String(searchForm.value.lastContact.getDate()).padStart(2, '0');
        lastContact = `${year}-${month}-${day}`;
      } else {
        lastContact = String(searchForm.value.lastContact);
      }
      params.last_contact = lastContact;
    }

    // 最后跟进
    if (searchForm.value.lastFollow) {
      let lastFollow = '';
      if (typeof searchForm.value.lastFollow === 'string') {
        lastFollow = searchForm.value.lastFollow;
      } else if (searchForm.value.lastFollow instanceof Date) {
        const year = searchForm.value.lastFollow.getFullYear();
        const month = String(searchForm.value.lastFollow.getMonth() + 1).padStart(2, '0');
        const day = String(searchForm.value.lastFollow.getDate()).padStart(2, '0');
        lastFollow = `${year}-${month}-${day}`;
      } else {
        lastFollow = String(searchForm.value.lastFollow);
      }
      params.last_follow = lastFollow;
    }

    const res = await getContactAllList(params);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      const list = data.list || [];
      // 映射接口返回的数据到表格数据格式
      tableData.value = list;
      pagination.value.total = data.total || 0;
    } else {
      MessagePlugin.error(res.msg || '获取联系人列表失败');
      tableData.value = [];
      pagination.value.total = 0;
    }
  } catch (error: any) {
    console.error('获取联系人列表失败:', error);
    MessagePlugin.error('获取联系人列表失败，请重试');
    tableData.value = [];
    pagination.value.total = 0;
  } finally {
    tableLoading.value = false;
  }
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
