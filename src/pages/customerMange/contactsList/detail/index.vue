<template>
  <div class="contact-detail-container">
    <!-- 顶部联系人信息区域 -->
    <t-card :bordered="false" class="header-card">
      <div class="contact-header">
        <div class="header-left">
          <div class="contact-name">
            <h2>{{ contactInfo.contact_name }}</h2>
          </div>
          <div class="basic-info">
            <span>关联客户: {{ contactInfo.customer_name }}</span>
            <span>手机号码: {{ contactInfo.mobile }}</span>
          </div>
        </div>
        <div class="header-right">
          <div class="next-follow-up">下次跟进: {{ contactInfo.nextFollowUp }}</div>
          <div class="nav-buttons">
            <t-button variant="text" theme="default" @click="handlePrev">
              <t-icon name="chevron-left" />
            </t-button>
            <t-button variant="text" theme="default" @click="handleNext">
              <t-icon name="chevron-right" />
            </t-button>
          </div>
        </div>
      </div>
    </t-card>

    <!-- 操作按钮区域 -->
    <div class="action-buttons">
      <t-button theme="default" variant="outline" @click="clickOper(1)">
        <template #icon>
          <t-icon name="call" />
        </template>
        拨打手机
      </t-button>
      <t-button theme="default" variant="outline" @click="clickOper(2)">
        <template #icon>
          <t-icon name="chat" />
        </template>
        发送短信
      </t-button>
      <t-button theme="default" variant="outline" @click="clickOper(3)">
        <template #icon>
          <t-icon name="edit" />
        </template>
        编辑联系人
      </t-button>
      <t-button theme="default" variant="outline" @click="clickOper(4)">
        <template #icon>
          <t-icon name="delete" />
        </template>
        删除联系人
      </t-button>
    </div>

    <!-- 概况信息 -->
    <t-card :bordered="false" class="info-card">
      <div class="section-header">
        <div class="header-left-group">
          <span class="section-icon">■</span>
          <span class="section-title">概况信息</span>
        </div>
      </div>
      <!-- 基本信息 -->
      <div class="info-section">
        <div class="section-subtitle">基本信息</div>
        <base-desc label-width="120px">
          <t-row type="flex">
            <base-desc-item label="联系人姓名">{{ contactInfo.contact_name }}</base-desc-item>
            <base-desc-item label="尊称">{{ contactInfo.honorific || '-' }}</base-desc-item>
          </t-row>
          <t-row type="flex">
            <base-desc-item label="部门职务">{{ contactInfo.role || '-' }}</base-desc-item>
            <base-desc-item label="固定电话">{{ contactInfo.tel || '-' }}</base-desc-item>
          </t-row>
          <t-row type="flex">
            <base-desc-item label="电子邮箱">{{ contactInfo.email || '-' }}</base-desc-item>
            <base-desc-item label="QQ号码">{{ contactInfo.wechat || '-' }}</base-desc-item>
          </t-row>
          <t-row type="flex">
            <base-desc-item label="详细地址">{{ contactInfo.contact_address || '-' }}</base-desc-item>
            <base-desc-item label="客户名称">
              <t-link theme="primary" @click="handleViewCustomer(contactInfo.customer_id)">{{
                contactInfo.customer_name
              }}</t-link>
            </base-desc-item>
          </t-row>
          <t-row type="flex">
            <base-desc-item label="角色">{{ contactInfo.position || '-' }}</base-desc-item>
            <base-desc-item label="手机号码">
              {{ contactInfo.mobile }}
              <t-space :size="12" style="margin-left: 8px">
                <t-link theme="primary" @click="handleDial(contactInfo.mobile)">
                  <t-icon name="call" size="14px" />
                  拨打
                </t-link>
                <t-link theme="primary" @click="handleSendSMS(contactInfo.mobile)">
                  <t-icon name="chat" size="14px" />
                  短信
                </t-link>
              </t-space>
            </base-desc-item>
          </t-row>
          <t-row type="flex">
            <base-desc-item label="传真号码">{{ contactInfo.fax || '-' }}</base-desc-item>
            <base-desc-item label="微信账号">{{ contactInfo.wechat || '-' }}</base-desc-item>
          </t-row>
          <base-desc-item label="所在地区">{{ contactInfo.contact_region_name || '-' }}</base-desc-item>
          <base-desc-item label="备注信息">{{ contactInfo.contact_remark || '-' }}</base-desc-item>
        </base-desc>
      </div>

      <!-- 系统信息 -->
      <div class="info-section">
        <div class="section-subtitle">系统信息</div>
        <base-desc label-width="100px">
          <t-row type="flex">
            <base-desc-item label="系统编号">{{ contactInfo.id }}</base-desc-item>
            <base-desc-item label="创建时间">{{ contactInfo.create_time }}</base-desc-item>
          </t-row>
          <t-row type="flex">
            <base-desc-item label="最后跟进">{{ contactInfo.lastFollowUp }}</base-desc-item>
            <base-desc-item label="最后联系">{{ contactInfo.lastContact }}</base-desc-item>
          </t-row>
          <t-row type="flex">
            <base-desc-item label="创建人员">{{ contactInfo.creator }}</base-desc-item>
            <base-desc-item label="更新时间">{{ contactInfo.updateTime }}</base-desc-item>
          </t-row>
          <t-row type="flex">
            <base-desc-item label="下次跟进">{{ contactInfo.nextFollowUp }}</base-desc-item>
          </t-row>
        </base-desc>
      </div>
    </t-card>

    <!-- 联系人动态 -->
    <t-card :bordered="false" class="dynamics-card">
      <div class="section-header">
        <div class="header-left-group">
          <span class="section-icon">■</span>
          <span class="section-title">联系人动态</span>
        </div>
        <div class="header-right-group">
          <t-checkbox v-model="onlyFollowUp">只看跟进</t-checkbox>
          <t-button theme="primary" @click="clickOper(5)">
            <template #icon>
              <t-icon name="edit" />
            </template>
            写跟进
          </t-button>
        </div>
      </div>

      <!-- 动态时间线 -->
      <contact-dynamics ref="contactDynamicsRef" />
    </t-card>

    <!-- 新建跟进弹框 -->
    <add-follow-up ref="addFollowUpRef" @submit-success="submitSuccess" />
  </div>
