<template>
  <div class="data-details">
    <!-- 客户简介 -->
    <t-card :bordered="false" class="info-card">
      <div class="section-header">
        <span class="section-icon">■</span>
        <span class="section-title">客户简介</span>
        <t-link theme="primary" class="view-details-link" @click="handleViewMore('materialDetails')">查看详情 ></t-link>
      </div>
      <base-desc label-width="150px">
        <t-row type="flex">
          <base-desc-item label="客户名称"> {{ customerData.customer_name }} </base-desc-item>
          <base-desc-item label="系统编号"> {{ customerData.sys_no }} </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="客户类型"> {{ customerData.customer_type_text }} </base-desc-item>
          <base-desc-item label="所属行业"> {{ customerData.industry_text }} </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="客户价值等级">
            <t-rate :value="customerData.valueLevel" :count="5" disabled allow-half
          /></base-desc-item>
          <base-desc-item label="客户来源"> {{ customerData.channel_text }} </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="客户状态"> {{ customerData.customer_jieduan_text }}</base-desc-item>
          <base-desc-item label="客户归属">
            {{ customerData.owner_name }}
            <span v-if="customerData.isLocked" class="locked-info">
              (已锁定,保护到期时间{{ customerData.protectionExpiry }})
            </span></base-desc-item
          >
        </t-row>
        <t-row v-if="customerData.region" type="flex">
          <base-desc-item label="所在地区"> {{ customerData.region }} </base-desc-item>
          <base-desc-item label="企业办公地址"> {{ customerData.address }} </base-desc-item>
        </t-row>
        <t-row v-if="customerData.registeredCapital || customerData.companyScale" type="flex">
          <base-desc-item label="注册资本"> {{ customerData.registeredCapital }} </base-desc-item>
          <base-desc-item label="企业规模"> {{ customerData.companyScale }} </base-desc-item>
        </t-row>
        <t-row v-if="customerData.remark" type="flex">
          <base-desc-item label="备注" :span="24"> {{ customerData.remark }} </base-desc-item>
        </t-row>
      </base-desc>
    </t-card>

    <!-- 首联系人 -->
    <t-card v-if="primaryContact.id" :bordered="false" class="info-card">
      <div class="section-header">
        <span class="section-icon">■</span>
        <span class="section-title">首联系人</span>
        <t-link theme="primary" class="view-details-link" @click="handleViewMore('contacts')"> 查看更多 > </t-link>
      </div>

      <base-desc label-width="150px">
        <t-row type="flex">
          <base-desc-item label="联系人姓名">
            {{ primaryContact.contact_name }}
            <t-link theme="primary" class="action-link" @click="handleEditContact(primaryContact)">
              <t-icon name="edit" size="14px" />
              编辑
            </t-link>
            <t-link theme="primary" class="action-link" @click="handleViewContactDetail(primaryContact)">
              <t-icon name="view" size="14px" />
              详情
            </t-link></base-desc-item
          >
          <base-desc-item label="手机号码">
            {{ primaryContact.mobile }}
            <t-link theme="primary" class="action-link" @click="handleDial(primaryContact.mobile)">
              <t-icon name="call" size="14px" />
              拨打
            </t-link>
            <t-link theme="primary" class="action-link" @click="handleSendSMS(primaryContact.mobile)">
              <t-icon name="chat" size="14px" />
              短信
            </t-link></base-desc-item
          >
        </t-row>
        <t-row type="flex">
          <base-desc-item label="角色">{{ primaryContact.position }}</base-desc-item>
          <base-desc-item label="部门职务"> {{ primaryContact.role }} </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="生日">{{ primaryContact.birthday }}</base-desc-item>
          <base-desc-item label="电子邮箱">
            {{ primaryContact.email }}
            <t-link theme="primary" class="action-link" @click="handleSendEmail(primaryContact.email)">
              <t-icon name="mail" size="14px" />
              发送邮件
            </t-link></base-desc-item
          >
        </t-row>
        <t-row type="flex">
          <base-desc-item label="固定电话">{{ primaryContact.phone }}</base-desc-item>
          <base-desc-item label="传真号码">{{ primaryContact.fax }}</base-desc-item>
        </t-row>
        <t-row v-if="primaryContact.wechat || primaryContact.contact_address" type="flex">
          <base-desc-item v-if="primaryContact.wechat" label="微信账号">{{ primaryContact.wechat }}</base-desc-item>
          <base-desc-item v-if="primaryContact.contact_address" label="家庭住址">{{
            primaryContact.contact_address
          }}</base-desc-item>
        </t-row>
      </base-desc>
    </t-card>

    <!-- 次联系人 -->
    <t-card v-if="secondaryContact.length > 0" :bordered="false" class="info-card">
      <div class="section-header">
        <span class="section-icon">■</span>
        <span class="section-title">次联系人</span>
        <t-link theme="primary" class="view-details-link" @click="handleViewMore('contacts')"> 查看更多 > </t-link>
      </div>

      <base-desc label-width="150px">
        <t-row type="flex">
          <base-desc-item label="联系人姓名">
            {{ secondaryContact[0].contact_name }}
            <t-link theme="primary" class="action-link" @click="handleEditContact(secondaryContact[0])">
              <t-icon name="edit" size="14px" />
              编辑
            </t-link>
            <t-link theme="primary" class="action-link" @click="handleViewContactDetail(secondaryContact[0])">
              <t-icon name="view" size="14px" />
              详情
            </t-link></base-desc-item
          >
          <base-desc-item label="手机号码">
            {{ secondaryContact[0].mobile }}
            <t-link theme="primary" class="action-link" @click="handleDial(secondaryContact[0].mobile)">
              <t-icon name="call" size="14px" />
              拨打
            </t-link>
            <t-link theme="primary" class="action-link" @click="handleSendSMS(secondaryContact[0].mobile)">
              <t-icon name="chat" size="14px" />
              短信
            </t-link></base-desc-item
          >
        </t-row>
        <t-row type="flex">
          <base-desc-item label="角色">{{ secondaryContact[0].position }}</base-desc-item>
          <base-desc-item label="部门职务"> {{ secondaryContact[0].role }} </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="生日">{{ secondaryContact[0].birthday }}</base-desc-item>
          <base-desc-item label="电子邮箱">
            {{ secondaryContact[0].email }}
            <t-link theme="primary" class="action-link" @click="handleSendEmail(secondaryContact[0].email)">
              <t-icon name="mail" size="14px" />
              发送邮件
            </t-link></base-desc-item
          >
        </t-row>
        <t-row type="flex">
          <base-desc-item label="固定电话">{{ secondaryContact[0].phone }}</base-desc-item>
          <base-desc-item label="传真号码">{{ secondaryContact[0].fax }}</base-desc-item>
        </t-row>
      </base-desc>
    </t-card>
    <div class="relevantData mt20">
      <t-card v-for="(item, index) in relevantDataList" :key="index" shadow="hover">
        <div class="center">{{ item.title }}</div>
        <div class="center color-primary mt10">{{ item.num }}条</div>
      </t-card>
    </div>

    <!-- 客户动态 -->
    <t-card :bordered="false" class="info-card dynamics-card">
      <div class="section-header">
        <span class="section-icon">■</span>
        <span class="section-title">客户动态</span>
        <t-button theme="primary" @click="handleWriteFollowUp">写跟进</t-button>
      </div>
      <customer-dynamics />
    </t-card>
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, ref } from 'vue';
import { useRouter } from 'vue-router';

