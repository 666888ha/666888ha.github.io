<template>
  <div class="quotation-page-container">
    <!-- 左侧分类导航 -->
    <div class="left-sidebar">
      <t-collapse v-model="activeCates" accordion>
        <t-collapse-panel
          v-for="category in categoryList"
          :key="category.cate_id"
          :header="category.cate_name"
          :value="category.cate_id"
        >
          <div class="category-children">
            <!-- 模拟三级分类，实际可根据接口返回的子分类渲染 -->
            <div
              v-for="(child, index) in 1"
              :key="`${category.cate_id}-${index}`"
              class="category-item"
              :class="{ active: selectedCateId === category.cate_id }"
              @click="handleCategorySelect(category.cate_id)"
            >
              分类
            </div>
          </div>
        </t-collapse-panel>
      </t-collapse>
    </div>

    <!-- 右侧产品内容区 -->
    <div class="right-content">
      <div class="content-header">
        <div class="selected-count">已选择 {{ selectedRowKeys.length }} 个产品</div>
        <div class="filter-item">
          <t-input v-model="product_name" placeholder="产品名称" clearable style="width: 44%" />
          <t-input
            v-model="product_code"
            placeholder="产品编码"
            clearable
            style="width: 44%; margin-left: 8px; margin-right: 8px"
          />
          <t-button theme="primary" @click="handleSearch">查询</t-button>
          <t-button theme="default" @click="handleReset">重置</t-button>
        </div>
      </div>
      <!-- 产品表格 -->
      <t-table
        :data="productList"
        row-key="product_id"
        :columns="columns"
        :selected-row-keys="selectedRowKeys"
        @select-change="handleSelectChange"
      >
        <!-- 自定义报价单价列 -->
        <template #quotationPrice="{ row }">
          <t-input-number
            v-model="row.quotationPrice"
            :min="0"
            :precision="2"
            placeholder="请输入单价"
            style="width: 150px"
            @change="() => handlePriceChange(row)"
          />
        </template>
        <!-- 自定义数量列 -->
        <template #quantity="{ row }">
          <t-input-number v-model="row.quantity" :min="1" style="width: 120px" @change="() => handlePriceChange(row)" />
        </template>
        <!-- 自定义总价列 -->
        <template #cell(quotationTotal)="{ row }">
          <span>¥{{ formatAmount((row?.quotationPrice || 0) * (row?.quantity || 1)) }}</span>
        </template>
        <!-- 自定义备注信息列 -->
        <template #remark="{ row }">
          <t-input v-model="row.remark" placeholder="请输入备注" />
        </template>
      </t-table>
      <div class="footer-wrapper">
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
      <!-- 底部确认按钮 -->
      <div class="footer-actions">
        <t-button theme="primary" @click="handleConfirm">确认报价</t-button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { getProductCategoryList, getProductListByCate } from '@/api/quotation';
// 响应式数据
const categoryList = ref([]);
const activeCates = ref([]);
const selectedCateId = ref(null);
const productList = ref([]);
const router = useRouter();
const route = useRoute();
// 选中的行
const selectedRowKeys = ref<(string | number)[]>([]);
// 产品名称和产品货号
const product_name = ref('');
const product_code = ref('');
// 分页
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showPageSize: true,
  totalContent: false,
  pageSizeOptions: [10, 20, 50, 100],
});

// 表格列配置
const columns = ref([
  {
    colKey: 'row-select',
    type: 'multiple',
    width: 50,
    fixed: 'left',
  },
  { title: '产品名称', colKey: 'product_name', ellipsis: true },
  { title: '品牌', colKey: 'brand' },
  { title: '产品货号', colKey: 'product_id' },
  { title: '型号', colKey: 'product_model' },
  { title: '单位', colKey: 'unit' },
  { title: '数量', colKey: 'quantity', align: 'center' },
  { title: '报价单价', colKey: 'quotationPrice', align: 'center' },
  {
    title: '报价总价',
    colKey: 'quotationTotal',
    align: 'right',
  },
  { title: '备注信息', key: 'remark' },
]);
// 选择变化
const handleSelectChange = (value: (string | number)[]) => {
  selectedRowKeys.value = value;
  console.log('选中的行:', selectedRowKeys.value);
};

// 页面加载时获取分类列表
onMounted(() => {
  fetchCategoryList();
});

