<template>
  <div class="follow-up-record-container">
    <!-- 顶部搜索和操作区域 -->
    <div class="search-header">
      <div class="header-left">
        <div class="header-title">跟进记录</div>
      </div>
      <div class="header-right">
        <t-date-range-picker v-model="searchForm.timeRange" placeholder="时间范围" style="width: 220px" clearable />
        <!-- 跟进人员 -->
        <t-select
          v-model="searchForm.follow_user_id"
          placeholder="跟进人员"
          clearable
          style="width: 160px"
          :options="followUserOptions"
          :loading="loadingFollowUser"
        />
        <!-- 跟进类型 -->
        <t-select
          v-model="searchForm.follow_type"
          placeholder="跟进类型"
          clearable
          style="width: 160px"
          :options="followTypeOptions"
          :loading="loadingFollowType"
        />
        <t-input v-model="searchForm.keyword" placeholder="搜索关键词" clearable style="width: 180px">
          <template #prefix-icon>
            <t-icon name="search" />
          </template>
        </t-input>
        <t-button theme="primary" @click="handleExport">
          <template #icon>
            <t-icon name="download" />
          </template>
          导出
        </t-button>
      </div>
    </div>

    <customer-dynamics />
  </div>
</template>
<script setup lang="ts">
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import {
  addFollowComment,
  delComment,
  delFollow,
  getCustomerFollowList,
  getEmployeeList,
} from '@/api/customer/customer';
import { getDictOptions } from '@/api/dic';

defineOptions({
  name: 'FollowUpRecord',
});
import CustomerDynamics from './customerDynamics.vue';

const FollowUpDetailsDialog = defineAsyncComponent(() => import('./followUpDetailsDialog.vue'));
const route = useRoute();

// 搜索表单
const searchForm = ref({
  timeRange: [],
  keyword: '',
  follow_user_id: '',
  follow_type: '',
});

// 跟进人员选项（从员工列表获取）
const followUserOptions = ref<Array<{ label: string; value: string }>>([]);
const loadingFollowUser = ref(false);

// 跟进类型选项（从数据字典获取）
const followTypeOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingFollowType = ref(false);

// 加载跟进人员列表
const loadFollowUserOptions = async () => {
  if (loadingFollowUser.value || followUserOptions.value.length > 0) {
    return;
  }
  loadingFollowUser.value = true;
  try {
    const res = await getEmployeeList({
      limit: 1000,
    });
    if (res.code === 0 || res.code === 200) {
      const list = res.data || [];
      followUserOptions.value = list.map((emp: any) => ({
        label: emp.real_name || '',
        value: String(emp.id || ''),
      }));
    }
  } catch (error: any) {
    console.error('获取跟进人员失败:', error);
    MessagePlugin.error('获取跟进人员失败，请重试');
  } finally {
    loadingFollowUser.value = false;
  }
};

// 加载跟进类型字典
const loadFollowTypeOptions = async () => {
  if (loadingFollowType.value || followTypeOptions.value.length > 0) {
    return;
  }
  loadingFollowType.value = true;
  try {
    const res = await getDictOptions('follow_type');
    if (res.code === 0 || res.code === 200) {
      const list = res.data || [];
      followTypeOptions.value = list;
    }
  } catch (error: any) {
    console.error('获取跟进类型失败:', error);
    MessagePlugin.error('获取跟进类型失败，请重试');
  } finally {
    loadingFollowType.value = false;
  }
};

// 跟进记录数据（按日期分组）
const followList = ref<
  Array<{
    date: string;
    list: any[];
  }>
>([]);

// 分页参数
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 50,
  pageSizeOptions: [10, 20, 50],
});

// 详情弹框引用
const followUpDetailRef = ref(null);

// 切换评论显示
const toggleComment = (record: any) => {
  record.showCommentlist = !record.showCommentlist;
};

