<template>
  <t-dialog
    v-model:visible="dialogVisible"
    title="公海规则说明"
    width="600px"
    :close-on-overlay-click="false"
    @close="handleClose"
  >
    <!-- 规则表格 -->
    <t-table bordered :data="rulesData" :columns="tableColumns" :row-key="rowKey" :hover="false"> </t-table>
    <!-- 说明文字 -->
    <div class="rules-description">
      超过N天"未成交"和"未跟进"的客户,由系统定时划入公海。从开启公海或获得客户 (新增、转移、从公海抢到客户)
      开始来计算客户多久未达到"成交"和"跟进"状态。
    </div>
  </t-dialog>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { ref } from 'vue';

defineOptions({
  name: 'RulesDescriptionDialog',
});

// 弹框显示状态
const dialogVisible = ref(false);

// 规则数据
const rulesData = ref([
  {
    id: 1,
    customerType: '普通客户',
    daysNotTransacted: 60,
    daysNotFollowed: 30,
  },
  {
    id: 2,
    customerType: '重点客户',
    daysNotTransacted: 90,
    daysNotFollowed: 30,
  },
]);

// 表格列配置
const tableColumns: PrimaryTableCol[] = [
  {
    title: '客户类型',
    align: 'center',
    colKey: 'customerType',
    width: 100,
  },
  {
    title: '未成交天数',
    align: 'center',
    colKey: 'daysNotTransacted',
    width: 100,
  },
  {
    title: '未跟进天数',
    align: 'center',
    colKey: 'daysNotFollowed',
    width: 100,
  },
];

// 行主键
const rowKey = 'id';

// 关闭弹框
const handleClose = () => {
  dialogVisible.value = false;
};

// 显示弹框
const show = () => {
  dialogVisible.value = true;
};

// 暴露方法
defineExpose({
  show,
});
</script>
<style lang="less" scoped>
:deep(.t-table) {
  margin-bottom: 24px;

  .t-table__header {
    background: var(--td-bg-color-container-select);

    th {
      background: var(--td-bg-color-container-select);
      font-weight: 600;
    }
  }

  .t-table__body {
    .t-table__row {
      &:nth-child(even) {
        background: var(--td-bg-color-container-select);
      }
    }
  }
}

.rules-description {
  font-size: 14px;
  color: var(--td-text-color-secondary);
  line-height: 1.6;
  padding: 16px;
  background: var(--td-bg-color-container-select);
  border-radius: 4px;
}
</style>
