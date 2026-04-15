<template>
  <div class="contract-add-container">
    <t-card :bordered="false" class="form-card">
      <template #header>
        <div class="card-header">
          <h2>创建合同</h2>
        </div>
      </template>
      <t-form
        ref="formRef"
        :data="formData"
        :rules="formRules"
        label-align="top"
        :label-width="120"
        @submit="handleSubmit"
        @reset="handleReset"
      >
        <t-row :gutter="[24, 24]">
          <!-- 合同主题 -->
          <t-col :span="6">
            <t-form-item label="合同主题" name="contract_title" required-mark>
              <t-input
                v-model="formData.contract_title"
                placeholder="请输入合同主题"
                :maxlength="255"
                show-word-limit
              />
            </t-form-item>
          </t-col>

          <!-- 客户名称 -->
          <t-col :span="6">
            <t-form-item label="客户名称" name="customer_id" required-mark>
              <t-select
                v-model="formData.customer_id"
                placeholder="选择客户"
                :options="customerOptions"
                :loading="loadingCustomer"
                filterable
                clearable
                disabled
                @search="handleCustomerSearch"
                @change="handleCustomerChange"
              >
                <template #empty>
                  <div v-if="loadingCustomer">加载中...</div>
                  <div v-else>暂无数据</div>
                </template>
              </t-select>
            </t-form-item>
          </t-col>

          <!-- 关联报价 -->
          <t-col :span="6">
            <t-form-item label="关联报价" required-mark>
              <div class="product-select-wrapper">
                <t-link v-if="quotationNo" theme="primary" @click="handleQuotationDetailClick">
                  {{ quotationNo }}
                </t-link>
                <span v-else class="quotation-loading">加载中...</span>
                <span v-if="productList.length > 0" class="product-count"
                  >已添加产品记录{{ productList.length }}条</span
                >
              </div>
            </t-form-item>
          </t-col>

          <!-- 合同总金额 -->
          <t-col :span="6">
            <t-form-item label="合同总金额" name="contract_amount" required-mark>
              <div class="amount-input-wrapper">
                <t-input v-model="formData.contract_amount" :min="0" placeholder="请先选择关联产品" style="flex: 1" />
                <span class="amount-unit">元</span>
              </div>
            </t-form-item>
          </t-col>

          <!-- 合同类型 -->
          <t-col :span="6">
            <t-form-item label="合同类型" name="contract_type">
              <t-select
                v-model="formData.contract_type"
                placeholder="选择类型"
                :options="contractTypeOptions"
                clearable
              />
            </t-form-item>
          </t-col>

          <!-- 签定日期 -->
          <t-col :span="6">
            <t-form-item label="签定日期" name="sign_date" required-mark>
              <t-date-picker v-model="formData.sign_date" placeholder="选择日期" style="width: 100%" />
            </t-form-item>
          </t-col>

          <!-- 维护时间 -->
          <!-- <t-col :span="6">
            <t-form-item label="维护时间" name="maintain_time">
              <t-date-picker v-model="formData.maintain_time" placeholder="选择日期" style="width: 100%" />
            </t-form-item>
          </t-col> -->

          <!-- 交货日期 -->
          <t-col :span="6">
            <t-form-item label="交货日期" name="delivery_date">
              <t-date-picker v-model="formData.delivery_date" placeholder="选择日期" style="width: 100%" />
            </t-form-item>
          </t-col>

          <!-- 客户签约人 -->
          <t-col :span="6">
            <t-form-item label="客户签约人" name="customer_signer">
              <t-input v-model="formData.customer_signer" placeholder="请输入客户签约人" />
            </t-form-item>
          </t-col>

          <!-- 我方签约人 -->
          <t-col :span="6">
            <t-form-item label="我方签约人" name="our_signer">
              <t-input v-model="formData.our_signer" placeholder="请输入我方签约人" />
            </t-form-item>
          </t-col>

          <!-- 交货地点 -->
          <t-col :span="6">
            <t-form-item label="交货地点" name="delivery_address">
              <t-input v-model="formData.delivery_address" placeholder="请输入交货地点" />
            </t-form-item>
          </t-col>
          <!-- 归属人员 -->
          <t-col :span="6">
            <t-form-item label="归属人员" name="owner_user_id" required-mark>
              <t-select
                v-model="formData.owner_user_id"
                placeholder="选择归属人员"
                :options="ownerOptions"
                :loading="loadingOwner"
                clearable
              >
                <template #empty>
                  <div v-if="loadingOwner">加载中...</div>
                  <div v-else>暂无数据</div>
                </template>
              </t-select>
            </t-form-item>
          </t-col>
          <!-- 付款计划 -->
          <t-col :span="12">
            <t-form-item label="付款计划">
              <div class="payment-plan-wrapper">
                <div class="payment-plan-header">
                  <t-button theme="primary" variant="outline" @click="addPaymentStage">
                    <template #icon>
                      <t-icon name="add" />
                    </template>
                    添加付款期次
                  </t-button>
                </div>
                <div class="payment-plan-table">
                  <table class="plan-table">
                    <thead>
                      <tr>
                        <th width="80">期次</th>
                        <th width="180">回款日期</th>
                        <th width="150">回款占比</th>
                        <th width="180">回款金额(元)</th>
                        <th width="150">回款阶段</th>
                        <th width="80">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(stage, index) in paymentStages" :key="index">
                        <td>{{ index + 1 }}</td>
                        <td>
                          <t-date-picker v-model="stage.date" placeholder="选择日期" style="width: 100%" />
                        </td>
                        <td>
                          <div class="percentage-input">
                            <t-input
                              v-model="stage.percentage"
                              type="number"
                              :min="0"
                              :max="100"
                              placeholder="0"
                              style="flex: 1"
                              @change="updatePaymentAmount(index)"
                            />
                            <span class="percentage-unit">%</span>
                          </div>
                        </td>
                        <td>
                          <t-input
                            v-model="stage.amount"
                            type="number"
                            :min="0"
                            placeholder="0"
                            :disabled="true"
                            style="width: 100%"
                          />
                        </td>
                        <td>
                          <t-select
                            v-model="stage.stage"
                            placeholder="回款阶段"
                            :options="paymentStageOptions"
                            style="width: 100%"
                          />
                        </td>
                        <td>
                          <t-button theme="danger" variant="text" size="small" @click="removePaymentStage(index)">
                            <t-icon name="delete" />
                          </t-button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-if="paymentStages.length === 0" class="empty-plan">
                    暂无付款期次，请点击"添加付款期次"按钮添加
                  </div>
                </div>
              </div>
            </t-form-item>
          </t-col>

          <!-- 上传附件 -->
          <t-col :span="12">
            <t-form-item label="上传附件" name="attachments">
              <base-upload
                v-model="formData.attachments"
                :upload-action="uploadAction"
                :multiple="true"
                button-text="选择附件"
                tips="支持格式:.rar .zip .doc .docx .pdf,单个文件不能超过20MB"
                :max-size="20"
                :allowed-types="['.rar', '.zip', '.doc', '.docx', '.pdf']"
              />
            </t-form-item>
          </t-col>

          <!-- 备注信息 -->
          <t-col :span="12">
            <t-form-item label="备注信息" name="remark">
              <t-textarea
                v-model="formData.remark"
                placeholder="请输入备注信息"
                :autosize="{ minRows: 4, maxRows: 6 }"
                :maxlength="300"
                show-word-limit
              />
            </t-form-item>
          </t-col>
        </t-row>
      </t-form>
    </t-card>

    <!-- 底部操作按钮 -->
    <div class="footer-actions">
      <t-button theme="primary" @click="handleSave"> 提交合同 </t-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, SubmitContext, UploadFile } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { quotationToContract } from '@/api/contract';