import CustomerDynamics from './customerDynamics.vue';

defineOptions({
  name: 'DataDetails',
});
const emit = defineEmits(['switch-tab']);
const BaseDescItem = defineAsyncComponent(() => import('@/components/BaseDescItem/index.vue'));
const BaseDesc = defineAsyncComponent(() => import('@/components/BaseDesc/index.vue'));

const router = useRouter();

// 客户数据
const customerData = ref({
  id: '',
  customer_name: '',
  sys_no: '',
  customer_type_text: '',
  industry_text: '',
  valueLevel: 0,
  channel_text: '',
  customer_jieduan_text: '',
  owner_name: '',
  region: '',
  address: '',
  registeredCapital: '',
  companyScale: '',
  remark: '',
  isLocked: false,
  protectionExpiry: '',
  contacts: [],
});

// 首联系人数据
const primaryContact = ref<any>({});

// 次联系人数据
const secondaryContact = ref([]);
// 相关数据
const relevantDataList = [
  { title: '跟进记录', num: 10 },
  { title: '工单记录', num: 10 },
  { title: '报价记录', num: 10 },
  { title: '合同记录', num: 10 },
  { title: '发票记录', num: 10 },
  { title: '费用记录', num: 10 },
  { title: '归属记录', num: 10 },
];
// 查看更多联系人：通知父组件切换到“相关联系人”tab
const handleViewMore = (value: string) => {
  emit('switch-tab', value);
};

