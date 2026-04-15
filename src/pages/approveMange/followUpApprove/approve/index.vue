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
    <!-- 跟进信息 + 操作按钮 -->
    <t-card :bordered="false" class="info-card">
      <div class="info-header">
        <div class="info-title">
          <h2>跟进信息</h2>
          <span class="status-text">({{ followDetail.approval_status_name }})</span>
        </div>
        <div v-if="props.isApprove && !isDetail" class="info-actions">
          <t-button variant="outline" theme="default" @click="handleReject">审批否决</t-button>
          <t-button theme="primary" @click="handleApprove">审批通过</t-button>
        </div>
      </div>
    </t-card>
    <!-- 客户信息 + 操作按钮 -->
    <t-card :bordered="false" class="info-card">
      <base-desc label-width="150px">
        <t-row type="flex">
          <base-desc-item label="关联客户">
            {{ followDetail.customer_name || followDetail.customer_id || '-' }}
          </base-desc-item>
          <base-desc-item label="主要拜访人">
            {{ followDetail.main_visitor_name || followDetail.main_visitor || '-' }}
          </base-desc-item>
        </t-row>
        <t-row type="flex">
          <base-desc-item label="拜访人身份">
            {{ followDetail.visitor_identity_name || followDetail.visitor_identity || '-' }}
          </base-desc-item>
          <base-desc-item label="跟进类型">
            {{ followDetail.follow_type_name || followDetail.follow_type || '-' }}
          </base-desc-item>
        </t-row>
        <base-desc-item label="报价几率">
          {{ followDetail.win_rate ? `${followDetail.win_rate}%` : '-' }}
        </base-desc-item>
        <base-desc-item label="跟进信息">
          {{ followDetail.follow_content || '-' }}
        </base-desc-item>
        <t-row type="flex">
          <base-desc-item label="打卡">
            <t-space v-for="item in punchImages" :key="item.label" direction="vertical" align="center">
              <t-image
                :src="item.src || defaultImageUrl"
                fit="contain"
                :style="{ width: '120px', height: '120px', marginLeft: '10px' }"
                @error="onError"
              />
              <span>{{ item.label }}</span>
            </t-space>
          </base-desc-item>
        </t-row>
      </base-desc>
    </t-card>
    <!-- 审批否决弹框 -->
    <approve-fail-dialog ref="approveFailDialogRef" @success="handleApprovalSuccess" />
    <!-- 审批通过弹框 -->
    <approve-success-dialog ref="approveSuccessDialogRef" @success="handleApprovalSuccess" />
  </div>
</template>
<script setup lang="ts">
import type { ImageProps } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, defineAsyncComponent, onBeforeMount, onMounted, ref, withDefaults } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { getFollowDetail } from '@/api/customer/customer';

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

const ApproveFailDialog = defineAsyncComponent(() => import('../components/approveFailDialog.vue'));
const ApproveSuccessDialog = defineAsyncComponent(() => import('../components/approveSuccessDialog.vue'));
const BaseDescItem = defineAsyncComponent(() => import('@/components/BaseDescItem/index.vue'));
const BaseDesc = defineAsyncComponent(() => import('@/components/BaseDesc/index.vue'));
const route = useRoute();
const router = useRouter();
// 审批否决弹框引用
const approveFailDialogRef = ref(null);
// 审批通过弹框引用
const approveSuccessDialogRef = ref(null);

// 跟进详情
const followDetail = ref<Record<string, any>>({});

// 当前步骤（示例：2 表示一级审批进行中）
const currentStep = ref(0);

// 这些字段后续可以根据接口返回动态赋值
const submitTime = computed(() => followDetail.value.create_time || '—');
const firstApprover = computed(() => 'xxx');
// const secondApprover = computed(() => 'xxx');
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
const isDetail = Number(route.query.isDetail);
console.log(isDetail);
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
  router.push('/followUpManagement/list');
};

// 打卡图片
const defaultImageUrl = '';
const punchImages = computed(() => [
  {
    label: '出发',
    src: followDetail.value.departure_image || followDetail.value.departure_img || '',
  },
  {
    label: '到达',
    src: followDetail.value.arrival_image || followDetail.value.arrival_img || '',
  },
  {
    label: '离开',
    src: followDetail.value.leave_image || followDetail.value.leave_img || '',
  },
]);

const onError: ImageProps['onError'] = () => {
  // 保持静默，图片失败时仍然展示占位
};

// 加载详情
const loadFollowDetail = async () => {
  const id = route.query.id as string | undefined;
  if (!id) return;
  try {
    const res = await getFollowDetail(id);
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
</style>