</template>
<script setup lang="ts">
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { deleteContact, getContactAllList, getContactDetail } from '@/api/customer/customer';
import { copyToClipboard } from '@/utils/ruoyi';

defineOptions({
  name: 'ContactDetail',
});
const contactDynamicsRef = ref(null);
import AddFollowUp from './components/addFollowUp.vue';
import ContactDynamics from './components/contactDynamics.vue';
// 表格数据（筛选后的数据）
const tableData = ref([]);
const BaseDesc = defineAsyncComponent(() => import('@/components/BaseDesc/index.vue'));
const BaseDescItem = defineAsyncComponent(() => import('@/components/BaseDescItem/index.vue'));
const addFollowUpRef = ref(null);
const currentId = ref();
const route = useRoute();
const router = useRouter();
const contact_id = route.query.id;
// 联系人信息
const contactInfo = ref<any>({});

// 只看跟进筛选
const onlyFollowUp = ref(false);

// 操作
const clickOper = async (type: number) => {
  switch (type) {
    case 1: // 拨打手机
      {
        const success = await copyToClipboard(contactInfo.value.mobile);
        if (success) {
          MessagePlugin.success('复制成功');
        } else {
          MessagePlugin.error('复制失败，请手动复制');
        }
      }
      break;
    case 2: // 发送短信
      MessagePlugin.info('发送短信功能开发中');
      break;
    case 3: // 编辑联系人
      router.push({
        path: '/customerMange/contacts/edit',
        query: { id: contact_id },
      });
      break;
    case 4: // 删除联系人
      handleDeleteCustomer();
      break;
    case 5: // 写跟进
      if (addFollowUpRef.value) {
        addFollowUpRef.value.show(contactInfo.value, 1);
      }
      break;
  }
};

// 拨打
const handleDial = async (mobile: string) => {
  const success = await copyToClipboard(mobile);
  if (success) {
    MessagePlugin.success('复制成功');
  } else {
    MessagePlugin.error('复制失败，请手动复制');
  }
};

// 发送短信
const handleSendSMS = (mobile: string) => {
  MessagePlugin.info(`发送短信到 ${mobile}`);
};
// 删除客户
const handleDeleteCustomer = () => {
  const dialog = DialogPlugin.confirm({
    header: '确认删除',
    body: `确定要删除客户"${contactInfo.value.customer_name}"的联系人"${contactInfo.value.contact_name}"吗？删除后无法恢复。`,
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const response = await deleteContact(contact_id);
        if (response.code === 0 || response.code === 200) {
          MessagePlugin.success('删除成功');
          dialog.hide();
          // 删除之后返回
          router.back();
        } else {
          MessagePlugin.error(response.message || '删除失败');
        }
      } catch (error: any) {
        MessagePlugin.error(error.message || '删除失败，请重试');
      }
    },
  });
};
// 查看客户详情
const handleViewCustomer = (id: any) => {
  // 这里应该根据关联客户跳转
  router.push({
    path: '/customerMange/customer/detail',
    query: { id },
  });
};

