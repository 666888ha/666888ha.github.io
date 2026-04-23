import { request } from '@/utils/request';

/** 站内消息一条（与 tp8crm message/list 一致） */
export interface UserMessageRow {
  id: number;
  user_id: number;
  category: string;
  title: string;
  content: string;
  biz_type: string | null;
  biz_id: number | null;
  link_url: string | null;
  is_read: number;
  create_time: string;
}

export function getMessageList(params?: { page?: number; limit?: number; read?: string }) {
  return request.get<{ code: number; msg?: string; data: { total: number; list: UserMessageRow[] } }>({
    url: '/api/message/list',
    params,
  });
}

export function getMessageUnreadCount() {
  return request.get<{ code: number; data: { count: number } }>({
    url: '/api/message/unread-count',
  });
}

export function postMessageRead(id: number) {
  return request.post<{ code: number; msg?: string }>({
    url: '/api/message/read',
    data: { id },
  });
}

export function postMessageReadAll() {
  return request.post<{ code: number; msg?: string }>({
    url: '/api/message/read-all',
  });
}
