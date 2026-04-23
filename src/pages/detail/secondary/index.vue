<template>
  <div>
    <div class="secondary-notification">
      <t-tabs v-model="tabValue" @change="onTabChange">
        <t-tab-panel v-for="(tab, tabIndex) in TAB_LIST" :key="tabIndex" :value="tab.value" :label="tab.label">
          <t-loading v-if="loading" size="medium" style="padding: 48px" />
          <t-list v-else-if="msgDataList.length > 0" class="secondary-msg-list" :split="true">
            <t-list-item v-for="item in msgDataList" :key="item.id">
              <p class="content" :class="[{ unread: !item.is_read }]" @click="onRowClick(item)">
                <t-tag size="medium" :theme="NOTIFICATION_TYPES.get('middle')" variant="light">
                  {{ categoryLabel(item.category) }}
                </t-tag>
                <strong>{{ item.title }}</strong>
                {{ item.content }}
              </p>
              <template #action>
                <span class="msg-date">{{ item.create_time }}</span>
                <div class="msg-action">
                  <t-tooltip
                    v-if="!item.is_read"
                    class="set-read-icon"
                    :overlay-style="{ margin: '6px' }"
                    :content="t('pages.detailSecondary.setRead')"
                  >
                    <span class="msg-action-icon" @click.stop="markRead(item)">
                      <t-icon name="queue" size="16px" />
                    </span>
                  </t-tooltip>
                </div>
              </template>
            </t-list-item>
          </t-list>
          <div v-else class="secondary-msg-list__empty-list">
            <empty-icon></empty-icon>
            <p>{{ t('pages.detailSecondary.empty') }}</p>
          </div>
        </t-tab-panel>
      </t-tabs>
    </div>
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import EmptyIcon from '@/assets/assets-empty.svg?component';
import { getMessageList, postMessageRead, type UserMessageRow } from '@/api/message';
import { NOTIFICATION_TYPES } from '@/constants';
import { t } from '@/locales';

defineOptions({
  name: 'DetailSecondary',
});

const TAB_LIST = [
  { label: t('pages.detailSecondary.all'), value: 'msgData' },
  { label: t('pages.detailSecondary.unread'), value: 'unreadMsg' },
  { label: t('pages.detailSecondary.read'), value: 'readMsg' },
];

const tabValue = ref('msgData');
const allRows = ref<UserMessageRow[]>([]);
const loading = ref(false);
const router = useRouter();

const categoryLabel = (c: string) => {
  if (c === 'approval_pending') return '待办';
  if (c === 'approval_result') return '审批';
  return '消息';
};

const msgDataList = computed(() => {
  const rows = allRows.value;
  if (tabValue.value === 'unreadMsg') {
    return rows.filter((r) => !r.is_read);
  }
  if (tabValue.value === 'readMsg') {
    return rows.filter((r) => r.is_read);
  }
  return rows;
});

const loadAll = async () => {
  loading.value = true;
  try {
    const res = await getMessageList({ page: 1, limit: 200 });
    if (res?.code === 0 || res?.code === 200) {
      allRows.value = res.data?.list ?? [];
    }
  } catch (e: any) {
    MessagePlugin.error(e?.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

const onTabChange = () => {
  loadAll();
};

const markRead = async (item: UserMessageRow) => {
  try {
    await postMessageRead(item.id);
    item.is_read = 1;
  } catch (e: any) {
    MessagePlugin.error(e?.message || '操作失败');
  }
};

const onRowClick = (item: UserMessageRow) => {
  if (item.link_url) {
    router.push(item.link_url);
  }
};

onMounted(() => {
  loadAll();
});
</script>
<style lang="less" scoped>
@import './index.less';
</style>
