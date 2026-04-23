import { defineStore } from 'pinia';

import type { NotificationItem } from '@/types/interface';

const msgData = [];

type MsgDataType = typeof msgData;

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    msgData,
  }),
  getters: {
    unreadMsg: (state) => state.msgData.filter((item: NotificationItem) => item.status),
    readMsg: (state) => state.msgData.filter((item: NotificationItem) => !item.status),
  },
  actions: {
    setMsgData(data: MsgDataType) {
      this.msgData = data;
    },
  },
  /** 消息改走接口 /api/message/*，不再持久化本地假数据 */
  persist: false,
});
