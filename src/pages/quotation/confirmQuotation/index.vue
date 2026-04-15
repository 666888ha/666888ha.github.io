<template>
  <div class="quotation-confirm-container">
    <t-card :bordered="false" class="form-card">
      <template #header>
        <div class="card-header">
          <div class="header-top">
            <h2>确认报价</h2>
          </div>
          <div class="header-info">
            <span class="info-label">客户名称:</span>
            <t-select
              v-if="showCustomerSelect"
              v-model="followCustomerId"
              class="customer-select-inline"
              placeholder="请选择客户"
              filterable
              clearable
              :options="customerSearchOptions"
              :loading="loadingCustomers"
              @search="searchCustomer"
              @popup-visible-change="onCustomerPopupVisible"
              @change="onDirectCustomerSelectChange"
            >
              <template #empty>
                <div v-if="loadingCustomers">加载中...</div>
                <div v-else>暂无数据</div>
              </template>
            </t-select>
            <t-link
              v-else-if="customerInfo.customerName && customerInfo.customerId"
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
      <t-form ref="formRef" :data="quotationForm" label-align="top" :label-width="120">
        <!-- 基础信息 -->
        <div class="form-section">
          <t-row :gutter="[24, 24]">
            <t-col :span="3">
              <t-form-item label="报价单号" name="quotationNumber">
                <t-input v-model="quotationForm.quotationNumber" placeholder="系统自动生成" disabled />
              </t-form-item>
            </t-col>
            <t-col :span="3">
              <t-form-item label="报价人" name="create_user_id">
                <t-select
                  v-model="quotationForm.create_user_id"
                  placeholder="请选择报价人"
                  clearable
                  :options="quoterOptions"
                  :loading="loadingQuoters"
                  style="width: 100%"
                >
                  <template #empty>
                    <div v-if="loadingQuoters">加载中...</div>
                    <div v-else>暂无数据</div>
                  </template>
                </t-select>
              </t-form-item>
            </t-col>
            <t-col :span="3">
              <t-form-item label="报价日期" name="quotation_date">
                <t-date-picker
                  v-model="quotationForm.quotation_date"
                  format="YYYY年MM月DD日"
                  placeholder="请选择日期"
                  style="width: 100%"
                />
              </t-form-item>
            </t-col>
            <t-col :span="3">
              <t-form-item label="报价单位" name="quotation_unit">
                <t-input v-model="quotationForm.quotation_unit" placeholder="请输入报价单位" />
              </t-form-item>
            </t-col>
            <t-col :span="3">
              <t-form-item label="税率" name="tax_rate">
                <t-select v-model="quotationForm.tax_rate" :options="taxRateOptions" placeholder="请选择税率" />
              </t-form-item>
            </t-col>
            <t-col :span="3">
              <t-form-item label="发票" name="invoice">
                <t-select v-model="quotationForm.invoice" :options="invoiceOptions" placeholder="请选择发票类型" />
              </t-form-item>
            </t-col>
            <t-col :span="3">
              <t-form-item label="运费" name="freight">
                <t-select v-model="quotationForm.freight" :options="freightOptions" placeholder="请选择运费" />
              </t-form-item>
            </t-col>
            <t-col :span="3">
              <t-form-item label="成交几率" name="win_rate">
                <t-select
                  v-model="quotationForm.win_rate"
                  placeholder="请选择成交几率"
                  :options="dealProbabilityOptions"
                  clearable
                  style="width: 100%"
                />
              </t-form-item>
            </t-col>
          </t-row>
        </div>

        <!-- 产品报价 -->
        <div class="form-section">
          <div class="content-header">
            <div class="section-title">产品报价</div>
            <t-button v-if="!isEditing" theme="primary" variant="outline" @click="handleEditQuotation">
              <template #icon>
                <t-icon name="edit" />
              </template>
              编辑报价
            </t-button>
            <t-space v-else>
              <t-button theme="primary" @click="() => handleSaveQuotation('save')">
                <template #icon>
                  <t-icon name="check" />
                </template>
                保存
              </t-button>
              <t-button theme="default" variant="outline" @click="handleCancelEdit">
                <template #icon>
                  <t-icon name="close" />
                </template>
                取消
              </t-button>
            </t-space>
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
            @select-change="handleSelectChange"
          >
            <!-- 数量列 -->
            <template #quantity="{ row }">
              <t-input-number
                v-if="isEditing"
                v-model="row.quantity"
                :min="1"
                style="width: 100px"
                @change="() => handlePriceChange(row)"
              />
              <span v-else>{{ row?.quantity || 0 }}</span>
            </template>
            <!-- 单价列 -->
            <template #quotationPrice="{ row }">
              <t-input-number
                v-if="isEditing"
                v-model="row.quotationPrice"
                :min="0"
                :precision="2"
                style="width: 120px"
                @change="() => handlePriceChange(row)"
              />
              <span v-else>{{ formatAmount(row?.quotationPrice) }}</span>
            </template>
            <!-- 总价列 -->
            <template #quotationTotal="{ row }">
              <span>¥{{ formatAmount((row?.quotationPrice || 0) * (row?.quantity || 0)) }}</span>
            </template>
            <template #operation="{ row }">
              <t-button theme="primary" variant="text" @click="handleDelete(row)">删除</t-button>
            </template>
            <template #empty>
              <div style="text-align: center; padding: 40px 0; color: #999">暂无数据，请先选择产品</div>
            </template>
          </t-table>
        </div>

        <!-- 表单操作按钮 -->
        <t-form-item class="form-actions">
          <div class="footer-wrapper">
            <div class="footer-left">
              <t-checkbox v-model="selectAll" @change="handleSelectAll">全选</t-checkbox>
              <t-checkbox v-model="invertSelection" @change="handleInvertSelection">反选</t-checkbox>
            </div>
            <div class="footer-right">
              <t-space>
                <t-button v-if="quotationId" theme="primary" @click="handleGeneratePDF"> 生成PDF </t-button>
                <t-button theme="primary" @click="() => handleSaveQuotation('confirm')">确认报价</t-button>
              </t-space>
            </div>
          </div>
        </t-form-item>
      </t-form>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  getContactList,
  getCustomerDetail,
  getCustomerList,
  getEmployeeList,
  getFollowDetail,
} from '@/api/customer/customer';
import {
  addCustomerQuotation,
  editCustomerQuotation,
  generateQuotationPDF,
  getQuotationDetail,
  quotationToContract,
} from '@/api/quotation';
import { amountToChinese } from '@/utils/ruoyi';
// 优先检查是否有报价单ID（quotationId），其次检查是否有跟进ID（folowId）
const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstanceFunctions>();
const quotationId = route.query.quotationId as string | undefined;

