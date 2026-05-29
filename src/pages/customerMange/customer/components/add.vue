<template>
  <div class="customer-add-container">
    <t-card :bordered="false" class="form-card">
      <template #header>
        <div class="card-header">
          <t-icon name="user-add" class="header-icon" />
          <h2>{{ isEditMode ? '编辑客户' : '创建客户' }}</h2>
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
        <!-- 基础信息 -->
        <div class="form-section">
          <div class="section-title">基础信息</div>
          <t-row :gutter="[24, 24]">
            <!-- 客户名称 -->
            <t-col :span="6">
              <t-form-item label="客户名称" name="customer_name">
                <t-select
                  v-model="formData.customer_name"
                  placeholder="客户名称"
                  :loading="customerNameSearching"
                  allow-input
                  filterable
                  clearable
                  @search="handleCustomerNameSearch"
                  @change="handleCustomerNameChange"
                >
                  <template #empty>
                    <div v-if="customerNameSearching">搜索中...</div>
                    <div v-else>暂无数据</div>
                  </template>
                  <t-option
                    v-for="item in customerNameOptions"
                    :key="item.value"
                    :value="item.value"
                    :label="item.label"
                    :disabled="item.disabled"
                  >
                    <div class="customer-name-option">
                      <div class="option-left">
                        <span class="company-name">{{ truncateCompanyName(item.label) }}</span>
                        <t-tag v-if="item.disabled" size="small" theme="default" variant="light">公司库企业</t-tag>
                        <t-tag v-else size="small" theme="primary" variant="light">天眼查企业</t-tag>
                      </div>
                      <div class="option-right">
                        <span v-if="item.disabled && item.ownerName" class="owner-info"
                          >归属人: {{ item.ownerName }}</span
                        >
                        <t-button
                          v-if="item.disabled"
                          theme="default"
                          variant="text"
                          size="small"
                          style="margin-left: 8px"
                          @click="clickOper(item)"
                          >申请协作</t-button
                        >
                      </div>
                    </div>
                  </t-option>
                </t-select>
              </t-form-item>
            </t-col>

            <!-- 客户状态 -->
            <t-col :span="6">
              <t-form-item label="客户状态" name="customer_jieduan">
                <t-select
                  v-model="formData.customer_jieduan"
                  placeholder="请选择客户状态"
                  :options="customerStatusOptions"
                  :loading="loadingCustomerStatus"
                  clearable
                />
              </t-form-item>
            </t-col>

            <!-- 标签 -->
            <t-col :span="6">
              <t-form-item label="标签" name="customer_tags">
                <t-select
                  v-model="formData.customer_tags"
                  placeholder="请选择标签"
                  :options="tagOptions"
                  :loading="loadingTags"
                  multiple
                  clearable
                  :max="10"
                />
              </t-form-item>
            </t-col>

            <!-- 所属行业 -->
            <t-col :span="6">
              <t-form-item label="所属行业" name="industry">
                <t-select v-model="formData.industry" placeholder="请选择行业" clearable :options="industryOptions">
                </t-select>
              </t-form-item>
            </t-col>

            <!-- 客户类型 -->
            <t-col :span="6">
              <t-form-item label="客户类型" name="customer_type">
                <t-radio-group v-model="formData.customer_type">
                  <t-radio v-for="item in customerTypeOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </t-radio>
                </t-radio-group>
              </t-form-item>
            </t-col>

            <!-- 客户价值等级 -->
            <t-col :span="6">
              <t-form-item label="客户价值等级" name="value_level">
                <t-rate v-model="formData.value_level" :count="5" />
              </t-form-item>
            </t-col>

            <!-- 注册资本 -->
            <t-col :span="6">
              <t-form-item label="注册资本" name="registered_capital">
                <t-select v-model="formData.registered_capital" placeholder="请选择" clearable>
                  <t-option
                    v-for="item in registeredCapitalOptions"
                    :key="item.value"
                    :value="item.label"
                    :label="item.label"
                  />
                </t-select>
              </t-form-item>
            </t-col>

            <!-- 客户渠道 -->
            <t-col :span="6">
              <t-form-item label="客户渠道" name="channel">
                <t-select v-model="formData.channel" placeholder="请选择渠道" clearable :options="channelOptions">
                </t-select>
              </t-form-item>
            </t-col>

            <!-- 归属人员 -->
            <t-col :span="6">
              <t-form-item label="归属人员" name="owner_user_id">
                <t-select v-model="formData.owner_user_id" placeholder="请选择归属人员" clearable>
                  <t-option v-for="item in ownerOptions" :key="item.value" :value="item.value" :label="item.label" />
                </t-select>
              </t-form-item>
            </t-col>
          </t-row>
        </div>

        <!-- 附加信息 -->
        <div class="form-section">
          <div class="section-title">附加信息</div>
          <t-row :gutter="[24, 32]">
            <!-- 所在地区 -->
            <t-col :span="6">
              <t-form-item label="所在地区" name="region">
                <t-cascader
                  ref="cityRef"
                  v-model="formData.region"
                  :options="areaTree"
                  placeholder="请选择省市区"
                  value-type="full"
                  clearable
                  expand-trigger="click"
                />
              </t-form-item>
            </t-col>

            <!-- 企业办公地址：高德地点检索 + 地图选点 -->
            <t-col :span="18">
              <t-form-item label="企业办公地址" name="address">
                <amap-address-field v-model="formData.address" v-model:region="formData.region" />
              </t-form-item>
            </t-col>
          </t-row>
          <t-row :gutter="[24, 32]">
            <!-- 企业规模 -->
            <t-col :span="6">
              <t-form-item label="企业规模" name="company_scale">
                <t-select v-model="formData.company_scale" placeholder="请选择" clearable>
                  <t-option
                    v-for="item in enterpriseScaleOptions"
                    :key="item.value"
                    :value="item.value"
                    :label="item.label"
                  />
                </t-select>
              </t-form-item>
            </t-col>

            <!-- 相关客户 -->
            <t-col :span="6">
              <t-form-item label="相关客户" name="related_customer_id">
                <t-select
                  v-model="formData.related_customer_id"
                  placeholder="请选择相关客户"
                  multiple
                  clearable
                  :loading="loadingRelatedCustomer"
                >
                  <t-option
                    v-for="item in relatedCustomerOptions"
                    :key="item.value"
                    :value="item.value"
                    :label="item.label"
                  />
                </t-select>
              </t-form-item>
            </t-col>
          </t-row>
        </div>
        <!-- 其他信息 -->
        <div class="form-section">
          <div class="section-title">其他信息</div>
          <t-row>
            <t-col :span="12">
              <t-form-item label="备注" name="remark">
                <t-textarea v-model="formData.remark" placeholder="请输入内容" style="width: 100%"></t-textarea>
              </t-form-item>
            </t-col>
          </t-row>
        </div>

        <!-- 联系人信息 -->
        <div class="form-section">
          <div class="contact-header">
            <div class="section-title">首要联系人 (大股东)</div>
            <t-button theme="primary" @click="handleAddContact">
              <template #icon>
                <t-icon name="add" />
              </template>
              增加联系人
            </t-button>
          </div>
          <div class="contact-list">
            <div v-for="(contact, index) in contactList" :key="index" class="contact-card">
              <div class="contact-delete" @click="handleDeleteContact(index)">
                <t-icon name="close" />
              </div>
              <div class="contact-name">{{ contact.contact_name }}</div>
              <div class="contact-phone">{{ maskPhone(contact.mobile) }}</div>
              <div class="contact-footer">
                <t-link theme="default" variant="text" @click="handleViewMore(contact, index)">
                  查看更多
                  <t-icon name="chevron-right" class="link-arrow" />
                </t-link>
              </div>
            </div>
            <div v-if="contactList.length === 0" class="contact-empty">
              <t-icon name="user" class="empty-icon" />
              <p>暂无联系人，请点击"增加联系人"添加</p>
            </div>
          </div>
        </div>
        <!-- 表单操作按钮 -->
        <t-form-item class="form-actions">
          <t-space>
            <t-button theme="primary" type="submit" :loading="loading">保存</t-button>
            <t-button theme="default" variant="outline" type="reset" :disabled="loading">重置</t-button>
            <t-button
              theme="default"
              variant="outline"
              :disabled="loading"
              @click="router.push('/customerMange/customer')"
            >
              取消
            </t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-card>

    <!-- 联系人信息对话框 -->
    <contact-dialog
      v-model:visible="contactDialogVisible"
      :contact-data="editingContactData"
      :title="contactDialogTitle"
      @submit="handleContactSubmit"
    />
  </div>
