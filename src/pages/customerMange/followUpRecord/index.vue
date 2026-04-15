<template>
  <div class="customer-container">
    <!-- 搜索区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <!-- 关键词输入 -->
        <div class="filter-item">
          <label class="filter-label">关键词</label>
          <t-input v-model="searchForm.keyword" placeholder="请输入内容" />
        </div>
        <!-- 跟进人员 -->
        <div class="filter-item">
          <label class="filter-label">跟进人员</label>
          <!-- 跟进人员 -->
          <t-select
            v-model="searchForm.follow_user_id"
            placeholder="跟进人员"
            clearable
            :options="followUserOptions"
            :loading="loadingFollowUser"
          />
        </div>
        <!-- 所属模块 -->
        <div class="filter-item">
          <label class="filter-label">所属模块</label>
          <t-select v-model="searchForm.module" placeholder="请选择所属模块" :options="moduleOptions" clearable />
        </div>
        <!-- 跟进类型 -->
        <div class="filter-item">
          <label class="filter-label">跟进类型</label>
          <!-- 跟进类型 -->
          <t-select
            v-model="searchForm.follow_type"
            placeholder="跟进类型"
            clearable
            :options="followTypeOptions"
            :loading="loadingFollowType"
          />
        </div>
        <!-- 时间范围 -->
        <div class="filter-item">
          <label class="filter-label">时间范围</label>
          <t-date-range-picker v-model="searchForm.dateRange" placeholder="请选择时间范围" clearable />
        </div>
      </div>
      <div class="filter-right">
        <!-- 操作按钮 -->
        <t-button theme="primary" @click="handleSearch">查询</t-button>
        <t-button theme="default" @click="handleReset">重置</t-button>
      </div>
    </div>
    <!-- 操作按钮和表格控制 -->
    <div class="import-btn">
      <t-button theme="primary" @click="clickOper(1)">
        <template #icon>
          <t-icon name="download" />
        </template>
        导出
      </t-button>
    </div>

    <!-- 跟进记录时间线列表 -->
    <div class="follow-up-timeline">
      <div v-for="(dateGroup, dateIndex) in followList" :key="dateIndex" class="date-group">
        <!-- 日期标记 -->
        <div class="date-marker">{{ dateGroup.date }}</div>

        <!-- 该日期下的记录列表 -->
        <div class="records-list">
          <t-card
            v-for="(record, recordIndex) in dateGroup.list"
            :key="recordIndex"
            :bordered="true"
            class="record-card"
          >
            <div class="record-item">
              <!-- 时间线圆点 -->
              <div class="timeline-dot"></div>
              <!-- 记录内容 -->
              <div class="record-content">
                <div class="record-header">
                  <div class="user-info">
                    <t-avatar size="32px" shape="circle" class="user-avatar">
                      <template #icon>
                        <t-icon name="user" />
                      </template>
                    </t-avatar>
                    <span class="operator-name">{{ record.operator }}</span>
                    <span class="action-type">{{ record.action }}</span>
                  </div>
                  <div class="record-actions-right">
                    <t-button variant="text" theme="default" size="small" @click="handleDeleteRecord(record)">
                      <t-icon name="close" size="16px" />
                    </t-button>
                    <span class="record-time">{{ record.time }}</span>
                  </div>
                </div>

                <!-- 记录描述 -->
                <div class="record-description">{{ record.content }}</div>

                <!-- 来源信息 -->
                <div v-if="record.fromCustomer" class="record-source">来自客户: {{ record.fromCustomer }}</div>

                <!-- 操作按钮 -->
                <div class="record-actions">
                  <t-button variant="text" theme="default" size="small" @click="handleViewDetail(record)">
                    <t-icon name="view" size="14px" />
                    详情
                  </t-button>
                  <t-button variant="text" theme="default" size="small" @click="toggleComment(record)">
                    <t-icon name="chat" size="14px" />
                    评论{{ record.comment_list?.length > 0 ? `(${record.comment_list.length})` : '' }}
                  </t-button>
                </div>

                <!-- 评论区域 -->
                <div v-if="record.showCommentlist" class="comments-section">
                  <!-- 评论列表 -->
                  <div v-if="record.comment_list && record.comment_list.length > 0" class="comments-list">
                    <div
                      v-for="(comment, commentIndex) in record.comment_list"
                      :key="commentIndex"
                      class="comment-item"
                    >
                      <div class="comment-header">
                        <div class="comment-user-info">
                          <t-avatar size="50px" shape="circle">
                            <template #icon>
                              <t-icon name="user" />
                            </template>
                          </t-avatar>
                          <span class="comment-operator-name">{{ comment.comment_user_name }}</span>
                          <span class="comment-time">{{ comment.create_time }}</span>
                        </div>
                        <t-button variant="text" theme="default" size="small" @click="handleDeleteComment(record)">
                          <t-icon name="close" size="14px" />
                        </t-button>
                      </div>
                      <div class="comment-content">{{ comment.comment_content }}</div>
                    </div>
                  </div>

                  <!-- 评论输入框 -->
                  <div class="comment-input-area">
                    <t-input
                      v-model="record.comment_content"
                      placeholder="请输入评论内容"
                      clearable
                      @enter="submitComment(record)"
                    >
                      <template #suffix>
                        <t-button theme="primary" size="small" @click="submitComment(record)">评论</t-button>
                      </template>
                    </t-input>
                  </div>
                </div>
              </div>
            </div>
          </t-card>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <t-pagination
        v-model="pagination.current"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-size-options="pagination.pageSizeOptions"
        :show-jumper="false"
        :total-content="false"
        @change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>

    <!-- 查看详情弹框 -->
    <follow-up-details-dialog ref="followUpDetailRef" @refresh-list="loadTableData" />
  </div>