import { getCustomerList, getEmployeeList } from '@/api/customer/customer';
import { getDictOptions } from '@/api/dic';
import { getQuotationDetail } from '@/api/quotation';
import BaseUpload from '@/components/BaseUpload/index.vue';

defineOptions({
  name: 'QuationContract',
});

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstanceFunctions>();
const quotationNo = ref<string>('');

// 报价ID（从路由参数获取）
const quotationId = computed(() => {
  const id = route.query.quotationId as string | undefined;
  return id ? Number(id) : null;
});

// 表单数据
const formData = ref({
  contract_title: '',
  customer_id: null as number | null, // 修改为数字或null,
  quotation_id: null as number | null, // 修改为数字或null,
  contract_amount: 0,
  contract_type: '',
  sign_date: '',
  maintain_time: '',
  delivery_date: '',
  customer_signer: '',
  our_signer: '',
  delivery_address: '',
  payment_method: '',
  attachments: [],
  owner_user_id: '',
  remark: '',
});

// 产品列表
const productList = ref<Array<{ product_name: string; unit: string; quantity: number; unit_price: number }>>([]);

// 表单验证规则
const formRules = {
  contract_title: [{ required: true, message: '请输入合同主题', type: 'error' }],
  customer_id: [{ required: true, message: '请选择客户', type: 'error' }],
  contract_amount: [{ required: true, message: '请输入合同总金额', type: 'error' }],
  sign_date: [{ required: true, message: '请选择签定日期', type: 'error' }],
  owner_user_id: [{ required: true, message: '请选择归属人员', type: 'error' }],
};

