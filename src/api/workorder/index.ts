/**
 * CRM 工单（经 tp8crm 代理工单系统）
 */
import { request } from '@/utils/request';

const requestOpts = {
  isTransformResponse: false as const,
  withToken: true,
};

export type WorkOrderScope = 'all' | 'mine';

function cleanParams(p: Record<string, unknown>) {
  const o: Record<string, unknown> = {};
  Object.keys(p).forEach((k) => {
    const v = p[k];
    if (v !== undefined && v !== null && v !== '') {
      o[k] = v;
    }
  });
  return o;
}

export function getWorkOrderList(params: {
  scope: WorkOrderScope;
  page?: number;
  limit?: number;
  keyword?: string;
  /** 工单接口：all | pending | unfinished | completed | rejected */
  status?: string;
  /** 工单系统 type 字典数字 id；不传或 0 表示不限 */
  type?: number;
}) {
  const q = cleanParams({
    scope: params.scope,
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    keyword: params.keyword?.trim() || undefined,
    status: params.status && params.status !== 'all' ? params.status : 'all',
    type: params.type != null && params.type > 0 ? params.type : undefined,
  });
  return request.get<any>({ url: '/api/workorder/list', params: q }, requestOpts);
}

export function getWorkOrderDetail(params: { id: number; scope: WorkOrderScope }) {
  return request.get<any>(
    { url: '/api/workorder/detail', params: { id: params.id, scope: params.scope } },
    requestOpts,
  );
}