</template>
<script setup lang="ts">
import debounce from 'lodash/debounce';
import type { FormInstanceFunctions, FormRules, SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import type { AddCustomerParams } from '@/api/customer/customer';
import {
  addCustomer,
  getCustomerDetail,
  getCustomerList,
  getEmployeeList,
  searchCompany,
  updateCustomer,
} from '@/api/customer/customer';
import { getDictOptions } from '@/api/dic';
import { areaTree } from '@/utils/area';

import AmapAddressField from '@/components/AmapAddressField/index.vue';

import type { Contact } from './ContactDialog.vue';
import ContactDialog from './ContactDialog.vue';

defineOptions({
  name: 'CustomerAdd',
});

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstanceFunctions>();
const loading = ref(false);

// 编辑模式：从路由获取客户ID
const customerId = route.query.id as string | undefined;
const isEditMode = !!customerId;

// 客户状态选项
const customerStatusOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingCustomerStatus = ref(false);

// 表单数据
const formData = ref({
  customer_name: '',
  customer_jieduan: '', // 客户状态，默认1-了解产品
  customer_tags: [],
  industry: '',
  customer_type: 'dealer', // 默认选择"其他客户"
  value_level: 1, // 默认3星
  registered_capital: '', // 注册资本
  channel: '',
  owner_user_id: '', // 归属人 ID
  region: [] as string[], // 级联选择器返回数组格式 [省, 市, 区]
  address: '', // 企业办公地址
  company_scale: '', // 公司规模
  related_customer_id: [] as string[], // 相关客户 ID，多选
  remark: '',
});

// 客户名称搜索相关
const customerNameOptions = ref<Array<{ label: string; value: string; disabled: boolean; ownerName?: string }>>([]);
const customerNameSearching = ref(false);
// 保存选项映射，用于将 tyc_id 转换为 name
const customerNameMap = ref<Record<string, string>>({});
// 保存本地客户的归属人信息
const localCustomerOwners = ref<Record<string, string>>({});

// 客户名称搜索（防抖）
const handleCustomerNameSearch = debounce(async (keyword: string) => {
  if (!keyword || keyword.trim().length === 0) {
    customerNameOptions.value = [];
    customerNameMap.value = {};
    localCustomerOwners.value = {};
    return;
  }

  customerNameSearching.value = true;

  try {
    const response = await searchCompany(keyword);
    if (response.code === 0 || response.code === 200) {
      const data = response.data || {};
      const list = data.list || [];
      // 转换为选项格式
      customerNameOptions.value = list.map((item: any) => {
        const name = item.name || '';
        const id = item.id || '';
        const source = item.type || '';
        const ownerName = item.realname || '';

        // 保存映射关系
        let value = id || name;
        if (source === 'local' && value) {
          value = `local_${value}`;
          localCustomerOwners.value[value] = ownerName;
        }

        if (id) {
          customerNameMap.value[id] = name;
        }

        return {
          label: name,
          value,
          id,
          disabled: source === 'local', // 本地客户不可选择
          ownerName,
        };
      });
    }
  } catch (error: any) {
    console.error('搜索公司失败:', error);
    customerNameOptions.value = [];
    customerNameMap.value = {};
    localCustomerOwners.value = {};
  } finally {
    customerNameSearching.value = false;
  }
  console.log(customerNameOptions.value);
}, 300);

// 客户名称变化处理
const handleCustomerNameChange = (value: string) => {
  if (!value || value.trim().length === 0) {
    return;
  }

  // 跳过本地客户（已禁用，理论上不会触发）
  if (value.includes('local_')) {
    return;
  }

  // 如果选择的是选项（tyc_id），则转换为客户名称
  if (customerNameMap.value[value]) {
    formData.value.customer_name = customerNameMap.value[value];
  }
  // 如果是直接输入的文本，保持原样
};

// 获取本地客户的归属人姓名
const getOwnerName = (value: string) => {
  return localCustomerOwners.value[value] || '';
};

// 截断公司名称到15个字符
const truncateCompanyName = (name: string) => {
  if (!name) return '';
  if (name.length <= 15) return name;
  return `${name.substring(0, 15)}...`;
};

// 联系人列表
const contactList = ref<Contact[]>([]);

// 联系人对话框
const contactDialogVisible = ref(false);
const contactDialogTitle = ref('增加联系人');
const editingContactIndex = ref<number | null>(null);
const editingContactData = ref<Contact | null>(null);

// 标签选项
const tagOptions = ref<Array<{ label: string; value: string }>>([]);
const loadingTags = ref(false);

// 加载标签字典选项
const loadTagOptions = async () => {
  // 如果正在加载或已有数据，则不再请求
  if (loadingTags.value || tagOptions.value.length > 0) {
    return;
  }

  loadingTags.value = true;
  try {
    const response = await getDictOptions('biaoqian');
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      tagOptions.value = data;
    }
  } catch (error: any) {
    MessagePlugin.error('获取标签字典失败，请重试');
  } finally {
    loadingTags.value = false;
  }
};