// 报价表单数据
const quotationForm = ref({
  quotationNumber: '',
  create_user_id: undefined as number | undefined,
  quotation_date: '',
  quotation_unit: '合肥森谱科学仪器有限公司',
  tax_rate: '13%',
  invoice: '增值税专用发票',
  freight: '包含',
  win_rate: '' as number | string,
});

// 税率选项
const taxRateOptions = [
  { label: '13%', value: '13%' },
  { label: '9%', value: '9%' },
  { label: '6%', value: '6%' },
  { label: '3%', value: '3%' },
  { label: '0%', value: '0%' },
];

// 发票选项
const invoiceOptions = [
  { label: '增值税专用发票', value: '增值税专用发票' },
  { label: '增值税普通发票', value: '增值税普通发票' },
  { label: '电子发票', value: '电子发票' },
];

// 运费选项
const freightOptions = [
  { label: '包含', value: '包含' },
  { label: '不包含', value: '不包含' },
  { label: '到付', value: '到付' },
];

// 成交几率选项
const dealProbabilityOptions = ref([
  { label: '10%', value: 10 },
  { label: '20%', value: 20 },
  { label: '30%', value: 30 },
  { label: '40%', value: 40 },
  { label: '50%', value: 50 },
  { label: '60%', value: 60 },
  { label: '70%', value: 70 },
  { label: '80%', value: 80 },
  { label: '90%', value: 90 },
  { label: '100%', value: 100 },
]);

// 报价人选项
const quoterOptions = ref<Array<{ label: string; value: number }>>([]);
const loadingQuoters = ref(false);

