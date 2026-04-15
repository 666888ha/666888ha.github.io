<template>
  <div>
    <!-- status=0: 待审批状态 -->
    <template v-if="status === 0">
      <!-- 审批进度 -->
      <t-card :bordered="false" class="approve-card">
        <div class="approve-steps-wrapper">
          <t-steps theme="default" layout="horizontal" :current="currentStep">
            <t-step-item title="提交审批" :content="submitTime" />
            <t-step-item title="1级审批" :content="`审批人：${firstApprover}`" />
            <t-step-item title="审批完成" :content="`审批人：${finalApprover}`" />
          </t-steps>
        </div>
      </t-card>

      <!-- 合同信息 + 操作按钮 -->
      <t-card :bordered="false" class="info-card">
        <div class="info-header">
          <div class="info-title">
            <h2>{{ contractDetail.contract_title || '-' }}</h2>
            <span class="status-text">({{ approvalStatusText }})</span>
          </div>
          <div class="info-actions">
            <t-button theme="primary" variant="outline" @click="handleRevoke">
              <template #icon>
                <t-icon name="refresh" />
              </template>
              撤销审批
            </t-button>
          </div>
        </div>
      </t-card>
    </template>

    <!-- status=1: 已通过状态 -->
    <template v-if="status === 1">
      <t-card :bordered="false" class="info-card">
        <div class="info-header">
          <div class="info-title">
            <h2>{{ contractDetail.contract_title || '-' }}</h2>
            <t-tag theme="success" variant="light">已通过</t-tag>
          </div>
          <div class="info-actions">
            <t-button variant="outline" theme="default" @click="handleAddCollaboration">
              <template #icon>
                <t-icon name="file-add" />
              </template>
              添加协作
            </t-button>
            <t-button variant="outline" theme="default" @click="handleReject">
              <template #icon>
                <t-icon name="close" />
              </template>
              驳回审批
            </t-button>
            <t-button variant="outline" theme="default" @click="handleEdit">
              <template #icon>
                <t-icon name="edit" />
              </template>
              编辑合同
            </t-button>
            <t-button variant="outline" theme="danger" @click="handleDelete">
              <template #icon>
                <t-icon name="delete" />
              </template>
              删除合同
            </t-button>
          </div>
        </div>
        <div class="info-extra">
          <span>关联客户: </span>
          <t-link
            v-if="contractDetail.customer_id"
            theme="primary"
            variant="text"
            @click="handleViewCustomer(contractDetail.customer_id)"
          >
            {{ contractDetail.customer_name || '-' }}
          </t-link>
          <span v-else>{{ contractDetail.customer_name || '-' }}</span>
        </div>
      </t-card>
    </template>

    <!-- status=2: 被驳回状态 -->
    <template v-if="status === 2">
      <t-card :bordered="false" class="info-card">
        <div class="info-header">
          <div class="info-title">
            <h2>{{ contractDetail.contract_title || '-' }}</h2>
            <span class="status-text status-rejected">(被驳回)</span>
          </div>
          <div class="info-actions">
            <t-button variant="outline" theme="default" @click="handleEdit">
              <template #icon>
                <t-icon name="edit" />
              </template>
              编辑合同
            </t-button>
            <t-button theme="primary" @click="handleSubmit">
              <template #icon>
                <t-icon name="check" />
              </template>
              提交审批
            </t-button>
            <t-button variant="outline" theme="danger" @click="handleDelete">
              <template #icon>
                <t-icon name="delete" />
              </template>
              删除合同
            </t-button>
          </div>
        </div>
      </t-card>

      <!-- 驳回信息 -->
      <t-card :bordered="false" class="info-card">
        <div class="section-header">
          <h3>驳回信息:</h3>
        </div>
        <div class="reject-content">
          <t-textarea
            :value="contractDetail.approval_remark || contractDetail.reject_reason || ''"
            readonly
            :autosize="{ minRows: 4, maxRows: 8 }"
            placeholder="管理员驳回内容"
          />
        </div>
      </t-card>
    </template>

    <!-- 基础信息组件 -->
    <base-detail-basic
      :contract-detail="contractDetail"
      :first-approver="firstApprover"
      :second-approver="secondApprover"
      :approval-status-text="approvalStatusText"
      :notify-users="notifyUsers"
      :collaborate-users="collaborateUsers"
      @delete-product="handleDeleteProduct"
    />
  </div>
</template>
<script setup lang="ts">
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { deleteContract, getContractDetail, revokeContractApproval, submitContractApproval } from '@/api/contract';

defineOptions({
  name: 'ContractDetail',
});

const BaseDetailBasic = defineAsyncComponent(() => import('./components/baseDetailBasic.vue'));

const route = useRoute();
const router = useRouter();

// 合同详情
const contractDetail = ref<Record<string, any>>({});

// 状态值
const status = computed(() => {
  const statusParam = route.query.status;
  if (statusParam === '0' || statusParam === '1' || statusParam === '2') {
    return Number(statusParam);
  }
  return contractDetail.value.approval_status || 0;
});

// 当前步骤（0: 提交审批, 1: 1级审批, 2: 2级审批, 3: 审批完成）
const currentStep = computed(() => {
  const approvalStatus = contractDetail.value.approval_status;
  if (approvalStatus === 0) return 0; // 待审批
  if (approvalStatus === 1) return 1; // 1级审批中
  if (approvalStatus === 2) return 2; // 2级审批中
  if (approvalStatus === 3) return 3; // 审批完成
  return 0;
});