const submitComment = async (record: any) => {
  if (!record.comment_content || !record.comment_content.trim()) {
    MessagePlugin.warning('请输入评论内容');
    return;
  }

  try {
    const res = await addFollowComment({
      follow_id: record.id,
      comment_content: record.comment_content.trim(),
    });
    if (res.code === 0 || res.code === 200) {
      MessagePlugin.success('评论成功');
      // 本地追加一条评论到列表
      if (!record.comments) record.comments = [];
      record.comments.push({
        operator: '当前用户',
        time: new Date().toLocaleString('zh-CN').replace(/\//g, '-'),
        content: record.comment_content.trim(),
      });
      record.commentCount = record.comments.length;
      record.comment_content = '';
    } else {
      MessagePlugin.error(res.msg || '评论失败');
    }
  } catch (error) {
    console.error('添加评论失败:', error);
    MessagePlugin.error('添加评论失败，请重试');
  }
};

// 删除评论
const handleDeleteComment = async (record: any) => {
  try {
    const res = await delComment(record.id);
    if (res.code === 0 || res.code === 200) {
      MessagePlugin.success('删除跟进评论成功!');
      loadTableData();
    } else {
      MessagePlugin.error(res.msg || '删除跟进评论失败');
    }
  } catch (error: any) {
    MessagePlugin.error('删除跟进评论失败，请重试');
  }
};

// 查看详情
const handleViewDetail = (record: any) => {
  if (followUpDetailRef.value) {
    followUpDetailRef.value.show(record);
  } else {
    MessagePlugin.info('查看详情功能开发中');
  }
};

// 删除记录
const handleDeleteRecord = (record: any) => {
  const confirmDia = DialogPlugin.confirm({
    header: '提示',
    body: '此操作将永久删除该跟进记录, 是否继续?',
    theme: 'warning',
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const res = await delFollow(record.id);
        if (res.code === 0 || res.code === 200) {
          MessagePlugin.success('删除成功!');
          confirmDia.hide();
          loadTableData();
        } else {
          MessagePlugin.error(res.msg || '删除失败');
          confirmDia.hide();
        }
      } catch (error: any) {
        console.error('删除跟进记录失败:', error);
        MessagePlugin.error('删除跟进记录失败，请重试');
        confirmDia.hide();
      }
    },
    onCancel: () => {
      MessagePlugin.info('已取消删除');
      confirmDia.hide();
    },
  });
};

// 导出
const handleExport = () => {
  MessagePlugin.success('导出功能开发中');
};

// 分页变化
const handlePageChange = (page: number, pageInfo: any) => {
  pagination.value.current = page;
  if (pageInfo) {
    pagination.value.pageSize = pageInfo.pageSize || pagination.value.pageSize;
  }
  loadTableData();
};

// 每页条数变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  pagination.value.current = 1;
  loadTableData();
};

// 加载表格数据（调用 /follow/follow-record-list）
const loadTableData = async () => {
  const customerId = route.query.id;
  if (!customerId) {
    followList.value = [];
    pagination.value.total = 0;
    return;
  }

  const params: any = {
    customer_id: customerId,
    page: pagination.value.current,
    limit: pagination.value.pageSize,
  };

  // 时间范围
  if (Array.isArray(searchForm.value.timeRange) && searchForm.value.timeRange.length === 2) {
    params.start_time = searchForm.value.timeRange[0];
    params.end_time = searchForm.value.timeRange[1];
  }
  // 跟进人
  if (searchForm.value.follow_user_id) {
    params.follow_user_id = searchForm.value.follow_user_id;
  }
  // 跟进类型
  if (searchForm.value.follow_type) {
    params.follow_type = searchForm.value.follow_type;
  }
  // 关键词
  if (searchForm.value.keyword) {
    params.keyword = searchForm.value.keyword;
  }
  try {
    const res = await getCustomerFollowList(params);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      const rawList: any[] = data.list || [];
      // 转换为前端时间线所需结构
      followList.value = rawList.map((group: any) => {
        const records = Array.isArray(group.list) ? group.list : [];
        return {
          date: group.date || '',
          list: records.map((item: any) => ({
            id: item.id,
            operator: item.visitor_identity || '',
            action: item.follow_type_name ? `跟进(${item.follow_type_name})` : '跟进',
            time: item.create_time || '',
            content: item.follow_content || '',
            fromCustomer: item.customer_name || '',
            showClose: false,
            showComment: false,
            showCommentlist: false,
            commentCount: 0,
            comments: [],
            newComment: '',
            // 原始数据保留一份，后续如需用到审批等字段可以从这里取
            _raw: item,
          })),
        };
      });
      pagination.value.total = data.count || 0;
    } else {
      MessagePlugin.error(res.msg || '获取跟进记录失败');
    }
  } catch (error: any) {
    console.error('获取跟进记录失败:', error);
    MessagePlugin.error('获取跟进记录失败，请重试');
  }
};