// 加载报价人选项
const loadQuoterOptions = async () => {
  if (loadingQuoters.value || quoterOptions.value.length > 0) {
    return;
  }
  loadingQuoters.value = true;
  try {
    const res = await getEmployeeList({
      limit: 1000, // 获取所有员工
    });
    if (res.code === 0 || res.code === 200) {
      const data = res.data || [];
      quoterOptions.value = data.map((emp: any) => ({
        label: emp.real_name || '',
        value: emp.id || '',
      }));
    } else {
      MessagePlugin.error((res as any).msg || '获取报价人列表失败');
    }
  } catch (error: any) {
    console.error('获取报价人列表失败:', error);
    MessagePlugin.error('获取报价人列表失败，请重试');
  } finally {
    loadingQuoters.value = false;
  }
};

// 表格数据
const tableData = ref<any[]>([]);
const tableLoading = ref(false);
// 编辑状态
const isEditing = ref(false);
// 保存原始数据，用于取消编辑
const originalTableData = ref<any[]>([]);
// 保存跟进详情中的 customer_id（无跟进时由用户直接选择客户）
const followCustomerId = ref<number | undefined>(undefined);

// 客户信息（需在 showCustomerSelect 等计算属性之前声明）
const customerInfo = ref({
  customerId: undefined as number | undefined,
  customerName: '',
  primaryContact: '',
  secondaryContact: '',
});

/** 路由中带非空跟进 id 时仍走原跟进报价流程 */
const hasValidFollowId = computed(() => {
  const f = route.query.folowId as string | undefined;
  if (f === undefined || f === null) return false;
  return String(f).trim() !== '';
});

/** 列表直开报价：无跟进 id，需在页面选择客户 */
const showCustomerSelect = computed(() => {
  if (quotationId) return false;
  if (hasValidFollowId.value) return false;
  return !(customerInfo.value.customerId && customerInfo.value.customerName);
});

const customerSearchOptions = ref<Array<{ label: string; value: number }>>([]);
const loadingCustomers = ref(false);

const searchCustomer = async (keyword: string) => {
  loadingCustomers.value = true;
  try {
    const res = await getCustomerList({
      type: 'list',
      page: 1,
      limit: 30,
      keyword: keyword?.trim() || undefined,
    } as any);
    if (res.code === 0 || res.code === 200) {
      const list = (res.data as any)?.list || [];
      customerSearchOptions.value = list.map((item: any) => ({
        label: item.customer_name || item.customerName || String(item.id),
        value: Number(item.id),
      }));
    }
  } catch (e) {
    console.error('搜索客户失败:', e);
  } finally {
    loadingCustomers.value = false;
  }
};

const onCustomerPopupVisible = (visible: boolean) => {
  if (visible && customerSearchOptions.value.length === 0) {
    searchCustomer('');
  }
};