// 提交时间
const submitTime = computed(() => contractDetail.value.create_time || '—');

// 审批人（这些字段需要根据实际接口返回调整）
const firstApprover = computed(() => contractDetail.value.first_approver_name || '—');
const secondApprover = computed(() => contractDetail.value.second_approver_name || '—');
const finalApprover = computed(() => contractDetail.value.approval_user_name || '—');

// 审批状态文本
const approvalStatusText = computed(() => {
  const approvalStatus = contractDetail.value.approval_status;
  if (approvalStatus === 0) return '待审批(待1级审批)';
  if (approvalStatus === 1) return '待审批(待2级审批)';
  if (approvalStatus === 2) return '审批中';
  if (approvalStatus === 3) return '审批通过';
  if (approvalStatus === 4) return '被驳回';
  return '未知状态';
});

// 通知他人
const notifyUsers = computed(() => {
  return contractDetail.value.notify_users || '-';
});

// 协作人员
const collaborateUsers = computed(() => {
  return contractDetail.value.collaborate_users || '-';
});

// 撤销审批
const handleRevoke = async () => {
  const id = route.query.id;
  if (!id) {
    MessagePlugin.error('缺少合同ID');
    return;
  }

  const confirmDialog = DialogPlugin.confirm({
    header: '撤销审批',
    body: '确定要撤销审批吗？',
    onConfirm: async () => {
      try {
        const res = await revokeContractApproval(id);
        if (res.code === 0 || res.code === 200) {
          MessagePlugin.success('撤销审批成功');
          confirmDialog.destroy();
          // 刷新页面数据
          await loadContractDetail();
        } else {
          MessagePlugin.error(res.msg || '撤销审批失败');
        }
      } catch (error: any) {
        MessagePlugin.error(error.message || '撤销审批失败，请重试');
      }
    },
  });
};

// 添加协作
const handleAddCollaboration = () => {
  MessagePlugin.info('添加协作功能待开发');
};

// 驳回审批
const handleReject = () => {
  MessagePlugin.info('驳回审批功能待开发');
};

// 编辑合同
const handleEdit = () => {
  const id = route.query.id;
  if (!id) {
    MessagePlugin.error('缺少合同ID，无法编辑');
    return;
  }
  router.push({
    path: '/contractMange/edit',
    query: { id },
  });
};

// 提交审批
const handleSubmit = async () => {
  const id = route.query.id;
  if (!id) {
    MessagePlugin.error('缺少合同ID');
    return;
  }

  const confirmDialog = DialogPlugin.confirm({
    header: '提交审批',
    body: '确定要提交审批吗？',
    onConfirm: async () => {
      try {
        const res = await submitContractApproval(id);
        if (res.code === 0 || res.code === 200) {
          MessagePlugin.success('提交审批成功');
          confirmDialog.destroy();
          // 刷新页面数据
          await loadContractDetail();
        } else {
          MessagePlugin.error(res.msg || '提交审批失败');
        }
      } catch (error: any) {
        MessagePlugin.error(error.message || '提交审批失败，请重试');
      }
    },
  });
};

// 删除合同
const handleDelete = async () => {
  const id = route.query.id;
  if (!id) {
    MessagePlugin.error('缺少合同ID');
    return;
  }

  const confirmDialog = DialogPlugin.confirm({
    header: '删除合同',
    body: '确定要删除该合同吗？删除后无法恢复。',
    onConfirm: async () => {
      try {
        const res = await deleteContract(id);
        if (res.code === 0 || res.code === 200) {
          MessagePlugin.success('删除成功');
          confirmDialog.destroy();
          // 返回列表页
          router.push('/contractMange');
        } else {
          MessagePlugin.error(res.msg || '删除失败');
        }
      } catch (error: any) {
        MessagePlugin.error(error.message || '删除失败，请重试');
      }
    },
  });
};

// 查看客户
const handleViewCustomer = (customerId: string | number) => {
  router.push({
    path: '/customerMange/customer/detail',
    query: { id: customerId },
  });
};

// 删除产品
const handleDeleteProduct = (row: any) => {
  MessagePlugin.info('删除产品功能待开发');
};

// 加载合同详情
const loadContractDetail = async () => {
  const id = route.query.id as string | undefined;
  if (!id) {
    MessagePlugin.error('缺少合同ID');
    return;
  }
  try {
    const res = await getContractDetail(id);
    if (res.code === 0 || res.code === 200) {
      contractDetail.value = res.data || {};
    } else {
      MessagePlugin.error(res.msg || '获取合同详情失败');
    }
  } catch (error: any) {
    console.error('获取合同详情失败:', error);
    MessagePlugin.error('获取合同详情失败，请重试');
  }
};

onMounted(() => {
  loadContractDetail();
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

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #1f1f1f;
  }

  .status-text {
    font-size: 12px;
    color: #0052d9;

    &.status-rejected {
      color: #ff4d4f;
    }
  }
}

.info-actions {
  display: flex;
  gap: 8px;
}

.info-extra {
  font-size: 14px;
  color: #666;
  margin-top: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #1f1f1f;
  }
}

.reject-content {
  :deep(.t-textarea) {
    .t-textarea__inner {
      background-color: #f5f7fa;
    }
  }
}
</style>
