<template>
  <t-dialog v-model:visible="dialogVisible" :header="dialogTitle" width="50%" :footer="false" @close="handleClose">
    <template #body>
      <t-form
        ref="contactFormRef"
        :data="contactFormData"
        :rules="contactFormRules"
        :label-width="100"
        @submit="handleSubmit"
      >
        <t-row :gutter="24">
          <!-- 左列 -->
          <t-col :span="6">
            <!-- 联系人姓名 -->
            <t-form-item label="联系人姓名" name="contact_name" required-mark>
              <t-input v-model="contactFormData.contact_name" placeholder="请输入" clearable />
            </t-form-item>

            <!-- 角色 -->
            <t-form-item label="角色" name="position">
              <t-select v-model="contactFormData.position" placeholder="请选择" clearable :options="roleOptions" />
            </t-form-item>

            <!-- 部门职务 -->
            <t-form-item label="部门职务" name="role">
              <t-select v-model="contactFormData.role" placeholder="请选择" clearable :options="departmentOptions" />
            </t-form-item>

            <!-- 固定电话 -->
            <t-form-item label="固定电话" name="tel">
              <t-input v-model="contactFormData.tel" placeholder="请输入" clearable />
            </t-form-item>

            <!-- 电子邮箱 -->
            <t-form-item label="电子邮箱" name="email">
              <t-input v-model="contactFormData.email" placeholder="请输入" clearable />
            </t-form-item>

            <!-- 微信账号 -->
            <t-form-item label="微信账号" name="wechat">
              <t-input v-model="contactFormData.wechat" placeholder="请输入" clearable />
            </t-form-item>

            <!-- 详细地址 -->
            <t-form-item label="详细地址" name="contact_address">
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
              <t-date-picker v-model="contactFormData.birthday" placeholder="请选择日期" clearable mode="date" />
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
          </t-col>
        </t-row>

        <!-- 备注 -->
        <t-form-item label="备注" name="contact_remark" class="remark">
          <t-textarea
            v-model="contactFormData.contact_remark"
            placeholder="请输入内容"
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </t-form-item>

        <!-- 按钮区域 -->
        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">确认提交</t-button>
            <t-button theme="default" @click="handleClose">取消</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRules, SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';

import { areaTree } from '@/utils/area';

export interface Contact {
  contact_name: string; // 联系人姓名（必填）
  phone: string; // 手机号（必填）
  is_main?: number; // 是否大股东
  email?: string; // 邮箱
  position?: string; // 角色
  remark?: string; // 备注
  role?: string; // 部门职务
  tel?: string; // 固定电话
  wechat?: string; // 微信账号
  contact_address?: string; // 详细地址
  honorific?: string; // 尊称
  birthday?: string; // 生日
  mobile?: string; // 手机号码
  fax?: string; // 传真号码
  contact_region?: string | string[]; // 所在地区（可以是数组或字符串）
  contact_region_name?: string; // 所在地区（可以是数组或字符串）
  contact_remark?: string; // 备注
}

const props = defineProps<{
  visible: boolean;
  contactData?: Contact | null;
  title?: string;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  submit: [contact: Contact];
}>();

const contactFormRef = ref<FormInstanceFunctions>();

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

// 对话框标题
const dialogTitle = computed(() => props.title || (props.contactData ? '编辑联系人' : '增加联系人'));

// 联系人表单数据
const contactFormData = ref({
  contact_name: '',
  position: '',
  role: '',
  tel: '',
  email: '',
  wechat: '',
  contact_address: '',
  honorific: 'unknown',
  birthday: '',
  mobile: '',
  fax: '',
  contact_region: [],
  contact_remark: '',
});

// 角色选项
const roleOptions = [
  { label: '决策人', value: '决策人' },
  { label: '影响人', value: '影响人' },
  { label: '使用人', value: '使用人' },
  { label: '采购人', value: '采购人' },
  { label: '其他', value: '其他' },
];

// 部门职务选项
const departmentOptions = [
  { label: '总经理', value: '总经理' },
  { label: '副总经理', value: '副总经理' },
  { label: '部门经理', value: '部门经理' },
  { label: '主管', value: '主管' },
  { label: '员工', value: '员工' },
  { label: '其他', value: '其他' },
];

// 联系人表单验证规则
const contactFormRules: FormRules = {
  contact_name: [{ required: true, message: '请输入联系人姓名', type: 'error' }],
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

// 监听 contactData 变化，填充表单
watch(
  () => props.contactData,
  (newData) => {
    if (newData) {
      contactFormData.value = {
        contact_name: newData.contact_name || '',
        role: newData.role || '',
        position: newData.position || '',
        tel: newData.tel || '',
        email: newData.email || '',
        wechat: newData.wechat || '',
        contact_address: newData.contact_address || '',
        honorific: newData.honorific || 'unknown',
        birthday: newData.birthday || '',
        mobile: newData.mobile || '',
        fax: newData.fax || '',
        contact_region: Array.isArray(newData.contact_region)
          ? newData.contact_region
          : newData.contact_region
            ? newData.contact_region.split(',')
            : [],
        contact_remark: newData.contact_remark || '',
      };
    } else {
      // 重置表单
      contactFormData.value = {
        contact_name: '',
        role: '',
        position: '',
        tel: '',
        email: '',
        wechat: '',
        contact_address: '',
        honorific: 'unknown',
        birthday: '',
        mobile: '',
        fax: '',
        contact_region: [],
        contact_remark: '',
      };
    }
  },
  { immediate: true },
);

// 监听 visible 变化，重置表单
watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      // 关闭时重置表单
      contactFormRef.value?.reset();
      contactFormData.value.honorific = 'unknown';
    }
  },
);
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
const handleSubmit = ({ validateResult, firstError }: SubmitContext) => {
  if (validateResult === true) {
    // 创建新对象，避免引用问题

    const contact: any = {
      contact_name: contactFormData.value.contact_name || '',
      position: contactFormData.value.position || '',
      role: contactFormData.value.role || '',
      tel: contactFormData.value.tel || '',
      email: contactFormData.value.email || '',
      wechat: contactFormData.value.wechat || '',
      contact_address: contactFormData.value.contact_address || '',
      honorific: contactFormData.value.honorific || 'unknown',
      birthday: contactFormData.value.birthday || '',
      mobile: contactFormData.value.mobile || '',
      fax: contactFormData.value.fax || '',
      contact_region: Array.isArray(contactFormData.value.contact_region)
        ? contactFormData.value.contact_region.join(',')
        : contactFormData.value.contact_region || '',
      contact_remark: contactFormData.value.contact_remark || '',
    };
    if (contactFormData.value.contact_region) {
      const contactRegionNames = convertRegionCodesToNames(contactFormData.value.contact_region).join('/');
      contact.contact_region_name = contactRegionNames;
    }
    emit('submit', contact);
    dialogVisible.value = false;
  } else {
    MessagePlugin.warning(firstError || '请完善联系人信息');
  }
};

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
};
</script>
<style lang="less" scoped>
// 组件样式可以在这里添加
.remark {
  margin-top: 24px;
}
</style>