// 编辑联系人
const handleEditContact = (contact: any) => {
  router.push({
    path: '/customerMange/contacts/edit',
    query: { id: contact.id },
  });
};

// 查看联系人详情
const handleViewContactDetail = (contact: any) => {
  router.push({
    path: '/customerMange/contacts/detail',
    query: { id: contact.id, customerId: contact.customer_id },
  });
};

// 拨打
const handleDial = (number: string) => {
  MessagePlugin.info(`拨打: ${number}`);
};

// 发送短信
const handleSendSMS = (number: string) => {
  MessagePlugin.info(`发送短信到: ${number}`);
};

// 发送邮件
const handleSendEmail = (email: string) => {
  MessagePlugin.info(`发送邮件到: ${email}`);
};

// 写跟进
const handleWriteFollowUp = () => {
  router.push({
    path: '/customerMange/customer/followUpCustomer',
    query: { id: customerData.value.id },
  });
};

// 设置客户数据（从父组件调用）
const setCustomerData = (data: any) => {
  // 更新客户数据
  customerData.value = {
    id: data.id || '',
    customer_name: data.customer_name,
    sys_no: data.sys_no || '',
    customer_type_text: data.customer_type_text || '',
    industry_text: data.industry_text || '',
    valueLevel: data.value_level || 0,
    channel_text: data.channel_text || '',
    customer_jieduan_text: data.customer_jieduan_text,
    owner_name: data.owner_name || '',
    region: data.region_name || '',
    address: data.address || '',
    registeredCapital: data.registered_capital || '',
    companyScale: data.company_scale || '',
    remark: data.remark || '',
    isLocked: false,
    protectionExpiry: '',
    contacts: data.contacts || [],
  };

  // 更新首联系人数据
  if (data.contacts && Array.isArray(data.contacts) && data.contacts.length > 0) {
    // 找到 is_main === 1 的联系人，如果没有则使用第一个
    const mainContact = data.contacts.find((c: any) => c.is_main === 1) || data.contacts[0];
    primaryContact.value = mainContact;
    if (data.contacts.length > 1) {
      secondaryContact.value = data.contacts.filter((c: any) => c.is_main === 0); // 假设第二个联系人存在
    }
  }
};

// 获取状态文本
const getStatusText = (status: number | string) => {
  const statusMap: Record<number, string> = {
    1: '正常',
    2: '公海',
    3: '垃圾',
  };
  const statusNum = typeof status === 'string' ? Number(status) : status;
  return statusMap[statusNum] || '未知';
};

// 暴露方法给父组件
defineExpose({
  setCustomerData,
});
</script>
<style lang="less" scoped>
.data-details {
  .info-card {
    margin-bottom: 20px;

    :deep(.t-card__body) {
      padding: 20px 24px;
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

  .relevantData {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    .center {
      text-align: center;
    }
    .color-primary {
      color: var(--td-brand-color);
    }
  }

  .dynamics-card {
    margin-top: 20px;

    :deep(.t-card__body) {
      padding: 0;
    }
  }
}
</style>