const persistQuotationTempCustomer = () => {
  const raw = localStorage.getItem('quotation_temp_data');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (followCustomerId.value) {
      data.customer_id = followCustomerId.value;
      localStorage.setItem('quotation_temp_data', JSON.stringify(data));
    } else {
      delete data.customer_id;
      localStorage.setItem('quotation_temp_data', JSON.stringify(data));
    }
  } catch {
    /* ignore */
  }
};
// 选中的行
const selectedRowKeys = ref<(string | number)[]>([]);
const selectAll = ref(false);
const invertSelection = ref(false);
// 表格列配置
const columns = computed(() => [
  {
    colKey: 'row-select',
    type: 'multiple',
    width: 50,
    fixed: 'left',
  },
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
  { title: '操作', colKey: 'operation', width: 100, fixed: 'right' },
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

// 列表直开报价：选择客户后写入临时数据并刷新头部信息
const handleDirectCustomerChange = async (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '' || Number.isNaN(Number(value))) {
    followCustomerId.value = undefined;
    customerInfo.value = {
      customerId: undefined,
      customerName: '',
      primaryContact: '',
      secondaryContact: '',
    };
    persistQuotationTempCustomer();
    return;
  }
  followCustomerId.value = Number(value);
  const exists = customerSearchOptions.value.some((o) => o.value === followCustomerId.value);
  if (!exists && followCustomerId.value) {
    customerSearchOptions.value.push({
      value: followCustomerId.value,
      label: String(followCustomerId.value),
    });
  }
  await loadCustomerInfo(followCustomerId.value);
  persistQuotationTempCustomer();
};

const onDirectCustomerSelectChange = (value: unknown) => {
  void handleDirectCustomerChange(value as number | string | undefined);
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
    // 1. 如果有 quotationId，直接调用报价单详情接口
    if (quotationId) {
      const response = await getQuotationDetail(quotationId);
      if (response && response.code === 0 && response.data) {
        const detail = response.data;
        // 填充表单数据
        quotationForm.value.create_user_id = detail.create_user_id || '';
        quotationForm.value.quotationNumber = detail.quotation_no || '';
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
          quotationForm.value.win_rate = Number(detail.win_rate);
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
    } else if (hasValidFollowId.value) {
      // 2. 有有效跟进 id：按跟进详情逻辑处理
      const followIdParam = String(route.query.folowId).trim();
      const response = await getFollowDetail(followIdParam);
      if (response && response.code === 0 && response.data) {
        const followData = response.data;
        quotationForm.value.create_user_id = followData.follow_user_id;
        quotationForm.value.win_rate = followData.win_rate;

        // 设置客户ID（用于后续查找客户名称）
        if (followData.customer_id) {
          followCustomerId.value = Number(followData.customer_id);
          // 加载客户信息
          await loadCustomerInfo(followData.customer_id);
        }

        // 从本地存储读取产品数据（如果有）
        const tempDataStr = localStorage.getItem('quotation_temp_data');
        if (tempDataStr) {
          const tempData = JSON.parse(tempDataStr);
          // 处理产品列表数据
          if (tempData.products && Array.isArray(tempData.products) && tempData.products.length > 0) {
            tableData.value = tempData.products.map((item: any, index: number) => {
              return {
                product_id: item.product_id || `temp_${index}`,
                product_name: item.product_name || '',
                brand: item.brand || '',
                product_model: item.product_model || '',
                unit: item.unit || '',
                quantity: Number(item.quantity) || 0,
                quotationPrice: Number(item.quotationPrice) || 0,
                quotationTotal:
                  Number(item.quotationTotal) || (Number(item.quotationPrice) || 0) * (Number(item.quantity) || 0),
                remark: item.remark || '',
              };
            });
          } else {
            tableData.value = [];
          }
        } else {
          tableData.value = [];
        }
      } else {
        MessagePlugin.error(response?.msg || '获取跟进详情失败');
      }
    } else {
      // 3. 否则，从本地存储读取数据
      const tempDataStr = localStorage.getItem('quotation_temp_data');
      if (!tempDataStr) {
        MessagePlugin.warning('未找到报价数据，请先选择产品');
        router.push({ path: '/quotation/chooseProduct', query: { folowId: '' } });
        return;
      }

      const tempData = JSON.parse(tempDataStr);
      console.log('从本地存储读取的报价数据:', tempData);

      // 直开报价：可从临时数据中恢复已选客户
      if (tempData.customer_id) {
        followCustomerId.value = Number(tempData.customer_id);
        await loadCustomerInfo(tempData.customer_id);
        const name = customerInfo.value.customerName;
        customerSearchOptions.value = [
          {
            value: followCustomerId.value as number,
            label: name || String(tempData.customer_id),
          },
        ];
      }

      // 处理产品列表数据
      if (tempData.products && Array.isArray(tempData.products) && tempData.products.length > 0) {
        tableData.value = tempData.products.map((item: any, index: number) => {
          return {
            product_id: item.product_id || `temp_${index}`,
            product_name: item.product_name || '',
            brand: item.brand || '',
            product_model: item.product_model || '',
            unit: item.unit || '',
            quantity: Number(item.quantity) || 0,
            quotationPrice: Number(item.quotationPrice) || 0,
            quotationTotal:
              Number(item.quotationTotal) || (Number(item.quotationPrice) || 0) * (Number(item.quantity) || 0),
            remark: item.remark || '',
          };
        });
        console.log('转换后的产品列表:', tableData.value);
      } else {
        tableData.value = [];
        MessagePlugin.warning('产品列表为空');
      }
    }
  } catch (error: any) {
    console.error('加载报价数据失败:', error);
    MessagePlugin.error(error?.message || '加载报价数据失败，请重试');
    const hasQuotationId = !!route.query.quotationId;
    if (!hasQuotationId && !hasValidFollowId.value) {
      router.push({ path: '/quotation/chooseProduct', query: { folowId: '' } });
    }
  } finally {
    tableLoading.value = false;
  }
};

// 选择变化
const handleSelectChange = (value: (string | number)[]) => {
  selectedRowKeys.value = value;
  selectAll.value = value.length === tableData.value.length && tableData.value.length > 0;
};

// 全选
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedRowKeys.value = tableData.value.map((item) => item.product_id);
  } else {
    selectedRowKeys.value = [];
  }
};