// 所属行业选项
const industryOptions = ref<Array<{ label: string; value: string }>>([]);

// 注册资本选项
const registeredCapitalOptions = [
  { label: '50万以下', value: 'under50' },
  { label: '50-100万', value: '50-100' },
  { label: '100-500万', value: '100-500' },
  { label: '500-1000万', value: '500-1000' },
  { label: '1000万以上', value: 'over1000' },
];

// 客户渠道选项
const channelOptions = ref<Array<{ label: string; value: string }>>([]);

// 归属人员选项
const ownerOptions = ref<Array<{ label: string; value: string }>>([]);

// 客户类型选项
const customerTypeOptions = ref<Array<{ label: string; value: string }>>([]);

// 加载归属人员列表
const loadOwnerOptions = async () => {
  try {
    const response = await getEmployeeList({
      limit: 1000, // 获取所有员工
    });

    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      // 转换为下拉选项格式
      ownerOptions.value = data.map((emp: any) => ({
        label: emp.real_name || '',
        value: emp.id || '',
      }));
    }
  } catch (error: any) {
    console.error('获取员工列表失败:', error);
    MessagePlugin.error('获取员工列表失败，请重试');
  }
};

// 加载状态标记，防止重复请求
const loadingCustomerType = ref(false);
const loadingIndustry = ref(false);
const loadingChannel = ref(false);

