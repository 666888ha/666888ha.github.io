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
          <t-select
            v-model="searchForm.followUpPersonnel"
            placeholder="请选择跟进人员"
            :options="personnelOptions"
            multiple
            clearable
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
          <t-select
            v-model="searchForm.followUpType"
            placeholder="请选择跟进类型"
            :options="followUpTypeOptions"
            clearable
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
      <t-button theme="primary" @click="clickOper()">
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
                    <t-button
                      v-if="record.showClose"
                      variant="text"
                      theme="default"
                      size="small"
                      @click="handleDeleteRecord(record)"
                    >
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
                  <t-button
                    v-if="record.showComment"
                    variant="text"
                    theme="default"
                    size="small"
                    @click="toggleComment(record)"
                  >
                    <t-icon name="chat" size="14px" />
                    评论{{ record.commentCount > 0 ? `(${record.commentCount})` : '' }}
                  </t-button>
                </div>

                <!-- 评论区域 -->
                <div v-if="record.showCommentlist" class="comments-section">
                  <!-- 评论列表 -->
                  <div v-if="record.comments && record.comments.length > 0" class="comments-list">
                    <div v-for="(comment, commentIndex) in record.comments" :key="commentIndex" class="comment-item">
                      <div class="comment-header">
                        <div class="comment-user-info">
                          <t-avatar size="50px" shape="circle">
                            <template #icon>
                              <t-icon name="user" />
                            </template>
                          </t-avatar>
                          <span class="comment-operator-name">{{ comment.operator }}</span>
                          <span class="comment-time">{{ comment.time }}</span>
                        </div>
                        <t-button
                          variant="text"
                          theme="default"
                          size="small"
                          @click="handleDeleteComment(record, commentIndex)"
                        >
                          <t-icon name="close" size="14px" />
                        </t-button>
                      </div>
                      <div class="comment-content">{{ comment.content }}</div>
                    </div>
                  </div>

                  <!-- 评论输入框 -->
                  <div class="comment-input-area">
                    <t-input
                      v-model="record.newComment"
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
    <follow-up-details-dialog ref="followUpDetailRef" />
  </div>
</template>
<script setup lang="ts">
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, onMounted, ref } from 'vue';

defineOptions({
  name: 'FollowUpRecordAll',
});
const FollowUpDetailsDialog = defineAsyncComponent(() => import('./followUpDetailsDialog.vue'));
// 搜索表单
const searchForm = ref({
  keyword: '',
  dateRange: [] as string[],
  followUpPersonnel: [] as string[],
  module: '',
  followUpType: '',
});

// 跟进人员选项
const personnelOptions = ref([
  { label: '张三', value: 'zhangsan' },
  { label: '李四', value: 'lisi' },
  { label: '王五', value: 'wangwu' },
  { label: '赵六', value: 'zhaoliu' },
  { label: '孙七', value: 'sunqi' },
  { label: '周八', value: 'zhouba' },
  { label: '吴九', value: 'wujiu' },
  { label: '郑十', value: 'zhengshi' },
]);

// 所属模块选项
const moduleOptions = ref([
  { label: '全部', value: '' },
  { label: '客户管理', value: 'customer' },
  { label: '销售管理', value: 'sales' },
  { label: '合同管理', value: 'contract' },
  { label: '项目管理', value: 'project' },
  { label: '财务模块', value: 'finance' },
]);