// 客户选项
const customerOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingCustomer = ref(false);
const customerSearchKeyword = ref('');

// 加载客户列表
const loadCustomerOptions = async (keyword = '') => {
  loadingCustomer.value = true;
  try {
    const res = await getCustomerList({
      type: 'list',
      page: 1,
      limit: 20,
      keyword: keyword || undefined,
    } as any);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || ({} as any);
      const list = (data as any).list || [];
      customerOptions.value = list.map((item: any) => ({
        label: item.customer_name || item.customerName || '',
        value: item.id || '',
      }));
    }
  } catch (error: any) {
    console.error('获取客户列表失败:', error);
    MessagePlugin.error('获取客户列表失败，请重试');
  } finally {
    loadingCustomer.value = false;
  }
};

// 客户搜索
const handleCustomerSearch = (keyword: string) => {
  customerSearchKeyword.value = keyword;
  loadCustomerOptions(keyword);
};

// 客户变化
const handleCustomerChange = (value: string | number) => {
  // 可以在这里加载客户相关信息
};

// 合同类型选项
const contractTypeOptions = ref<Array<{ label: string; value: string | number }>>([]);

// 加载合同类型选项
const loadContractTypeOptions = async () => {
  try {
    const res = await getDictOptions('hetong_type');
    if (res.code === 0 || res.code === 200) {
      const data = res.data || [];
      contractTypeOptions.value = data
        .map((item: any) => ({
          label: item.content || item.label || '',
          value: item.value || '',
        }))
        .filter((item: any) => item.label && item.value);
    }
  } catch (error: any) {
    console.error('获取合同类型失败:', error);
    // 加载失败时使用默认选项
    contractTypeOptions.value = [
      { label: '销售合同', value: '销售合同' },
      { label: '采购合同', value: '采购合同' },
      { label: '服务合同', value: '服务合同' },
      { label: '其他', value: '其他' },
    ];
  }
};

// 回款阶段选项
const paymentStageOptions = ref<Array<{ label: string; value: string | number }>>([]);

// 加载回款阶段选项
const loadPaymentStageOptions = async () => {
  try {
    const res = await getDictOptions('huikuan');
    if (res.code === 0 || res.code === 200) {
      const data = res.data || [];
      paymentStageOptions.value = data
        .map((item: any) => ({
          label: item.content || item.label || '',
          value: item.value || '',
        }))
        .filter((item: any) => item.label && item.value);
    }
  } catch (error: any) {
    console.error('获取回款阶段失败:', error);
    // 加载失败时使用默认选项
    paymentStageOptions.value = [
      { label: '预付款', value: 'prepayment' },
      { label: '首付款', value: 'downpayment' },
      { label: '中期款', value: 'midpayment' },
      { label: '上线验收', value: 'acceptance' },
      { label: '尾款', value: 'balance' },
      { label: '其他', value: 'other' },
    ];
  }
};

// 付款期次
interface PaymentStage {
  date: string;
  percentage: number;
  amount: number;
  stage: string;
}

const paymentStages = ref<PaymentStage[]>([]);

// 添加付款期次
const addPaymentStage = () => {
  paymentStages.value.push({
    date: '',
    percentage: 0,
    amount: 0,
    stage: '',
  });
};

// 移除付款期次
const removePaymentStage = (index: number) => {
  paymentStages.value.splice(index, 1);
  // 更新所有期次的金额
  paymentStages.value.forEach((_, i) => updatePaymentAmount(i));
};

