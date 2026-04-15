<template>
  <div>
    <!-- 审批进度 -->
    <t-card :bordered="false" class="approve-card">
      <div class="approve-steps-wrapper">
        <t-steps theme="default" layout="horizontal" :current="currentStep">
          <t-step-item title="提交审批" :content="submitTime" />
          <t-step-item title="一级审批" :content="`审批人：${firstApprover}`" />
          <!-- <t-step-item title="二级审批" :content="`审批人：${secondApprover}`" /> -->
          <t-step-item title="审批完成" :content="`审批人：${finalApprover}`" />
        </t-steps>
      </div>
    </t-card>

    <!-- 客户信息 + 操作按钮 -->
    <t-card :bordered="false" class="info-card">
      <div class="info-header">
        <div class="info-title">
          <h2>客户信息</h2>
          <span class="status-text">({{ followDetail.approval_status_name }})</span>
        </div>
        <div v-if="props.isApprove" class="info-actions">
          <t-button variant="outline" theme="default" @click="handleReject">审批否决</t-button>
          <t-button theme="primary" @click="handleApprove">审批通过</t-button>
        </div>
      </div>
    </t-card>
    <t-card :bordered="false" class="info-card">
      <h3 class="section-header">基础信息</h3>
      <base-desc label-width="150px">
        <t-row type="flex">
          <base-desc-item label="客户名称">
            {{ followDetail.customer_name || '-' }}
          </base-desc-item>
          <base-desc-item label="客户状态">
            {{ followDetail.customer_jieduan_text || '-' }}
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="标签">
            {{ followDetail.customer_tags }}
          </base-desc-item>
          <base-desc-item label="所属行业">
            {{ followDetail.industry_text || '-' }}
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="客户类型">
            {{ followDetail.customer_type_text || '-' }}
          </base-desc-item>
          <base-desc-item label="客户价值等级">
            <t-rate :value="followDetail.value_level" :count="5" disabled allow-half
          /></base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="注册资本">
            {{ followDetail.registered_capital || '-' }}
          </base-desc-item>
          <base-desc-item label="客户渠道">
            {{ followDetail.channel_text || '-' }}
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="归属人员">
            {{ followDetail.owner_name || '-' }}
          </base-desc-item>
        </t-row>
      </base-desc>
      <h3 class="section-header">附加信息</h3>
      <base-desc label-width="150px">
        <t-row type="flex">
          <base-desc-item label="所在地区">
            {{ followDetail.region_name || '-' }}
          </base-desc-item>
          <base-desc-item label="详细地址">
            {{ followDetail.address || '-' }}
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="企业规模">
            {{ followDetail.company_scale || '-' }}
          </base-desc-item>
          <base-desc-item label="上级客户">
            {{ followDetail.parent_customer_id || '-' }}
          </base-desc-item>
        </t-row>
      </base-desc>
      <h3 class="section-header">其他信息</h3>
      <base-desc label-width="150px">
        <base-desc-item label="备注">
          {{ followDetail.remark || '-' }}
        </base-desc-item>
      </base-desc>

      <!-- 联系人信息 -->
      <div class="form-section">
        <div class="contact-header">
          <div class="section-title">首要联系人 (大股东)</div>
        </div>
        <div class="contact-list">
          <div v-for="(contact, index) in followDetail.contacts" :key="index" class="contact-card">
            <div class="contact-name">{{ contact.contact_name }}</div>
            <div class="contact-phone">{{ contact.mobile }}</div>
            <div class="contact-footer">
              <t-link theme="default" variant="text" @click="handleViewMore(contact)">
                查看更多
                <t-icon name="chevron-right" class="link-arrow" />
              </t-link>
            </div>
          </div>
          <div v-if="followDetail?.contacts?.length === 0" class="contact-empty">
            <t-icon name="user" class="empty-icon" />
            <p>暂无联系人</p>
          </div>
        </div>
      </div>
    </t-card>
    <contactDetailDialog ref="contactDetailDialogRef" />
    <!-- 审批否决弹框 -->
    <approve-fail-dialog ref="approveFailDialogRef" @success="handleApprovalSuccess" />
    <!-- 审批通过弹框 -->
    <approve-success-dialog ref="approveSuccessDialogRef" @success="handleApprovalSuccess" />
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, defineAsyncComponent, onMounted, ref, withDefaults } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { getCustomerDetail } from '@/api/customer/customer';

