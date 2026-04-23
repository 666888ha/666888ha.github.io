<template>
  <t-popup
    expand-animation
    placement="bottom-right"
    trigger="click"
    attach="body"
    :z-index="5500"
    @visible-change="onPopupVisible"
  >
    <template #content>
      <div class="header-msg">
        <div class="header-msg-top">
          <p>{{ t('layout.notice.title') }}</p>
          <t-button
            v-if="unreadCount > 0"
            class="clear-btn"
            variant="text"
            theme="primary"
            :loading="readAllLoading"
            @click="onReadAll"
            >{{ t('layout.notice.clear') }}</t-button
          >
        </div>
        <t-loading v-if="listLoading" size="small" style="padding: 24px" />
        <t-list v-else-if="displayList.length > 0" class="narrow-scrollbar" :split="false">
          <t-list-item v-for="item in displayList" :key="item.id">
            <div class="msg-row" @click="onRowClick(item)">
              <p class="msg-content">{{ item.title }}</p>
              <p class="msg-type">{{ item.content }}</p>
            </div>
            <p class="msg-time">{{ item.create_time }}</p>
            <template #action>
              <t-button
                v-if="!item.is_read"
                size="small"
                variant="outline"
                :loading="item._marking"
                @click.stop="onMarkRead(item)"
              >
                {{ t('layout.notice.setRead') }}
              </t-button>
            </template>
          </t-list-item>
        </t-list>

        <div v-else class="empty-list">
          <img src="https://tdesign.gtimg.com/pro-template/personal/nothing.png" alt="空" />
          <p>{{ t('layout.notice.empty') }}</p>
        </div>
        <div v-if="displayList.length > 0" class="header-msg-bottom">
          <t-button class="header-msg-bottom-link" variant="text" theme="default" block @click="goDetail">{{
            t('layout.notice.viewAll')
          }}</t-button>
        </div>
      </div>
    </template>
    <t-badge :count="unreadCount" :offset="[4, 4]">
      <t-button theme="default" shape="square" variant="text">
        <t-icon name="mail" />
      </t-button>
    </t-badge>
  </t-popup>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  getMessageList,
  getMessageUnreadCount,
  postMessageRead,
  postMessageReadAll,
  type UserMessageRow,
} from '@/api/message';
import { t } from '@/locales';

const router = useRouter();

const unreadCount = ref(0);
const displayList = ref<(UserMessageRow & { _marking?: boolean })[]>([]);
const listLoading = ref(false);
const readAllLoading = ref(false);

let pollTimer: ReturnType<typeof setInterval> | null = null;

const fetchUnread = async () => {
  try {
    const res = await getMessageUnreadCount();
    if (res?.code === 0 || res?.code === 200) {
      unreadCount.value = res.data?.count ?? 0;
    }
  } catch {
    /* 静默 */
  }
};

const fetchList = async () => {
  listLoading.value = true;
  try {
    const res = await getMessageList({ page: 1, limit: 30, read: '0' });
    if (res?.code === 0 || res?.code === 200) {
      displayList.value = (res.data?.list ?? []).map((r) => ({ ...r, _marking: false }));
    }
  } catch (e: any) {
    MessagePlugin.error(e?.message || '加载消息失败');
  } finally {
    listLoading.value = false;
  }
};

const onPopupVisible = (visible: boolean) => {
  if (visible) {
    fetchList();
  }
};

const onMarkRead = async (item: UserMessageRow & { _marking?: boolean }) => {
  item._marking = true;
  try {
    await postMessageRead(item.id);
    item.is_read = 1;
    await fetchUnread();
    displayList.value = displayList.value.filter((r) => !r.is_read);
  } catch (e: any) {
    MessagePlugin.error(e?.message || '操作失败');
  } finally {
    item._marking = false;
  }
};

const onReadAll = async () => {
  readAllLoading.value = true;
  try {
    await postMessageReadAll();
    displayList.value = [];
    await fetchUnread();
  } catch (e: any) {
    MessagePlugin.error(e?.message || '操作失败');
  } finally {
    readAllLoading.value = false;
  }
};

const onRowClick = (item: UserMessageRow) => {
  if (item.link_url) {
    router.push(item.link_url);
  }
};

const goDetail = () => {
  router.push('/detail/secondary');
};

onMounted(() => {
  fetchUnread();
  pollTimer = setInterval(fetchUnread, 60000);
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>
<style lang="less" scoped>
.header-msg {
  width: 400px;
  margin: calc(0px - var(--td-comp-paddingTB-xs)) calc(0px - var(--td-comp-paddingLR-s));

  .empty-list {
    text-align: center;
    padding: var(--td-comp-paddingTB-xxl) 0;
    font: var(--td-font-body-medium);
    color: var(--td-text-color-secondary);

    img {
      width: var(--td-comp-size-xxxxl);
    }

    p {
      margin-top: var(--td-comp-margin-xs);
    }
  }

  &-top {
    position: relative;
    font: var(--td-font-title-medium);
    color: var(--td-text-color-primary);
    text-align: left;
    padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-xl) 0;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .clear-btn {
      right: calc(var(--td-comp-paddingTB-l) - var(--td-comp-paddingLR-xl));
    }
  }

  &-bottom {
    align-items: center;
    display: flex;
    justify-content: center;
    padding: var(--td-comp-paddingTB-s) var(--td-comp-paddingLR-s);
    border-top: 1px solid var(--td-component-stroke);

    &-link {
      text-decoration: none;
      cursor: pointer;
      color: var(--td-text-color-placeholder);
    }
  }

  .t-list {
    height: calc(100% - 104px);
    padding: var(--td-comp-margin-s) var(--td-comp-margin-s);
  }

  .msg-row {
    cursor: pointer;
  }

  .t-list-item {
    overflow: hidden;
    width: 100%;
    padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-l);
    border-radius: var(--td-radius-default);
    font: var(--td-font-body-medium);
    color: var(--td-text-color-primary);
    cursor: pointer;
    transition: background-color 0.2s linear;

    &:hover {
      background-color: var(--td-bg-color-container-hover);

      .msg-content {
        color: var(--td-brand-color);
      }

      .t-list-item__action {
        button {
          bottom: var(--td-comp-margin-l);
          opacity: 1;
        }
      }

      .msg-time {
        bottom: -6px;
        opacity: 0;
      }
    }

    .msg-content {
      margin-bottom: var(--td-comp-margin-s);
    }

    .msg-type {
      color: var(--td-text-color-secondary);
    }

    .t-list-item__action {
      button {
        opacity: 0;
        position: absolute;
        right: var(--td-comp-margin-xxl);
        bottom: -6px;
      }
    }

    .msg-time {
      transition: all 0.2s ease;
      opacity: 1;
      position: absolute;
      right: var(--td-comp-margin-xxl);
      bottom: var(--td-comp-margin-l);
      color: var(--td-text-color-secondary);
    }
  }
}
</style>
