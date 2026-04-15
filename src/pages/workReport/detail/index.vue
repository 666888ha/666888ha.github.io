<template>
  <div class="work-report-detail-container">
    <!-- 头部标题和操作按钮 -->
    <t-card :bordered="false" class="header-card">
      <div class="header-content">
        <div class="header-left">
          <h2 class="report-title">{{ reportTitle }}</h2>
          <div v-if="reportDetail.approve_status === 1" class="status-badge">
            <span class="status-dot status-approved"></span>
            <span class="status-text">已批阅</span>
          </div>
          <div v-else-if="reportDetail.approve_status === 0" class="status-badge">
            <span class="status-dot status-pending"></span>
            <span class="status-text">待批阅</span>
          </div>
        </div>
        <div class="header-right">
          <t-button theme="primary" variant="outline" @click="handleEdit">
            <template #icon>
              <t-icon name="edit" />
            </template>
            编辑报告
          </t-button>
          <t-button theme="danger" variant="outline" @click="handleDelete">
            <template #icon>
              <t-icon name="delete" />
            </template>
            删除报告
          </t-button>
        </div>
      </div>
    </t-card>

    <!-- 工作总结 -->
    <t-card :bordered="false" class="content-card">
      <div class="section-header">
        <h3>工作总结</h3>
      </div>
      <div class="summary-content">
        <div v-if="parsedSummary.newCustomers && parsedSummary.newCustomers.length > 0" class="summary-section">
          <h4 class="summary-subtitle">新增客户</h4>
          <div v-for="(customer, index) in parsedSummary.newCustomers" :key="index" class="summary-item">
            <div class="item-content">
              <span class="customer-name">{{ customer.name }}</span>
              <span v-if="customer.contact" class="item-detail">首要联系人: {{ customer.contact }}</span>
              <span v-if="customer.phone" class="item-detail">联系号码: {{ customer.phone }}</span>
            </div>
          </div>
        </div>

        <div v-if="parsedSummary.newFollows && parsedSummary.newFollows.length > 0" class="summary-section">
          <h4 class="summary-subtitle">新增跟进</h4>
          <div v-for="(follow, index) in parsedSummary.newFollows" :key="index" class="summary-item">
            <div class="item-content">
              <span>{{ follow.content }}</span>
            </div>
          </div>
        </div>

        <div v-if="parsedSummary.newQuotes && parsedSummary.newQuotes.length > 0" class="summary-section">
          <h4 class="summary-subtitle">新增报价</h4>
          <div v-for="(quote, index) in parsedSummary.newQuotes" :key="index" class="summary-item">
            <div class="item-content">
              <span>{{ quote.content }}</span>
            </div>
          </div>
        </div>

        <div v-if="parsedSummary.newContracts && parsedSummary.newContracts.length > 0" class="summary-section">
          <h4 class="summary-subtitle">新增合同</h4>
          <div v-for="(contract, index) in parsedSummary.newContracts" :key="index" class="summary-item">
            <div class="item-content">
              <span>{{ contract.content }}</span>
            </div>
          </div>
        </div>

        <!-- 如果没有解析到结构化数据，直接显示原始文本 -->
        <div v-if="!hasStructuredData && reportDetail.summary" class="summary-text">
          {{ reportDetail.summary }}
        </div>
      </div>
    </t-card>

    <!-- 工作计划 -->
    <t-card :bordered="false" class="content-card">
      <div class="section-header">
        <h3>工作计划</h3>
      </div>
      <div class="plan-content">
        {{ reportDetail.plan || '-' }}
      </div>
    </t-card>

    <!-- 工作点评 -->
    <t-card v-if="reportDetail.approve_comment" :bordered="false" class="content-card">
      <div class="section-header">
        <h3>工作点评</h3>
      </div>
      <div class="comment-content">
        {{ reportDetail.approve_comment }}
      </div>
    </t-card>

    <!-- 编辑报告弹框 -->
    <add-work-report-dialog ref="editReportDialogRef" @success="handleEditSuccess" />
  </div>
</template>
<script setup lang="ts">
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { deleteWorkReport, getWorkReportDetail } from '@/api/workReport';

defineOptions({
  name: 'WorkReportDetail',
});

const AddWorkReportDialog = defineAsyncComponent(() => import('../components/addWorkReportDialog.vue'));

const route = useRoute();
const router = useRouter();

// 报告详情
const reportDetail = ref<Record<string, any>>({});

// 编辑弹框引用
const editReportDialogRef = ref<InstanceType<typeof AddWorkReportDialog> | null>(null);