// 更新付款金额
const updatePaymentAmount = (index: number) => {
  const stage = paymentStages.value[index];
  if (stage && formData.value.contract_amount) {
    stage.amount = Number(((formData.value.contract_amount * stage.percentage) / 100).toFixed(2));
  }
};

// 监听合同总金额变化，更新所有付款期次的金额
watch(
  () => formData.value.contract_amount,
  (newAmount) => {
    paymentStages.value.forEach((stage, index) => {
      if (stage.percentage > 0) {
        stage.amount = Number(((newAmount * stage.percentage) / 100).toFixed(2));
      }
    });
  },
);
// 归属人员选项
const ownerOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingOwner = ref(false);

// 加载归属人员列表
const loadOwnerOptions = async () => {
  loadingOwner.value = true;
  try {
    const response = await getEmployeeList({
      limit: 1000,
    });
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      ownerOptions.value = data.map((emp: any) => ({
        label: emp.real_name || '',
        value: String(emp.id || ''),
      }));
    }
  } catch (error: any) {
    console.error('获取员工列表失败:', error);
    MessagePlugin.error('获取员工列表失败，请重试');
  } finally {
    loadingOwner.value = false;
  }
};

// 文件上传相关
const uploadAction = ref('/api/dict/upload');

// 跳转到报价单详情页面
const handleQuotationDetailClick = () => {
  if (quotationId.value) {
    router.push({
      name: 'QuotationDetail',
      query: { quotationId: quotationId.value },
    });
  }
};

// 监听产品列表变化，自动计算总金额
watch(
  () => productList.value,
  (newProducts) => {
    if (newProducts.length > 0) {
      const totalAmount = newProducts.reduce((sum, item) => {
        return sum + (item.unit_price || 0) * (item.quantity || 0);
      }, 0);
      formData.value.contract_amount = Number(totalAmount.toFixed(2));
    }
  },
  { deep: true },
);

// 保存合同（提交合同）
const handleSave = async () => {
  // 先验证产品列表
  if (productList.value.length === 0) {
    MessagePlugin.warning('请添加产品');
    return;
  }

  const result = await formRef.value?.validate();
  if (result === true) {
    await submitContract();
  }
};

// 提交合同（报价转合同）
const submitContract = async () => {
  try {
    // 检查报价ID
    if (!quotationId.value) {
      MessagePlugin.warning('缺少报价ID参数');
      return;
    }

    // 处理附件数据，转换为指定格式
    const formatAttachments = (files: UploadFile[]) => {
      if (!files || files.length === 0) return [];
      return files
        .filter((file) => file.url || file.response) // 只处理已上传成功的文件
        .map((file) => {
          // 从上传响应中获取文件URL，优先使用 url，其次从 response 中获取
          const fileUrl =
            file.url || file.response?.url || file.response?.data?.url || file.response?.data?.file_url || '';
          return {
            original_name: file.name || '',
            file_url: fileUrl,
            file_size: file.size || 0,
          };
        });
    };
    // 处理付款计划数据
    const formatPaymentPlan = (stages: PaymentStage[]) => {
      return stages.map((stage, index) => ({
        stage: index + 1,
        date: stage.date,
        percentage: stage.percentage,
        amount: stage.amount,
        stage_name: stage.stage,
      }));
    };
    // 构建提交数据，参照 customer-contract/add 接口的传参格式，多传 quotation_id
    const submitData: any = {
      ...formData.value,
      products: productList.value,
      attachments: formatAttachments(formData.value.attachments || []),
      payment_plan: formatPaymentPlan(paymentStages.value),
      quotation_id: quotationId.value, // 多传 quotation_id
    };

    // 调用报价转合同接口
    const response = await quotationToContract(submitData);

    if (response.code === 0 || response.code === 200) {
      MessagePlugin.success(response.msg || '提交成功');
      router.push('/contractMange/contractMange');
    } else {
      MessagePlugin.error(response.msg || response.message || '提交失败');
    }
  } catch (error: any) {
    console.error('提交合同失败:', error);
    MessagePlugin.error(error?.response?.data?.msg || error?.message || '提交失败，请重试');
  }
};