// 相关客户选项
const relatedCustomerOptions = ref<Array<{ label: string; value: string }>>([]);
const loadingRelatedCustomer = ref(false);

// 加载相关客户列表
const loadRelatedCustomerOptions = async () => {
  if (loadingRelatedCustomer.value || relatedCustomerOptions.value.length > 0) {
    return;
  }

  loadingRelatedCustomer.value = true;
  try {
    const res = await getCustomerList({ limit: 1000 });
    if (res.code === 0 || res.code === 200) {
      const list = res.data.list || [];
      relatedCustomerOptions.value = list.map((item: any) => ({
        label: item.customer_name || '',
        value: `${item.id}` || '',
      }));
    }
  } catch (error: any) {
    console.error('获取相关客户列表失败:', error);
    MessagePlugin.error('获取相关客户列表失败，请重试');
  } finally {
    loadingRelatedCustomer.value = false;
  }
};

// 加载客户状态字典选项
const loadCustomerStatusOptions = async () => {
  // 如果正在加载或已有数据，则不再请求
  if (loadingCustomerStatus.value || customerStatusOptions.value.length > 0) {
    return;
  }

  loadingCustomerStatus.value = true;
  try {
    const response = await getDictOptions('customer_jieduan', false);
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      // 转换为选项格式
      customerStatusOptions.value = data;
    }
  } catch (error: any) {
    MessagePlugin.error('获取客户状态字典失败，请重试');
  } finally {
    loadingCustomerStatus.value = false;
  }
};

// 加载客户类型字典选项
const loadCustomerTypeOptions = async () => {
  // 如果正在加载或已有数据，则不再请求
  if (loadingCustomerType.value || customerTypeOptions.value.length > 0) {
    return;
  }

  loadingCustomerType.value = true;
  try {
    const response = await getDictOptions('customer_type', false);
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      // 转换为选项格式
      customerTypeOptions.value = data;

      // 如果默认值不在选项中，设置为第一个选项或空字符串
      if (customerTypeOptions.value.length > 0 && !formData.value.customer_type) {
        formData.value.customer_type = customerTypeOptions.value[0].value;
      }
    }
  } catch (error: any) {
    MessagePlugin.error('获取客户类型字典失败，请重试');
  } finally {
    loadingCustomerType.value = false;
  }
};