// 报告标题
const reportTitle = computed(() => {
  const type = reportDetail.value.report_type;
  const typeText = type === 1 ? '日报' : type === 2 ? '周报' : type === 3 ? '月报' : '报告';
  const date = reportDetail.value.submit_time || '';
  let dateStr = '';
  if (date) {
    const dateObj = new Date(date);
    if (type === 3) {
      // 月报：显示年月
      dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    } else {
      // 日报和周报：显示完整日期
      dateStr = date.split(' ')[0];
    }
  }
  const userName = reportDetail.value.user_name || '';
  return `${dateStr} 工作${typeText}${userName ? `(${userName})` : ''}`;
});

// 解析工作总结
const parsedSummary = computed(() => {
  const summary = reportDetail.value.summary || '';
  if (!summary) {
    return {
      newCustomers: [],
      newFollows: [],
      newQuotes: [],
      newContracts: [],
    };
  }

  // 尝试解析结构化数据（如果summary是JSON格式）
  try {
    const parsed = JSON.parse(summary);
    if (typeof parsed === 'object') {
      return {
        newCustomers: parsed.newCustomers || [],
        newFollows: parsed.newFollows || [],
        newQuotes: parsed.newQuotes || [],
        newContracts: parsed.newContracts || [],
      };
    }
  } catch (e) {
    // 如果不是JSON，尝试按文本格式解析
    // 这里可以根据实际的数据格式来解析
    // 暂时返回空数组，直接显示原始文本
  }

  return {
    newCustomers: [],
    newFollows: [],
    newQuotes: [],
    newContracts: [],
  };
});

// 是否有结构化数据
const hasStructuredData = computed(() => {
  return (
    (parsedSummary.value.newCustomers && parsedSummary.value.newCustomers.length > 0) ||
    (parsedSummary.value.newFollows && parsedSummary.value.newFollows.length > 0) ||
    (parsedSummary.value.newQuotes && parsedSummary.value.newQuotes.length > 0) ||
    (parsedSummary.value.newContracts && parsedSummary.value.newContracts.length > 0)
  );
});

// 编辑报告
const handleEdit = () => {
  if (editReportDialogRef.value) {
    editReportDialogRef.value.show(reportDetail.value);
  }
};

// 删除报告
const handleDelete = () => {
  const id = route.query.id;
  if (!id) {
    MessagePlugin.error('缺少报告ID');
    return;
  }

  const confirmDialog = DialogPlugin.confirm({
    header: '删除报告',
    body: '确定要删除该报告吗？删除后无法恢复。',
    onConfirm: async () => {
      try {
        const res = await deleteWorkReport(id);
        if (res.code === 0 || res.code === 200) {
          MessagePlugin.success('删除成功');
          confirmDialog.destroy();
          // 返回列表页
          router.push('/workReport/workReport');
        } else {
          MessagePlugin.error(res.msg || '删除失败');
        }
      } catch (error: any) {
        MessagePlugin.error(error.message || '删除失败，请重试');
      }
    },
  });
};

// 编辑成功回调
const handleEditSuccess = () => {
  // 重新加载详情数据
  loadReportDetail();
};

// 加载报告详情
const loadReportDetail = async () => {
  const id = route.query.id as string | undefined;
  if (!id) {
    MessagePlugin.error('缺少报告ID');
    return;
  }
  try {
    const res = await getWorkReportDetail(id);
    if (res.code === 0 || res.code === 200) {
      reportDetail.value = res.data || {};
    } else {
      MessagePlugin.error(res.msg || '获取报告详情失败');
    }
  } catch (error: any) {
    console.error('获取报告详情失败:', error);
    MessagePlugin.error('获取报告详情失败，请重试');
  }
};

onMounted(() => {
  loadReportDetail();
});
</script>
<style lang="less" scoped>
.work-report-detail-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header-card {
  margin-bottom: 16px;

  :deep(.t-card__body) {
    padding: 20px 24px;
  }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .report-title {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: #1f1f1f;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: 8px;

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;

        &.status-approved {
          background-color: #00a870;
        }

        &.status-pending {
          background-color: #ffa940;
        }
      }

      .status-text {
        font-size: 14px;
        color: #666;
      }
    }
  }

  .header-right {
    display: flex;
    gap: 8px;
  }
}

.content-card {
  margin-bottom: 16px;

  :deep(.t-card__body) {
    padding: 20px 24px;
  }
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

.summary-content {
  .summary-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .summary-subtitle {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .summary-item {
      margin-bottom: 12px;
      padding: 12px;
      background: #fafafa;
      border-radius: 4px;

      &:last-child {
        margin-bottom: 0;
      }

      .item-content {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 14px;
        color: #666;

        .customer-name {
          font-weight: 500;
          color: #333;
        }

        .item-detail {
          color: #999;
          font-size: 12px;
        }
      }
    }
  }

  .summary-text {
    font-size: 14px;
    color: #666;
    line-height: 1.8;
    white-space: pre-wrap;
  }
}

.plan-content {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  white-space: pre-wrap;
}

.comment-content {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