// 反选
const handleInvertSelection = (checked: boolean) => {
  if (checked) {
    const allIds = tableData.value.map((item) => item.product_id);
    selectedRowKeys.value = allIds.filter((id) => !selectedRowKeys.value.includes(id));
  }
  invertSelection.value = false;
};

// 删除
const handleDelete = (row: any) => {
  tableData.value = tableData.value.filter((item) => item.product_id !== row.product_id);
  selectedRowKeys.value = selectedRowKeys.value.filter((id) => id !== row.product_id);
  MessagePlugin.success('删除成功');
};

// 编辑报价
const handleEditQuotation = () => {
  // 保存原始数据
  originalTableData.value = JSON.parse(JSON.stringify(tableData.value));
  isEditing.value = true;
};

// 保存报价
const handleSaveQuotation = async (type: 'confirm' | 'save') => {
  // 验证数据
  if (tableData.value.length === 0) {
    MessagePlugin.warning('至少需要一个产品');
    return;
  }

  for (const item of tableData.value) {
    if (!item.quotationPrice || item.quotationPrice <= 0) {
      MessagePlugin.warning(`产品 ${item.product_name} 的报价单价必须大于0`);
      return;
    }
    if (!item.quantity || item.quantity <= 0) {
      MessagePlugin.warning(`产品 ${item.product_name} 的数量必须大于0`);
      return;
    }
  }

  // 验证报价单位
  if (!quotationForm.value.quotation_unit) {
    MessagePlugin.warning('请输入报价单位');
    return;
  }

  // 验证报价日期
  if (!quotationForm.value.quotation_date) {
    MessagePlugin.warning('请选择报价日期');
    return;
  }

  // 构建产品列表数据（按照API文档格式）
  const productsData = tableData.value.map((item: any) => ({
    product_name: item.product_name || '',
    unit: item.unit || '',
    quantity: Number.parseInt(String(item.quantity || 0)),
    unit_price: Number.parseFloat(String(item.quotationPrice || 0)),
  }));

  // 格式化报价日期为 Y-m-d 格式
  let formattedDate = '';
  const dateStr = quotationForm.value.quotation_date;
  // 如果格式是 "YYYY年MM月DD日"，转换为 YYYY-MM-DD
  if (dateStr.match(/^\d{4}年\d{2}月\d{2}日$/)) {
    const [year, month, day] = dateStr.match(/\d+/g) || [];
    formattedDate = `${year}-${month}-${day}`;
  } else if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // 如果已经是 YYYY-MM-DD 格式，直接使用
    formattedDate = dateStr;
  } else {
    // 否则尝试转换为 Date 对象再格式化
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
    } else {
      MessagePlugin.warning('报价日期格式不正确');
      return;
    }
  }

  // 获取 customer_id（目前从 followCustomerId 中获取，已在加载详情时设置）
  if (!followCustomerId.value) {
    MessagePlugin.warning(hasValidFollowId.value ? '未找到客户信息，请返回重试' : '请先选择客户');
    return;
  }

  // 如果是确认报价，调用新增/编辑接口
  if (type === 'confirm') {
    try {
      // 构建通用请求数据（按照API文档格式）
      const baseData: any = {
        customer_id: followCustomerId.value,
        quotation_date: formattedDate,
        freight: quotationForm.value.freight,
        invoice: quotationForm.value.invoice,
        create_user_id: quotationForm.value.create_user_id,
        quotation_unit: quotationForm.value.quotation_unit,
        tax_rate: quotationForm.value.tax_rate,
        win_rate: quotationForm.value.win_rate,
        products: productsData,
      };

      // 根据是否有 quotationId 判断是新增还是编辑
      const quotationIdParam = route.query.quotationId as string | undefined;
      let response;
      if (quotationIdParam) {
        // 编辑报价：调用 /customer-quotation/edit，需多传 id
        response = await editCustomerQuotation({
          id: Number(quotationIdParam),
          ...baseData,
        });
      } else {
        // 新增报价：调用 /customer-quotation/add
        response = await addCustomerQuotation(baseData);
      }

      if (response && (response.code === 0 || response.code === 200)) {
        MessagePlugin.success(response.msg || (quotationIdParam ? '编辑报价成功' : '报价提交成功'));
        // 清空本地存储
        localStorage.removeItem('quotation_temp_data');
        // 跳转到报价列表页
        router.push('/quotation/list');
      } else {
        MessagePlugin.error(response?.msg || '报价提交失败');
      }
    } catch (error: any) {
      console.error('提交报价失败:', error);
      const errorMessage = error?.response?.data?.msg || error?.message || '提交报价失败，请重试';
      MessagePlugin.error(errorMessage);
    }
  } else {
    // 如果是保存（编辑模式），不调用接口，只做本地处理
    isEditing.value = false;
    originalTableData.value = [];
    MessagePlugin.success('保存成功');
  }
};