// 加载所属行业字典选项
const loadIndustryOptions = async () => {
  // 如果正在加载或已有数据，则不再请求
  if (loadingIndustry.value || industryOptions.value.length > 0) {
    return;
  }

  loadingIndustry.value = true;
  try {
    const response = await getDictOptions('industry', false);

    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      // 转换为选项格式
      industryOptions.value = data;
    }
  } catch (error: any) {
    MessagePlugin.error('获取所属行业字典失败，请重试');
  } finally {
    loadingIndustry.value = false;
  }
};

// 加载客户渠道字典选项
const loadChannelOptions = async () => {
  // 如果正在加载或已有数据，则不再请求
  if (loadingChannel.value || channelOptions.value.length > 0) {
    return;
  }

  loadingChannel.value = true;
  try {
    const response = await getDictOptions('channel', false);

    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      // 转换为选项格式
      channelOptions.value = data;
    }
  } catch (error: any) {
    console.error('获取客户渠道字典失败:', error);
    MessagePlugin.error('获取客户渠道字典失败，请重试');
  } finally {
    loadingChannel.value = false;
  }
};

// 企业规模选项
const enterpriseScaleOptions = [
  { label: '1-50人', value: '1-50' },
  { label: '50-100人', value: '50-100' },
  { label: '100-500人', value: '100-500' },
  { label: '500-1000人', value: '500-1000' },
  { label: '1000人以上', value: 'over1000' },
];

// 表单验证规则
const formRules: FormRules = {
  customer_name: [{ required: true, message: '请输入客户名称', type: 'error' }],
  customer_jieduan: [{ required: true, message: '请选择客户状态', type: 'error' }],
  industry: [{ required: true, message: '请选择所属行业', type: 'error' }],
  customer_type: [{ required: true, message: '请选择客户类型', type: 'error' }],
  value_level: [{ required: true, message: '请选择客户价值等级', type: 'error' }],
  registeredCapital: [{ required: true, message: '请选择注册资本', type: 'error' }],
  channel: [{ required: true, message: '请选择客户渠道', type: 'error' }],
  owner: [{ required: true, message: '请选择归属人员', type: 'error' }],
  region: [{ required: true, message: '请选择所在地区', type: 'error' }],
  address: [{ required: true, message: '请填写企业办公地址', type: 'error' }],
  enterpriseScale: [{ required: true, message: '请选择企业规模', type: 'error' }],
};

