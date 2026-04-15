<template>
  <div class="quotation-confirm-container">
    <t-card :bordered="false" class="form-card">
      <template #header>
        <div class="card-header">
          <div class="header-top">
            <h2>报价单详情</h2>
          </div>
          <div class="header-info">
            <span class="info-label">客户名称:</span>
            <t-link
              v-if="customerInfo.customerName && customerInfo.customerId"
              theme="primary"
              @click="handleCustomerClick"
            >
              {{ customerInfo.customerName }}
            </t-link>
            <span v-else class="info-value">-</span>
            <span class="info-label">主要联系人:</span>
            <span class="info-value">{{ customerInfo.primaryContact || '-' }}</span>
            <span class="info-label">次要联系人:</span>
            <span class="info-value">{{ customerInfo.secondaryContact || '-' }}</span>
          </div>
        </div>
      </template>
      <div class="form-section">
        <div class="section-header">
          <span class="section-icon">■</span>
          <span class="section-title">报价信息</span>
        </div>
        <base-desc label-width="150px">
          <t-row type="flex">
            <base-desc-item label="报价单号"> {{ quotationForm.quotationNumber }} </base-desc-item>
            <base-desc-item label="报价人"> {{ quotationForm.create_user_name }} </base-desc-item>
          </t-row>
          <t-row type="flex">
            <base-desc-item label="报价日期"> {{ quotationForm.quotation_date }} </base-desc-item>
            <base-desc-item label="报价单位"> {{ quotationForm.quotation_unit }} </base-desc-item>
          </t-row>
          <t-row type="flex">
            <base-desc-item label="税率"> {{ quotationForm.tax_rate }} </base-desc-item>
            <base-desc-item label="发票"> {{ quotationForm.invoice }} </base-desc-item>
          </t-row>
          <t-row type="flex">
            <base-desc-item label="运费"> {{ quotationForm.freight }} </base-desc-item>
            <base-desc-item label="成交几率"> {{ quotationForm.win_rate }}% </base-desc-item>
          </t-row>
        </base-desc>
        <div class="section-header">
          <span class="section-icon">■</span>
          <span class="section-title">产品报价</span>
        </div>
        <!-- 统计信息 -->
        <div class="summary-info">
          <div class="summary-item">
            <span class="summary-label">报价记录数量:</span>
            <span class="summary-value">{{ tableData.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">产品总数量:</span>
            <span class="summary-value">{{ totalQuantity }}{{ totalQuantityUnit }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">合计小写:</span>
            <span class="summary-value amount">{{ formatAmount(totalAmount) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">合计大写:</span>
            <span class="summary-value">{{ amountToChinese(totalAmount) }}</span>
          </div>
        </div>

        <!-- 产品表格 -->
        <t-table
          :data="tableData"
          :columns="columns"
          :selected-row-keys="selectedRowKeys"
          row-key="product_id"
          :loading="tableLoading"
        >
          <template #empty>
            <div style="text-align: center; padding: 40px 0; color: #999">暂无数据，请先选择产品</div>
          </template>
        </t-table>
      </div>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { getContactList, getCustomerDetail } from '@/api/customer/customer';
import { getQuotationDetail } from '@/api/quotation';
import { amountToChinese } from '@/utils/ruoyi';

const router = useRouter();
const route = useRoute();

// 报价表单数据
const quotationForm = ref({
  quotationNumber: '',
  owner_user_id: undefined as number | undefined,
  quotation_date: '',
  quotation_unit: '合肥森谱科学仪器有限公司',
  tax_rate: '',
  invoice: '',
  freight: '',
  win_rate: '',
  create_user_name: '',
});
const BaseDescItem = defineAsyncComponent(() => import('@/components/BaseDescItem/index.vue'));
const BaseDesc = defineAsyncComponent(() => import('@/components/BaseDesc/index.vue'));

// 表格数据
const tableData = ref<any[]>([]);
const tableLoading = ref(false);
// 保存原始数据，用于取消编辑
// 保存跟进详情中的 customer_id
const followCustomerId = ref<number | undefined>(undefined);

// 客户信息
const customerInfo = ref({
  customerId: undefined as number | undefined,
  customerName: '',
  primaryContact: '',
  secondaryContact: '',
});
// 选中的行
const selectedRowKeys = ref<(string | number)[]>([]);
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

// 计算总数量
const totalQuantity = computed(() => {
  return tableData.value.reduce((sum, item) => sum + (item.quantity || 0), 0);
});

// 计算总数量单位（取第一个产品的单位，如果都相同）
const totalQuantityUnit = computed(() => {
  if (tableData.value.length === 0) return '个';
  const firstUnit = tableData.value[0]?.unit || '个';
  // 检查是否所有单位都相同
  const allSame = tableData.value.every((item) => (item.unit || '个') === firstUnit);
  return allSame ? firstUnit : '个';
});

// 计算总金额
const totalAmount = computed(() => {
  return tableData.value.reduce((sum, item) => {
    const quantity = Number(item?.quantity || 0);
    const price = Number(item?.quotationPrice || 0);
    return sum + quantity * price;
  }, 0);
});

// 格式化金额
const formatAmount = (amount: number | string) => {
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (isNaN(num)) return '¥0.00';
  return `${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// 加载客户信息
const loadCustomerInfo = async (customerId: number | string) => {
  if (!customerId) return;
  try {
    const response = await getCustomerDetail(customerId);
    if (response && response.code === 0 && response.data) {
      const data = response.data;
      customerInfo.value.customerId = Number(data.id || customerId);
      customerInfo.value.customerName = data.customer_name || '';

      // 获取联系人信息
      if (data.contacts && Array.isArray(data.contacts) && data.contacts.length > 0) {
        // 主要联系人（is_main === 1）
        const mainContact = data.contacts.find((c: any) => c.is_main === 1 || c.is_main === '1');
        if (mainContact) {
          customerInfo.value.primaryContact = mainContact.contact_name || '';
        } else if (data.contacts.length > 0) {
          // 如果没有标记为主要联系人，使用第一个
          customerInfo.value.primaryContact = data.contacts[0].contact_name || '';
        }

        // 次要联系人（is_main !== 1，取第一个）
        const secondaryContacts = data.contacts.filter((c: any) => c.is_main !== 1 && c.is_main !== '1');
        if (secondaryContacts.length > 0) {
          customerInfo.value.secondaryContact = secondaryContacts[0].contact_name || '';
        } else if (data.contacts.length > 1 && !mainContact) {
          // 如果没有主要联系人标记，第二个作为次要联系人
          customerInfo.value.secondaryContact = data.contacts[1].contact_name || '';
        }
      } else {
        // 如果没有联系人，尝试调用联系人列表接口
        try {
          const contactRes = await getContactList(String(customerId));
          if (contactRes && contactRes.code === 0 && contactRes.data) {
            const contactData = contactRes.data;
            const contacts = contactData.list || contactData || [];
            if (contacts.length > 0) {
              const mainContact = contacts.find((c: any) => c.is_main === 1 || c.is_main === '1');
              if (mainContact) {
                customerInfo.value.primaryContact = mainContact.contact_name || '';
              } else if (contacts.length > 0) {
                customerInfo.value.primaryContact = contacts[0].contact_name || '';
              }
              if (contacts.length > 1) {
                const secondaryContacts = contacts.filter((c: any) => c.is_main !== 1 && c.is_main !== '1');
                if (secondaryContacts.length > 0) {
                  customerInfo.value.secondaryContact = secondaryContacts[0].contact_name || '';
                } else {
                  customerInfo.value.secondaryContact = contacts[1].contact_name || '';
                }
              }
            }
          }
        } catch (error) {
          console.error('获取联系人列表失败:', error);
        }
      }
    }
  } catch (error: any) {
    console.error('加载客户信息失败:', error);
  }
};

// 点击客户名称跳转
const handleCustomerClick = () => {
  if (customerInfo.value.customerId) {
    router.push({
      path: '/customerMange/customer/detail',
      query: { id: customerInfo.value.customerId },
    });
  }
};

// 加载报价数据（从报价详情 / 跟进详情 / 本地存储）
const loadQuotationDetail = async () => {
  tableLoading.value = true;
  try {
    // 优先检查是否有报价单ID（quotationId），其次检查是否有跟进ID（folowId）
    const quotationId = route.query.quotationId as string | undefined;
    const response = await getQuotationDetail(quotationId);
    if (response && response.code === 0 && response.data) {
      const detail = response.data;
      // 填充表单数据
      quotationForm.value.quotationNumber = detail.quotation_no || '';
      quotationForm.value.create_user_name = detail.create_user_name || '';
      // 报价日期：接口格式为 YYYY-MM-DD，转换为 YYYY年MM月DD日 供选择器使用
      if (detail.quotation_date) {
        const dateStr = detail.quotation_date;
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateStr.split('-');
          quotationForm.value.quotation_date = `${year}年${month}月${day}日`;
        } else {
          quotationForm.value.quotation_date = dateStr;
        }
      }

      // 成交几率
      if (detail.win_rate !== undefined && detail.win_rate !== null) {
        quotationForm.value.win_rate = detail.win_rate;
      }

      // 保存 customer_id，用于后续提交和“添加协作”等功能
      if (detail.customer_id) {
        followCustomerId.value = Number(detail.customer_id);
        await loadCustomerInfo(detail.customer_id);
      } else if (detail.customer_name) {
        // 仅有客户名称时，也在头部展示
        customerInfo.value.customerName = detail.customer_name;
      }

      // 处理产品列表数据（products 数组）
      if (detail.products && Array.isArray(detail.products) && detail.products.length > 0) {
        tableData.value = detail.products.map((item: any, index: number) => {
          const quantity = Number(item.quantity) || 0;
          const unitPrice = Number(item.unit_price) || 0;
          const totalPrice =
            item.total_price !== undefined && item.total_price !== null
              ? Number(item.total_price)
              : quantity * unitPrice;
          return {
            product_id: item.product_id || `temp_${index}`,
            product_name: item.product_name || '',
            brand: item.brand || '',
            product_model: item.product_model || '',
            unit: item.unit || '',
            quantity,
            quotationPrice: unitPrice,
            quotationTotal: totalPrice,
            remark: item.remark || '',
          };
        });
      } else {
        tableData.value = [];
        MessagePlugin.warning('报价单中暂无产品数据');
      }
    } else {
      MessagePlugin.error(response?.msg || '获取报价单详情失败');
    }
  } catch (error: any) {
    console.error('加载报价数据失败:', error);
    MessagePlugin.error(error?.message || '加载报价数据失败，请重试');
  } finally {
    tableLoading.value = false;
  }
};

// 页面加载
onMounted(async () => {
  loadQuotationDetail();
});
</script>
<style scoped lang="less">
.quotation-confirm-container {
  padding: 40px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0px 2px 3px 0px rgba(0, 0, 0, 0.1);
}

.form-card {
  :deep(.t-card__header) {
    border-bottom: 1px dashed var(--td-component-border);
  }
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 22px;

  .header-top {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-icon {
    font-size: 20px;
    color: var(--td-brand-color);
  }

  h2 {
    margin: 0;
    font-size: var(--td-font-size-title-large);
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--td-text-color-secondary);

    .info-label {
      color: var(--td-text-color-placeholder);
      margin-right: 4px;
    }

    .info-value {
      color: var(--td-text-color-primary);
      margin-right: 16px;
    }

    .t-button {
      margin-left: auto;
    }
  }
}

.form-section {
  margin-bottom: var(--td-comp-margin-xxl);

  .section-title {
    font-size: var(--td-font-size-title-medium);
    font-weight: 500;
    color: var(--td-text-color-primary);
    padding-bottom: 24px;
    padding-top: 24px;
  }
  .summary-info {
    display: flex;
    gap: 32px;
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 16px;

    .summary-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .summary-label {
        font-size: 14px;
        color: #666;
      }

      .summary-value {
        font-size: 14px;
        color: #333;
        font-weight: 500;

        &.amount {
          color: #f00;
          font-weight: 600;
        }
      }
    }
  }
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);

  .section-icon {
    color: var(--td-text-color-primary);
    font-size: 14px;
  }

  .section-title {
    flex: 1;
  }

  .view-details-link {
    font-weight: normal;
    font-size: 14px;
  }
}
.form-actions {
  padding-top: 20px;
  border-top: 1px dashed var(--td-component-border);

  .footer-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .footer-left {
      display: flex;
      gap: 16px;
    }

    .footer-right {
      display: flex;
      gap: 12px;
    }
  }
}
</style>
.includes('.')) {
