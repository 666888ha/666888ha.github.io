<template>
  <!-- 跟进详情弹框 -->
  <t-dialog
    v-model:visible="dialogVisible"
    header="跟进详情"
    width="720px"
    :close-on-overlay-click="false"
    :on-confirm="onConfirm"
    :on-cancel="onCancel"
  >
    <base-desc label-width="150px">
      <base-desc-item label="关联客户">
        {{ followDetail.customer_name || followDetail.customer_id || '-' }}
      </base-desc-item>
      <base-desc-item label="主要拜访人">
        {{ followDetail.main_visitor_name || followDetail.main_visitor || '-' }}
      </base-desc-item>
      <base-desc-item label="拜访人身份">
        {{ followDetail.visitor_identity_name || followDetail.visitor_identity || '-' }}
      </base-desc-item>
      <base-desc-item label="跟进类型">
        {{ followDetail.follow_type_name || followDetail.follow_type || '-' }}
      </base-desc-item>
      <base-desc-item label="成交几率">
        {{ followDetail.win_rate || followDetail.win_rate || '-' }}
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
            <p>{{ item.title }}</p>
            <span>{{ item.label }}</span>
          </t-space>
        </base-desc-item>
      </t-row>
    </base-desc>

    <template #footer>
      <t-button theme="primary" size="small" @click="clickOper(3)">编辑跟进</t-button>
      <t-button theme="danger" size="small" @click="clickOper(4)">删除跟进</t-button>
    </template>
  </t-dialog>
  <newFollowUpDialog ref="newFollowUp" @success="handleEditSuccess" />
</template>
<script setup lang="ts">
import type { ImageProps } from 'tdesign-vue-next';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { computed, defineAsyncComponent, ref } from 'vue';

import { getFollowDetail } from '@/api/customer/customer';

const emit = defineEmits(['refresh-list']);

const BaseDescItem = defineAsyncComponent(() => import('@/components/BaseDescItem/index.vue'));
const BaseDesc = defineAsyncComponent(() => import('@/components/BaseDesc/index.vue'));
const newFollowUpDialog = defineAsyncComponent(() => import('./newFollowUpDialog.vue'));
const newFollowUp = ref(null);
// 弹框显隐状态
const dialogVisible = ref(false);

// 当前查看的跟进ID
const currentFollowId = ref<string | number | null>(null);

// 跟进详情数据（接口返回）
const followDetail = ref<Record<string, any>>({});

// 打卡图片
const defaultImageUrl = '';
const punchImages = computed(() => [
  {
    title: '出发',
    label: followDetail.value.departure_time,
    src: followDetail.value.departure_image || followDetail.value.departure_img || '',
  },
  {
    title: '到达',
    label: followDetail.value.arrival_time,
    src: followDetail.value.arrival_image || followDetail.value.arrival_img || '',
  },
  {
    title: '离开',
    label: followDetail.value.leave_time,
    src: followDetail.value.leave_image || followDetail.value.leave_img || '',
  },
]);

const onError: ImageProps['onError'] = () => {
  // 保持静默，图片失败时仍然展示占位
};

// 操作点击事件（示例）
const clickOper = (type: number) => {
  switch (type) {
    case 1:
      break;
    case 2:
      break;
    case 3: // 编辑跟进
      // dialogVisible.value = false
      newFollowUp.value.show(currentFollowId.value);
      break;
    case 4:
      handleDelete();
      break;
    default:
      break;
  }
};

// 编辑成功后：刷新当前跟进详情 + 通知父组件刷新列表
const handleEditSuccess = () => {
  if (currentFollowId.value) {
    loadFollowDetail(currentFollowId.value);
  }
  emit('refresh-list');
};

// 加载跟进详情
const loadFollowDetail = async (id: string | number) => {
  if (!id) return;
  try {
    const res = await getFollowDetail(id);
    if (res.code === 0 || res.code === 200) {
      followDetail.value = res.data || {};
    } else {
      MessagePlugin.error(res.msg || '获取跟进详情失败');
    }
  } catch (error: any) {
    console.error('获取跟进详情失败:', error);
    MessagePlugin.error('获取跟进详情失败，请重试');
  }
};

// 父组件调用：传入列表记录，内部取 id 调接口
const show = (record: any) => {
  const id = record?.id;
  if (!id) {
    MessagePlugin.error('缺少跟进记录ID，无法查看详情');
    return;
  }
  currentFollowId.value = id;
  dialogVisible.value = true;
  loadFollowDetail(id);
};

defineExpose({
  show,
});
// 删除跟进
const handleDelete = () => {
  const confirmDia = DialogPlugin.confirm({
    header: '提示',
    body: '此操作将永久删除该跟进记录, 是否继续?',
    theme: 'warning',
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: () => {
      MessagePlugin.success('删除成功!');
      dialogVisible.value = false;
      confirmDia.hide();
    },
    onCancel: () => {
      MessagePlugin.info('已取消删除');
      confirmDia.hide();
    },
  });
};
// 对话框确认和取消操作
const onConfirm = () => {
  // 可以在这里添加确认逻辑
  dialogVisible.value = false;
};
const onCancel = () => {
  // 可以在这里添加取消逻辑
  dialogVisible.value = false;
};
</script>
<style scoped lang="less">
/* 弹框内表单间距优化 */
:deep(.t-form-item) {
  margin-bottom: 10px;
}
/* 链接样式调整（与截图一致） */
:deep(.t-link) {
  color: #0052d9;
  cursor: pointer;
  text-decoration: underline;
}
</style>
