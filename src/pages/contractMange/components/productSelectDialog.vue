<template>
  <t-dialog
    v-model:visible="visible"
    header="选择产品"
    width="80%"
    :close-on-overlay-click="false"
    @close="handleClose"
  >
    <div class="product-select-container">
      <!-- 左侧分类导航 -->
      <div class="left-sidebar">
        <t-collapse v-model="activeCates" accordion>
          <t-collapse-panel v-for="category in categoryList" :key="category.cate_id" :header="category.cate_name">
            <div class="category-children">
              <div
                class="category-item"
                :class="{ active: selectedCateId === category.cate_id }"
                @click="handleCategorySelect(category.cate_id)"
              >
                二级分类
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
            <t-input
              v-model="searchKeyword"
              placeholder="产品名称"
              clearable
              style="width: 200px"
              @input="handleSearch"
            />
            <t-input
              v-model="searchKeyword"
              placeholder="产品编码"
              clearable
              style="width: 200px"
              @input="handleSearch"
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
            />
          </template>
          <!-- 自定义数量列 -->
          <template #quantity="{ row }">
            <t-input-number v-model="row.quantity" :min="1" style="width: 120px" />
          </template>
          <!-- 自定义总价列 -->
          <template #totalPrice="{ row }">
            <span>¥{{ formatAmount((row?.quotationPrice || 0) * (row?.quantity || 1)) }}</span>
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
      </div>
    </div>

    <template #footer>
      <t-button theme="default" @click="handleClose">取消</t-button>
      <t-button theme="primary" @click="handleConfirm">确认</t-button>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import { getProductCategoryList, getProductListByCate } from '@/api/quotation';

defineOptions({
  name: 'ProductSelectDialog',
});

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  confirm: [products: Array<{ product_name: string; unit: string; quantity: number; unit_price: number }>];
}>();

const visible = computed({
  get: () => props.visible,
  set: (value) => {
    emit('update:visible', value);
  },
});

// 响应式数据
const categoryList = ref([]);
const activeCates = ref([]);
const selectedCateId = ref(null);
const productList = ref<any[]>([]);
const searchKeyword = ref('');

// 选中的行
const selectedRowKeys = ref<(string | number)[]>([]);

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
  { title: '数量', colKey: 'quantity', align: 'center', cell: 'quantity' },
  { title: '单价', colKey: 'quotationPrice', align: 'center', cell: 'quotationPrice' },
  {
    title: '总价',
    colKey: 'totalPrice',
    align: 'right',
    cell: 'totalPrice',
  },
]);

// 选择变化
const handleSelectChange = (value: (string | number)[]) => {
  selectedRowKeys.value = value;
};

// 格式化金额
const formatAmount = (amount: number) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0.00';
  }
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// 页面加载时获取分类列表
onMounted(() => {
  fetchCategoryList();
});

// 获取产品分类列表
const fetchCategoryList = async () => {
  try {
    const res = await getProductCategoryList();
    if (res.code === 0 || res.code === 200) {
      const data = res.data || [];
      // 确保 data 是数组
      if (!Array.isArray(data)) {
        console.error('分类列表数据格式错误:', data);
        MessagePlugin.error('分类列表数据格式错误');
        categoryList.value = [];
        return;
      }
      categoryList.value = data;
      if (categoryList.value.length > 0) {
        selectedCateId.value = categoryList.value[0].cate_id;
        fetchProductList(categoryList.value[0].cate_id);
      }
    } else {
      MessagePlugin.error(res.msg || res.message || '获取分类列表失败');
      categoryList.value = [];
    }
  } catch (error: any) {
    console.error('获取分类列表失败:', error);
    MessagePlugin.error(error?.response?.data?.msg || error?.message || '获取分类列表失败');
    categoryList.value = [];
  }
};

// 分类选择
const handleCategorySelect = (cateId: any) => {
  selectedCateId.value = cateId;
  pagination.value.current = 1;
  fetchProductList(cateId);
};

// 获取产品列表
const fetchProductList = async (cateId: any) => {
  try {
    const res = await getProductListByCate(cateId);

    if (res.code === 0 || res.code === 200) {
      // API 返回的数据结构是 { data: { product_list: [...] } }
      const list = res.data?.product_list || res.data || [];

      // 确保 list 是数组
      if (!Array.isArray(list)) {
        console.error('产品列表数据格式错误:', list);
        MessagePlugin.error('产品列表数据格式错误');
        productList.value = [];
        pagination.value.total = 0;
        return;
      }

      // 为产品添加默认属性
      productList.value = list.map((item: any) => {
        const quantity = 1;
        const quotationPrice = item.market_price || item.unit_price || 0;
        return {
          ...item,
          checked: false,
          quantity,
          quotationPrice,
          quotationTotal: quantity * quotationPrice,
        };
      });
      pagination.value.total = productList.value.length;
    } else {
      MessagePlugin.error(res.msg || res.message || '获取产品列表失败');
      productList.value = [];
      pagination.value.total = 0;
    }
  } catch (error: any) {
    console.error('获取产品列表失败:', error);
    MessagePlugin.error(error?.response?.data?.msg || error?.message || '获取产品列表失败');
    productList.value = [];
    pagination.value.total = 0;
  }
};

// 搜索
const handleSearch = () => {
  if (selectedCateId.value) {
    fetchProductList(selectedCateId.value);
  }
};

// 重置
const handleReset = () => {
  searchKeyword.value = '';
  if (selectedCateId.value) {
    fetchProductList(selectedCateId.value);
  }
};

// 分页变化
const handlePageChange = (current: number) => {
  pagination.value.current = current;
  if (selectedCateId.value) {
    fetchProductList(selectedCateId.value);
  }
};

// 每页条数变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  pagination.value.current = 1;
  if (selectedCateId.value) {
    fetchProductList(selectedCateId.value);
  }
};

// 确认
const handleConfirm = () => {
  if (selectedRowKeys.value.length === 0) {
    MessagePlugin.warning('请至少选择一个产品');
    return;
  }

  // 验证选中的产品是否都填写了单价和数量
  const selectedProducts = productList.value
    .filter((item) => selectedRowKeys.value.includes(item.product_id))
    .map((item) => ({
      product_name: item.product_name || '',
      unit: item.unit || '',
      quantity: item.quantity || 1,
      unit_price: item.quotationPrice || item.unit_price || 0,
    }));

  // 检查是否有未填写单价的产品
  const invalidProducts = selectedProducts.filter((item) => !item.unit_price || item.unit_price <= 0);
  if (invalidProducts.length > 0) {
    MessagePlugin.warning('请为所有选中的产品填写单价');
    return;
  }

  emit('confirm', selectedProducts);
  visible.value = false;
  // 重置选中状态
  selectedRowKeys.value = [];
};

// 关闭
const handleClose = () => {
  visible.value = false;
  // 重置选中状态
  selectedRowKeys.value = [];
};
</script>
<style scoped lang="less">
.product-select-container {
  display: flex;
  gap: 20px;
  min-height: 500px;
}

.left-sidebar {
  width: 200px;
  flex-shrink: 0;
}

.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .selected-count {
    color: var(--td-text-color-secondary);
    font-size: 14px;
  }

  .filter-item {
    display: flex;
    gap: 8px;
  }
}

.footer-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
