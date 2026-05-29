<template>
  <div class="add-contact-container">
    <t-card :bordered="false">
      <div class="form-header">
        <h2 class="form-title">{{ props.queryId ? '编辑联系人' : '添加联系人' }}</h2>
      </div>

      <t-form
        ref="formRef"
        :data="contactFormData"
        :rules="contactFormRules"
        label-width="100px"
        @submit="handleSubmit"
      >
        <t-row :gutter="24">
          <!-- 左列 -->
          <t-col :span="6">
            <t-form-item label="联系人姓名" name="contact_name" required>
              <t-input v-model="contactFormData.contact_name" placeholder="请输入" clearable />
            </t-form-item>
            <t-form-item label="客户名称" name="customer_id">
              <t-select
                v-model="contactFormData.customer_id"
                placeholder="请选择客户"
                clearable
                filterable
                :disabled="!!customer_id"
                :options="customerOptions"
                :loading="loadingCustomer"
                @search="handleCustomerSearch"
              />
            </t-form-item>
            <t-form-item label="角色" name="position">
              <t-select v-model="contactFormData.position" placeholder="请选择" clearable :options="roleOptions" />
            </t-form-item>

            <t-form-item label="部门职务" name="role">
              <t-select
                v-model="contactFormData.role"
                placeholder="请选择"
                clearable
                :options="departmentOptions"
                :loading="loadingDepartmentRole"
              />
            </t-form-item>

            <t-form-item label="固定电话" name="tel">
              <t-input v-model="contactFormData.tel" placeholder="请输入" clearable />
            </t-form-item>

            <t-form-item label="电子邮箱" name="email">
              <t-input v-model="contactFormData.email" placeholder="请输入" clearable />
            </t-form-item>

            <t-form-item label="家庭住址" name="contact_address" class="detailed-address-item">
              <t-input v-model="contactFormData.contact_address" placeholder="请输入" clearable />
            </t-form-item>
          </t-col>

          <!-- 右列 -->
          <t-col :span="6">
            <!-- 尊称 -->
            <t-form-item label="尊称" name="honorific">
              <t-radio-group v-model="contactFormData.honorific">
                <t-radio value="未知">未知</t-radio>
                <t-radio value="先生">先生</t-radio>
                <t-radio value="女士">女士</t-radio>
              </t-radio-group>
            </t-form-item>

            <!-- 生日 -->
            <t-form-item label="生日" name="birthday">
              <t-date-picker
                v-model="contactFormData.birthday"
                placeholder="请选择日期"
                clearable
                mode="date"
                style="width: 100%"
              />
            </t-form-item>

            <!-- 手机号码 -->
            <t-form-item label="手机号码" name="mobile" required-mark>
              <t-input v-model="contactFormData.mobile" placeholder="请输入" clearable :maxlength="11" />
            </t-form-item>

            <!-- 传真号码 -->
            <t-form-item label="传真号码" name="fax">
              <t-input v-model="contactFormData.fax" placeholder="请输入" clearable />
            </t-form-item>

            <!-- 所在地区 -->
            <t-form-item label="所在地区" name="contact_region">
              <t-cascader
                v-model="contactFormData.contact_region"
                :options="areaTree"
                placeholder="请选择省市区"
                value-type="full"
                clearable
              />
            </t-form-item>

            <t-form-item label="微信账号" name="wechat">
              <t-input v-model="contactFormData.wechat" placeholder="请输入" clearable />
            </t-form-item>
          </t-col>
        </t-row>

        <!-- 备注 -->
        <t-form-item label="备注" name="contact_remark" class="remarks-item">
          <t-textarea
            v-model="contactFormData.contact_remark"
            placeholder="请输入内容"
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </t-form-item>

        <!-- 按钮区域 -->
        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit" :loading="submitting">确认提交</t-button>
            <t-button theme="default" :disabled="submitting" @click="handleCancel">取消</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import type { FormRules, SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { addContact, getContactDetail, getCustomerList, updateContact } from '@/api/customer/customer';
import { useContactDeptRoleOptions } from '@/utils/contactDeptRoleDict';
import { areaTree } from '@/utils/area';

defineOptions({
  name: 'AddContact',
});
const props = defineProps({
  queryId: {
    type: String,
    default: '',
  },
});
const router = useRouter();
const route = useRoute();
const formRef = ref(null);
const submitting = ref(false);
const contact_id = route.query.id;
const customer_id = route.query.customer_id;
// 联系人表单数据
const contactFormData = ref({
  customer_id: '',
  contact_name: '',
  position: '',
  role: '',
  tel: '',
  email: '',
  wechat: '',
  contact_address: '',
  honorific: '先生',
  birthday: '',
  mobile: '',
  fax: '',
  contact_region: [],
  contact_remark: '',
});

// 联系人表单验证规则
const contactFormRules: FormRules = {
  contact_name: [{ required: true, message: '请输入联系人姓名', type: 'error' }],
  customer_id: [{ required: true, message: '请选择客户', type: 'error' }],
  mobile: [
    { required: true, message: '请输入手机号码', type: 'error' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号码',
      type: 'error',
    },
  ],
  email: [
    {
      pattern: /^[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
      message: '请输入正确的邮箱地址',
      type: 'warning',
    },
  ],
};

// 角色选项
const roleOptions = [
  { label: '决策人', value: '决策人' },
  { label: '影响人', value: '影响人' },
  { label: '使用人', value: '使用人' },
  { label: '采购人', value: '采购人' },
  { label: '其他', value: '其他' },
];

const { departmentOptions, loadingDepartmentRole, loadContactDeptRoleOptions } = useContactDeptRoleOptions();

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
    } else {
      MessagePlugin.error((res as any).msg || res.message || '获取客户列表失败');
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
// 联系人表单提交
const handleSubmit = async ({ validateResult, firstError }: SubmitContext) => {
  if (validateResult !== true) {
    MessagePlugin.warning(firstError || '请完善联系人信息');
    return;
  }

  submitting.value = true;
  try {
    // 处理地区数据（如果是数组，转换为字符串）
    const contactRegion = Array.isArray(contactFormData.value.contact_region)
      ? contactFormData.value.contact_region.join(',')
      : contactFormData.value.contact_region;
    // 将 code 数组转换为名称数组
    const contactRegionNames = convertRegionCodesToNames(contactFormData.value.contact_region).join('/');
    // 构建提交参数
    const params: any = {
      customer_id: contactFormData.value.customer_id,
      contact_name: contactFormData.value.contact_name,
      honorific: contactFormData.value.honorific || 'unknown',
      position: contactFormData.value.position || '',
      role: contactFormData.value.role || '',
      mobile: contactFormData.value.mobile || '',
      tel: contactFormData.value.tel || '',
      email: contactFormData.value.email || '',
      wechat: contactFormData.value.wechat || '',
      fax: contactFormData.value.fax || '',
      contact_region: contactRegion || '',
      contact_region_name: contactRegionNames,
      contact_address: contactFormData.value.contact_address || '',
      birthday: contactFormData.value.birthday || '',
      contact_remark: contactFormData.value.contact_remark || '',
    };
    if (contact_id) params.contact_id = contact_id;
    const res = contact_id ? await updateContact(params) : await addContact(params);
    const info = contact_id ? '编辑客户联系人成功' : '添加客户联系人成功';
    if (res.code === 0 || res.code === 200) {
      MessagePlugin.success(info);
      // 提交成功后返回列表页
      if (customer_id) {
        router.push({ path: '/customerMange/customer/detail', query: { id: customer_id } });
      } else {
        router.push('/customerMange/contactsList');
      }
    } else {
      MessagePlugin.error((res as any).msg || res.message || '添加联系人失败');
    }
  } catch (error: any) {
    console.error('添加联系人失败:', error);
    MessagePlugin.error(error?.message || '添加联系人失败，请重试');
  } finally {
    submitting.value = false;
  }
};

// 取消操作
const handleCancel = () => {
  router.back();
};

// 加载联系人详情
const loadContactDetail = async (contactId: string) => {
  try {
    const res = await getContactDetail(contactId);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || ({} as any);

      // 填充表单数据
      contactFormData.value = {
        customer_id: data.customer_id || data.customerId || '',
        contact_name: data.contact_name || data.contactName || '',
        position: data.position || '',
        role: data.role || '',
        tel: data.tel || '',
        email: data.email || '',
        wechat: data.wechat || '',
        contact_address: data.contact_address || data.contactAddress || '',
        honorific: data.honorific || 'unknown',
        birthday: data.birthday || '',
        mobile: data.mobile || '',
        fax: data.fax || '',
        contact_region: data.contact_region
          ? Array.isArray(data.contact_region)
            ? data.contact_region
            : typeof data.contact_region === 'string'
              ? data.contact_region.split(',').filter(Boolean)
              : []
          : [],
        contact_remark: data.contact_remark || data.contactRemark || '',
      };

      // 确保客户列表已加载，以便显示选中的客户
      await loadCustomerOptions();
    } else {
      MessagePlugin.error((res as any).msg || res.message || '获取联系人详情失败');
    }
  } catch (error: any) {
    console.error('获取联系人详情失败:', error);
    MessagePlugin.error(error?.message || '获取联系人详情失败，请重试');
  }
};
// 初始化
onMounted(async () => {
  await loadContactDeptRoleOptions();
  // 加载客户列表
  await loadCustomerOptions();
  // 如果是编辑模式，加载联系人详情
  if (contact_id) {
    loadContactDetail(contact_id as string);
  }
  // 如果是客户详情进来的添加联系人，默认选中当前客户不可修改
  if (customer_id) {
    contactFormData.value.customer_id = String(customer_id);
  }
});
</script>
<style lang="less" scoped>
.add-contact-container {
  padding: 24px;
  background: #fff;

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    .form-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--td-text-color-primary);
      margin: 0;
    }
  }
  :deep(.t-form-item__label) {
    font-weight: normal;
  }
  :deep(.t-form-item--required .t-form-item__label::before) {
    content: '*';
    color: var(--td-error-color);
    margin-right: 4px;
  } // 所在地区和备注之间加间隔
  .remarks-item {
    margin-top: 32px !important;
  }
}
</style>