// 跟进类型选项
const followUpTypeOptions = ref([
  { label: '全部', value: '' },
  { label: '电话跟进', value: 'phone' },
  { label: '邮件跟进', value: 'email' },
  { label: '拜访跟进', value: 'visit' },
  { label: '会议跟进', value: 'meeting' },
  { label: '其他跟进', value: 'other' },
]);
// 跟进记录数据
const followList = ref([
  {
    date: '03-23',
    list: [
      {
        id: 1,
        operator: '赵小刚',
        action: '跟进(到访)',
        time: '2025-03-23 22:31',
        content: '上门拜访了客户,客户对产品意向很高,但是希望价格能有优惠。',
        fromCustomer: '合肥森谱科学仪器有限公司',
        showClose: true,
        showComment: true,
        showCommentlist: false,
        commentCount: 3,
        comments: [
          {
            operator: '赵小刚',
            time: '2025-03-23 22:31',
            content: '上门拜访了客户,客户对产品意向很高,但是希望价格能有优惠。',
          },
          {
            operator: '赵小刚',
            time: '2025-03-23 22:31',
            content: '上门拜访了客户,客户对产品意向很高,但是希望价格能有优惠。',
          },
        ],
        newComment: '',
      },
      {
        id: 2,
        operator: '赵小刚',
        action: '跟进(到访)',
        time: '2025-03-23 22:31',
        content: '上门拜访了客户,客户对产品意向很高,但是希望价格能有优惠。',
        fromCustomer: '合肥森谱科学仪器有限公司',
        showClose: true,
        showComment: true,
        showCommentlist: false,
        commentCount: 0,
        comments: [],
        newComment: '',
      },
      {
        id: 3,
        operator: '赵小刚',
        action: '跟进(到访)',
        time: '2025-03-23 22:31',
        content: '上门拜访了客户,客户对产品意向很高,但是希望价格能有优惠。',
        fromCustomer: '合肥森谱科学仪器有限公司',
        showClose: true,
        showComment: true,
        showCommentlist: false,
        commentCount: 0,
        comments: [],
        newComment: '',
      },
    ],
  },
  {
    date: '03-25',
    list: [
      {
        id: 2,
        operator: '李晓',
        action: '跟进(到访)',
        time: '2025-03-23 22:31',
        content: '上门拜访了客户,客户对产品意向很高,但是希望价格能有优惠。',
        fromCustomer: '合肥森谱科学仪器有限公司',
        showClose: true,
        showComment: true,
        showCommentlist: false,
        commentCount: 3,
      },
    ],
  },
]);
// 分页参数
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 50,
  pageSizeOptions: [10, 20, 50],
});

// 详情弹框引用
const followUpDetailRef = ref(null);
// 查询操作
const handleSearch = () => {
  console.log('执行筛选查询，参数：', searchForm);
  loadTableData();
  // 实际项目中：将filterForm作为参数请求接口，更新表格数据
};

// 重置操作
const handleReset = () => {
  // 清空筛选表单
  searchForm.value.keyword = '';
  searchForm.value.dateRange = [];
  searchForm.value.followUpPersonnel = [];
  searchForm.value.module = '';
  searchForm.value.followUpType = '';
  console.log('筛选条件已重置');
  loadTableData();
};

// 切换评论显示
const toggleComment = (record: any) => {
  record.showCommentlist = !record.showCommentlist;
};

// 提交评论
const submitComment = (record: any) => {
  if (!record.newComment.trim()) {
    MessagePlugin.warning('请输入评论内容');
    return;
  }

  if (!record.comments) {
    record.comments = [];
  }
  record.comments.push({
    operator: '当前用户',
    time: new Date()
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(/\//g, '-'),
    content: record.newComment,
  });

  record.commentCount = record.comments.length;
  record.newComment = '';
  MessagePlugin.success('评论成功');
};

// 删除评论
const handleDeleteComment = (record: any, index: number) => {
  record.comments.splice(index, 1);
  record.commentCount = record.comments.length;
  MessagePlugin.success('删除成功');
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
  DialogPlugin.confirm({
    header: '确认删除',
    body: '确定要删除这条跟进记录吗？',
    onConfirm: () => {
      // 找到并删除该记录
      followList.value.forEach((dateGroup) => {
        const index = dateGroup.list.findIndex((item) => item.id === record.id);
        if (index > -1) {
          dateGroup.list.splice(index, 1);
          pagination.value.total--;
        }
      });
      MessagePlugin.success('删除成功');
    },
  });
};

// 导出
const clickOper = () => {
  MessagePlugin.success('导出功能开发中');
};

// 分页变化
const handlePageChange = (pageInfo: any) => {
  pagination.value.current = pageInfo.current || pagination.value.current;
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
// 加载表格数据
const loadTableData = async () => {
  // TODO: 调用API加载数据
};
// 初始化
onMounted(() => {
  loadTableData();
});
</script>
<style lang="less" scoped>
.customer-container {
  padding: var(--td-comp-paddingTB-lg) var(--td-comp-paddingLR-lg);
  background: #fff;
  padding: 20px;
}
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
</style>
