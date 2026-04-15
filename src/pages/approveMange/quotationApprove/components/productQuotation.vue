<template>
  <div class="product-quotation-container">
    <t-table :data="tableData" :columns="columns" :row-key="rowKey" :loading="loading" :hover="true">
      <!-- 产品名称 -->
      <template #product_name="{ row }">
        {{ row.product_name || '-' }}
      </template>
      <!-- 产品货号 -->
      <template #product_id="{ row }">
        {{ row.product_id || '-' }}
      </template>
      <!-- 品牌 -->
      <template #brand="{ row }">
        {{ row.brand || '-' }}
      </template>
      <!-- 规格型号 -->
      <template #product_model="{ row }">
        {{ row.product_model || '-' }}
      </template>
      <!-- 数量 -->
      <template #quantity="{ row }">
        {{ row.quantity || 0 }}
      </template>
      <!-- 单位 -->
      <template #unit="{ row }">
        {{ row.unit || '-' }}
      </template>
      <!-- 单价 -->
      <template #quotationPrice="{ row }">
        {{ formatAmount(row.quotationPrice || row.unit_price || 0) }}
      </template>
      <!-- 总价 -->
      <template #quotationTotal="{ row }">
        {{ formatAmount(row.quotationTotal || row.total_price || 0) }}
      </template>
      <!-- 备注 -->
      <template #remark="{ row }">
        {{ row.remark || '-' }}
      </template>
      <template #empty>
        <div style="text-align: center; padding: 40px 0; color: #999">暂无产品数据</div>
      </template>
    </t-table>
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';

defineOptions({
  name: 'ProductQuotation',
});

// 定义 props
const props = defineProps<{
  products?: any[];
}>();

// 表格数据
const tableData = ref<any[]>([]);
const loading = ref(false);
const rowKey = 'product_id';

// 表格列配置
const columns = computed(() => [
  { title: '产品名称', colKey: 'product_name', width: 200, ellipsis: true },
  { title: '产品货号', colKey: 'product_id', width: 150 },
  { title: '品牌', colKey: 'brand', width: 120 },
  { title: '规格型号', colKey: 'product_model', width: 120 },
  {
    title: '数量',
    colKey: 'quantity',
    width: 100,
    align: 'center',
  },
  { title: '单位', colKey: 'unit', width: 80, align: 'center' },
  {
    title: '单价',
    colKey: 'quotationPrice',
    width: 120,
    align: 'right',
  },
  {
    title: '总价',
    colKey: 'quotationTotal',
    width: 120,
    align: 'right',
  },
  { title: '备注', colKey: 'remark', width: 200, ellipsis: true },
]);

// 格式化金额
const formatAmount = (amount: number | string) => {
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (isNaN(num)) return '¥0.00';
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// 删除产品
const handleDelete = (row: any) => {
  MessagePlugin.info('删除功能暂不支持');
};

// 监听 props.products 变化，更新表格数据
watch(
  () => props.products,
  (newProducts) => {
    if (newProducts && Array.isArray(newProducts)) {
      tableData.value = newProducts.map((item: any, index: number) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price || item.quotationPrice) || 0;
        const totalPrice = Number(item.total_price || item.quotationTotal) || quantity * unitPrice;
        return {
          product_id: item.product_id || `temp_${index}`,
          product_name: item.product_name || '-',
          brand: item.brand || '-',
          product_model: item.product_model || '-',
          quantity,
          unit: item.unit || '-',
          quotationPrice: unitPrice,
          quotationTotal: totalPrice,
          remark: item.remark || '-',
        };
      });
    } else {
      tableData.value = [];
    }
  },
  { immediate: true, deep: true },
);
</script>
<style lang="less" scoped>
.product-quotation-container {
  padding: 16px 0;
}
</style>