// 取消编辑
const handleCancelEdit = () => {
  // 恢复原始数据
  if (originalTableData.value.length > 0) {
    tableData.value = JSON.parse(JSON.stringify(originalTableData.value));
  }
  isEditing.value = false;
  originalTableData.value = [];
};

// 单价或数量变化时，自动计算总价
const handlePriceChange = (row: any) => {
  // 计算总价
  const quantity = Number(row.quantity) || 0;
  const price = Number(row.quotationPrice) || 0;
  row.quotationTotal = quantity * price;
};

// 生成PDF
const handleGeneratePDF = async () => {
  // 获取报价ID
  if (!quotationId) {
    MessagePlugin.warning('请先保存报价后再生成PDF');
    return;
  }

  try {
    MessagePlugin.loading('正在生成PDF...');
    const response = await generateQuotationPDF(quotationId);

    if (response && (response.code === 0 || response.code === 200)) {
      MessagePlugin.closeAll();
      MessagePlugin.success(response.msg || 'PDF生成成功');

      // 如果返回了文件URL，可以打开下载
      if (response.data && response.data.url) {
        window.open(response.data.url, '_blank');
      } else if (response.data && response.data.file_url) {
        window.open(response.data.file_url, '_blank');
      }
    } else {
      MessagePlugin.closeAll();
      MessagePlugin.error(response?.msg || 'PDF生成失败');
    }
  } catch (error: any) {
    MessagePlugin.closeAll();
    console.error('生成PDF失败:', error);
    MessagePlugin.error(error?.response?.data?.msg || error?.message || '生成PDF失败，请重试');
  }
};

// 页面加载
onMounted(async () => {
  // 加载报价人列表
  await loadQuoterOptions();
  // 从本地存储加载报价数据
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
    padding: var(--td-comp-paddingTB-lg) var(--td-comp-paddingLR-lg);
    border-bottom: 1px dashed var(--td-component-border);
  }

  :deep(.t-card__body) {
    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl);
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
    flex-wrap: wrap;
    align-items: center;
    row-gap: 8px;
    column-gap: 8px;
    font-size: 14px;
    color: var(--td-text-color-secondary);

    .info-label {
      color: var(--td-text-color-placeholder);
      margin-right: 4px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .info-value {
      color: var(--td-text-color-primary);
      margin-right: 16px;
    }

    .t-button {
      margin-left: auto;
    }

    .customer-select-inline {
      min-width: 280px;
      max-width: 400px;
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

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
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
