/**
 * 首页看板（tp8crm route: home/dashboard）
 * 请求带 /api 前缀，由 Vite 代理转发到 PHP
 */
import { request } from '@/utils/request';

const opt = {
  requestOptions: {
    isTransformResponse: false as const,
    withToken: true,
  },
};

export type HomeDashboardParams = {
  range?: 'week' | 'month' | 'quarter';
  year?: number;
  month_year?: number;
  month?: number;
  dept_id?: number | string;
  user_id?: number | string;
};

function cleanParams(p: Record<string, any>) {
  const o: Record<string, any> = {};
  Object.keys(p).forEach((k) => {
    const v = p[k];
    if (v !== undefined && v !== null && v !== '') {
      o[k] = v;
    }
  });
  return o;
}

/** GET home/dashboard */
export const getHomeDashboard = (params: HomeDashboardParams) =>
  request.get<any>({
    url: '/api/home/dashboard',
    params: cleanParams(params as Record<string, any>),
    ...opt,
  } as any);
