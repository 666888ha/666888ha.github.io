## =========================================== ## @author: yangganqiong ## @desc：客户详情-相关客户 ## @date: 2026-01-13
09:35:50 ## ===========================================
<template>
  <el-descriptions title="相关客户" border>
    <template #extra>
      <el-button type="primary" :icon="Upload" solid @click="clickOper(1)">导出</el-button>
    </template>
  </el-descriptions>
  <!-- 客户表格 -->
  <el-table
    ref="multipleTable"
    v-loading="listLoading"
    :data="dataSource"
    stripe
    :header-cell-style="{ background: '#f5f7fa' }"
    @selection-change="handleSelectionChange"
  >
    <el-table-column type="selection" width="50" :reserve-selection="true" />
    <el-table-column
      v-for="(item, index) in colData"
      :key="index"
      show-overflow-tooltip
      :prop="item.prop"
      :label="item.label"
    >
      <template #default="scope">
        <template v-if="item.prop === 'name'">
          <el-link type="primary"> {{ scope.row[item.prop] }}</el-link>
        </template>
        <template v-else>
          {{ scope.row[item.prop] }}
        </template>
      </template>
    </el-table-column>
    <template #empty>
      <el-empty description="暂无数据" />
    </template>
  </el-table>
  <div class="table-footer mt15">
    <div class="footer-left">
      <el-button @click="selectAll"> 全选 </el-button>
      <el-button @click="selectInverse"> 反选 </el-button>
    </div>
    <el-pagination
      v-model:current-page="ipagination.page.pageNum"
      v-model:page-size="ipagination.page.pageSize"
      :pager-count="5"
      :page-sizes="[10, 20, 30]"
      :total="ipagination.page.total"
      layout=" prev, pager, next,sizes"
      background
      @size-change="onHandleSizeChange"
      @current-change="onHandleCurrentChange"
    >
    </el-pagination>
  </div>
</template>
<script setup>
import {
  ArrowRight,
  CaretRight,
  ChatDotRound,
  Comment,
  Delete,
  Edit,
  Message,
  PhoneFilled,
  Plus,
  Position,
  Refresh,
  Remove,
  RemoveFilled,
  Upload,
} from '@element-plus/icons-vue';
import { defineAsyncComponent, getCurrentInstance, reactive, ref } from 'vue';

const listLoading = ref(false);
// 引入组件
let dataSource = reactive([
  {
    id: 1,
    name: '合肥速谱科学仪器有限公司',
    status: '跟进',
    starLevel: 4, // 星级（1-5）
    contact: '李小红',
    phone: '18888888888',
    lastFollow: '2025-08-25 14:54',
    unfollowDays: 30,
  },
  {
    id: 2,
    name: '合肥速谱科学仪器有限公司',
    status: '跟进',
    starLevel: 4, // 星级（1-5）
    contact: '李小红',
    phone: '18888888888',
    lastFollow: '2025-08-25 14:54',
    unfollowDays: 30,
  },
]);
const ipagination = reactive({
  page: {
    pageNum: 1,
    pageSize: 10,
    total: 0,
  },
});
const colData = ref([
  { prop: 'name', label: '客户名称', visible: true },
  { prop: 'status', label: '客户类型', visible: true },
  { prop: 'starLevel', label: '客户状态', visible: true },
  { prop: 'contact', label: '首联系人', visible: true },
  { prop: 'phone', label: '手机号码', visible: true },
  { prop: 'phone1', label: '客户归属', visible: true },
  { prop: 'phone2', label: '备注', visible: true },
]);
// 列表全选
const selectedRows = ref([]); // 用于存储选中行的数据
const multipleTable = ref(null); // 表格引用
// 全选/反选逻辑
function selectAll() {
  dataSource.forEach((row) => {
    multipleTable.value.toggleRowSelection(row, true);
  });
}
function selectInverse() {
  dataSource.forEach((row) => {
    if (selectedRows.value.includes(row)) {
      multipleTable.value.toggleRowSelection(row, false);
    } else {
      multipleTable.value.toggleRowSelection(row, true);
    }
  });
}
// 处理选中项变化事件，更新selectedRows的值
function handleSelectionChange(val) {
  selectedRows.value = val; // 更新选中行数据数组
}
// 分页改变
const onHandleSizeChange = (val) => {
  ipagination.page.pageSize = val;
};
// 分页改变
const onHandleCurrentChange = (val) => {
  ipagination.page.pageNum = val;
};
// 表头样式
const headerCellStyle = () => {
  return {
    background: '#F5F7FA',
    color: '#1F2F3D',
    fontWeight: 'bold',
  };
};
</script>
<style lang="scss" scoped>
.table-footer {
  display: flex;
  justify-content: space-between;
  .footer-left {
    display: flex;
    align-items: center;
  }
  .table-footer-tool {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    i {
      margin-right: 10px;
      cursor: pointer;
      color: var(--el-text-color-regular);
      &:last-of-type {
        margin-right: 0;
      }
    }
  }
}
</style>