defineOptions({
  name: 'FollowUpApprove',
});

// 定义 props
const props = withDefaults(
  defineProps<{
    isApprove?: boolean; // 是否为审批页面，true-审批页面，false-详情页面
  }>(),
  {
    isApprove: true, // 默认为审批页面
  },
);

const ApproveFailDialog = defineAsyncComponent(() => import('../../components/approveFailDialog.vue'));
const ApproveSuccessDialog = defineAsyncComponent(() => import('../../components/approveSuccessDialog.vue'));
const contactDetailDialog = defineAsyncComponent(() => import('./contactDetailDialog.vue'));

const BaseDescItem = defineAsyncComponent(() => import('@/components/BaseDescItem/index.vue'));
const BaseDesc = defineAsyncComponent(() => import('@/components/BaseDesc/index.vue'));
const route = useRoute();
const router = useRouter();

// 审批否决弹框引用
const approveFailDialogRef = ref(null);
// 审批通过弹框引用
const approveSuccessDialogRef = ref(null);
// 联系人信息
const contactDetailDialogRef = ref(null);

// 跟进详情
const followDetail = ref<Record<string, any>>({});

// 当前步骤（示例：2 表示一级审批进行中）
const currentStep = ref(0);
console.log(currentStep);

// 这些字段后续可以根据接口返回动态赋值
const submitTime = computed(() => followDetail.value.create_time || '—');
const firstApprover = computed(() => 'xxx');
const secondApprover = computed(() => 'xxx');
const finalApprover = computed(() => 'xxx');

const handleApprove = () => {
  const id = route.query.id;
  if (!id) {
    MessagePlugin.error('缺少客户ID，无法进行审批');
    return;
  }
  if (approveSuccessDialogRef.value) {
    approveSuccessDialogRef.value.show(id);
  }
};

const handleReject = () => {
  const id = route.query.id;
  if (!id) {
    MessagePlugin.error('缺少客户ID，无法进行审批');
    return;
  }
  if (approveFailDialogRef.value) {
    approveFailDialogRef.value.show(id);
  }
};

// 审批成功回调（否决成功后刷新或返回列表）
const handleApprovalSuccess = () => {
  // 可以刷新当前页面数据，或者返回列表页
  router.push('/approveMange/customerApprove');
};
// 加载详情
const loadFollowDetail = async () => {
  const id = route.query.id as string | undefined;
  if (!id) return;
  try {
    const res = await getCustomerDetail(id);
    if (res.code === 0 || res.code === 200) {
      followDetail.value = res.data || {};
      currentStep.value = followDetail.value.approval_status;
    } else {
      MessagePlugin.error(res.msg || '获取跟进详情失败');
    }
  } catch (error: any) {
    console.error('获取跟进详情失败:', error);
    MessagePlugin.error('获取跟进详情失败，请重试');
  }
};
// 查看
const handleViewMore = (contact: Contact) => {
  contactDetailDialogRef.value?.show(contact);
};
onMounted(() => {
  loadFollowDetail();
});
</script>
<style lang="less" scoped>
.approve-card {
  margin-bottom: 16px;
  :deep(.t-card__body) {
    padding: 24px 32px;
  }
}

.approve-steps-wrapper {
  .t-steps {
    width: 100%;
  }
}
.section-header {
  margin-bottom: 20px;
  margin-top: 20px;
}
.info-card {
  margin-bottom: 15px;
  :deep(.t-card__body) {
    padding: 16px 24px;
  }
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.info-title {
  display: flex;
  align-items: center;
  gap: 8px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #ff4d4f;
  }

  .label {
    font-size: 14px;
    font-weight: 500;
    color: #1f1f1f;
  }

  .status-text {
    font-size: 12px;
    color: #ff4d4f;
  }
}

.info-actions {
  display: flex;
  gap: 8px;
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
</style>