// 表单提交
const handleSubmit = async ({ validateResult, firstError }: SubmitContext) => {
  if (validateResult === true) {
    await submitContract(false);
  } else {
    MessagePlugin.warning(firstError || '请完善表单信息');
  }
};

// 表单重置
const handleReset = () => {
  formData.value = {
    contract_title: '',
    customer_id: '',
    quotation_id: '',
    contract_amount: 0,
    contract_type: '',
    sign_date: '',
    maintain_time: '',
    delivery_date: '',
    customer_signer: '',
    our_signer: '',
    delivery_address: '',
    payment_method: '',
    attachments: [],
    owner_user_id: '',
    remark: '',
  };
  productList.value = [];
};

// 加载报价详情并填充表单
const loadQuotationDetail = async () => {
  if (!quotationId.value) {
    MessagePlugin.warning('缺少报价ID参数');
    return;
  }

  try {
    const response = await getQuotationDetail(quotationId.value);
    if (response && (response.code === 0 || response.code === 200) && response.data) {
      const detail = response.data;

      // 保存报价单号
      quotationNo.value = detail.quotation_no || '';

      // 填充归属人员
      if (detail.owner_user_id) {
        formData.value.owner_user_id = String(detail.owner_user_id);
      }

      // 填充客户ID和客户名称
      if (detail.customer_id) {
        formData.value.customer_id = Number(detail.customer_id);
        // 确保客户选项中有该客户
        const customerExists = customerOptions.value.some((opt) => Number(opt.value) === Number(detail.customer_id));
        if (!customerExists) {
          // 如果客户不在选项中，添加到选项列表
          customerOptions.value.push({
            label: detail.customer_name || `客户${detail.customer_id}`,
            value: Number(detail.customer_id),
          });
        }
      }

      // 填充关联报价ID
      formData.value.quotation_id = quotationId.value;

      // 填充关联报价的商品
      if (detail.products && Array.isArray(detail.products) && detail.products.length > 0) {
        productList.value = detail.products.map((item: any) => ({
          product_name: item.product_name || '',
          unit: item.unit || '',
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
        }));

        // 计算合同总金额
        const totalAmount = productList.value.reduce((sum, item) => {
          return sum + (item.unit_price || 0) * (item.quantity || 0);
        }, 0);
        formData.value.contract_amount = Number(totalAmount.toFixed(2));
      } else {
        productList.value = [];
        MessagePlugin.warning('报价单中暂无产品数据');
      }
    } else {
      MessagePlugin.error(response?.msg || '获取报价详情失败');
    }
  } catch (error: any) {
    console.error('加载报价详情失败:', error);
    MessagePlugin.error(error?.message || '获取报价详情失败，请重试');
  }
};

// 初始化
onMounted(async () => {
  await loadCustomerOptions();
  await loadOwnerOptions();
  await loadContractTypeOptions();
  await loadPaymentStageOptions();
  // 如果有报价ID，加载报价详情
  if (quotationId.value) {
    await loadQuotationDetail();
  }
});
</script>
<style scoped lang="less">
.contract-add-container {
  padding: 20px;
  background: #fff;
}

.form-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  }
}

.product-select-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;

  .product-count {
    color: var(--td-text-color-secondary);
    font-size: 14px;
  }

  .quotation-loading {
    color: var(--td-text-color-secondary);
    font-size: 14px;
  }
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;

  .amount-unit {
    color: var(--td-text-color-secondary);
    font-size: 14px;
    white-space: nowrap;
  }
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
}
.payment-plan-wrapper {
  .payment-plan-header {
    margin-bottom: 16px;
  }

  .payment-plan-table {
    border: 1px solid #e5e6eb;
    border-radius: 4px;
    overflow: hidden;

    .plan-table {
      width: 100%;
      border-collapse: collapse;

      th,
      td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #e5e6eb;

        &:last-child {
          text-align: center;
        }
      }

      th {
        background-color: #f5f7fa;
        font-weight: 500;
      }

      tr:hover {
        background-color: #f9f9f9;
      }
    }

    .empty-plan {
      padding: 40px;
      text-align: center;
      color: #999;
      background-color: #fafafa;
    }
  }
}

.percentage-input {
  display: flex;
  align-items: center;
  gap: 8px;

  .percentage-unit {
    color: #666;
    white-space: nowrap;
  }
}
</style>