// 初始化
onMounted(() => {
  loadFollowUserOptions();
  loadFollowTypeOptions();
  loadTableData();
});
</script>
<style lang="less" scoped>
.follow-up-record-container {
  .search-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .header-right {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .follow-up-timeline {
    .date-group {
      margin-bottom: 32px;

      .date-marker {
        font-size: 14px;
        font-weight: 600;
        color: var(--td-text-color-primary);
        margin-bottom: 16px;
      }

      .records-list {
        position: relative;
        padding-left: 20px;

        &::before {
          content: '';
          position: absolute;
          left: 4px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--td-component-border);
        }

        .record-card {
          position: relative;
          margin-bottom: 24px;

          :deep(.t-card__body) {
            padding: 16px;
          }

          .record-item {
            position: relative;
            display: flex;

            .timeline-dot {
              position: absolute;
              left: -37px;
              top: -20px;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              border: 2px solid var(--td-brand-color);
              z-index: 1;
              background: white;
            }

            .record-content {
              flex: 1;
              padding-left: 12px;

              .record-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;

                .user-info {
                  display: flex;
                  align-items: center;
                  gap: 8px;

                  .user-avatar {
                    background: var(--td-bg-color-container-select);
                  }

                  .operator-name {
                    font-weight: 500;
                    color: var(--td-text-color-primary);
                    font-size: 14px;
                  }

                  .action-type {
                    color: var(--td-text-color-secondary);
                    font-size: 14px;
                  }
                }

                .record-actions-right {
                  display: flex;
                  align-items: center;
                  gap: 8px;

                  .record-time {
                    color: var(--td-text-color-placeholder);
                    font-size: 12px;
                  }
                }
              }

              .record-description {
                color: var(--td-text-color-primary);
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 8px;
              }

              .record-source {
                color: var(--td-text-color-placeholder);
                font-size: 12px;
                margin-bottom: 8px;
              }

              .record-actions {
                display: flex;
                gap: 16px;
                justify-content: flex-end;
                margin-top: 8px;
              }

              .comments-section {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid var(--td-component-border);

                .comments-list {
                  margin-bottom: 16px;

                  .comment-item {
                    padding: 12px;
                    background: var(--td-bg-color-container);
                    border-radius: 4px;
                    margin-bottom: 8px;

                    .comment-header {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      margin-bottom: 8px;

                      .comment-user-info {
                        display: flex;
                        align-items: center;
                        gap: 8px;

                        .comment-operator-name {
                          font-weight: 500;
                          color: var(--td-text-color-primary);
                          font-size: 14px;
                        }

                        .comment-time {
                          color: var(--td-text-color-placeholder);
                          font-size: 12px;
                        }
                      }
                    }

                    .comment-content {
                      color: var(--td-text-color-primary);
                      font-size: 14px;
                      line-height: 1.6;
                    }
                  }
                }

                .comment-input-area {
                  :deep(.t-input) {
                    .t-input__suffix {
                      padding-right: 0;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 32px;
  }
  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }
}
</style>