// 手机号脱敏显示
const maskPhone = (phone: string) => {
  if (!phone || phone.length !== 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

// 添加联系人
const handleAddContact = () => {
  contactDialogTitle.value = '增加联系人';
  editingContactIndex.value = null;
  editingContactData.value = null;
  contactDialogVisible.value = true;
};
const clickOper = (item: any) => {
  router.push({
    path: '/customerMange/customer/detail',
    query: {
      id: item.id,
    },
  });
};
// 查看/编辑联系人详情
const handleViewMore = (contact: Contact, index: number) => {
  contactDialogTitle.value = '编辑联系人';
  editingContactIndex.value = index;
  // 先复制对象，避免直接修改原始数据
  const contactCopy = { ...contact };
  // 如果 contact_region 是字符串，则转换为数组；如果已经是数组，则直接使用
  if (contactCopy.contact_region) {
    contactCopy.contact_region =
      typeof contactCopy.contact_region === 'string'
        ? contactCopy.contact_region.split(',')
        : contactCopy.contact_region;
  }
  editingContactData.value = contactCopy;
  contactDialogVisible.value = true;
};

// 联系人表单提交
const handleContactSubmit = (contact: Contact) => {
  if (editingContactIndex.value !== null) {
    // 编辑模式
    contactList.value[editingContactIndex.value] = contact;
    MessagePlugin.success('操作成功');
  } else {
    // 新增模式
    contactList.value.push(contact);
    console.log(contact);
    MessagePlugin.success('操作成功');
  }
  editingContactIndex.value = null;
  editingContactData.value = null;
};

// 删除联系人
const handleDeleteContact = (index: number) => {
  if (index >= 0 && index < contactList.value.length) {
    const contact = contactList.value[index];
    contactList.value.splice(index, 1);
    MessagePlugin.success('联系人已删除');
  }
};
interface AreaData {
  value: string;
  label: string;
  children?: AreaData[]; // 使用可选属性
}
let currentData = areaTree as AreaData[];
// 根据 code 数组转换为省市区名称数组
const convertRegionCodesToNames = (codes: (string | number)[]): string[] => {
  if (!codes || codes.length === 0) return [];

  const names: string[] = [];

  for (const code of codes) {
    const codeStr = String(code);
    const found = currentData.find((item) => item.value === codeStr);
    if (found) {
      names.push(found.label);
      if (found.children && found.children.length > 0) {
        currentData = found.children;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return names;
};

// 提交表单
const handleSubmit = async ({ validateResult, firstError }: SubmitContext) => {
  if (validateResult !== true) {
    MessagePlugin.warning(firstError || '请完善表单信息');
    return;
  }

  loading.value = true;
  try {
    // 处理地区数据（级联选择器返回的是 code 数组）
    const regionCodes = formData.value.region || [];
    if (contactList.value && contactList.value.length > 0) {
      contactList.value[0].is_main = contactList.value.length ? 1 : 0;
    }

    // 将 code 数组转换为名称数组
    const regionNames = convertRegionCodesToNames(regionCodes).join('/');
    const param = JSON.parse(JSON.stringify(formData.value)) as typeof formData.value;
    const params: AddCustomerParams = {
      customer_name: param.customer_name,
      customer_jieduan: param.customer_jieduan || '', // 客户状态，默认1-了解产品
      customer_tags: param.customer_tags.join(','),
      industry: param.industry,
      customer_type: param.customer_type,
      value_level: param.value_level,
      registered_capital: param.registered_capital,
      channel: param.channel,
      owner_user_id: param.owner_user_id,
      region_name: regionNames,
      address: param.address,
      company_scale: param.company_scale,
      related_customer_id: Array.isArray(param.related_customer_id)
        ? param.related_customer_id.join(',')
        : param.related_customer_id,
      remark: param.remark,
      region: param.region.join(','),
      contacts: contactList.value,
    };

    let response;
    if (isEditMode && customerId) {
      // 编辑模式
      params.id = customerId;
      response = await updateCustomer(params);
    } else {
      // 新增模式
      response = await addCustomer(params);
    }

    // 处理响应
    if (response.code === 0 || response.code === 200) {
      MessagePlugin.success(isEditMode ? '客户更新成功' : '客户创建成功');
      // 保存成功后返回列表页
      router.push('/customerMange/customer');
    } else {
      MessagePlugin.error(response.msg || response.message || '操作失败，请重试');
    }
  } catch (error: any) {
    console.error('提交客户信息失败:', error);
    const errorMessage = error?.response?.data?.msg || error?.message || '网络错误，请稍后重试';
    MessagePlugin.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

// 重置表单
const handleReset = () => {
  formData.value = {
    customer_name: '',
    customer_jieduan: '', // 添加了这个缺失的属性
    customer_tags: [],
    industry: '',
    customer_type: 'other', // 默认为其他类型
    value_level: 3,
    registered_capital: '',
    channel: '',
    owner_user_id: '',
    region: [],
    address: '',
    company_scale: '',
    related_customer_id: [],
    remark: '',
  };
  contactList.value = [];
  MessagePlugin.info('表单已重置');
};
// 加载客户详情（编辑模式）
const loadCustomerDetail = async () => {
  if (!customerId) {
    console.error('客户ID为空，无法加载详情');
    MessagePlugin.error('客户ID不能为空');
    return;
  }

  try {
    loading.value = true;
    console.log('加载客户详情，客户ID:', customerId);
    const response = await getCustomerDetail(customerId);
    if (response.code === 0 || response.code === 200) {
      const data = response.data || {};
      // 填充表单数据
      formData.value = {
        customer_name: data.customer_name || data.customerName || '',
        customer_jieduan: data.customer_jieduan || data.customerJieduan || '', // 客户状态，默认1-了解产品
        customer_tags: data.customer_tags?.split(',') || [],
        industry: data.industry || '',
        customer_type: data.customer_type || '经销商',
        value_level: data.value_level || 1,
        registered_capital: data.registered_capital || '',
        channel: data.channel || '',
        owner_user_id: data.owner_user_id || '',
        region: data.region?.split(',') || [], // 使用 code 数组
        address: data.address || data.detailAddress || '',
        company_scale: data.company_scale || data.enterpriseScale || '',
        related_customer_id: data.related_customer_id
          ? typeof data.related_customer_id === 'string'
            ? data.related_customer_id.split(',')
            : data.related_customer_id
          : [],
        remark: data.remark || data.remarks || '',
      };
      // 填充联系人列表
      if (data.contacts && Array.isArray(data.contacts)) {
        contactList.value = data.contacts;
      }
    }
  } catch (error: any) {
    console.error('加载客户详情失败:', error);
    MessagePlugin.error('加载客户详情失败，请重试');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  // 加载归属人员列表
  loadOwnerOptions();

  // 加载标签字典选项
  loadTagOptions();

  // 加载客户状态字典选项
  loadCustomerStatusOptions();

  // 加载客户类型字典选项
  loadCustomerTypeOptions();

  // 加载所属行业字典选项
  loadIndustryOptions();

  // 加载客户渠道字典选项
  loadChannelOptions();

  // 加载相关客户列表
  loadRelatedCustomerOptions();

  // 如果是编辑模式，加载客户详情
  if (isEditMode) {
    loadCustomerDetail();
  }
});
</script>
<style lang="less" scoped>
.customer-add-container {
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
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;

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
}

.select-with-add-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;

  :deep(.t-select) {
    flex: 1;
  }

  .select-add-btn {
    position: absolute;
    right: 8px;
    width: 24px;
    height: 24px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--td-bg-color-container-select);
    border: 1px solid var(--td-component-border);
    z-index: 10;

    .t-icon {
      font-size: 14px;
      color: var(--td-brand-color);
    }

    &:hover {
      background: var(--td-bg-color-container-hover);
    }
  }
}

.search-icon {
  cursor: pointer;
  color: var(--td-text-color-placeholder);

  &:hover {
    color: var(--td-brand-color);
  }
}

.form-actions {
  padding-top: 20px;
  border-top: 1px dashed var(--td-component-border);
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.contact-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.contact-card {
  position: relative;
  width: calc(50% - 8px);
  min-width: 300px;
  padding: 20px;
  background: #fff;
  border: 1px solid var(--td-component-border);
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .contact-delete {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
    background: var(--td-bg-color-container-hover);
    color: var(--td-text-color-placeholder);
    transition: all 0.2s;

    &:hover {
      background: var(--td-error-color);
      color: #fff;
    }

    .t-icon {
      font-size: 14px;
    }
  }

  .contact-name {
    font-size: 14px;
    color: var(--td-text-color-primary);
    margin-bottom: 12px;
  }

  .contact-phone {
    font-size: 18px;
    font-weight: 600;
    color: var(--td-text-color-primary);
    margin-bottom: 16px;
  }

  .contact-footer {
    display: flex;
    align-items: center;

    .t-link {
      font-size: 12px;
      color: var(--td-text-color-secondary);
      display: flex;
      align-items: center;
      gap: 4px;

      .link-arrow {
        font-size: 12px;
        color: var(--td-text-color-placeholder);
      }

      &:hover {
        color: var(--td-brand-color);

        .link-arrow {
          color: var(--td-brand-color);
        }
      }
    }
  }
}

.contact-empty {
  width: 100%;
  padding: 40px;
  text-align: center;
  color: var(--td-text-color-placeholder);

  .empty-icon {
    font-size: 48px;
    color: var(--td-text-color-disabled);
    margin-bottom: 16px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

// 必填项红色星号样式（标签中的星号）
:deep(.t-form__label) {
  color: var(--td-text-color-primary);
}

// 带加号图标的select样式
.select-with-add {
  :deep(.t-input__suffix) {
    display: flex;
    align-items: center;
  }
}

// 客户名称选项样式
.customer-name-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;

  .option-left {
    display: flex;
    align-items: center;
    flex: 1;

    .company-name {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .t-tag {
      margin-left: 8px;
    }
  }

  .option-right {
    display: flex;
    align-items: center;

    .owner-info {
      font-size: 12px;
      color: var(--td-text-color-secondary);
    }
  }
}

// 禁用选项的样式
:deep(.t-select__option.t-is-disabled) {
  opacity: 0.6;

  .customer-name-option {
    cursor: not-allowed;
  }
}
</style>