// 获取产品分类列表
const fetchCategoryList = async () => {
  try {
    const res = await getProductCategoryList();
    if (res.code === 0) {
      categoryList.value = res.data;
      console.log('分类列表:', categoryList.value);
      // 默认展开第一个分类
      if (categoryList.value.length > 0) {
        activeCates.value = [categoryList.value[0].cate_id];
        selectedCateId.value = activeCates.value[0];
        await fetchProductList(activeCates.value[0]);
      }
    }
  } catch (error) {
    console.error('获取分类列表失败:', error);
  }
};

// 切换分类
const handleCategorySelect = async (cateId: string | number) => {
  selectedCateId.value = cateId;
  pagination.value.current = 1;
  await fetchProductList(cateId);
};

// 获取分类下的产品列表
const fetchProductList = async (cateId: string | number) => {
  try {
    const res = await getProductListByCate({
      cate_id: cateId,
      product_name: product_name.value,
      product_code: product_code.value,
    });
    if (res.code === 0) {
      // 为产品添加默认属性
      productList.value = res.data.product_list.map((item: any) => {
        const quantity = 1;
        const quotationPrice = item.market_price || 0;
        return {
          ...item,
          checked: false,
          quantity,
          quotationPrice,
          quotationTotal: quantity * quotationPrice,
          remark: '',
        };
      });
      pagination.value.total = productList.value.length;
    }
  } catch (error) {
    console.error('获取产品列表失败:', error);
  }
};

const handleSearch = () => {
  fetchProductList(selectedCateId.value);
};

// 处理重置
const handleReset = () => {
  // 清空搜索条件
  product_name.value = '';
  product_code.value = '';
  fetchProductList(selectedCateId.value);
};

// 格式化金额
const formatAmount = (amount: number | string) => {
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// 单价或数量变化时，自动计算总价
const handlePriceChange = (row: any) => {
  const quantity = Number(row.quantity) || 0;
  const price = Number(row.quotationPrice) || 0;
  row.quotationTotal = quantity * price;
};

// 分页变化
const handlePageChange = (current: number, pageInfo: any) => {
  pagination.value.current = current;
  pagination.value.pageSize = pageInfo.pageSize;
  fetchProductList(selectedCateId.value);
};

// 每页条数变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  pagination.value.current = 1;
  fetchProductList(selectedCateId.value);
};
// 确认报价
const handleConfirm = async () => {
  // 检查是否有选中的产品
  if (selectedRowKeys.value.length === 0) {
    MessagePlugin.warning('请至少选择一个产品');
    return;
  }

  // 获取选中的产品
  const selectedItems = productList.value.filter((item: any) => selectedRowKeys.value.includes(item.product_id));

  // 验证所有选中产品的必填字段
  for (const item of selectedItems) {
    if (!item.quotationPrice || item.quotationPrice <= 0) {
      MessagePlugin.warning(`产品 ${item.product_name} 的报价单价必须大于0`);
      return;
    }
    if (!item.quantity || item.quantity <= 0) {
      MessagePlugin.warning(`产品 ${item.product_name} 的数量必须大于0`);
      return;
    }
  }

  // 保存到本地存储
  const tempData = {
    products: selectedItems,
  };

  localStorage.setItem('quotation_temp_data', JSON.stringify(tempData));

  // 跳转到确认报价页面
  router.push({
    path: '/quotation/confirmQuotation',
    query: {
      folowId: route.query.folowId ?? '',
    },
  });
};
</script>
<style scoped lang="less">
.quotation-page-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.left-sidebar {
  width: 240px;
  background-color: #ffffff;
  margin-right: 10px;
  padding: 16px;
  overflow-y: auto;
  border-right: 1px solid #e5e6eb;
}

.category-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 14px;
}

.category-item:hover {
  background-color: #e8f3ff;
}

.category-item.active {
  background-color: #d6e9ff;
  color: #165dff;
  font-weight: 500;
}

.right-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.selected-count {
  color: #666;
  font-size: 14px;
}

.footer-info {
  margin-top: 24px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  gap: 24px;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
}

.required {
  color: #f00;
}

.footer-actions {
  margin-top: 24px;
  text-align: right;
  padding-top: 24px;
  border-top: 1px solid #e5e6eb;
}
.footer-wrapper {
  margin-top: 20px;
}
.filter-item {
  display: flex;
  justify-content: space-between;
  input {
    margin-left: 10px;
  }
}
</style>