// 计算属性：当前在列表中的索引
const currentIndex = computed(() => {
  const index = tableData.value.findIndex((item) => item.id === Number(currentId.value));
  return index === -1 ? 0 : index;
});

// 计算属性：是否是第一个
const isFirst = computed(() => currentIndex.value === 0);

// 计算属性：是否是最后一个
const isLast = computed(() => currentIndex.value === tableData.value.length - 1);
// 切换到上一个
const handlePrev = () => {
  if (isFirst.value) {
    MessagePlugin.info('已经是第一个客户了');
    return;
  }
  const newIndex = currentIndex.value - 1;
  router.push({
    path: '/customerMange/contacts/detail',
    query: { id: tableData.value[newIndex].id, customerId: tableData.value[newIndex].customer_id },
  });
};

// 切换到下一个
const handleNext = () => {
  if (isLast.value) {
    MessagePlugin.warning('已经是最后一个客户了');
    return;
  }
  const newIndex = currentIndex.value + 1;
  router.push({
    path: '/customerMange/contacts/detail',
    query: { id: tableData.value[newIndex].id, customerId: tableData.value[newIndex].customer_id },
  });
};
const submitSuccess = () => {
  // 刷新动态时间线
  if (contactDynamicsRef.value) {
    contactDynamicsRef.value.loadTableData();
  }
};
// 加载表格数据
const loadTableData = async () => {
  try {
    const params: any = {
      page: 1,
      limit: 1000,
    };
    const res = await getContactAllList(params);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      const list = data.list || [];
      // 映射接口返回的数据到表格数据格式
      tableData.value = list;
    } else {
      MessagePlugin.error(res.msg || '获取联系人列表失败');
      tableData.value = [];
    }
  } catch (error: any) {
    console.error('获取联系人列表失败:', error);
    MessagePlugin.error('获取联系人列表失败，请重试');
    tableData.value = [];
  }
};
// 初始化
onMounted(() => {
  const id = route.query.id;
  currentId.value = id;
  if (id) {
    loadContactDetail(id as string);
    loadTableData();
  } else {
    MessagePlugin.warning('缺少联系人ID参数');
    router.back();
  }
});

// 加载联系人详情
const loadContactDetail = async (contactId: string) => {
  try {
    const res = await getContactDetail(contactId);
    if (res.code === 0 || res.code === 200) {
      const data = res.data || ({} as any);
      contactInfo.value = data;
    } else {
      MessagePlugin.error((res as any).msg || res.message || '获取联系人详情失败');
    }
  } catch (error: any) {
    console.error('获取联系人详情失败:', error);
    MessagePlugin.error(error?.message || '获取联系人详情失败，请重试');
  }
};
</script>
<style lang="less" scoped>
.contact-detail-container {
  padding: 20px;
  background: #fff;
  min-height: 100vh;
}

.header-card {
  margin-bottom: 16px;

  :deep(.t-card__body) {
    padding: 20px 24px;
  }
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .header-left {
    flex: 1;

    .contact-name {
      margin-bottom: 12px;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--td-text-color-primary);
      }
    }

    .basic-info {
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: var(--td-text-color-secondary);

      span {
        white-space: nowrap;
      }
    }
  }

  .header-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;

    .next-follow-up {
      font-size: 14px;
      color: var(--td-text-color-secondary);
    }

    .nav-buttons {
      display: flex;
      gap: 8px;

      .t-button {
        width: 32px;
        height: 32px;
        padding: 0;
      }
    }
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  .t-button {
    :deep(.t-icon) {
      margin-right: 4px;
    }
  }
}

.info-card,
.dynamics-card {
  margin-bottom: 20px;

  :deep(.t-card__body) {
    padding: 20px 24px;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .header-left-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-right-group {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .section-icon {
    color: var(--td-brand-color);
    font-size: 12px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }
}

.info-section {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }

  .section-subtitle {
    font-size: 14px;
    font-weight: 500;
    color: var(--td-text-color-primary);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--td-component-border);
  }
}

:deep(.t-link) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.write-follow-btn {
  position: relative;

  :deep(.t-badge) {
    position: absolute;
    top: -4px;
    right: -4px;
  }
}
</style>