</template>
<script setup lang="ts">
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, onMounted, ref } from 'vue';

import { addFollowComment, delComment, delFollow, getEmployeeList, getFollowRecordList } from '@/api/customer/customer';
import { getDictOptions } from '@/api/dic';

defineOptions({
  name: 'FollowUpRecord',
});

const FollowUpDetailsDialog = defineAsyncComponent(() => import('./followUpDetailsDialog.vue'));

// 搜索表单初始值（用于重置）
const initialSearchForm = {
  dateRange: [],
  keyword: '',
  follow_user_id: '',
  follow_type: '',
  module: '',
};

// 搜索表单
const searchForm = ref({ ...initialSearchForm });

// 跟进人员选项（从员工列表获取）
const followUserOptions = ref<Array<{ label: string; value: string }>>([]);
const loadingFollowUser = ref(false);

// 跟进类型选项（从数据字典获取）
const followTypeOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingFollowType = ref(false);

// 所属模块选项
const moduleOptions = ref<Array<{ label: string; value: string }>>([
  { label: '客户管理', value: 'customer' },
  { label: '跟进管理', value: 'follow' },
]);

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

// 搜索
const handleSearch = () => {
  pagination.value.current = 1; // 重置到第一页
  loadTableData();
};

// 重置
const handleReset = () => {
  // 重置搜索表单
  searchForm.value = { ...initialSearchForm };
  // 重置分页
  pagination.value.current = 1;
  // 重新加载数据
  loadTableData();
};

// 加载表格数据（调用 /follow/follow-record-list）
const loadTableData = async () => {
  const params: any = {
    page: pagination.value.current,
    limit: pagination.value.pageSize,
  };
  // 时间范围
  if (Array.isArray(searchForm.value.dateRange) && searchForm.value.dateRange.length === 2) {
    params.start_time = searchForm.value.dateRange[0];
    params.end_time = searchForm.value.dateRange[1];
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
  // 所属模块（如果需要的话）
  if (searchForm.value.module) {
    params.module = searchForm.value.module;
  }

  try {
    const res = await getFollowRecordList(params);
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
            comment_list: item.comment_list || [],
            newComment: '',
            // 原始数据保留一份，后续如需用到审批等字段可以从这里取
            _raw: item,
          })),
        };
      });
      pagination.value.total = data?.list?.length || 0;
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
.customer-container {
  padding: var(--td-comp-paddingTB-lg) var(--td-comp-paddingLR-lg);
  background: #fff;
  padding: 20px;
  .filter-bar {
    margin-bottom: 32px;
    margin-top: 32px;
    display: flex;
    justify-content: space-between;
    align-content: center;
    .filter-left {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      flex: 1;
      margin-right: 20px;

      .filter-item {
        display: flex;
        align-items: center;
        column-gap: 10px;
        .filter-label {
          min-width: 100px;
          text-align: right;
        }
      }
    }
    .filter-right {
      display: flex;
      flex-wrap: wrap;
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
  .import-btn {
    display: flex;
    justify-content: flex-end;
  }
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 32px;
  }
}
</style>
